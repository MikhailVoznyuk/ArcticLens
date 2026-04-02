import fs from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import type { AreaId, MetricGroup, IndexedBundle, LayerItem } from '../types.js';
import { toPublicDataPath } from '../lib/path.js';

const AREA_LABELS: Record<AreaId, string> = {
  amga: 'Амга',
  yunkor: 'Юнкор',
};

const GROUPS: MetricGroup[] = ['composites', 'indices', 'masks', 'dynamics', 'textures', 'terrain', 'experimental'];

function inferYear(input: string) {
  const match = input.match(/(20\d{2})/);
  return match ? Number(match[1]) : undefined;
}

function cleanMetricKey(fileName: string, area: AreaId, year?: number) {
  const withoutExt = fileName.replace(/\.tif$/i, '');
  const parts = withoutExt
    .replace(new RegExp(area, 'ig'), '')
    .replace(year ? new RegExp(String(year), 'g') : /$^/, '')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (parts.includes('annual_composite') || parts.includes('composite')) return 'annual_composite';
  return parts.toLowerCase();
}

export function buildBundleIndex(dataRoot: string): IndexedBundle {
  const bundle: IndexedBundle = {
    dataRoot,
    manifestPath: fs.existsSync(path.join(dataRoot, 'manifest.json')) ? path.join(dataRoot, 'manifest.json') : undefined,
    global: {
      aoiUnionPath: fs.existsSync(path.join(dataRoot, 'global', 'aoi_union.geojson'))
        ? path.join(dataRoot, 'global', 'aoi_union.geojson')
        : undefined,
      parcelsClippedPath: fs.existsSync(path.join(dataRoot, 'global', 'parcels_clipped.geojson'))
        ? path.join(dataRoot, 'global', 'parcels_clipped.geojson')
        : undefined,
    },
    areas: {
      amga: {
        label: AREA_LABELS.amga,
        years: [],
        vectors: {},
        analyticsCsv: {},
        layers: [],
      },
      yunkor: {
        label: AREA_LABELS.yunkor,
        years: [],
        vectors: {},
        analyticsCsv: {},
        layers: [],
      },
    },
  };

  (['amga', 'yunkor'] as AreaId[]).forEach((area) => {
    const base = path.join(dataRoot, 'areas', area);
    const areaEntry = bundle.areas[area];

    const aoiPath = path.join(base, 'vectors', `${area}_aoi.geojson`);
    const parcelsPath = path.join(base, 'vectors', `${area}_parcels.geojson`);
    if (fs.existsSync(aoiPath)) areaEntry.vectors.aoiPath = aoiPath;
    if (fs.existsSync(parcelsPath)) areaEntry.vectors.parcelsPath = parcelsPath;

    const csvFiles = fg.sync(path.join(base, 'analytics', '*.csv'), { absolute: true }).sort();
    for (const csv of csvFiles) {
      const year = inferYear(path.basename(csv));
      if (!year) continue;
      areaEntry.analyticsCsv[year] = csv;
      if (!areaEntry.years.includes(year)) areaEntry.years.push(year);
    }

    for (const group of GROUPS) {
      const tifFiles = fg.sync(path.join(base, 'rasters', group, '*.tif'), { absolute: true }).sort();
      tifFiles.forEach((absPath) => {
        const fileName = path.basename(absPath);
        const year = inferYear(fileName);
        const metricKey = cleanMetricKey(fileName, area, year);
        const layer: LayerItem = {
          area,
          group,
          year,
          metricKey,
          fileName,
          absolutePath: absPath,
          publicPath: toPublicDataPath(dataRoot, absPath),
        };
        areaEntry.layers.push(layer);
        if (year && !areaEntry.years.includes(year)) areaEntry.years.push(year);
      });
    }

    areaEntry.years.sort((a, b) => a - b);
  });

  return bundle;
}
