export type AreaId = 'amga' | 'yunkor';

export type BasemapOption = {
  id: string;
  label: string;
  url: string;
  attribution: string;
};

export type MetricGroup =
  | 'composites'
  | 'indices'
  | 'masks'
  | 'dynamics'
  | 'textures'
  | 'terrain'
  | 'experimental';

export type MapMode = 'base' | 'water' | 'change' | 'risk' | 'relief' | 'advanced';

export type MetricOption = {
  id: string;
  label: string;
  group: MetricGroup;
  key: string;
  modes: MapMode[];
};

export type AreaMeta = {
  id: AreaId;
  label: string;
  years: number[];
};

export type LayersByArea = Record<AreaId, Partial<Record<MetricGroup, string[]>>>;

export type BootstrapResponse = {
  areas: AreaMeta[];
  availableMetrics: string[];
  basemapDefault: string;
  layersByArea: LayersByArea;
};

export type LayerResolveResponse = {
  area: AreaId;
  year?: number;
  group: MetricGroup;
  metricKey: string;
  fileName?: string;
  url?: string;
};
