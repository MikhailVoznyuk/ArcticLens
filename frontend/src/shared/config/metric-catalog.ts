import type { MapMode, MetricOption } from '@/shared/types/map';

export const MAP_MODE_OPTIONS: Array<{ value: MapMode; label: string }> = [
  { value: 'base', label: 'Базовый режим' },
  { value: 'water', label: 'Вода' },
  { value: 'change', label: 'Изменения' },
  { value: 'risk', label: 'Зоны внимания' },
  { value: 'relief', label: 'Рельеф' },
  { value: 'advanced', label: 'Advanced' },
];

export const METRIC_CATALOG: MetricOption[] = [
  { id: 'composite', label: 'Композит', group: 'composites', key: 'annual_composite', modes: ['base', 'advanced'] },
  { id: 'ndvi', label: 'NDVI', group: 'indices', key: 'ndvi', modes: ['base', 'change', 'advanced'] },
  { id: 'ndwi', label: 'NDWI', group: 'indices', key: 'ndwi', modes: ['base', 'water', 'change', 'advanced'] },
  { id: 'osavi', label: 'OSAVI', group: 'indices', key: 'osavi', modes: ['base', 'advanced'] },
  { id: 'brightness', label: 'Brightness', group: 'indices', key: 'brightness', modes: ['advanced'] },
  { id: 'nir-red-ratio', label: 'NIR/Red', group: 'indices', key: 'nir_red_ratio', modes: ['advanced'] },
  { id: 'red-green-ratio', label: 'Red/Green', group: 'indices', key: 'red_green_ratio', modes: ['advanced'] },
  { id: 'water-mask', label: 'Вода', group: 'masks', key: 'water_mask', modes: ['water', 'advanced'] },
  { id: 'change-mask', label: 'Изменения', group: 'masks', key: 'change_mask', modes: ['change', 'advanced'] },
  { id: 'texture-anomaly-mask', label: 'Текстурные аномалии', group: 'masks', key: 'texture_anomaly_mask', modes: ['advanced'] },
  { id: 'persistence-water-mask', label: 'Постоянная вода', group: 'masks', key: 'persistence_water_mask', modes: ['water', 'advanced'] },
  { id: 'water-occurrence', label: 'Water occurrence', group: 'dynamics', key: 'water_occurrence', modes: ['water', 'advanced'] },
  { id: 'delta-ndvi', label: 'Δ NDVI', group: 'dynamics', key: 'delta_ndvi', modes: ['change', 'advanced'] },
  { id: 'delta-ndwi', label: 'Δ NDWI', group: 'dynamics', key: 'delta_ndwi', modes: ['water', 'change', 'advanced'] },
  { id: 'water-growth', label: 'Water growth', group: 'dynamics', key: 'water_growth', modes: ['water', 'advanced'] },
  { id: 'risk-score', label: 'Risk score', group: 'experimental', key: 'risk_score', modes: ['risk', 'advanced'] },
  { id: 'hotspot-mask', label: 'Hotspot', group: 'experimental', key: 'hotspot_mask', modes: ['risk', 'advanced'] },
  { id: 'slope', label: 'Slope', group: 'terrain', key: 'slope', modes: ['relief', 'advanced'] },
  { id: 'tpi', label: 'TPI', group: 'terrain', key: 'tpi', modes: ['relief', 'advanced'] },
  { id: 'roughness', label: 'Roughness', group: 'terrain', key: 'roughness', modes: ['relief', 'advanced'] },
  { id: 'dem', label: 'DEM', group: 'terrain', key: 'dem', modes: ['advanced'] },
  { id: 'tri', label: 'TRI', group: 'terrain', key: 'tri', modes: ['advanced'] },
  { id: 'curvature', label: 'Curvature', group: 'terrain', key: 'curvature', modes: ['advanced'] },
];

function matchesMode(option: MetricOption, mode: MapMode) {
  return mode === 'advanced' ? true : option.modes.includes(mode);
}

export function getMetricOptionById(metricId?: string) {
  return METRIC_CATALOG.find((item) => item.id === metricId);
}

export function getAvailableMetricOptions(metricKeysByGroup: Partial<Record<MetricOption['group'], string[]>> | undefined, mode: MapMode) {
  return METRIC_CATALOG.filter((option) => {
    const keys = metricKeysByGroup?.[option.group] ?? [];
    return keys.includes(option.key) && matchesMode(option, mode);
  });
}

export function getDefaultMetricId(mode: MapMode, metricKeysByGroup: Partial<Record<MetricOption['group'], string[]>> | undefined) {
  const preferredByMode: Record<MapMode, string[]> = {
    base: ['ndvi', 'ndwi', 'osavi', 'composite'],
    water: ['water-mask', 'persistence-water-mask', 'water-occurrence', 'delta-ndwi', 'water-growth', 'ndwi'],
    change: ['change-mask', 'delta-ndvi', 'delta-ndwi', 'ndvi'],
    risk: ['risk-score', 'hotspot-mask'],
    relief: ['slope', 'tpi', 'roughness', 'dem'],
    advanced: METRIC_CATALOG.map((item) => item.id),
  };

  const available = getAvailableMetricOptions(metricKeysByGroup, mode);
  for (const id of preferredByMode[mode]) {
    if (available.some((item) => item.id === id)) return id;
  }

  return available[0]?.id;
}
