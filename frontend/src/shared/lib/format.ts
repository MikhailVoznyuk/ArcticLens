export function formatNumber(value: number | string | null | undefined, digits = 2) {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(num);
}

export function titleizeMetric(key: string) {
  const normalized = key.toLowerCase();

  if (/pred[_-]?ml[_-]?final[_-]?heatmap/.test(normalized) || /(^|_)heatmap($|_)/.test(normalized)) {
    return 'Heatmap';
  }

  if (/ml[_-]?minus[_-]?baseline/.test(normalized) || /(^|_)gap($|_)/.test(normalized)) {
    return 'Gap';
  }

  const map: Record<string, string> = {
    parcel_id: 'Parcel ID',
    area_ha: 'Площадь, га',
    ndvi: 'NDVI',
    ndwi: 'NDWI',
    osavi: 'OSAVI',
    brightness: 'Brightness',
    heatmap: 'Heatmap',
    gap: 'Gap',
    nir_red_ratio: 'NIR/Red',
    red_green_ratio: 'Red/Green',
    risk_score: 'Risk score',
    hotspot_mask: 'Hotspot',
    water_occurrence: 'Water occurrence',
    water_growth: 'Water growth',
    delta_ndvi: 'Δ NDVI',
    delta_ndwi: 'Δ NDWI',
    change_mask: 'Change mask',
    water_mask: 'Water mask',
    persistence_water_mask: 'Persistence water mask',
    is_valid_for_full_analytics: 'Полная аналитика',
  };

  return map[key] ?? key.replace(/_/g, ' ');
}
