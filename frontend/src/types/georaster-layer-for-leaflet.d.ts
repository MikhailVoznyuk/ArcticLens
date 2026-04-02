declare module 'georaster-layer-for-leaflet' {
  import { GridLayer } from 'leaflet';

  type Options = {
    georaster: unknown;
    opacity?: number;
    resolution?: number;
    resampleMethod?: 'nearest' | 'bilinear';
    updateWhenIdle?: boolean;
    updateWhenZooming?: boolean;
    keepBuffer?: number;
    pixelValuesToColorFn?: (pixelValues: number[]) => string | null | undefined;
  };

  export default class GeoRasterLayer extends GridLayer {
    constructor(options: Options);
  }
}
