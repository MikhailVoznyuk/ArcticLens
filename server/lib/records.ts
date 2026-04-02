const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

export function parseScalar(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (raw === '') return null;
  const lower = raw.toLowerCase();
  if (TRUE_VALUES.has(lower)) return true;
  if (FALSE_VALUES.has(lower)) return false;
  const numeric = Number(raw.replace(',', '.'));
  if (!Number.isNaN(numeric) && /^[-+]?\d+(?:[.,]\d+)?$/.test(raw)) return numeric;
  return raw;
}

export function normalizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key.trim(), parseScalar(value)]));
}

export function getParcelId(record: Record<string, unknown>) {
  const candidate = record.parcel_id ?? record.parcelId ?? record.id ?? record.ID ?? record.PARCEL_ID;
  return candidate === undefined || candidate === null ? undefined : String(candidate);
}
