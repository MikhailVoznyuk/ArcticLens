import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { normalizeRecord } from '../lib/records.js';

const textCache = new Map<string, string>();
const jsonCache = new Map<string, unknown>();
const csvCache = new Map<string, Record<string, string | number | boolean | null>[]>();

export function readText(filePath: string) {
  const cached = textCache.get(filePath);
  if (cached) return cached;
  const value = fs.readFileSync(filePath, 'utf8');
  textCache.set(filePath, value);
  return value;
}

export function readJson<T>(filePath: string): T {
  const cached = jsonCache.get(filePath);
  if (cached) return cached as T;
  const value = JSON.parse(readText(filePath)) as T;
  jsonCache.set(filePath, value);
  return value;
}

export function readCsv(filePath: string) {
  const cached = csvCache.get(filePath);
  if (cached) return cached;
  const content = readText(filePath);
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }).map((row: Record<string, unknown>) => normalizeRecord(row));
  csvCache.set(filePath, rows);
  return rows;
}
