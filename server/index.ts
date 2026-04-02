import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { z } from 'zod';
import { buildBundleIndex } from './services/bundle-indexer.js';
import { readJson } from './services/file-cache.js';
import { normalizeFeatureCollection } from './src/lib/geojson-normalize.js';
import { getParcelDetail } from './services/analytics.js';
import { resolveLayer } from './services/layers.js';
import type { AreaId, MetricGroup } from './types.js';

const port = Number(process.env.PORT ?? 4001);
const currentFile = fileURLToPath(import.meta.url);
const serverRoot = path.resolve(path.dirname(currentFile), '..');
const dataRoot = path.resolve(serverRoot, process.env.GIS_DATA_ROOT ?? './data/frontend_export');

async function main() {
  const app = Fastify({ logger: true });
  const areaSchema = z.enum(['amga', 'yunkor']);
  const layerGroupSchema = z.enum(['composites', 'indices', 'masks', 'dynamics', 'textures', 'terrain', 'experimental']);
  const bundle = buildBundleIndex(dataRoot);

  await app.register(cors, { origin: true });
  await app.register(fastifyStatic, {
    root: dataRoot,
    prefix: '/data/',
    decorateReply: false,
  });

  app.get('/health', async () => ({ ok: true, dataRoot }));

  app.get('/api/bootstrap', async () => {
    return {
      areas: (Object.entries(bundle.areas) as [AreaId, (typeof bundle.areas)[AreaId]][]).map(([id, entry]) => ({
        id,
        label: entry.label,
        years: entry.years,
      })),
      availableMetrics: Array.from(new Set(Object.values(bundle.areas).flatMap((area) => area.layers.map((layer) => layer.metricKey)))).sort(),
      basemapDefault: 'osm',
      layersByArea: Object.fromEntries(
        (Object.entries(bundle.areas) as [AreaId, (typeof bundle.areas)[AreaId]][]).map(([id, entry]) => [
          id,
          Object.fromEntries(
            ['composites', 'indices', 'masks', 'dynamics', 'textures', 'terrain', 'experimental'].map((group) => [
              group,
              Array.from(new Set(entry.layers.filter((layer) => layer.group === group).map((layer) => layer.metricKey))).sort(),
            ]),
          ),
        ]),
      ),
    };
  });

  app.get('/api/areas/:area/vectors', async (request, reply) => {
    const area = areaSchema.parse((request.params as { area: string }).area);
    const entry = bundle.areas[area];

    if (!entry.vectors.aoiPath || !entry.vectors.parcelsPath) {
      reply.code(404);
      return { error: 'Area vectors not found' };
    }

    return {
      aoi: normalizeFeatureCollection(area, readJson(entry.vectors.aoiPath)),
      parcels: normalizeFeatureCollection(area, readJson(entry.vectors.parcelsPath)),
    };
  });

  app.get('/api/layers/resolve', async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const area = areaSchema.parse(query.area);
    const group = layerGroupSchema.parse(query.group) as MetricGroup;
    const metricKey = String(query.metricKey ?? '').trim();
    const year = query.year ? Number(query.year) : undefined;

    if (!metricKey) {
      reply.code(400);
      return { error: 'metricKey is required' };
    }

    const layer = resolveLayer(bundle, area, group, metricKey, year);
    if (!layer) {
      reply.code(404);
      return { error: 'Layer not found', area, group, metricKey, year };
    }

    return {
      area,
      group,
      metricKey,
      year: layer.year,
      fileName: layer.fileName,
      url: layer.publicPath,
    };
  });

  app.get('/api/parcels/:area/:parcelId', async (request, reply) => {
    const params = request.params as { area: string; parcelId: string };
    const area = areaSchema.parse(params.area);
    const parcelId = decodeURIComponent(params.parcelId);
    const year = (request.query as { year?: string }).year ? Number((request.query as { year?: string }).year) : undefined;
    const detail = getParcelDetail(bundle, area, parcelId, year);

    if (!detail) {
      reply.code(404);
      return { error: `Parcel ${parcelId} not found in ${area}` };
    }

    return detail;
  });

  await app.listen({ port, host: '0.0.0.0' });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
