import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../db.js';
import type { InteractionEvent } from '../generated/prisma/client.js';

const MAX_MS = 2_147_483_647; // Postgres integer upper bound

const EventSchema = z.object({
  id: z.string().min(1).max(100),
  sessionId: z.string().min(1).max(100),
  timestamp: z.iso.datetime(),
  userId: z.string().min(1).max(100),
  source: z.enum(['manual', 'patients', 'diagnostics', 'system']),
  section: z.string().min(1).max(50),
  action: z.string().min(1).max(200),
  detail: z.string().max(500).nullable(),
  patientId: z.string().max(50).nullable(),
  targetId: z.string().max(50).nullable(),
  stressMode: z.boolean().nullable(),
  msSinceSectionOpen: z.number().int().min(0).max(MAX_MS).nullable(),
  msSinceAlarmOnset: z.number().int().min(0).max(MAX_MS).nullable(),
});

const BatchSchema = z.object({ events: z.array(EventSchema).min(1).max(500) });

export const eventRoutes = new Hono();

/**
 * Ingest a batch of interaction events. Clients retry unsent batches, so
 * duplicates (same client-generated id) are ignored rather than rejected.
 */
eventRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = BatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Invalid event batch', issues: parsed.error.issues.slice(0, 10) }, 400);
  }

  const result = await prisma.interactionEvent.createMany({
    data: parsed.data.events.map((e) => ({ ...e, timestamp: new Date(e.timestamp) })),
    skipDuplicates: true,
  });

  return c.json({ received: parsed.data.events.length, inserted: result.count });
});

// ---------------------------------------------------------------------------
// CSV export for analysis in R / pandas. Same columns as the dashboard's
// browser export, plus ReceivedAt (server time the event arrived).

const COLUMNS: [header: string, value: (e: InteractionEvent) => string | number | boolean | null][] = [
  ['ID', (e) => e.id],
  ['SessionID', (e) => e.sessionId],
  ['Timestamp', (e) => e.timestamp.toISOString()],
  ['UserID', (e) => e.userId],
  ['Source', (e) => e.source],
  ['Section', (e) => e.section],
  ['Action', (e) => e.action],
  ['Detail', (e) => e.detail],
  ['PatientID', (e) => e.patientId],
  ['TargetID', (e) => e.targetId],
  ['StressMode', (e) => e.stressMode],
  ['MsSinceSectionOpen', (e) => e.msSinceSectionOpen],
  ['MsSinceAlarmOnset', (e) => e.msSinceAlarmOnset],
  ['ReceivedAt', (e) => e.receivedAt.toISOString()],
];

function escapeCell(value: string | number | boolean | null): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const ExportQuery = z.object({
  sessionId: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
});

eventRoutes.get('/export.csv', async (c) => {
  const query = ExportQuery.safeParse(c.req.query());
  if (!query.success) return c.json({ error: 'Invalid query' }, 400);
  const where = { sessionId: query.data.sessionId, userId: query.data.userId };

  const lines = [COLUMNS.map(([h]) => h).join(',')];
  const pageSize = 2000;
  let cursor: string | undefined;
  // Keyset pagination keeps memory and per-query transfer bounded.
  for (;;) {
    const page = await prisma.interactionEvent.findMany({
      where,
      orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
      take: pageSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    for (const e of page) lines.push(COLUMNS.map(([, get]) => escapeCell(get(e))).join(','));
    if (page.length < pageSize) break;
    cursor = page[page.length - 1].id;
  }

  return c.body(lines.join('\n'), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="clinflow_interaction_events.csv"',
  });
});
