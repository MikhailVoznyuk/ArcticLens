'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useMap } from 'react-leaflet';
import parseGeoraster from 'georaster';
import type GeoRasterLayer from 'georaster-layer-for-leaflet';
import { apiUrl } from '@/shared/api/http';
import type { MetricGroup } from '@/shared/types/map';

const VEGETATION_PALETTE = ['#E44B33', '#FDC177', '#FFFDBD', '#AEDEA5', '#5EA7B1'] as const;
const WATER_PALETTE = ['#FFFFFF', '#3C70FF'] as const;

type ParsedGeoRaster = {
  noDataValue?: number | null;
};

type RenderQuality = 'interactive' | 'settled';

type RasterRenderConfig = {
  opacity: number;
  resolution: number;
  resampleMethod: 'nearest' | 'bilinear';
  updateWhenIdle: boolean;
  updateWhenZooming: boolean;
  updateInterval: number;
  keepBuffer: number;
};

const georasterCache = new Map<string, Promise<ParsedGeoRaster>>();
let georasterLayerModulePromise: Promise<typeof GeoRasterLayer> | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hexToRgb(hex: string) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((char) => `${char}${char}`).join('')
    : value;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function interpolatePalette(palette: readonly string[], value: number, alpha: number) {
  const v = clamp(value, 0, 1);
  if (palette.length === 1) {
    const { r, g, b } = hexToRgb(palette[0]);
    return rgba(r, g, b, alpha);
  }

  const scaled = v * (palette.length - 1);
  const index = Math.min(Math.floor(scaled), palette.length - 2);
  const localT = scaled - index;
  const from = hexToRgb(palette[index]);
  const to = hexToRgb(palette[index + 1]);

  const r = Math.round(from.r + (to.r - from.r) * localT);
  const g = Math.round(from.g + (to.g - from.g) * localT);
  const b = Math.round(from.b + (to.b - from.b) * localT);

  return rgba(r, g, b, alpha);
}

function normalizeMetricValue(group: MetricGroup, metricKey: string, raw: number) {
  if (group === 'experimental' && metricKey === 'risk_score') {
    return clamp(raw, 0, 1);
  }

  if (group === 'indices' && (metricKey === 'ndvi' || metricKey === 'osavi' || metricKey === 'ndwi')) {
    return clamp((raw + 1) / 2, 0, 1);
  }

  return clamp(raw, 0, 1);
}

function colorize(group: MetricGroup, metricKey: string, raw: number) {
  if (raw === undefined || raw === null || Number.isNaN(raw)) return null;

  if (group === 'masks') {
    if (raw <= 0) return null;
    if (metricKey.includes('water')) return rgba(60, 112, 255, 0.68);
    if (metricKey.includes('change')) return rgba(255, 140, 65, 0.6);
    if (metricKey.includes('anomaly')) return rgba(153, 76, 255, 0.6);
    return rgba(255, 71, 87, 0.6);
  }

  if (group === 'experimental' && metricKey === 'hotspot_mask') {
    return raw <= 0 ? null : rgba(255, 0, 76, 0.7);
  }

  if (group === 'experimental' && metricKey === 'risk_score') {
    return interpolatePalette(VEGETATION_PALETTE, normalizeMetricValue(group, metricKey, raw), 0.82);
  }

  if (group === 'terrain') {
    const v = clamp((raw + 1) / 2, 0, 1);
    const g = Math.round(255 * v);
    return rgba(g, g, g, 0.56);
  }

  if (group === 'textures') {
    const v = clamp(raw / 2, 0, 1);
    return rgba(Math.round(160 * v), Math.round(80 + 120 * v), 255, 0.56);
  }

  if (group === 'dynamics') {
    if (metricKey.includes('ndvi') || metricKey.includes('ndwi')) {
      const v = clamp((raw + 1) / 2, 0, 1);
      const r = Math.round(255 * (1 - v));
      const g = Math.round(255 * v);
      return rgba(r, g, 60, 0.58);
    }
    if (metricKey.includes('water')) {
      const v = clamp(raw, 0, 1);
      return rgba(55, 140, 255, 0.28 + v * 0.48);
    }
  }

  if (group === 'indices') {
    if (metricKey === 'ndvi' || metricKey === 'osavi') {
      return interpolatePalette(VEGETATION_PALETTE, normalizeMetricValue(group, metricKey, raw), 0.8);
    }
    if (metricKey === 'ndwi') {
      return interpolatePalette(WATER_PALETTE, normalizeMetricValue(group, metricKey, raw), 0.78);
    }
    if (metricKey === 'brightness') {
      const v = clamp(raw, 0, 1);
      const c = Math.round(v * 255);
      return rgba(c, c, c, 0.5);
    }

    const v = clamp(raw, 0, 1.5) / 1.5;
    return rgba(Math.round(255 * v), Math.round(180 * (1 - v)), 80, 0.5);
  }

  return null;
}

