// Loads prisma/seed-data.json (from `pnpm generate:data`) into the database.
// Replaces the synthetic dataset only; interaction_events (study data) are never touched.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import type { DatasetMeta, DeptWaitTime, DiagnosticResult, Patient } from '@clinflow/shared/types';
import { withVerifiedSsl } from '../src/connection.ts';
import { PrismaClient } from '../src/generated/prisma/client.js';

interface SeedData {
  meta: DatasetMeta;
  patients: Patient[];
  waitingTimes: DeptWaitTime[];
  diagnostics: DiagnosticResult[];
}

// prisma.config.ts has already loaded the repo-root env file.
// Seeding is an admin task, so prefer the direct (non-pooled) connection.
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set. Run `neon env pull` in the repo root.');

const data = JSON.parse(readFileSync(resolve(import.meta.dirname, 'seed-data.json'), 'utf8')) as SeedData;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: withVerifiedSsl(connectionString) }) });

try {
  await prisma.$transaction([
    prisma.diagnosticResult.deleteMany(),
    prisma.departmentWaitTime.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.datasetMeta.deleteMany(),
    prisma.datasetMeta.create({ data: { id: 1, seed: data.meta.seed, generatedAt: new Date(data.meta.generatedAt) } }),
    prisma.patient.createMany({ data: data.patients.map((p) => ({ ...p, admittedAt: new Date(p.admittedAt) })) }),
    prisma.diagnosticResult.createMany({ data: data.diagnostics.map((d) => ({ ...d, requestedAt: new Date(d.requestedAt) })) }),
    prisma.departmentWaitTime.createMany({ data: data.waitingTimes }),
  ]);
  console.log(
    `Seeded dataset (seed ${data.meta.seed}): ${data.patients.length} patients, ` +
      `${data.diagnostics.length} diagnostic results, ${data.waitingTimes.length} departments.`,
  );
} finally {
  await prisma.$disconnect();
}
