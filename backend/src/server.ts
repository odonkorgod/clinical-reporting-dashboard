import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prisma } from './db.js';
import { env } from './env.js';
import { datasetRoutes } from './routes/dataset.js';
import { eventRoutes } from './routes/events.js';

const app = new Hono();

app.use('/api/*', logger());

app.get('/api/health', async (c) => {
  const started = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return c.json({ status: 'ok', database: 'ok', latencyMs: Math.round(performance.now() - started) });
  } catch (error) {
    console.error('Health check failed:', error);
    return c.json({ status: 'degraded', database: 'unreachable' }, 503);
  }
});

app.route('/api/dataset', datasetRoutes);
app.route('/api/events', eventRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((error, c) => {
  console.error(`${c.req.method} ${c.req.path} failed:`, error);
  return c.json({ error: 'Internal server error' }, 500);
});

// In production, serve the built dashboard from the same origin as the API.
const frontendDist = resolve(import.meta.dirname, '../../frontend/dist');
const indexHtml = resolve(frontendDist, 'index.html');
if (existsSync(indexHtml)) {
  const root = relative(process.cwd(), frontendDist) || '.';
  const notApi = (path: string) => !path.startsWith('/api/');
  app.use('*', async (c, next) => (notApi(c.req.path) ? serveStatic({ root })(c, next) : next()));
  // Single-page app: unknown non-API paths get the dashboard shell.
  app.get('*', async (c, next) => (notApi(c.req.path) ? c.html(await readFile(indexHtml, 'utf8')) : next()));
}

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`ClinFlow API listening on http://localhost:${info.port}`);
  if (existsSync(indexHtml)) console.log(`Serving dashboard from ${frontendDist}`);
});

async function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
