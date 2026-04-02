import { useCallback, useMemo } from 'react';
import { Heart, Plus, X } from 'lucide-react';
import { useFavoritesStore } from '@/features/favorites/model/use-favorites-store';
import { useMapStore } from '@/entities/map/model/use-map-store';
import { formatNumber } from '@/shared/lib/format';
import type { ParcelDetail } from '@/shared/types/parcel';

export function ParcelPopup({ detail }: { detail: ParcelDetail }) {
  const setSelectedParcelId = useMapStore((state) => state.setSelectedParcelId);
  const setSelectedParcelDetail = useMapStore((state) => state.setSelectedParcelDetail);
  const openAnalytics = useMapStore((state) => state.openAnalytics);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const favoriteItems = useFavoritesStore((state) => state.items);

  const hasFavorite = useMemo(
    () => favoriteItems.some((item) => item.area === detail.area && item.parcelId === detail.parcelId),
    [detail.area, detail.parcelId, favoriteItems],
  );

  const close = useCallback(() => {
    setSelectedParcelId(undefined);
    setSelectedParcelDetail(undefined);
  }, [setSelectedParcelDetail, setSelectedParcelId]);

  return (
    <div className="pointer-events-auto absolute left-1/2 top-1/2 z-[900] w-[360px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 rounded-glass glass-card p-5 text-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-slate-600">{detail.area === 'amga' ? 'Амга' : 'Юнкор'} · {detail.year ?? '—'}</div>
          <h3 className="mt-1 text-xl font-semibold leading-tight">{detail.title}</h3>
          <div className="mt-1 text-sm text-slate-700">parcel_id: {detail.parcelId}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite({ area: detail.area, parcelId: detail.parcelId, title: detail.title })}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-accent"
            title="Добавить в избранное"
          >
            {hasFavorite ? <Heart className="h-5 w-5 fill-current" /> : <Plus className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/50 text-slate-700"
            title="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {detail.popupMetrics.map((metric) => (
          <div key={metric.key} className="rounded-3xl border border-white/70 bg-white/35 px-3 py-2">
            <div className="text-xs text-slate-600">{metric.label}</div>
            <div className="mt-1 text-base font-semibold">
              {typeof metric.value === 'number' ? formatNumber(metric.value) : String(metric.value ?? '—')}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-700">
          {detail.isValidForFullAnalytics === false
            ? 'Часть аналитики неполная. В карточке и модальном окне показаны только доступные значения.'
            : 'Аналитика доступна для просмотра.'}
        </div>
        <button
          type="button"
          onClick={openAnalytics}
          className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-white shadow-accent"
        >
          Обзор
        </button>
      </div>
    </div>
  );
}
