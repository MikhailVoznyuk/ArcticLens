import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoriteParcel } from '@/shared/types/parcel';

const keyOf = (item: FavoriteParcel) => `${item.area}:${item.parcelId}`;

type FavoritesStore = {
  items: FavoriteParcel[];
  add: (item: FavoriteParcel) => void;
  remove: (area: string, parcelId: string) => void;
  toggle: (item: FavoriteParcel) => void;
  has: (area: string, parcelId: string) => boolean;
};

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const exists = state.items.some((x) => keyOf(x) === keyOf(item));
          return exists ? state : { items: [item, ...state.items] };
        }),
      remove: (area, parcelId) =>
        set((state) => ({
          items: state.items.filter((item) => !(item.area === area && item.parcelId === parcelId)),
        })),
      toggle: (item) => {
        const exists = get().items.some((x) => keyOf(x) === keyOf(item));
        if (exists) {
          get().remove(item.area, item.parcelId);
          return;
        }
        get().add(item);
      },
      has: (area, parcelId) => get().items.some((item) => item.area === area && item.parcelId === parcelId),
    }),
    {
      name: 'gis-demo-favorites',
    },
  ),
);
