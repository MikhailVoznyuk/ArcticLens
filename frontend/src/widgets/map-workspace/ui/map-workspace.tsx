'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { getBootstrap, getAreaVectors } from '@/entities/map/api/map-api';
import { useMapStore } from '@/entities/map/model/use-map-store';
import { FavoritesWidget } from '@/widgets/favorites-panel/ui/favorites-widget';
import { AreaSwitcher } from '@/widgets/area-switcher/ui/area-switcher';
import { TopToolbar } from '@/widgets/top-toolbar/ui/top-toolbar';
import type { AreaId, AreaMeta, BootstrapResponse, LayersByArea } from '@/shared/types/map';

const MapShell = dynamic(
  () => import('@/widgets/map-shell/ui/map-shell').then((mod) => mod.MapShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-slate-700">
        Инициализация карты...
      </div>
    ),
  },
);

export default function MapWorkspace() {
  const [areas, setAreas] = useState<AreaMeta[]>([]);
  const [layersByArea, setLayersByArea] = useState<LayersByArea>({ amga: {}, yunkor: {} });
  const [vectors, setVectors] = useState<Partial<Record<AreaId, { aoi: GeoJSON.FeatureCollection; parcels: GeoJSON.FeatureCollection }>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setArea = useMapStore((state) => state.setArea);
  const setYear = useMapStore((state) => state.setYear);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsLoading(true);
      setError(null);

      try {
        const bootstrap = await getBootstrap();
        if (cancelled) return;

        const typedBootstrap = bootstrap as BootstrapResponse;
        setAreas(typedBootstrap.areas);
        setLayersByArea(typedBootstrap.layersByArea);

        const firstArea = typedBootstrap.areas[0];
        if (firstArea) {
          setArea(firstArea.id as AreaId);
          setYear(firstArea.years[firstArea.years.length - 1]);
        }

        const entries = await Promise.all(
          typedBootstrap.areas.map(async (area) => [area.id, await getAreaVectors(area.id as AreaId)] as const),
        );

        if (cancelled) return;
        setVectors(Object.fromEntries(entries) as Partial<Record<AreaId, { aoi: GeoJSON.FeatureCollection; parcels: GeoJSON.FeatureCollection }>>);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [setArea, setYear]);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center bg-slate-100 text-slate-700">
          Загрузка карты и аналитических слоёв...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center text-slate-700">
          <div className="text-xl font-semibold">Не удалось прочитать bundle</div>
          <div className="max-w-[760px] text-sm">
            Проверьте существование <code>server/data/frontend_export</code> и наличие внутри <code>manifest.json</code>, <code>global</code> и <code>areas</code>.
          </div>
          <pre className="max-w-[760px] overflow-auto rounded-3xl bg-slate-900 p-4 text-left text-xs text-slate-100">{error}</pre>
        </div>
      );
    }

    return <MapShell areas={areas} vectors={vectors} layersByArea={layersByArea} />;
  }, [areas, error, isLoading, layersByArea, vectors]);

  return (
    <main className="relative h-screen overflow-hidden">
      {content}
      <TopToolbar areas={areas} layersByArea={layersByArea} />
      <FavoritesWidget />
      <AreaSwitcher />
    </main>
  );
}
