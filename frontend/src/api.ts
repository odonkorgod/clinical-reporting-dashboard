// Client for the ClinFlow backend. In development Vite proxies /api to the
// backend (see vite.config.ts); in production the backend serves this app, so
// relative URLs work. Set VITE_API_URL to point at an API on another origin.

import type { DatasetMeta, DeptWaitTime, DiagnosticResult, Patient } from '@clinflow/shared/types';
import type { LogEntry } from './telemetry/store';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface DatasetResponse {
  meta: DatasetMeta;
  patients: Patient[];
  diagnostics: DiagnosticResult[];
  waitingTimes: DeptWaitTime[];
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  /** 4xx other than timeouts/rate limits: retrying the same request won't help. */
  get isPermanent(): boolean {
    return this.status >= 400 && this.status < 500 && this.status !== 408 && this.status !== 429;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? `${init?.method ?? 'GET'} ${path} failed with ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export function fetchDataset(signal?: AbortSignal): Promise<DatasetResponse> {
  return request<DatasetResponse>('/api/dataset', { signal });
}

export function uploadEvents(events: readonly LogEntry[]): Promise<{ received: number; inserted: number }> {
  return request('/api/events', { method: 'POST', body: JSON.stringify({ events }) });
}

/** Server-side CSV of every event stored in the database. */
export const serverExportUrl = `${API_BASE}/api/events/export.csv`;
