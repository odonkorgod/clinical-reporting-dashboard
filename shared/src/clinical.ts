// Risk stratification used by both the dashboard and the data generator.
//
// Scoring bands follow the NEWS2 early-warning score for the four vitals this
// dataset records (heart rate, systolic BP, SpO2 on scale 1, temperature).
// NEWS2 also uses respiratory rate, supplemental oxygen and consciousness,
// which are not captured here, so the aggregate thresholds below are lowered
// to suit a 4-parameter score. This is a simulation aid, not a validated
// clinical tool.
//
// Keep this file free of runtime imports: the Node generator script imports it
// directly, and only `import type` lines are stripped safely.

import type { Patient, RiskLevel } from './types';

export type VitalScore = 0 | 1 | 2 | 3;

export type ScoredVital = 'heartRate' | 'systolic' | 'spo2' | 'temperature';

export const SCORED_VITALS: readonly ScoredVital[] = ['heartRate', 'systolic', 'spo2', 'temperature'];

export interface RiskAssessment {
  scores: Record<ScoredVital, VitalScore>;
  total: number;
  risk: RiskLevel;
}

export function scoreHeartRate(bpm: number): VitalScore {
  if (bpm <= 40) return 3;
  if (bpm <= 50) return 1;
  if (bpm <= 90) return 0;
  if (bpm <= 110) return 1;
  if (bpm <= 130) return 2;
  return 3;
}

export function scoreSystolic(mmHg: number): VitalScore {
  if (mmHg <= 90) return 3;
  if (mmHg <= 100) return 2;
  if (mmHg <= 110) return 1;
  if (mmHg <= 219) return 0;
  return 3;
}

export function scoreSpo2(percent: number): VitalScore {
  if (percent <= 91) return 3;
  if (percent <= 93) return 2;
  if (percent <= 95) return 1;
  return 0;
}

export function scoreTemperature(celsius: number): VitalScore {
  if (celsius <= 35.0) return 3;
  if (celsius <= 36.0) return 1;
  if (celsius <= 38.0) return 0;
  if (celsius <= 39.0) return 1;
  return 2;
}

/**
 * Aggregate risk from the per-vital scores:
 * - high:   total >= 5
 * - medium: total 3–4, or any single vital scoring 3 (NEWS2 "red score")
 * - low:    otherwise
 */
export function riskFromScores(scores: Record<ScoredVital, VitalScore>): { total: number; risk: RiskLevel } {
  const values = SCORED_VITALS.map((k) => scores[k]);
  const total = values.reduce<number>((sum, s) => sum + s, 0);
  if (total >= 5) return { total, risk: 'high' };
  if (total >= 3 || values.includes(3)) return { total, risk: 'medium' };
  return { total, risk: 'low' };
}

export function assessPatient(p: Pick<Patient, ScoredVital>): RiskAssessment {
  const scores: Record<ScoredVital, VitalScore> = {
    heartRate: scoreHeartRate(p.heartRate),
    systolic: scoreSystolic(p.systolic),
    spo2: scoreSpo2(p.spo2),
    temperature: scoreTemperature(p.temperature),
  };
  return { scores, ...riskFromScores(scores) };
}
