import parseGeoraster from 'georaster';
import { apiUrl } from '@/shared/api/http';
import { resolveLayer } from '@/entities/map/api/map-api';
import type { AreaId } from '@/shared/types/map';
import type { MetricValue, ParcelDetail } from '@/shared/types/parcel';

type LatLngPoint = { lat: number; lng: number };

type ParsedGeoRaster = {
  noDataValue?: number | null;
  projection?: number | string | null;
  width?: number;
  height?: number;
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
  pixelWidth?: number;
  pixelHeight?: number;
  values?: number[][][];
};

type SampleMetricKey = 'heatmap' | 'gap';

const georasterCache = new Map<string, Promise<ParsedGeoRaster>>();
let proj4Promise: Promise<any> | null = null;

function getProj4() {
  if (!proj4Promise) {
    proj4Promise = import('proj4').then((mod) => mod.default ?? mod);
  }

  return proj4Promise;
}

function getRasterMetricLabel(key: SampleMetricKey) {
  return key === 'heatmap' ? 'Heatmap' : 'Gap';
}

function ensureMetric(items: MetricValue[], key: SampleMetricKey, value: number, afterKey?: string) {
  const next = [...items];
  const label = getRasterMetricLabel(key);
  const existingIndex = next.findIndex((item) => item.key === key);
  const metric = { key, label, value };

  if (existingIndex >= 0) {
    next[existingIndex] = metric;
    return next;
  }

  const afterIndex = afterKey ? next.findIndex((item) => item.key === afterKey) : -1;
  if (afterIndex >= 0) {
    next.splice(afterIndex + 1, 0, metric);
    return next;
  }

  next.push(metric);
  return next;
}

function normalizeProjection(projection: number | string | null | undefined) {
  if (!projection) return null;

  if (typeof projection === 'number') {
    if (projection === 4326) return 'EPSG:4326';
    if (projection === 3857) return 'EPSG:3857';
    if (projection >= 32601 && projection <= 32660) {
      const zone = projection - 32600;
      return `+proj=utm +zone=${zone} +datum=WGS84 +units=m +no_defs +type=crs`;
    }
    if (projection >= 32701 && projection <= 32760) {
      const zone = projection - 32700;
      return `+proj=utm +zone=${zone} +south +datum=WGS84 +units=m +no_defs +type=crs`;
    }
    return `EPSG:${projection}`;
  }

  const value = projection.trim();
  if (/^EPSG:/i.test(value)) {
    const code = Number(value.split(':').pop());
    return normalizeProjection(Number.isFinite(code) ? code : value);
  }

  if (/^\+proj=/.test(value)) {
    return value;
  }

  return value;
}

async function projectLatLng(point: LatLngPoint, projection: number | string | null | undefined) {
  const target = normalizeProjection(projection);
  if (!target || target === 'EPSG:4326') {
    return [point.lng, point.lat] as const;
  }

  const proj4 = await getProj4();
  const [x, y] = proj4('EPSG:4326', target, [point.lng, point.lat]);
  return [x, y] as const;
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

async function sampleRasterValue(url: string, point: LatLngPoint) {
  const georaster = await loadGeoRaster(url);
  const band = georaster.values?.[0];
  const width = georaster.width ?? band?.[0]?.length;
  const height = georaster.height ?? band?.length;
  const xmin = georaster.xmin;
  const xmax = georaster.xmax;
  const ymin = georaster.ymin;
  const ymax = georaster.ymax;

  if (!band || !width || !height || xmin === undefined || xmax === undefined || ymin === undefined || ymax === undefined) {
    return null;
  }

  const [x, y] = await projectLatLng(point, georaster.projection);
  const pixelWidth = georaster.pixelWidth ?? (xmax - xmin) / width;
  const pixelHeight = Math.abs(georaster.pixelHeight ?? (ymax - ymin) / height);

  const col = Math.floor((x - xmin) / pixelWidth);
  const row = Math.floor((ymax - y) / pixelHeight);

  if (row < 0 || row >= height || col < 0 || col >= width) {
    return null;
  }

  const value = band[row]?.[col];
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }

  if (typeof georaster.noDataValue === 'number' && value === georaster.noDataValue) {
    return null;
  }

  return value;
}

async function resolveMetricUrl(area: AreaId, year: number | undefined, metricKey: SampleMetricKey) {
  try {
    const layer = await resolveLayer(area, 'experimental', metricKey, year);
    return layer.url ?? null;
  } catch {
    return null;
  }
}

export async function enrichParcelDetailWithRasterMetrics(
  detail: ParcelDetail,
  options: { area: AreaId; year?: number; point?: LatLngPoint | null },
) {
  if (!options.point) return detail;

  const year = detail.year ?? options.year;
  const [heatmapUrl, gapUrl] = await Promise.all([
    resolveMetricUrl(options.area, year, 'heatmap'),
    resolveMetricUrl(options.area, year, 'gap'),
  ]);

  const [heatmapValue, gapValue] = await Promise.all([
    heatmapUrl ? sampleRasterValue(heatmapUrl, options.point) : Promise.resolve(null),
    gapUrl ? sampleRasterValue(gapUrl, options.point) : Promise.resolve(null),
  ]);

  let popupMetrics = detail.popupMetrics;
  let modalMetrics = detail.modalMetrics;
  const currentRecord = { ...detail.currentRecord };

  if (typeof heatmapValue === 'number') {
    popupMetrics = ensureMetric(popupMetrics.filter((item) => item.key !== 'brightness'), 'heatmap', heatmapValue, 'osavi');
    modalMetrics = ensureMetric(modalMetrics, 'heatmap', heatmapValue, 'brightness');
    currentRecord.heatmap = heatmapValue;
  }

  if (typeof gapValue === 'number') {
    modalMetrics = ensureMetric(modalMetrics, 'gap', gapValue, 'heatmap');
    currentRecord.gap = gapValue;
  }

  return {
    ...detail,
    popupMetrics,
    modalMetrics,
    currentRecord,
  };
}
