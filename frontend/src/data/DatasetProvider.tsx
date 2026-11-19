import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, RotateCw } from 'lucide-react';
import { fetchDataset } from '../api';
import { DatasetContext, deriveDataset } from './dataset';
import type { Dataset } from './dataset';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; dataset: Dataset };

export default function DatasetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchDataset(controller.signal)
      .then((raw) => setState({ status: 'ready', dataset: deriveDataset(raw) }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
      });
    return () => controller.abort();
  }, [attempt]);

  if (state.status === 'ready') {
    return <DatasetContext.Provider value={state.dataset}>{children}</DatasetContext.Provider>;
  }

  return (
    <div className="flex h-screen items-center justify-center px-4">
      {state.status === 'loading' ? (
        <div className="flex items-center gap-3 text-clinical-muted" role="status">
          <Activity size={18} className="text-clinical-blue-500 animate-pulse" />
          <span className="text-sm">Loading patient data…</span>
        </div>
      ) : (
        <div className="max-w-sm rounded-xl border border-red-800/50 bg-red-950/20 p-5 text-center" role="alert">
          <AlertTriangle size={22} className="mx-auto mb-2 text-red-400" />
          <p className="text-sm font-semibold text-white">Couldn't load patient data</p>
          <p className="mt-1 text-xs text-clinical-muted">{state.message}</p>
          <button
            type="button"
            onClick={() => {
              setState({ status: 'loading' });
              setAttempt((n) => n + 1);
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-clinical-border px-3 py-1.5 text-xs text-clinical-text hover:border-clinical-blue-600 hover:text-white"
          >
            <RotateCw size={12} /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
