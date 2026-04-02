import { useEffect, useMemo } from 'react';
import { Menu, SlidersHorizontal } from 'lucide-react';
import { BASEMAPS } from '@/shared/config/basemaps';
import { MAP_MODE_OPTIONS, getAvailableMetricOptions, getDefaultMetricId } from '@/shared/config/metric-catalog';
import { IconCircleButton } from '@/shared/ui/icon-circle-button';
import { PillSelect } from '@/shared/ui/pill-select';
import { useMapStore } from '@/entities/map/model/use-map-store';
import type { AreaMeta, LayersByArea } from '@/shared/types/map';

export function TopToolbar({ areas, layersByArea }: { areas: AreaMeta[]; layersByArea: LayersByArea }) {
  const toolbarOpen = useMapStore((state) => state.toolbarOpen);
  const toggleToolbar = useMapStore((state) => state.toggleToolbar);
  const selectedArea = useMapStore((state) => state.selectedArea);
  const selectedYear = useMapStore((state) => state.selectedYear);
  const selectedBasemapId = useMapStore((state) => state.selectedBasemapId);
  const selectedMetricId = useMapStore((state) => state.selectedMetricId);
  const selectedMode = useMapStore((state) => state.selectedMode);
  const setYear = useMapStore((state) => state.setYear);
  const setBasemapId = useMapStore((state) => state.setBasemapId);
  const setMetricId = useMapStore((state) => state.setMetricId);
  const setMode = useMapStore((state) => state.setMode);

  const years = areas.find((area) => area.id === selectedArea)?.years ?? [];
  const areaLayers = layersByArea[selectedArea];
  const metricOptions = useMemo(
    () => getAvailableMetricOptions(areaLayers, selectedMode),
    [areaLayers, selectedMode],
  );

  useEffect(() => {
    if (!metricOptions.some((item) => item.id === selectedMetricId)) {
      const nextMetricId = getDefaultMetricId(selectedMode, areaLayers);
      if (nextMetricId) setMetricId(nextMetricId);
    }
  }, [areaLayers, metricOptions, selectedMetricId, selectedMode, setMetricId]);

  return (
    <div className="absolute right-6 top-6 z-[850] flex items-start gap-3">
      <IconCircleButton onClick={toggleToolbar} aria-label="Открыть панель фильтров">
        {toolbarOpen ? <SlidersHorizontal className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
      </IconCircleButton>

      {toolbarOpen ? (
        <div className="glass-panel flex flex-wrap gap-3 rounded-[30px] px-4 py-3">
          <PillSelect
            label="Режим"
            value={selectedMode}
            onChange={(value) => setMode(value as typeof selectedMode)}
            options={MAP_MODE_OPTIONS}
            className="min-w-[220px]"
          />

          <PillSelect
            label="Период"
            value={selectedYear ? String(selectedYear) : ''}
            onChange={(value) => setYear(value ? Number(value) : undefined)}
            options={years.map((year) => ({ value: String(year), label: String(year) }))}
          />

          <PillSelect
            label="Слой"
            value={selectedMetricId}
            onChange={setMetricId}
            options={metricOptions.map((item) => ({ value: item.id, label: item.label }))}
            className="min-w-[240px]"
          />

          <PillSelect
            label="Карта"
            value={selectedBasemapId}
            onChange={setBasemapId}
            options={BASEMAPS.map((item) => ({ value: item.id, label: item.label }))}
            className="min-w-[220px]"
          />
        </div>
      ) : null}
    </div>
  );
}
