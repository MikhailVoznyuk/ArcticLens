import path from 'node:path';

export function normalizeSlashes(value: string) {
  return value.replace(/\\/g, '/');
}

export function toPublicDataPath(root: string, absPath: string) {
  const rel = normalizeSlashes(path.relative(root, absPath));
  return `/data/${rel}`;
}
