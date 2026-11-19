// Generates backend/prisma/seed-data.json, which `pnpm db:seed` loads into Postgres.
//
//   pnpm generate:data            # default seed
//   pnpm generate:data -- 1234    # custom seed
//
// Output is deterministic for a given seed. Vitals are sampled per patient
// from a target acuity tier, then checked against the same assessPatient()
// the dashboard uses, so the generated risk mix is exactly what the UI shows.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assessPatient, SCORED_VITALS } from '@clinflow/shared/clinical';
import type { ScoredVital, VitalScore } from '@clinflow/shared/clinical';
import type {
  DatasetMeta,
  DeptWaitTime,
  DiagnosticResult,
  DiagnosticStatus,
  Patient,
  RiskLevel,
  Ward,
} from '@clinflow/shared/types';

const DEFAULT_SEED = 20260328;
// Snapshot time the dataset represents (the "current shift").
const REFERENCE_TIME = Date.parse('2026-03-28T04:25:00Z');
const OUTPUT = resolve(import.meta.dirname, '../prisma/seed-data.json');

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)

const seedArg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
const seed = seedArg ? Number(seedArg) : DEFAULT_SEED;

let state = seed >>> 0;
function rand(): number {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const randTenth = (min: number, max: number) => randInt(Math.round(min * 10), Math.round(max * 10)) / 10;
const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
function weighted<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  let r = rand() * entries.reduce((s, [, w]) => s + w, 0);
  for (const [key, w] of entries) {
    r -= w;
    if (r < 0) return key;
  }
  return entries[entries.length - 1][0];
}

// ---------------------------------------------------------------------------
// Ward configuration

interface WardConfig {
  patients: number;
  ages: [number, number];
  femaleOnly?: boolean;
  acuity: Record<RiskLevel, number>;
  diagnoses: string[];
  queue: { avgWait: [number, number]; queued: [number, number] };
}

const WARD_CONFIG: Record<Ward, WardConfig> = {
  Cardiology: {
    patients: 45,
    ages: [35, 89],
    acuity: { low: 0.6, medium: 0.25, high: 0.15 },
    diagnoses: ['Acute coronary syndrome', 'Atrial fibrillation', 'Congestive heart failure', 'Hypertensive urgency', 'Chest pain under evaluation'],
    queue: { avgWait: [15, 35], queued: [10, 28] },
  },
  Emergency: {
    patients: 55,
    ages: [18, 85],
    acuity: { low: 0.45, medium: 0.3, high: 0.25 },
    diagnoses: ['Road traffic injury', 'Acute abdominal pain', 'Severe dehydration', 'Suspected sepsis', 'Asthma exacerbation', 'Syncope under evaluation'],
    queue: { avgWait: [35, 55], queued: [30, 45] },
  },
  General: {
    patients: 60,
    ages: [18, 90],
    acuity: { low: 0.75, medium: 0.18, high: 0.07 },
    diagnoses: ['Community-acquired pneumonia', 'Cellulitis', 'Uncontrolled type 2 diabetes', 'Urinary tract infection', 'Malaria', 'Post-operative monitoring'],
    queue: { avgWait: [25, 45], queued: [20, 40] },
  },
  ICU: {
    patients: 30,
    ages: [35, 89],
    acuity: { low: 0.25, medium: 0.35, high: 0.4 },
    diagnoses: ['Septic shock', 'Acute respiratory failure', 'Post-cardiac arrest care', 'Diabetic ketoacidosis', 'Severe traumatic brain injury'],
    queue: { avgWait: [5, 15], queued: [4, 12] },
  },
  Neurology: {
    patients: 38,
    ages: [20, 88],
    acuity: { low: 0.62, medium: 0.25, high: 0.13 },
    diagnoses: ['Ischaemic stroke', 'Seizure, post-ictal monitoring', 'Bacterial meningitis', 'Transient ischaemic attack', 'Guillain-Barré syndrome'],
    queue: { avgWait: [15, 35], queued: [8, 20] },
  },
  Obstetrics: {
    patients: 38,
    ages: [18, 42],
    femaleOnly: true,
    acuity: { low: 0.8, medium: 0.15, high: 0.05 },
    diagnoses: ['Pre-eclampsia', 'Postpartum haemorrhage', 'Preterm labour', 'Gestational diabetes', 'Post-caesarean monitoring'],
    queue: { avgWait: [15, 35], queued: [10, 30] },
  },
  Oncology: {
    patients: 42,
    ages: [25, 85],
    acuity: { low: 0.62, medium: 0.25, high: 0.13 },
    diagnoses: ['Neutropenic fever', 'Chemotherapy-induced nausea', 'Tumour lysis syndrome', 'Cancer pain crisis', 'Malignant pleural effusion'],
    queue: { avgWait: [8, 25], queued: [8, 20] },
  },
  Pulmonology: {
    patients: 40,
    ages: [30, 88],
    acuity: { low: 0.55, medium: 0.28, high: 0.17 },
    diagnoses: ['COPD exacerbation', 'Pulmonary embolism', 'Pulmonary tuberculosis', 'Pleural effusion', 'Interstitial lung disease'],
    queue: { avgWait: [20, 40], queued: [12, 30] },
  },
};

