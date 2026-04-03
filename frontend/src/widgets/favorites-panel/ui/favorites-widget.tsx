import { useEffect, useState } from 'react';
import { Check, Focus, FolderClosed, Pencil, Search, Trash2, X } from 'lucide-react';
import { useFavoritesStore } from '@/features/favorites/model/use-favorites-store';
import { useMapStore } from '@/entities/map/model/use-map-store';
import { IconCircleButton } from '@/shared/ui/icon-circle-button';
import type { FavoriteParcel } from '@/shared/types/parcel';
import { cn } from '@/shared/lib/cn';

function FavoriteCard({ item }: { item: FavoriteParcel }) {
  const focusFromFavorite = useMapStore((state) => state.focusFromFavorite);
  const remove = useFavoritesStore((state) => state.remove);
  const rename = useFavoritesStore((state) => state.rename);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(item.title);

  useEffect(() => {
    if (!editing) {
      setDraftTitle(item.title);
    }
  }, [editing, item.title]);

  const saveTitle = () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      setDraftTitle(item.title);
      setEditing(false);
      return;
    }
    rename(item.area, item.parcelId, nextTitle);
    setEditing(false);
  };

  return (
    <div className="rounded-[24px] border border-white/70 bg-white/35 p-4">
      <div className="text-xs uppercase tracking-[0.08em] text-slate-500">{item.area === 'amga' ? 'Амга' : 'Юнкор'}</div>

      <div className="mt-1 flex items-start gap-2">
        {editing ? (
          <input
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveTitle();
              if (event.key === 'Escape') {
                setDraftTitle(item.title);
                setEditing(false);
              }
            }}
            autoFocus
            className="h-10 min-w-0 flex-1 rounded-[18px] border border-white/80 bg-white/75 px-3 text-base font-semibold text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-accent focus:bg-white"
            placeholder="Введите название поля"
          />
        ) : (
          <div className="min-w-0 flex-1 text-base font-semibold text-slate-900">{item.title}</div>
        )}

        <div className="flex shrink-0 gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={saveTitle}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white shadow-accent shadow-md transition-transform duration-200 hover:scale-[1.03] active:scale-95"
                aria-label="Сохранить новое имя"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftTitle(item.title);
                  setEditing(false);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-700 transition-colors duration-150 hover:bg-white/75"
                aria-label="Отменить редактирование"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/55 text-slate-700 transition-colors duration-150 hover:bg-white/75"
              aria-label="Изменить имя в избранном"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

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
  );
}

export function FavoritesWidget() {
  const favoritesOpen = useMapStore((state) => state.favoritesOpen);
  const toggleFavorites = useMapStore((state) => state.toggleFavorites);
  const items = useFavoritesStore((state) => state.items);

  return (
    <div className="absolute left-6 top-6 z-[850] flex items-start gap-3">
      <IconCircleButton onClick={toggleFavorites} aria-label="Открыть избранное">
        {favoritesOpen ? <X className="h-7 w-7" /> : <FolderClosed className="h-7 w-7" />}
      </IconCircleButton>

      {favoritesOpen ? (
        <div className={cn('glass-panel w-[360px] max-w-[calc(100vw-100px)] rounded-[30px] p-4', items.length > 6 ? 'max-h-[70vh]' : '')}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.08em] text-slate-500">Избранное</div>
              <div className="text-lg font-semibold text-slate-900">Сохранённые поля</div>
            </div>
            <div className="rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-white shadow-accent shadow-md">
              {items.length}
            </div>
          </div>

          <div className="scrollbar-thin mt-4 max-h-[400px] space-y-3 overflow-y-auto pr-1">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/70 bg-white/30 p-4 text-sm text-slate-700">
                Пока здесь ничего нет...
              </div>
            ) : null}

            {items.map((item) => (
              <FavoriteCard key={`${item.area}:${item.parcelId}`} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
