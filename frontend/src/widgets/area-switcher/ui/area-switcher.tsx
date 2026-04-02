import { LocateFixed, MapPinned } from 'lucide-react';
import { IconCircleButton } from '@/shared/ui/icon-circle-button';
import { useMapStore } from '@/entities/map/model/use-map-store';

export function AreaSwitcher() {
  const areaPanelOpen = useMapStore((state) => state.areaPanelOpen);
  const toggleAreaPanel = useMapStore((state) => state.toggleAreaPanel);
  const selectedArea = useMapStore((state) => state.selectedArea);
  const setArea = useMapStore((state) => state.setArea);
  const requestFit = useMapStore((state) => state.requestFit);

  const choose = (area: 'amga' | 'yunkor') => {
    setArea(area);
    requestFit();
  };

  return (
    <div className="absolute bottom-6 left-6 z-[850] flex items-end gap-3">
      <IconCircleButton onClick={toggleAreaPanel} aria-label="Открыть список зон">
        {areaPanelOpen ? <MapPinned className="h-7 w-7" /> : <LocateFixed className="h-7 w-7" />}
      </IconCircleButton>

      {areaPanelOpen ? (
        <div className="glass-panel flex items-center gap-2 rounded-[30px] px-3 py-3">
          <button
            type="button"
            onClick={() => choose('yunkor')}
            className={`rounded-pill px-4 py-2 text-sm font-semibold text-white shadow-accent ${selectedArea === 'yunkor' ? 'bg-accent' : 'bg-accent/80'}`}
          >
            Юнкор
          </button>
          <button
            type="button"
            onClick={() => choose('amga')}
            className={`rounded-pill px-4 py-2 text-sm font-semibold text-white shadow-accent ${selectedArea === 'amga' ? 'bg-accent' : 'bg-accent/80'}`}
          >
            Амга
          </button>
        </div>
      ) : null}
    </div>
  );
}