const MALE_NAMES = ['Kwame', 'Kwaku', 'Kofi', 'Yaw', 'Kwabena', 'Kwesi', 'Kojo', 'Kwadwo', 'Fiifi', 'Nana', 'Emmanuel', 'Samuel', 'Daniel', 'Isaac', 'Joseph', 'Michael', 'Prince', 'Richard', 'Eric', 'Ebenezer'];
const FEMALE_NAMES = ['Akosua', 'Ama', 'Abena', 'Efua', 'Adwoa', 'Esi', 'Afua', 'Yaa', 'Akua', 'Adjoa', 'Grace', 'Mercy', 'Comfort', 'Joyce', 'Patience', 'Gifty', 'Esther', 'Vida'];
const SURNAMES = ['Boateng', 'Mensah', 'Osei', 'Owusu', 'Asante', 'Appiah', 'Agyeman', 'Amoah', 'Kusi', 'Darko', 'Ofori', 'Addo', 'Annan', 'Quaye', 'Tetteh', 'Nkrumah', 'Badu', 'Sarpong', 'Frimpong', 'Acheampong', 'Gyamfi', 'Antwi', 'Bonsu', 'Ansah', 'Danquah', 'Opoku', 'Wiredu', 'Yeboah', 'Asamoah', 'Ampofo'];

// ---------------------------------------------------------------------------
// Vitals: value ranges that produce each NEWS2-style score. Where a score can
// come from either side of normal, the first range is the common presentation.

type Range = [number, number];
const VITAL_RANGES: Record<ScoredVital, Record<VitalScore, Range[]>> = {
  heartRate: { 0: [[55, 88]], 1: [[92, 108], [42, 50]], 2: [[112, 128]], 3: [[132, 148], [34, 40]] },
  systolic: { 0: [[112, 150]], 1: [[101, 110]], 2: [[91, 100]], 3: [[76, 90], [221, 232]] },
  spo2: { 0: [[96, 99]], 1: [[94, 95]], 2: [[92, 93]], 3: [[84, 91]] },
  temperature: { 0: [[36.2, 37.8]], 1: [[38.1, 39.0], [35.1, 36.0]], 2: [[39.1, 40.1]], 3: [[34.2, 35.0]] },
};

function sampleVital(vital: ScoredVital, score: VitalScore): number {
  const ranges = VITAL_RANGES[vital][score];
  const [lo, hi] = ranges.length > 1 && rand() < 0.2 ? ranges[1] : ranges[0];
  return vital === 'temperature' ? randTenth(lo, hi) : randInt(lo, hi);
}

/** Add `total` points across the vitals, capping each vital at `cap`. */
function distributeScores(total: number, cap: VitalScore): Record<ScoredVital, VitalScore> {
  const scores: Record<ScoredVital, VitalScore> = { heartRate: 0, systolic: 0, spo2: 0, temperature: 0 };
  let remaining = total;
  while (remaining > 0) {
    const k = pick(SCORED_VITALS);
    if (scores[k] < cap) {
      scores[k] = (scores[k] + 1) as VitalScore;
      remaining--;
    }
  }
  return scores;
}

function targetScores(tier: RiskLevel): Record<ScoredVital, VitalScore> {
  if (tier === 'low') return distributeScores(rand() < 0.35 ? 1 : 0, 1);
  if (tier === 'medium') {
    if (rand() < 0.3) {
      // A single extreme vital (NEWS2 red score) with everything else normal.
      const scores = distributeScores(0, 0);
      scores[pick(SCORED_VITALS)] = 3;
      return scores;
    }
    return distributeScores(randInt(3, 4), 2);
  }
  return distributeScores(randInt(5, 8), 3);
}

