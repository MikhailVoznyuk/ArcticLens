declare module 'georaster' {
  type ParsedGeoRaster = {
    noDataValue?: number | null;
  };

  export default function parseGeoraster(data: ArrayBuffer): Promise<ParsedGeoRaster>;
}
