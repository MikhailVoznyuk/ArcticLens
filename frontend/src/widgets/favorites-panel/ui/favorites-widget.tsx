import { Focus, Heart, Search, Trash2 } from 'lucide-react';
import { useFavoritesStore } from '@/features/favorites/model/use-favorites-store';
import { useMapStore } from '@/entities/map/model/use-map-store';
import { IconCircleButton } from '@/shared/ui/icon-circle-button';

export function FavoritesWidget() {
  const favoritesOpen = useMapStore((state) => state.favoritesOpen);
  const toggleFavorites = useMapStore((state) => state.toggleFavorites);
  const focusFromFavorite = useMapStore((state) => state.focusFromFavorite);
  const items = useFavoritesStore((state) => state.items);
  const remove = useFavoritesStore((state) => state.remove);

  return (
    <div className="absolute left-6 top-6 z-[850] flex items-start gap-3">
      <IconCircleButton onClick={toggleFavorites} aria-label="Открыть избранное">
        <Heart className={`h-7 w-7 ${items.length ? 'fill-current' : ''}`} />
      </IconCircleButton>

      {favoritesOpen ? (
        <div className="glass-panel w-[360px] max-w-[calc(100vw-100px)] rounded-[30px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Избранное</div>
              <div className="text-lg font-semibold text-slate-900">Сохранённые поля</div>
            </div>
            <div className="rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-white shadow-accent shadow-md">
              {items.length}
            </div>
          </div>

          <div className="mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/70 bg-white/30 p-4 text-sm text-slate-700">
                Пока здесь ничего нет...
              </div>
            ) : null}

            {items.map((item) => (
              <div key={`${item.area}:${item.parcelId}`} className="rounded-[24px] border border-white/70 bg-white/35 p-4">
                <div className="text-xs uppercase tracking-[0.08em] text-slate-500">{item.area === 'amga' ? 'Амга' : 'Юнкор'}</div>
                <div className="mt-1 text-base font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-700">parcel_id: {item.parcelId}</div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => focusFromFavorite({ area: item.area, parcelId: item.parcelId })}
                    className="inline-flex items-center gap-2 rounded-pill bg-accent px-3 py-2 text-sm font-semibold text-white shadow-accent shadow-md"
                  >
                    <Focus className="h-4 w-4" /> К полю
                  </button>
                  <button
                    type="button"
                    onClick={() => focusFromFavorite({ area: item.area, parcelId: item.parcelId, openAnalytics: true })}
                    className="inline-flex items-center gap-2 rounded-pill border border-white/70 bg-white/50 px-3 py-2 text-sm font-semibold text-slate-800"
                  >
                    <Search className="h-4 w-4" /> Обзор
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.area, item.parcelId)}
                    className="inline-flex items-center gap-2 rounded-pill border border-white/70 bg-white/45 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <Trash2 className="h-4 w-4" /> Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
