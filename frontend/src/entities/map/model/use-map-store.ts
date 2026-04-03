import { create } from 'zustand';
import type { AreaId, MapMode } from '@/shared/types/map';
import type { ParcelDetail } from '@/shared/types/parcel';

type MapStore = {
  selectedArea: AreaId;
  selectedYear?: number;
  selectedBasemapId: string;
  selectedMetricId: string;
  selectedMode: MapMode;
  toolbarOpen: boolean;
  areaPanelOpen: boolean;
  favoritesOpen: boolean;
  analyticsOpen: boolean;
  selectedParcelId?: string;
  selectedParcelDetail?: ParcelDetail;
  selectedParcelPoint?: { lat: number; lng: number };
  fitToken: number;
  focusFavorite?: { area: AreaId; parcelId: string; openAnalytics?: boolean };
  setArea: (area: AreaId) => void;
  setYear: (year?: number) => void;
  setBasemapId: (id: string) => void;
  setMetricId: (id: string) => void;
  setMode: (mode: MapMode) => void;
  toggleToolbar: () => void;
  toggleAreaPanel: () => void;
  toggleFavorites: () => void;
  openAnalytics: () => void;
  closeAnalytics: () => void;
  setSelectedParcelId: (id?: string) => void;
  setSelectedParcelDetail: (detail?: ParcelDetail) => void;
  setSelectedParcelPoint: (point?: { lat: number; lng: number }) => void;
  requestFit: () => void;
  focusFromFavorite: (payload: { area: AreaId; parcelId: string; openAnalytics?: boolean }) => void;
  clearFavoriteFocus: () => void;
};

export const useMapStore = create<MapStore>((set) => ({
  selectedArea: 'yunkor',
  selectedYear: undefined,
  selectedBasemapId: 'osm',
  selectedMetricId: 'ndvi',
  selectedMode: 'base',
  toolbarOpen: true,
  areaPanelOpen: true,
  favoritesOpen: false,
  analyticsOpen: false,
  fitToken: 0,
  setArea: (selectedArea) => set({ selectedArea, selectedParcelId: undefined, selectedParcelDetail: undefined, selectedParcelPoint: undefined }),
  setYear: (selectedYear) => set({ selectedYear }),
  setBasemapId: (selectedBasemapId) => set({ selectedBasemapId }),
  setMetricId: (selectedMetricId) => set({ selectedMetricId }),
  setMode: (selectedMode) => set({ selectedMode }),
  toggleToolbar: () => set((s) => ({ toolbarOpen: !s.toolbarOpen })),
  toggleAreaPanel: () => set((s) => ({ areaPanelOpen: !s.areaPanelOpen })),
  toggleFavorites: () => set((s) => ({ favoritesOpen: !s.favoritesOpen })),
  openAnalytics: () => set({ analyticsOpen: true }),
  closeAnalytics: () => set({ analyticsOpen: false }),
  setSelectedParcelId: (selectedParcelId) => set({ selectedParcelId }),
  setSelectedParcelPoint: (selectedParcelPoint) => set({ selectedParcelPoint }),
  setSelectedParcelDetail: (selectedParcelDetail) => set({ selectedParcelDetail }),
  requestFit: () => set((s) => ({ fitToken: s.fitToken + 1 })),
  focusFromFavorite: (focusFavorite) =>
    set({
      focusFavorite,
      favoritesOpen: false,
      analyticsOpen: false,
      selectedParcelId: focusFavorite.parcelId,
      selectedParcelDetail: undefined,
      selectedParcelPoint: undefined,
      selectedArea: focusFavorite.area,
    }),
  clearFavoriteFocus: () => set({ focusFavorite: undefined }),
}));
