import { Hono } from 'hono';
import { prisma } from '../db.js';

const toIso = (d: Date) => d.toISOString();

export const datasetRoutes = new Hono();

/**
 * Everything the dashboard needs in one round trip. The dataset is small
 * (a few hundred rows) and read once per page load.
 */
datasetRoutes.get('/', async (c) => {
  const [meta, patients, diagnostics, waitingTimes] = await Promise.all([
    prisma.datasetMeta.findUnique({ where: { id: 1 }, select: { seed: true, generatedAt: true } }),
    prisma.patient.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        age: true,
        ward: true,
        heartRate: true,
        systolic: true,
        diastolic: true,
        spo2: true,
        temperature: true,
        diagnosis: true,
        admittedAt: true,
      },
    }),
    prisma.diagnosticResult.findMany({
      orderBy: { requestedAt: 'asc' },
      select: { id: true, test: true, patientId: true, status: true, requestedAt: true },
    }),
    prisma.departmentWaitTime.findMany({
      orderBy: { department: 'asc' },
      select: { department: true, avgWait: true, patientCount: true },
    }),
  ]);

  if (!meta) {
    return c.json({ error: 'Dataset not seeded. Run `pnpm db:seed`.' }, 503);
  }

  return c.json({
    meta: { seed: meta.seed, generatedAt: toIso(meta.generatedAt) },
    patients: patients.map((p) => ({ ...p, admittedAt: toIso(p.admittedAt) })),
    diagnostics: diagnostics.map((d) => ({ ...d, requestedAt: toIso(d.requestedAt) })),
    waitingTimes,
  });
});
