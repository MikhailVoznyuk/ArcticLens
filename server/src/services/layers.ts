import type { AreaId, IndexedBundle, LayerItem, MetricGroup } from '../types.js';

function scoreLayer(layer: LayerItem, metricKey: string, year?: number) {
  let score = 0;
  if (year && layer.year === year) score += 8;
  if (layer.metricKey === metricKey) score += 10;
  if (layer.metricKey.includes(metricKey)) score += 5;
  if (metricKey.includes(layer.metricKey)) score += 3;
  return score;
}

export function resolveLayer(bundle: IndexedBundle, area: AreaId, group: MetricGroup, metricKey: string, year?: number) {
  const candidates = bundle.areas[area].layers.filter((item) => item.group === group);

  const exact = candidates.find((item) => item.metricKey === metricKey && (!year || item.year === year));
  if (exact) return exact;

  const sorted = [...candidates]
    .map((item) => ({ item, score: scoreLayer(item, metricKey, year) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return sorted[0]?.item;
}
