import type { AreaId, IndexedBundle } from '../types.js';
import { getParcelId } from '../lib/records.js';
import { readCsv } from './file-cache.js';

const METRIC_ALIASES: Record<string, RegExp[]> = {
  area_ha: [/^area_ha$/i, /^area$/i, /hectare/i],
  ndvi: [/^ndvi(?:_|$)/i, /ndvi_mean/i],
  ndwi: [/^ndwi(?:_|$)/i, /ndwi_mean/i],
  osavi: [/^osavi(?:_|$)/i, /osavi_mean/i],
  brightness: [/brightness/i],
  nir_red_ratio: [/nir.*red/i, /nir_red_ratio/i],
  red_green_ratio: [/red.*green/i, /red_green_ratio/i],
  risk_score: [/risk_score/i, /^risk$/i],
  water_occurrence: [/water_occurrence/i],
  hotspot_mask: [/hotspot/i],
  is_valid_for_full_analytics: [/is_valid_for_full_analytics/i],
};

function findMetricKey(record: Record<string, unknown>, metric: string) {
  const candidates = METRIC_ALIASES[metric] ?? [new RegExp(metric, 'i')];
  return Object.keys(record).find((key) => candidates.some((regex) => regex.test(key)));
}

function pickPopupMetrics(record: Record<string, unknown>) {
  const order = [
    'area_ha',
    'ndvi',
    'ndwi',
    'osavi',
    'brightness',
    'nir_red_ratio',
    'red_green_ratio',
    'risk_score',
    'water_occurrence',
    'hotspot_mask',
  ];

  const labels: Record<string, string> = {
    area_ha: 'Площадь, га',
    ndvi: 'NDVI',
    ndwi: 'NDWI',
    osavi: 'OSAVI',
    brightness: 'Brightness',
    nir_red_ratio: 'NIR/Red',
    red_green_ratio: 'Red/Green',
    risk_score: 'Risk score',
    water_occurrence: 'Water occurrence',
    hotspot_mask: 'Hotspot',
  };

  return order
    .map((metric) => {
      const key = findMetricKey(record, metric);
      if (!key) return null;
      return {
        key: metric,
        label: labels[metric] ?? metric,
        value: record[key] as string | number | boolean | null,
      };
    })
    .filter(Boolean)
    .slice(0, 7);
}

function normalizeTrendRow(record: Record<string, unknown>, year: number) {
  const row: Record<string, string | number | boolean | null> = { year };
  Object.keys(METRIC_ALIASES).forEach((metric) => {
    const key = findMetricKey(record, metric);
    row[metric] = key ? (record[key] as string | number | boolean | null) : null;
  });
  return row;
}

export function getParcelDetail(bundle: IndexedBundle, area: AreaId, parcelId: string, selectedYear?: number) {
  const areaEntry = bundle.areas[area];
  const years = Object.keys(areaEntry.analyticsCsv)
    .map(Number)
    .sort((a, b) => a - b);

  const timeline = years
    .map((year) => {
      const rows = readCsv(areaEntry.analyticsCsv[year]);
      const row = rows.find((item) => getParcelId(item) === parcelId);
      return row ? normalizeTrendRow(row, year) : null;
    })
    .filter(Boolean) as Array<Record<string, string | number | boolean | null>>;

  if (!timeline.length) return null;

  const preferredYear = selectedYear && years.includes(selectedYear) ? selectedYear : years[years.length - 1];
  const yearCandidates = [preferredYear, ...years.filter((year) => year !== preferredYear).sort((a, b) => b - a)];

  let yearForCurrent: number | undefined;
  let currentRecord: Record<string, unknown> | undefined;

  for (const year of yearCandidates) {
    const rows = readCsv(areaEntry.analyticsCsv[year]);
    const row = rows.find((item) => getParcelId(item) === parcelId);
    if (row) {
      yearForCurrent = year;
      currentRecord = row;
      break;
    }
  }

  if (!currentRecord || !yearForCurrent) return null;

  const isValidKey = findMetricKey(currentRecord, 'is_valid_for_full_analytics');

  return {
    area,
    parcelId,
    year: yearForCurrent,
    title: `Поле ${parcelId}`,
    isValidForFullAnalytics: isValidKey ? Boolean(currentRecord[isValidKey]) : undefined,
    popupMetrics: pickPopupMetrics(currentRecord),
    currentRecord,
    timeline,
  };
}
