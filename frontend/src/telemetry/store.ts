// App-wide interaction log for the VR research study.
//
// Lives outside React so any screen can record events, whether or not the
// Interaction Logs view is open. Each entry captures the simulation context at
// the moment of the action: which section the user was on, whether stress mode
// was active, and timings that can be used as response-time measures.

import { useMemo, useSyncExternalStore } from 'react';
import { INITIAL_SECTION } from '../sections';
import type { Section } from '../sections';
import { AUTO_ACTIONS } from './actions';

export type LogSource = 'manual' | 'patients' | 'diagnostics' | 'system';

export interface LogEntry {
  id: string;
  /** One session per page load; acknowledgements reset with a new session. */
  sessionId: string;
  /** ISO 8601, UTC. */
  timestamp: string;
  userId: string;
  source: LogSource;
  /** Section the user was viewing when the event happened. */
  section: string;
  action: string;
  /** Free-text context, e.g. the diagnostic test name. */
  detail: string | null;
  patientId: string | null;
  /** The specific item acted on, e.g. a diagnostic result ID. */
  targetId: string | null;
  /** null only for entries migrated from the original log format. */
  stressMode: boolean | null;
  /** Milliseconds since the current section was opened. */
  msSinceSectionOpen: number | null;
  /** Milliseconds since stress mode was switched on; null when it is off. */
  msSinceAlarmOnset: number | null;
}

export interface LogEventInput {
  source: LogSource;
  action: string;
  detail?: string | null;
  patientId?: string | null;
  targetId?: string | null;
}

export const SIM_USER_ID = 'SIM-USER-001';

const STORAGE_KEY = 'clinflow_interaction_log_v2';
const LEGACY_STORAGE_KEY = 'clinflow_interaction_log';

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const sessionId = makeId();

// ---------------------------------------------------------------------------
// Persistence

interface LegacyEntry {
  id: number;
  timestamp: string;
  action: string;
  userId: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function migrateLegacy(entry: LegacyEntry): LogEntry {
  return {
    id: `legacy-${entry.id}`,
    sessionId: 'legacy',
    timestamp: entry.timestamp,
    userId: entry.userId,
    source: 'manual',
    section: 'logs',
    action: entry.action,
    detail: null,
    patientId: null,
    targetId: null,
    stressMode: null,
    msSinceSectionOpen: null,
    msSinceAlarmOnset: null,
  };
}

function loadEntries(): LogEntry[] {
  const current = readJson(STORAGE_KEY);
  if (Array.isArray(current)) {
    return current.filter((e): e is LogEntry => isRecord(e) && typeof e.id === 'string' && typeof e.action === 'string');
  }

  // Carry over logs recorded before the v2 format so no study data is lost.
  const legacy = readJson(LEGACY_STORAGE_KEY);
  if (Array.isArray(legacy)) {
    return legacy
      .filter((e): e is LegacyEntry => isRecord(e) && typeof e.action === 'string' && typeof e.timestamp === 'string')
      .map(migrateLegacy);
  }
  return [];
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage full or unavailable (e.g. private mode): keep the in-memory log.
  }
}

// ---------------------------------------------------------------------------
// Store

let entries: LogEntry[] = loadEntries();
const listeners = new Set<() => void>();

const context = {
  section: INITIAL_SECTION as Section,
  sectionOpenedAt: performance.now(),
  stressMode: false,
  alarmOnsetAt: null as number | null,
};

function emit(): void {
  persist();
  for (const listener of listeners) listener();
}

export function logEvent(input: LogEventInput): LogEntry {
  const now = performance.now();
  const entry: LogEntry = {
    id: makeId(),
    sessionId,
    timestamp: new Date().toISOString(),
    userId: SIM_USER_ID,
    source: input.source,
    section: context.section,
    action: input.action,
    detail: input.detail ?? null,
    patientId: input.patientId ?? null,
    targetId: input.targetId ?? null,
    stressMode: context.stressMode,
    msSinceSectionOpen: Math.round(now - context.sectionOpenedAt),
    msSinceAlarmOnset: context.alarmOnsetAt === null ? null : Math.round(now - context.alarmOnsetAt),
  };
  entries = [entry, ...entries];
  emit();
  return entry;
}

/** Call when the user navigates; resets the section timer and logs the change. */
export function recordNavigation(section: Section): void {
  if (section === context.section) return;
  context.section = section;
  context.sectionOpenedAt = performance.now();
  logEvent({ source: 'system', action: AUTO_ACTIONS.openedSection, detail: section });
}

/**
 * Call when stress mode is toggled. Activation starts the alarm timer;
 * the deactivation entry's msSinceAlarmOnset is the total alarm duration.
 */
export function recordStressMode(enabled: boolean): void {
  if (enabled === context.stressMode) return;
  if (enabled) {
    context.stressMode = true;
    context.alarmOnsetAt = performance.now();
    logEvent({ source: 'system', action: AUTO_ACTIONS.stressModeOn });
  } else {
    logEvent({ source: 'system', action: AUTO_ACTIONS.stressModeOff });
    context.stressMode = false;
    context.alarmOnsetAt = null;
  }
}

export function clearLog(): void {
  entries = [];
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInteractionLog(): LogEntry[] {
  return useSyncExternalStore(subscribe, () => entries);
}

/** IDs acknowledged in the current session, for patients and diagnostic results. */
export function useAcknowledgements(): { patientIds: ReadonlySet<string>; resultIds: ReadonlySet<string> } {
  const log = useInteractionLog();
  return useMemo(() => {
    const patientIds = new Set<string>();
    const resultIds = new Set<string>();
    for (const e of log) {
      if (e.sessionId !== sessionId) continue;
      if (e.action === AUTO_ACTIONS.acknowledgedPatientAlert && e.patientId) patientIds.add(e.patientId);
      if (e.action === AUTO_ACTIONS.acknowledgedCriticalResult && e.targetId) resultIds.add(e.targetId);
    }
    return { patientIds, resultIds };
  }, [log]);
}
