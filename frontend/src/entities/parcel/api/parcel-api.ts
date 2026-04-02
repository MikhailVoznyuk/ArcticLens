import { fetchJson } from '@/shared/api/http';
import type { AreaId } from '@/shared/types/map';
import type { ParcelDetail } from '@/shared/types/parcel';

export async function getParcelDetail(area: AreaId, parcelId: string, year?: number) {
  const params = new URLSearchParams();
  if (year) params.set('year', String(year));
  return fetchJson<ParcelDetail>(`/api/parcels/${area}/${encodeURIComponent(parcelId)}?${params.toString()}`);
}
