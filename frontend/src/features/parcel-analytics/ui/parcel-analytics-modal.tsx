import { Fragment, useMemo } from 'react';
import { Heart, Plus, X } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFavoritesStore } from '@/features/favorites/model/use-favorites-store';
import { useMapStore } from '@/entities/map/model/use-map-store';
import { formatNumber, titleizeMetric } from '@/shared/lib/format';
import type { ParcelDetail } from '@/shared/types/parcel';

const TREND_KEYS = ['ndvi', 'ndwi', 'osavi', 'risk_score', 'water_occurrence'] as const;
const TREND_COLORS: Record<(typeof TREND_KEYS)[number], string> = {
  ndvi: '#16a34a',
  ndwi: '#2563eb',
  osavi: '#65a30d',
  risk_score: '#ef4444',
  water_occurrence: '#0ea5e9',
};

export function ParcelAnalyticsModal({ detail }: { detail: ParcelDetail }) {
  const close = useMapStore((state) => state.closeAnalytics);
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const favoriteItems = useFavoritesStore((state) => state.items);

  const hasFavorite = useMemo(
    () => favoriteItems.some((item) => item.area === detail.area && item.parcelId === detail.parcelId),
    [detail.area, detail.parcelId, favoriteItems],
  );

  const lineData = detail.timeline.map((row) => ({
    year: row.year,
    ...row,
  }));

  const currentPieData = detail.popupMetrics
    .filter((item) => typeof item.value === 'number' && Number(item.value) >= 0)
    .slice(0, 5)
    .map((item) => ({
      name: item.label,
      value: Number(item.value),
      fill: TREND_COLORS[item.label.replace(' ', '_').toLowerCase() as keyof typeof TREND_COLORS],
      color: TREND_COLORS[item.label.replace(' ', '_').toLowerCase() as keyof typeof TREND_COLORS],
    }));

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#F7FBFF]/30 p-4 backdrop-blur-sm">
      <div className="glass-card max-h-[92vh] w-[1200px] max-w-full overflow-hidden rounded-[32px]">
        <div className="flex items-start justify-between gap-4 border-b border-white/60 px-6 py-5">
          <div>
            <div className="text-sm text-slate-600">Подробная аналитика · {detail.area === 'amga' ? 'Амга' : 'Юнкор'}</div>
            <h2 className="mt-1 text-2xl font-semibold">{detail.title}</h2>
            <div className="mt-1 text-sm text-slate-700">parcel_id: {detail.parcelId}</div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleFavorite({ area: detail.area, parcelId: detail.parcelId, title: detail.title })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-accent shadow-md"
            >
              {hasFavorite ? <Heart className="h-5 w-5 fill-current" /> : <Plus className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[#E6E6E6]/50  text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="scrollbar-thin grid max-h-[calc(92vh-92px)] gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[1.35fr_0.95fr]">
          <section className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              {detail.modalMetrics.map((item) => (
                <div key={item.key} className="rounded-[24px] border border-white/70 bg-[#E6E6E6]/50 shadow-md p-4">
                  <div className="text-xs uppercase tracking-[0.08em] text-slate-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {typeof item.value === 'number' ? formatNumber(item.value) : String(item.value ?? '—')}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-white/70 bg-[#E6E6E6]/50  p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Тренды по годам</h3>
                  <p className="text-sm text-slate-600">Линейный обзор доступных yearly CSV для выбранного участка.</p>
                </div>
              </div>
              <div className="h-[360px] w-full">
                <ResponsiveContainer>
                  <LineChart data={lineData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.25)" strokeDasharray="4 4" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {TREND_KEYS.map((key) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={titleizeMetric(key)}
                        stroke={TREND_COLORS[key]}
                        strokeWidth={2}
                        dot={false}
                        connectNulls
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/70 bg-[#E6E6E6]/50 p-4">
              <h3 className="text-lg font-semibold">Срез текущего года</h3>
              <p className="mt-1 text-sm text-slate-600">Краткий обзор основных числовых показателей для выбранного участка.</p>
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={currentPieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={48} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-[#E6E6E6]/50 p-4">
              <h3 className="text-lg font-semibold">Атрибуты выбранного года</h3>
              <div className="mt-3 max-h-[360px] overflow-y-auto pr-1 text-sm">
                <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
                  {Object.entries(detail.currentRecord).map(([key, value]) => (
                    <Fragment key={key}>
                      <div className="text-slate-600">{titleizeMetric(key)}</div>
                      <div className="text-right font-medium text-slate-900">
                        {typeof value === 'number' ? formatNumber(value) : String(value ?? '—')}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
