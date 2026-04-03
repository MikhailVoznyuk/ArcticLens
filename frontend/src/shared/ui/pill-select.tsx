import { ChevronDown, Check } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';

type Option = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label: string;
  className?: string;
};

export function PillSelect({ value, onChange, options, label, className }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonId = useId();
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative min-w-[160px]', className)}>
      <button
        id={buttonId}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'relative flex w-full items-center rounded-pill bg-accent px-4 py-2 text-left text-white shadow-accent shadow-md transition-transform duration-200',
          open ? 'scale-[1.01]' : 'hover:scale-[1.01] active:scale-[0.99]',
        )}
      >
        <span className="mr-3 shrink-0 text-[15px] font-medium">{label}</span>
        <span className="min-w-0 flex-1 truncate pr-7 text-[15px] font-medium">
          {selectedOption?.label ?? 'Выбрать'}
        </span>
        <ChevronDown
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform duration-200',
            open ? 'rotate-180' : '',
          )}
        />
      </button>

      <div
        className={cn(
          'absolute left-0 right-0 top-[calc(100%+10px)] z-[980] origin-top transition duration-150 ease-out',
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        <div className="glass-panel overflow-hidden rounded-[24px] p-2 shadow-glass">
          <div id={listboxId} role="listbox" aria-labelledby={buttonId} className="scrollbar-thin max-h-[260px] space-y-1 overflow-y-auto pr-1">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-[18px] px-3 py-2 text-left text-sm font-medium transition-colors duration-150',
                    active
                      ? 'bg-accent text-white shadow-accent shadow-sm'
                      : 'bg-white/35 text-slate-800 hover:bg-white/55',
                  )}
                >
                  <span className="truncate pr-3">{option.label}</span>
                  <Check className={cn('h-4 w-4 shrink-0', active ? 'opacity-100' : 'opacity-0')} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
