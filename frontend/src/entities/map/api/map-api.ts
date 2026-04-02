import { fetchJson } from '@/shared/api/http';
import type { BootstrapResponse, LayerResolveResponse, AreaId } from '@/shared/types/map';

export async function getBootstrap() {
  return fetchJson<BootstrapResponse>('/api/bootstrap');
}

export async function resolveLayer(area: AreaId, group: string, metricKey: string, year?: number) {
  const params = new URLSearchParams({
    area,
    group,
    metricKey,
  });

  if (year) params.set('year', String(year));

  return fetchJson<LayerResolveResponse>(`/api/layers/resolve?${params.toString()}`);
}

export async function getAreaVectors(area: AreaId) {
  return fetchJson<{ aoi: GeoJSON.FeatureCollection; parcels: GeoJSON.FeatureCollection }>(
    `/api/areas/${area}/vectors`,
  );
}
