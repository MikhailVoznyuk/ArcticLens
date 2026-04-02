import { ChevronDown } from 'lucide-react';
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
  return (
    <label className={cn('relative flex min-w-[160px] items-center rounded-pill bg-accent px-4 py-2 text-white shadow-accent', className)}>
      <span className="mr-3 text-[15px] font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none bg-transparent pr-7 text-[15px] font-medium outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-slate-900">
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
    </label>
  );
}
