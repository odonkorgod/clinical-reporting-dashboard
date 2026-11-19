import { diagnostics } from '../data/syntheticData';
import { patientsById } from '../data/derived';
import type { DiagnosticResult, DiagnosticStatus } from '../data/types';
import { AUTO_ACTIONS } from '../telemetry/actions';
import { logEvent, useAcknowledgements } from '../telemetry/store';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DiagnosticsQueueProps {
  stressMode: boolean;
}

const statusStyle: Record<DiagnosticStatus, string> = {
  Critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
  Pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
  Completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  'In Progress': 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
};

const openCount = diagnostics.filter((d) => d.status !== 'Completed').length;
const criticalCount = diagnostics.filter((d) => d.status === 'Critical').length;

const formatUtcTime = (iso: string) => new Date(iso).toISOString().slice(11, 16);

export default function DiagnosticsQueue({ stressMode }: DiagnosticsQueueProps) {
  const { resultIds: acknowledged } = useAcknowledgements();
  const unacknowledgedCritical = criticalCount - diagnostics.filter((d) => acknowledged.has(d.id)).length;

  const review = (d: DiagnosticResult) =>
    logEvent({ source: 'diagnostics', action: AUTO_ACTIONS.reviewedResult, patientId: d.patientId, targetId: d.id, detail: d.test });

  const acknowledge = (d: DiagnosticResult) =>
    logEvent({ source: 'diagnostics', action: AUTO_ACTIONS.acknowledgedCriticalResult, patientId: d.patientId, targetId: d.id, detail: d.test });

  return (
    <div className={`rounded-xl border overflow-hidden ${stressMode ? 'border-red-700/50' : 'border-clinical-border'}`}>
      <div className="px-4 py-3 bg-clinical-panel border-b border-clinical-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Diagnostic Queue</h3>
          <p className="text-[11px] text-clinical-muted mt-0.5">
            {openCount} open · {diagnostics.length - openCount} completed this shift
          </p>
        </div>
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full border ${
            unacknowledgedCritical > 0
              ? 'bg-red-900/30 text-red-400 border-red-800/40'
              : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40'
          }`}
        >
          {unacknowledgedCritical > 0 ? `${unacknowledgedCritical} of ${criticalCount} critical unacknowledged` : 'All critical results acknowledged'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-clinical-dark/60 border-b border-clinical-border">
              {['Test', 'Patient', 'Status', 'Requested', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-clinical-muted font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diagnostics.map((item) => {
              const isCritical = item.status === 'Critical';
              const isAcknowledged = acknowledged.has(item.id);
              const alarming = isCritical && stressMode && !isAcknowledged;
              const patient = patientsById.get(item.patientId);
              return (
                <tr key={item.id} className={`border-b border-clinical-border/50 ${alarming ? 'bg-red-950/20' : 'hover:bg-white/[0.02]'}`}>
                  <td className="px-4 py-3 text-sm text-clinical-text">
                    <span className="flex items-center gap-2">
                      {alarming && <AlertTriangle size={13} className="text-red-400 animate-pulse-alert flex-shrink-0" />}
                      {item.test}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-mono text-clinical-blue-500">{item.patientId}</p>
                    {patient && <p className="text-[11px] text-clinical-muted">{patient.name} · {patient.ward}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[item.status]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-clinical-muted">{formatUtcTime(item.requestedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => review(item)}
                        className="text-[11px] px-2 py-1 rounded-md border border-clinical-border text-clinical-muted hover:text-white hover:border-clinical-blue-600 transition-colors"
                      >
                        Review
                      </button>
                      {isCritical && (isAcknowledged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 size={12} /> Ack'd
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledge(item)}
                          className={`text-[11px] px-2 py-1 rounded-md border font-semibold transition-colors ${
                            stressMode
                              ? 'border-red-500/60 text-red-200 bg-red-600/30 hover:bg-red-600/50'
                              : 'border-red-800/50 text-red-300 hover:bg-red-900/30'
                          }`}
                        >
                          Acknowledge
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