function sampleVitals(tier: RiskLevel) {
  const target = targetScores(tier);
  const systolic = sampleVital('systolic', target.systolic);
  // Pulse pressure keeps diastolic physiologically below systolic.
  const pulsePressure = systolic < 100 ? randInt(25, 35) : randInt(30, 60);
  return {
    heartRate: sampleVital('heartRate', target.heartRate),
    systolic,
    diastolic: Math.max(40, systolic - pulsePressure),
    spo2: sampleVital('spo2', target.spo2),
    temperature: sampleVital('temperature', target.temperature),
  };
}

// ---------------------------------------------------------------------------
// Build the dataset

const toIso = (ms: number) => new Date(ms).toISOString().replace('.000Z', 'Z');
const usedNames = new Set<string>();

function uniqueName(female: boolean): string {
  for (;;) {
    const name = `${pick(female ? FEMALE_NAMES : MALE_NAMES)} ${pick(SURNAMES)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
}

const unnumbered: Omit<Patient, 'id'>[] = [];
for (const [ward, cfg] of Object.entries(WARD_CONFIG) as [Ward, WardConfig][]) {
  for (let i = 0; i < cfg.patients; i++) {
    const tier = weighted(cfg.acuity);
    const vitals = sampleVitals(tier);
    const assessed = assessPatient(vitals).risk;
    if (assessed !== tier) throw new Error(`Sampler produced ${assessed} for a ${tier} target: ${JSON.stringify(vitals)}`);

    unnumbered.push({
      name: uniqueName(cfg.femaleOnly === true || rand() < 0.5),
      age: randInt(...cfg.ages),
      ward,
      ...vitals,
      diagnosis: pick(cfg.diagnoses),
      admittedAt: toIso(REFERENCE_TIME - randInt(60, 96 * 60) * 60_000),
    });
  }
}

// Shuffle (Fisher–Yates) so IDs are not grouped by ward.
for (let i = unnumbered.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [unnumbered[i], unnumbered[j]] = [unnumbered[j], unnumbered[i]];
}
const patients: Patient[] = unnumbered.map((p, i) => ({ id: `PT-${String(i + 1).padStart(3, '0')}`, ...p }));

const waitingTimes: DeptWaitTime[] = (Object.entries(WARD_CONFIG) as [Ward, WardConfig][]).map(([department, cfg]) => ({
  department,
  avgWait: randInt(...cfg.queue.avgWait),
  patientCount: randInt(...cfg.queue.queued),
}));

const TESTS = ['Full Blood Count', 'Troponin I', 'Chest X-Ray', 'CT Brain', 'Blood Culture', 'ABG Analysis', 'Serum Lactate', 'Urea & Electrolytes', 'D-Dimer', 'Malaria RDT', 'C-Reactive Protein', '12-lead ECG'];
const highRisk = patients.filter((p) => assessPatient(p).risk === 'high');
const diagnosticsDraft: Omit<DiagnosticResult, 'id'>[] = [];
for (let i = 0; i < 12; i++) {
  const critical = i < 3;
  diagnosticsDraft.push({
    test: pick(TESTS),
    patientId: pick(critical ? highRisk : patients).id,
    status: critical ? 'Critical' : weighted<Exclude<DiagnosticStatus, 'Critical'>>({ Pending: 4, 'In Progress': 3, Completed: 3 }),
    requestedAt: toIso(REFERENCE_TIME - randInt(5, 150) * 60_000),
  });
}
diagnosticsDraft.sort((a, b) => a.requestedAt.localeCompare(b.requestedAt));
const diagnostics: DiagnosticResult[] = diagnosticsDraft.map((d, i) => ({ id: `DX-${String(i + 1).padStart(3, '0')}`, ...d }));

// ---------------------------------------------------------------------------
// Sanity checks and output

for (const p of patients) {
  if (p.diastolic >= p.systolic) throw new Error(`${p.id}: diastolic ${p.diastolic} >= systolic ${p.systolic}`);
}

const meta: DatasetMeta = { seed, generatedAt: toIso(REFERENCE_TIME) };
writeFileSync(OUTPUT, `${JSON.stringify({ meta, patients, waitingTimes, diagnostics }, null, 2)}\n`);

const riskMix = { high: 0, medium: 0, low: 0 };
for (const p of patients) riskMix[assessPatient(p).risk]++;
const pct = (n: number) => `${Math.round((n / patients.length) * 100)}%`;
console.log(`Wrote ${OUTPUT}`);
console.log(`seed ${seed} · ${patients.length} patients · ${diagnostics.length} diagnostic results`);
console.log(`risk mix: high ${riskMix.high} (${pct(riskMix.high)}), medium ${riskMix.medium} (${pct(riskMix.medium)}), low ${riskMix.low} (${pct(riskMix.low)})`);
