declare module 'proj4' {
  type Converter = (from: string, to: string, coords: [number, number]) => [number, number];
  const proj4: Converter;
  export default proj4;
}
