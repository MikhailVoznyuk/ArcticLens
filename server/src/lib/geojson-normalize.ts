import proj4 from 'proj4';
import type { AreaId } from '../types.js';

proj4.defs('EPSG:32651', '+proj=utm +zone=51 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:32652', '+proj=utm +zone=52 +datum=WGS84 +units=m +no_defs');
proj4.defs('EPSG:4326', proj4.WGS84);

const WGS84_ALIASES = new Set(['EPSG:4326', 'CRS84', 'OGC:CRS84']);

type JsonObject = Record<string, unknown>;
type JsonValue = JsonObject | unknown[] | string | number | boolean | null;
const normalizedCache = new WeakMap<object, JsonObject>();

function getFallbackProjection(area: AreaId) {
  return area === 'amga' ? 'EPSG:32652' : 'EPSG:32651';
}

function isNumberPair(value: unknown): value is number[] {
  return Array.isArray(value) && value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number';
}

function findFirstCoordinate(value: unknown): number[] | null {
  if (isNumberPair(value)) return value;
  if (!Array.isArray(value)) return null;
  for (const item of value) {
    const coordinate = findFirstCoordinate(item);
    if (coordinate) return coordinate;
  }
  return null;
}

function normalizeCrsName(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const value = input.trim().toUpperCase();
  if (!value) return undefined;

  if (value.includes('CRS84')) return 'CRS84';

  const epsgMatch = value.match(/EPSG[:/]{1,2}(\d+)/) ?? value.match(/(\d{4,5})$/);
  if (epsgMatch) {
    return `EPSG:${epsgMatch[1]}`;
  }

  return value;
}

function getDeclaredCrs(featureCollection: JsonObject): string | undefined {
  const crs = featureCollection.crs;
  if (!crs || typeof crs !== 'object') return undefined;
  const typed = crs as JsonObject;

  const properties = typed.properties;
  if (properties && typeof properties === 'object') {
    const name = normalizeCrsName((properties as JsonObject).name);
    if (name) return name;
  }

  return normalizeCrsName(typed.name);
}

function looksLikeLonLat(coordinate: number[]) {
  const [x, y] = coordinate;
  return Math.abs(x) <= 180 && Math.abs(y) <= 90;
}

function looksLikeLatLonSwap(coordinate: number[]) {
  const [x, y] = coordinate;
  return Math.abs(x) <= 90 && Math.abs(y) <= 180 && Math.abs(y) > 90;
}

function looksProjected(coordinate: number[]) {
  const [x, y] = coordinate;
  return Math.abs(x) > 1000 || Math.abs(y) > 1000;
}

function getTransformPlan(area: AreaId, featureCollection: JsonObject) {
  const declaredCrs = getDeclaredCrs(featureCollection);
  const firstCoordinate = findFirstCoordinate(featureCollection.features);

  let sourceCrs = declaredCrs;
  let swapLonLat = false;

  if (firstCoordinate) {
    if (looksLikeLatLonSwap(firstCoordinate)) {
      swapLonLat = true;
    } else if (!sourceCrs && looksProjected(firstCoordinate)) {
      sourceCrs = getFallbackProjection(area);
    }
  }

  if (sourceCrs && WGS84_ALIASES.has(sourceCrs)) {
    sourceCrs = undefined;
  }

  return { sourceCrs, swapLonLat };
}

function transformPosition(position: number[], sourceCrs?: string, swapLonLat = false) {
  let [x, y, ...rest] = position;

  if (swapLonLat) {
    [x, y] = [y, x];
  }

  if (sourceCrs) {
    const [lon, lat] = proj4(sourceCrs, 'EPSG:4326', [x, y]);
    return [lon, lat, ...rest];
  }

  return [x, y, ...rest];
}

function transformCoordinates(value: JsonValue, sourceCrs?: string, swapLonLat = false): JsonValue {
  if (isNumberPair(value)) {
    return transformPosition(value, sourceCrs, swapLonLat);
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformCoordinates(item as JsonValue, sourceCrs, swapLonLat));
  }

  return value;
}

function normalizeGeometry(geometry: JsonObject | null | undefined, sourceCrs?: string, swapLonLat = false) {
  if (!geometry) return geometry;

  if (geometry.type === 'GeometryCollection' && Array.isArray(geometry.geometries)) {
    return {
      ...geometry,
      geometries: geometry.geometries.map((item) => normalizeGeometry((item as JsonObject) ?? undefined, sourceCrs, swapLonLat)),
    };
  }

  if ('coordinates' in geometry) {
    return {
      ...geometry,
      coordinates: transformCoordinates(geometry.coordinates as JsonValue, sourceCrs, swapLonLat),
    };
  }

  return geometry;
}

function normalizeBbox(bbox: unknown, sourceCrs?: string, swapLonLat = false) {
  if (!Array.isArray(bbox) || (bbox.length !== 4 && bbox.length !== 6)) return bbox;
  const min = transformPosition([Number(bbox[0]), Number(bbox[1])], sourceCrs, swapLonLat);
  const max = transformPosition([Number(bbox[2]), Number(bbox[3])], sourceCrs, swapLonLat);

  if (bbox.length === 6) {
    return [min[0], min[1], bbox[2], max[0], max[1], bbox[5]];
  }

  return [min[0], min[1], max[0], max[1]];
}

export function normalizeFeatureCollection(area: AreaId, featureCollection: JsonObject): JsonObject {
  const cached = normalizedCache.get(featureCollection);
  if (cached) return cached;

  const { sourceCrs, swapLonLat } = getTransformPlan(area, featureCollection);
  if (!sourceCrs && !swapLonLat) {
    normalizedCache.set(featureCollection, featureCollection);
    return featureCollection;
  }

  const normalized: JsonObject = {
    ...featureCollection,
    crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    bbox: normalizeBbox(featureCollection.bbox, sourceCrs, swapLonLat),
    features: Array.isArray(featureCollection.features)
      ? featureCollection.features.map((feature) => {
          if (!feature || typeof feature !== 'object') return feature;
          const typedFeature = feature as JsonObject;
          return {
            ...typedFeature,
            bbox: normalizeBbox(typedFeature.bbox, sourceCrs, swapLonLat),
            geometry: normalizeGeometry((typedFeature.geometry as JsonObject | undefined) ?? undefined, sourceCrs, swapLonLat),
          };
        })
      : featureCollection.features,
  };

  normalizedCache.set(featureCollection, normalized);
  return normalized;
}
