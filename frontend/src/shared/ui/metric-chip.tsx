import { formatNumber } from '@/shared/lib/format';

export function MetricChip({ label, value }: { label: string; value: unknown }) {
  const rendered = typeof value === 'number' ? formatNumber(value) : String(value ?? '—');

  return (
    <div className="rounded-pill border border-white/60 bg-white/35 px-3 py-2 text-sm text-slate-800">
      <div className="text-xs text-slate-600">{label}</div>
      <div className="mt-1 font-semibold">{rendered}</div>
    </div>
  );
}
