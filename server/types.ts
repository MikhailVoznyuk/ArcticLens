export type AreaId = 'amga' | 'yunkor';
export type MetricGroup = 'composites' | 'indices' | 'masks' | 'dynamics' | 'textures' | 'terrain' | 'experimental';

export type LayerItem = {
  area: AreaId;
  group: MetricGroup;
  year?: number;
  metricKey: string;
  fileName: string;
  absolutePath: string;
  publicPath: string;
};

export type IndexedBundle = {
  dataRoot: string;
  manifestPath?: string;
  global: {
    aoiUnionPath?: string;
    parcelsClippedPath?: string;
  };
  areas: Record<AreaId, {
    label: string;
    years: number[];
    vectors: {
      aoiPath?: string;
      parcelsPath?: string;
    };
    analyticsCsv: Record<number, string>;
    layers: LayerItem[];
  }>;
};
