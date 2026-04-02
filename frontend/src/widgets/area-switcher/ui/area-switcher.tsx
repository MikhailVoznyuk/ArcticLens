import { LocateFixed, MapPinned } from 'lucide-react';
import { IconCircleButton } from '@/shared/ui/icon-circle-button';
import { useMapStore } from '@/entities/map/model/use-map-store';
import {twMerge} from "tailwind-merge";

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
    <div className="absolute bottom-6 left-6 z-[850] flex items-end">
      <IconCircleButton className={'relative z-20'} onClick={toggleAreaPanel} aria-label="Открыть список зон">
        {areaPanelOpen ? <MapPinned className="h-7 w-7" /> : <LocateFixed className="h-7 w-7" />}
      </IconCircleButton>

        <div className={twMerge("relative z-10 -translate-x-[28px] glass-panel flex items-center gap-2 rounded-[30px] rounded-l-none px-3 py-2 pl-[42px] duration-300 overflow-hidden",
            areaPanelOpen ? 'w-[210px]': 'w-0 px-0'
            )}
             style={!areaPanelOpen ? {borderWidth: '0'} : {}}
        >
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
    </div>
  );
}
