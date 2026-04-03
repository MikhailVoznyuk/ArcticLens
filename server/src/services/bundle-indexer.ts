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

function trimKnownNoise(value: string, area: AreaId, year?: number) {
  return value
    .replace(/\.tif$/i, '')
    .replace(new RegExp(area, 'ig'), '')
    .replace(year ? new RegExp(String(year), 'g') : /$^/, '')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function canonicalizeMetricKey(group: MetricGroup, raw: string) {
  const value = raw.toLowerCase();

  if (group === 'composites') {
    if (/(^|_)(annual_)?composite(s)?($|_)/.test(value) || value.includes('annual_composite') || value.includes('composite')) {
      return 'annual_composite';
    }
  }

  const orderedPatterns: Array<[string, RegExp[]]> = [
    ['persistence_water_mask', [/persistence[_-]?water[_-]?mask/, /water[_-]?mask[_-]?persistence/]],
    ['texture_anomaly_mask', [/texture[_-]?anomaly[_-]?mask/, /anomaly[_-]?mask/]],
    ['water_mask', [/(^|_)water[_-]?mask($|_)/]],
    ['change_mask', [/change[_-]?mask/]],
    ['water_occurrence', [/water[_-]?occurrence/]],
    ['water_growth', [/water[_-]?growth/]],
    ['delta_ndvi', [/delta[_-]?ndvi/]],
    ['delta_ndwi', [/delta[_-]?ndwi/]],
    ['heatmap', [/pred[_-]?ml[_-]?final[_-]?heatmap/, /(^|_)heatmap($|_)/]],
    ['gap', [/ml[_-]?minus[_-]?baseline/, /heatmap[_-]?gap/, /(^|_)gap($|_)/]],
    ['risk_score', [/risk[_-]?score/]],
    ['hotspot_mask', [/hotspot[_-]?mask/, /hot[_-]?spot[_-]?mask/]],
    ['aspect_sin', [/aspect[_-]?sin/]],
    ['aspect_cos', [/aspect[_-]?cos/]],
    ['roughness', [/roughness/]],
    ['curvature', [/curvature/]],
    ['slope', [/slope/]],
    ['tri', [/(^|_)tri($|_)/, /terrain[_-]?ruggedness/]],
    ['tpi', [/(^|_)tpi($|_)/, /topographic[_-]?position/]],
    ['dem', [/(^|_)dem($|_)/, /elevation/]],
    ['nir_red_ratio', [/nir[_-]?red[_-]?ratio/, /ratio[_-]?nir[_-]?red/]],
    ['red_green_ratio', [/red[_-]?green[_-]?ratio/, /ratio[_-]?red[_-]?green/]],
    ['brightness', [/brightness/]],
    ['osavi', [/(^|_)osavi($|_)/]],
    ['ndwi', [/(^|_)ndwi($|_)/]],
    ['ndvi', [/(^|_)ndvi($|_)/]],
  ];

  for (const [canonical, patterns] of orderedPatterns) {
    if (patterns.some((pattern) => pattern.test(value))) {
      return canonical;
    }
  }

  return value;
}

function cleanMetricKey(fileName: string, area: AreaId, group: MetricGroup, year?: number) {
  const raw = trimKnownNoise(fileName, area, year);
  return canonicalizeMetricKey(group, raw);
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
      const tifFiles = fg.sync(path.join(base, 'rasters', group, '*.tif'), { absolute: true })
        .filter((absPath) => !/colored[_-]?rgb[_-]?masked/i.test(path.basename(absPath)))
        .sort();

      tifFiles.forEach((absPath) => {
        const fileName = path.basename(absPath);
        const year = inferYear(fileName);
        const metricKey = cleanMetricKey(fileName, area, group, year);
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
