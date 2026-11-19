// Values computed once from the synthetic dataset, so every view agrees with
// the data instead of carrying its own hardcoded figures.

import { assessPatient } from '../lib/clinical';
import type { RiskAssessment } from '../lib/clinical';
import { diagnostics, patients } from './syntheticData';
import type { Patient, RiskLevel, Ward } from './types';

export interface AssessedPatient extends Patient {
  assessment: RiskAssessment;
}

export const assessedPatients: AssessedPatient[] = patients.map((p) => ({ ...p, assessment: assessPatient(p) }));

export const patientsById: ReadonlyMap<string, AssessedPatient> = new Map(assessedPatients.map((p) => [p.id, p]));

export const riskCounts: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0 };
for (const p of assessedPatients) riskCounts[p.assessment.risk]++;

export const highRiskPatientIds: readonly string[] = assessedPatients
  .filter((p) => p.assessment.risk === 'high')
  .map((p) => p.id);

export const criticalResultIds: readonly string[] = diagnostics.filter((d) => d.status === 'Critical').map((d) => d.id);

/** Patients per ward, largest first. */
export const wardCensus: { ward: Ward; count: number }[] = Object.entries(
  patients.reduce<Partial<Record<Ward, number>>>((acc, p) => {
    acc[p.ward] = (acc[p.ward] ?? 0) + 1;
    return acc;
  }, {}),
)
  .map(([ward, count]) => ({ ward: ward as Ward, count: count ?? 0 }))
  .sort((a, b) => b.count - a.count);
