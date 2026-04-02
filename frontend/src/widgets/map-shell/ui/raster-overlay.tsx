'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import parseGeoraster from 'georaster';
import type GeoRasterLayer from 'georaster-layer-for-leaflet';
import { apiUrl } from '@/shared/api/http';
import type { MetricGroup } from '@/shared/types/map';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgba(r: number, g: number, b: number, a: number) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function colorize(group: MetricGroup, metricKey: string, raw: number) {
  if (raw === undefined || raw === null || Number.isNaN(raw)) return null;

  if (group === 'masks') {
    if (raw <= 0) return null;
    if (metricKey.includes('water')) return rgba(38, 132, 255, 0.55);
    if (metricKey.includes('change')) return rgba(255, 140, 65, 0.55);
    if (metricKey.includes('anomaly')) return rgba(153, 76, 255, 0.55);
    return rgba(255, 71, 87, 0.55);
  }

  if (group === 'experimental' && metricKey === 'hotspot_mask') {
    return raw <= 0 ? null : rgba(255, 0, 76, 0.65);
  }

  if (group === 'experimental' && metricKey === 'risk_score') {
    const v = clamp(raw, 0, 1);
    return rgba(255, Math.round(200 * (1 - v)), 0, 0.55);
  }

  if (group === 'terrain') {
    const v = clamp((raw + 1) / 2, 0, 1);
    const g = Math.round(255 * v);
    return rgba(g, g, g, 0.5);
  }

  if (group === 'textures') {
    const v = clamp(raw / 2, 0, 1);
    return rgba(Math.round(160 * v), Math.round(80 + 120 * v), 255, 0.5);
  }

  if (group === 'dynamics') {
    if (metricKey.includes('ndvi') || metricKey.includes('ndwi')) {
      const v = clamp((raw + 1) / 2, 0, 1);
      const r = Math.round(255 * (1 - v));
      const g = Math.round(255 * v);
      return rgba(r, g, 60, 0.5);
    }
    if (metricKey.includes('water')) {
      const v = clamp(raw, 0, 1);
      return rgba(55, 140, 255, 0.25 + v * 0.45);
    }
  }

  if (group === 'indices') {
    if (metricKey === 'ndvi' || metricKey === 'osavi') {
      const v = clamp((raw + 1) / 2, 0, 1);
      return rgba(Math.round(180 * (1 - v)), Math.round(80 + 170 * v), 40, 0.52);
    }
    if (metricKey === 'ndwi') {
      const v = clamp((raw + 1) / 2, 0, 1);
      return rgba(Math.round(170 * (1 - v)), Math.round(180 * (1 - v)), 255, 0.5);
    }
    if (metricKey === 'brightness') {
      const v = clamp(raw, 0, 1);
      const c = Math.round(v * 255);
      return rgba(c, c, c, 0.45);
    }

    const v = clamp(raw, 0, 1.5) / 1.5;
    return rgba(Math.round(255 * v), Math.round(180 * (1 - v)), 80, 0.45);
  }

  return null;
}

export function RasterOverlay({
  url,
  group,
  metricKey,
}: {
  url?: string;
  group: MetricGroup;
  metricKey: string;
}) {
  const map = useMap();
  const layerRef = useRef<GeoRasterLayer | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!url) return;

      if (layerRef.current) {
        map.removeLayer(layerRef.current as never);
        layerRef.current = null;
      }

      const module = await import('georaster-layer-for-leaflet');
      const GeoRasterLeafletLayer = (module.default ?? module) as typeof GeoRasterLayer;

      const response = await fetch(apiUrl(url));
      const arrayBuffer = await response.arrayBuffer();
      const georaster = await parseGeoraster(arrayBuffer);
      if (cancelled) return;

      const layer = new GeoRasterLeafletLayer({
        georaster,
        opacity: group === 'composites' ? 0.92 : 0.7,
        resolution: 256,
        pixelValuesToColorFn:
          group === 'composites'
            ? undefined
            : (pixelValues: number[]) => colorize(group, metricKey, pixelValues?.[0]),
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
  }, [group, map, metricKey, url]);

  return null;
}
