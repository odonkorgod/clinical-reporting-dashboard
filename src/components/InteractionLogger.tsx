import { useState } from 'react';
import { assessedPatients } from '../data/derived';
import { MANUAL_ACTIONS } from '../telemetry/actions';
import { downloadCsv } from '../telemetry/csv';
import { clearLog, logEvent, SIM_USER_ID, useInteractionLog } from '../telemetry/store';
import type { LogSource } from '../telemetry/store';
import { ClipboardList, Plus, Trash2, Download } from 'lucide-react';

interface InteractionLoggerProps {
  stressMode: boolean;
}

const sourceStyle: Record<LogSource, string> = {
  manual: 'text-clinical-blue-400',
  patients: 'text-emerald-400',
  diagnostics: 'text-purple-400',
  system: 'text-clinical-muted',
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour12: false });

const formatSeconds = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1)}s`);

export default function InteractionLogger({ stressMode }: InteractionLoggerProps) {
  const log = useInteractionLog();
  const [selectedAction, setSelectedAction] = useState<string>(MANUAL_ACTIONS[0]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const handleLog = () => {
    const entry = logEvent({ source: 'manual', action: selectedAction, patientId: selectedPatient || null });
    setLastAdded(entry.id);
    setTimeout(() => setLastAdded((current) => (current === entry.id ? null : current)), 1500);
  };

  const handleClear = () => {
    if (window.confirm(`Delete all ${log.length} logged events? Export them first if you need them.`)) clearLog();
  };

  const selectClass = `
    w-full px-3 py-2.5 rounded-lg text-sm border transition-colors appearance-none cursor-pointer
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-clinical-blue-500
    ${stressMode
      ? 'bg-red-950/20 border-red-700/40 text-red-100 hover:border-red-600'
      : 'bg-clinical-dark border-clinical-border text-clinical-text hover:border-clinical-blue-600'}
  `;

  return (
    <div className="flex flex-col gap-4">
      {/* Header + controls */}
      <div className={`rounded-xl border p-4 ${stressMode ? 'border-red-700/50 bg-red-950/10' : 'border-clinical-border bg-clinical-panel'}`}>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={16} className={stressMode ? 'text-red-400' : 'text-clinical-blue-500'} />
          <h3 className="text-sm font-semibold text-white">Interaction Logger</h3>
          <span className="ml-auto text-[11px] text-clinical-muted font-mono bg-clinical-dark px-2 py-0.5 rounded-full">
            {SIM_USER_ID}
          </span>
        </div>
        <p className="text-[11px] text-clinical-muted mb-4">
          Actions on the Patients and Diagnostics screens are logged automatically. Use this form for anything else.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1">
            <span className="sr-only">Action</span>
            <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} className={selectClass}>
              {MANUAL_ACTIONS.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </label>

          <label className="flex-1">
            <span className="sr-only">Patient</span>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className={selectClass}>
              <option value="">No specific patient</option>
              {assessedPatients.map((p) => (
                <option key={p.id} value={p.id}>{p.id} · {p.name}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleLog}
            className={`
              flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex-shrink-0
              ${stressMode
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/40'
                : 'bg-clinical-blue-600 hover:bg-clinical-blue-500 text-white shadow-lg shadow-blue-900/40'}
            `}
          >
            <Plus size={15} />
            Log Action
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className={`rounded-xl border overflow-hidden ${stressMode ? 'border-red-700/50' : 'border-clinical-border'}`}>
        <div className="px-4 py-3 bg-clinical-panel flex items-center justify-between border-b border-clinical-border">
          <div>
            <p className="text-sm font-semibold text-white">Event Log</p>
            <p className="text-[11px] text-clinical-muted mt-0.5">{log.length} event{log.length !== 1 ? 's' : ''} recorded</p>
          </div>
          <div className="flex items-center gap-2">
            {log.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => downloadCsv(log)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-clinical-border text-clinical-muted hover:text-white hover:border-clinical-blue-600 transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-clinical-border text-clinical-muted hover:text-red-400 hover:border-red-700 transition-colors"
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {log.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <ClipboardList size={32} className="mx-auto text-clinical-border mb-3" />
            <p className="text-sm text-clinical-muted">No actions logged yet</p>
            <p className="text-xs text-clinical-border mt-1">Use the dashboard or click "Log Action" to start recording</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-clinical-dark/90 backdrop-blur-sm">
                <tr className="border-b border-clinical-border">
                  {['#', 'Time', 'Source', 'Action', 'Patient', 'Stress', 'Since view', 'Since alarm'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-clinical-muted whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`
                      border-b border-clinical-border/50 transition-colors duration-300
                      ${entry.id === lastAdded ? 'bg-clinical-blue-600/10 animate-slide-in' : 'hover:bg-white/[0.02]'}
                    `}
                  >
                    <td className="px-4 py-2.5 text-xs font-mono text-clinical-muted w-8">{log.length - idx}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-clinical-muted whitespace-nowrap">{formatTime(entry.timestamp)}</td>
                    <td className={`px-4 py-2.5 text-xs font-mono whitespace-nowrap ${sourceStyle[entry.source] ?? 'text-clinical-muted'}`}>
                      {entry.source}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-clinical-text">
                      {entry.action}
                      {entry.detail && <span className="text-clinical-muted"> · {entry.detail}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-clinical-blue-500 whitespace-nowrap">{entry.patientId ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      {entry.stressMode === null ? (
                        <span className="text-clinical-muted">—</span>
                      ) : entry.stressMode ? (
                        <span className="text-red-400 font-semibold">ON</span>
                      ) : (
                        <span className="text-clinical-muted">off</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-clinical-muted whitespace-nowrap">{formatSeconds(entry.msSinceSectionOpen)}</td>
                    <td className="px-4 py-2.5 text-xs font-mono text-clinical-muted whitespace-nowrap">{formatSeconds(entry.msSinceAlarmOnset)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
