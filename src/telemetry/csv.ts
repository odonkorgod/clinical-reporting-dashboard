import type { LogEntry } from './store';

const COLUMNS: [header: string, value: (e: LogEntry) => string | number | boolean | null][] = [
  ['ID', (e) => e.id],
  ['SessionID', (e) => e.sessionId],
  ['Timestamp', (e) => e.timestamp],
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
];

function escapeCell(value: string | number | boolean | null): string {
  if (value === null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Oldest-first CSV, one row per event; empty cells mean "not applicable". */
export function toCsv(entries: readonly LogEntry[]): string {
  const rows = [...entries].reverse().map((e) => COLUMNS.map(([, get]) => escapeCell(get(e))).join(','));
  return [COLUMNS.map(([h]) => h).join(','), ...rows].join('\n');
}

export function downloadCsv(entries: readonly LogEntry[], filename = 'vr_interaction_logs.csv'): void {
  const blob = new Blob([toCsv(entries)], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // Revoke after the click has been handled; some browsers cancel the download otherwise.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
