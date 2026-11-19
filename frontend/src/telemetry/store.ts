// App-wide interaction log for the VR research study.
//
// Lives outside React so any screen can record events, whether or not the
// Interaction Logs view is open. Each entry captures the simulation context at
// the moment of the action: which section the user was on, whether stress mode
// was active, and timings that can be used as response-time measures.
//
// Every event is also uploaded to the backend (Neon Postgres) for central
// analysis. Unsent events wait in a persisted outbox and are retried with
// backoff, so the dashboard keeps working offline or while the API is down.

import { useMemo, useSyncExternalStore } from 'react';
import { ApiError, uploadEvents } from '../api';
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
const OUTBOX_KEY = 'clinflow_outbox_v1';

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

const isEntry = (e: unknown): e is LogEntry => isRecord(e) && typeof e.id === 'string' && typeof e.action === 'string';

function loadEntries(): LogEntry[] {
  const current = readJson(STORAGE_KEY);
  if (Array.isArray(current)) return current.filter(isEntry);

  // Carry over logs recorded before the v2 format so no study data is lost.
  const legacy = readJson(LEGACY_STORAGE_KEY);
  if (Array.isArray(legacy)) {
    return legacy
      .filter((e): e is LegacyEntry => isRecord(e) && typeof e.action === 'string' && typeof e.timestamp === 'string')
      .map(migrateLegacy);
  }
  return [];
}

function loadOutbox(local: LogEntry[]): LogEntry[] {
  const stored = readJson(OUTBOX_KEY);
  if (Array.isArray(stored)) return stored.filter(isEntry);
  // First run with server sync: upload everything recorded in this browser so far.
  return [...local];
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage full or unavailable (e.g. private mode): keep the in-memory log.
  }
}

// ---------------------------------------------------------------------------
// Store

let entries: LogEntry[] = loadEntries();
// Events not yet confirmed by the server. Kept apart from `entries` so that
// clearing the on-screen log never drops study data that hasn't been uploaded.
let outbox: LogEntry[] = loadOutbox(entries);
const listeners = new Set<() => void>();

export interface SyncStatus {
  /** Events waiting to be uploaded. */
  pending: number;
  uploading: boolean;
  lastError: string | null;
  lastSyncedAt: string | null;
}

let syncStatus: SyncStatus = { pending: outbox.length, uploading: false, lastError: null, lastSyncedAt: null };

const context = {
  section: INITIAL_SECTION as Section,
  sectionOpenedAt: performance.now(),
  stressMode: false,
  alarmOnsetAt: null as number | null,
};

function notify(): void {
  for (const listener of listeners) listener();
}

function emit(): void {
  persist();
  notify();
}

function setSyncStatus(patch: Partial<SyncStatus>): void {
  syncStatus = { ...syncStatus, ...patch, pending: outbox.length };
  notify();
}

// ---------------------------------------------------------------------------
// Upload

const BATCH_SIZE = 200;
const INITIAL_RETRY_MS = 2_000;
const MAX_RETRY_MS = 60_000;
let retryDelay = INITIAL_RETRY_MS;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** Upload the outbox in batches. Safe to call at any time; overlapping calls are ignored. */
export async function flushOutbox(): Promise<void> {
  if (syncStatus.uploading || outbox.length === 0) return;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const batch = outbox.slice(0, BATCH_SIZE);
  const batchIds = new Set(batch.map((e) => e.id));
  const removeBatch = () => {
    outbox = outbox.filter((e) => !batchIds.has(e.id));
    persist();
  };
  setSyncStatus({ uploading: true });

  try {
    await uploadEvents(batch);
    removeBatch();
    retryDelay = INITIAL_RETRY_MS;
    setSyncStatus({ uploading: false, lastError: null, lastSyncedAt: new Date().toISOString() });
    if (outbox.length > 0) void flushOutbox();
  } catch (error) {
    if (error instanceof ApiError && error.isPermanent) {
      // The server will never accept this batch; don't let it block newer events.
      // The events stay in the local log and its CSV export.
      console.error(`Server rejected ${batch.length} interaction events; they remain in the local log only.`, error);
      removeBatch();
      setSyncStatus({ uploading: false, lastError: `${batch.length} events rejected by the server (kept locally)` });
      if (outbox.length > 0) void flushOutbox();
      return;
    }
    setSyncStatus({ uploading: false, lastError: error instanceof Error ? error.message : String(error) });
    retryTimer = setTimeout(() => void flushOutbox(), retryDelay);
    retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushOutbox());
  setTimeout(() => void flushOutbox(), 0);
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
  outbox = [...outbox, entry];
  emit();
  setSyncStatus({});
  void flushOutbox();
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

/** Clears the log shown in this browser. Unsent events are still uploaded; the server copy is kept. */
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

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(subscribe, () => syncStatus);
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