function getRenderConfig(group: MetricGroup, quality: RenderQuality): RasterRenderConfig {
  if (group === 'composites') {
    return quality === 'interactive'
      ? {
          opacity: 0.96,
          resolution: 128,
          resampleMethod: 'nearest',
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 320,
          keepBuffer: 1,
        }
      : {
          opacity: 0.96,
          resolution: 192,
          resampleMethod: 'bilinear',
          updateWhenIdle: true,
          updateWhenZooming: false,
          updateInterval: 240,
          keepBuffer: 1,
        };
  }

  return quality === 'interactive'
    ? {
        opacity: 0.82,
        resolution: 128,
        resampleMethod: 'nearest',
        updateWhenIdle: true,
        updateWhenZooming: false,
        updateInterval: 320,
        keepBuffer: 1,
      }
    : {
        opacity: 0.82,
        resolution: 320,
        resampleMethod: 'bilinear',
        updateWhenIdle: true,
        updateWhenZooming: false,
        updateInterval: 220,
        keepBuffer: 1,
      };
}

async function loadGeoRasterLayerModule() {
  if (!georasterLayerModulePromise) {
    georasterLayerModulePromise = import('georaster-layer-for-leaflet').then(
      (module) => (module.default ?? module) as typeof GeoRasterLayer,
    );
  }

  return georasterLayerModulePromise;
}

async function loadGeoRaster(url: string) {
  const absoluteUrl = apiUrl(url);
  const cached = georasterCache.get(absoluteUrl);
  if (cached) return cached;

  const promise = fetch(absoluteUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch raster: ${response.status} ${response.statusText}`);
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => parseGeoraster(arrayBuffer) as Promise<ParsedGeoRaster>)
    .catch((error) => {
      georasterCache.delete(absoluteUrl);
      throw error;
    });

  georasterCache.set(absoluteUrl, promise);
  return promise;
}

export function RasterOverlay({
  url,
  group,
  metricKey,
  quality = 'settled',
}: {
  url?: string;
  group: MetricGroup;
  metricKey: string;
  quality?: RenderQuality;
}) {
  const map = useMap();
  const layerRef = useRef<GeoRasterLayer | null>(null);
  const renderConfig = useMemo(() => getRenderConfig(group, quality), [group, quality]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!url) return;

      if (layerRef.current) {
        map.removeLayer(layerRef.current as never);
        layerRef.current = null;
      }

      const [GeoRasterLeafletLayer, georaster] = await Promise.all([
        loadGeoRasterLayerModule(),
        loadGeoRaster(url),
      ]);
      if (cancelled) return;

      const noDataValue = typeof georaster.noDataValue === 'number' ? georaster.noDataValue : undefined;

      const layer = new GeoRasterLeafletLayer({
        georaster,
        opacity: renderConfig.opacity,
        resolution: renderConfig.resolution,
        resampleMethod: renderConfig.resampleMethod,
        updateWhenIdle: renderConfig.updateWhenIdle,
        updateWhenZooming: renderConfig.updateWhenZooming,
        updateInterval: renderConfig.updateInterval,
        keepBuffer: renderConfig.keepBuffer,
        pixelValuesToColorFn:
          group === 'composites'
            ? undefined
            : (pixelValues: number[]) => {
                const raw = pixelValues?.[0];
                if (raw === undefined || raw === null || Number.isNaN(raw)) return null;
                if (noDataValue !== undefined && raw === noDataValue) return null;
                return colorize(group, metricKey, raw);
              },
      });

      layer.addTo(map);
      layerRef.current = layer;
    }

    run().catch((error) => {
      console.error('Failed to load raster layer', error);
    });

    return () => {
      cancelled = true;
      if (layerRef.current) {
        map.removeLayer(layerRef.current as never);
        layerRef.current = null;
      }
    };
  }, [group, map, metricKey, renderConfig, url]);

  return null;
}
