import type { AreaId } from '@/shared/types/map';

export type MetricValue = {
  key: string;
  label: string;
  value: number | string | boolean | null;
};

export type ParcelDetail = {
  area: AreaId;
  parcelId: string;
  year?: number;
  title: string;
  isValidForFullAnalytics?: boolean;
  popupMetrics: MetricValue[];
  modalMetrics: MetricValue[];
  currentRecord: Record<string, string | number | boolean | null>;
  timeline: Array<Record<string, string | number | boolean | null>>;
};

export type FavoriteParcel = {
  area: AreaId;
  parcelId: string;
  title: string;
};
