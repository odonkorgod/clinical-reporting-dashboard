// The dataset loaded from the API, plus values computed from it once so every
// view agrees with the data instead of carrying its own hardcoded figures.

import { createContext, useContext } from 'react';
import { assessPatient } from '@clinflow/shared/clinical';
import type { RiskAssessment } from '@clinflow/shared/clinical';
import type { DatasetMeta, DeptWaitTime, DiagnosticResult, Patient, RiskLevel, Ward } from '@clinflow/shared/types';
import type { DatasetResponse } from '../api';

export interface AssessedPatient extends Patient {
  assessment: RiskAssessment;
}

export interface Dataset {
  meta: DatasetMeta;
  patients: AssessedPatient[];
  patientsById: ReadonlyMap<string, AssessedPatient>;
  diagnostics: DiagnosticResult[];
  waitingTimes: DeptWaitTime[];
  riskCounts: Record<RiskLevel, number>;
  highRiskPatientIds: readonly string[];
  criticalResultIds: readonly string[];
  /** Patients per ward, largest first. */
  wardCensus: { ward: Ward; count: number }[];
}

export function deriveDataset(raw: DatasetResponse): Dataset {
  const patients = raw.patients.map((p) => ({ ...p, assessment: assessPatient(p) }));

  const riskCounts: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0 };
  const wardCounts = new Map<Ward, number>();
  for (const p of patients) {
    riskCounts[p.assessment.risk]++;
    wardCounts.set(p.ward, (wardCounts.get(p.ward) ?? 0) + 1);
  }

  return {
    meta: raw.meta,
    patients,
    patientsById: new Map(patients.map((p) => [p.id, p])),
    diagnostics: raw.diagnostics,
    waitingTimes: raw.waitingTimes,
    riskCounts,
    highRiskPatientIds: patients.filter((p) => p.assessment.risk === 'high').map((p) => p.id),
    criticalResultIds: raw.diagnostics.filter((d) => d.status === 'Critical').map((d) => d.id),
    wardCensus: [...wardCounts].map(([ward, count]) => ({ ward, count })).sort((a, b) => b.count - a.count),
  };
}

export const DatasetContext = createContext<Dataset | null>(null);

/** The loaded dataset. Only usable below <DatasetProvider>, which renders children once loaded. */
export function useDataset(): Dataset {
  const dataset = useContext(DatasetContext);
  if (!dataset) throw new Error('useDataset() must be used inside <DatasetProvider>');
  return dataset;
}
