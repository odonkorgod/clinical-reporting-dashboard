import { useState, useEffect } from 'react';
import { logActions } from '../data/syntheticData';
import { ClipboardList, Plus, ChevronDown, Trash2, Download } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  action: string;
  userId: string;
}

interface InteractionLoggerProps {
  stressMode: boolean;
}

const userId = 'SIM-USER-001'; // Simulated VR user ID

const LS_KEY = 'clinflow_interaction_log';

function loadLogFromStorage(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as LogEntry[]) : [];
  } catch {
    return [];
  }
}

export default function InteractionLogger({ stressMode }: InteractionLoggerProps) {
  // Initialise from localStorage so logs persist across page refreshes
  const [log, setLog] = useState<LogEntry[]>(loadLogFromStorage);
  const [selectedAction, setSelectedAction] = useState(logActions[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  // Keep localStorage in sync whenever the log changes
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(log));
  }, [log]);

  const handleLog = () => {
    const entry: LogEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: selectedAction,
      userId,
    };
    setLog((prev) => [entry, ...prev]);
    setLastAdded(entry.id);
    setTimeout(() => setLastAdded(null), 1500);
  };

  const clearLog = () => {
    setLog([]);
    localStorage.removeItem(LS_KEY);
  };

  // Export as CSV with headers: ID, Timestamp, UserID, Action
  const exportLog = () => {
    const header = 'ID,Timestamp,UserID,Action';
    const rows = log.map((e) =>
      [e.id, e.timestamp, e.userId, `"${e.action.replace(/"/g, '""')}"`].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vr_interaction_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-GB', { hour12: false });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header + controls */}
      <div className={`rounded-xl border p-4 ${stressMode ? 'border-red-700/50 bg-red-950/10' : 'border-clinical-border bg-clinical-panel'}`}>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={16} className={stressMode ? 'text-red-400' : 'text-clinical-blue-500'} />
          <h3 className="text-sm font-semibold text-white">Interaction Logger</h3>
          <span className="ml-auto text-[11px] text-clinical-muted font-mono bg-clinical-dark px-2 py-0.5 rounded-full">
            {userId}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Action dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`
                w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm border transition-colors
                ${stressMode
                  ? 'bg-red-950/20 border-red-700/40 text-red-100 hover:border-red-600'
                  : 'bg-clinical-dark border-clinical-border text-clinical-text hover:border-clinical-blue-600'}
              `}
            >
              <span className="truncate">{selectedAction}</span>
              <ChevronDown size={14} className={`flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className={`
                absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border shadow-2xl overflow-hidden animate-slide-in
                ${stressMode ? 'bg-gray-950 border-red-700/40' : 'bg-clinical-dark border-clinical-border'}
              `}>
                {logActions.map((action) => (
                  <button
                    key={action}
                    onClick={() => { setSelectedAction(action); setIsOpen(false); }}
                    className={`
                      w-full text-left px-3 py-2.5 text-sm transition-colors
                      ${action === selectedAction
                        ? stressMode ? 'bg-red-900/40 text-red-300' : 'bg-clinical-blue-600/20 text-clinical-blue-400'
                        : 'text-clinical-muted hover:text-white hover:bg-white/5'}
                    `}
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Log button */}
          <button
            onClick={handleLog}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 flex-shrink-0
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
            <p className="text-[11px] text-clinical-muted mt-0.5">{log.length} event{log.length !== 1 ? 's' : ''} recorded this session</p>
          </div>
          <div className="flex items-center gap-2">
            {log.length > 0 && (
              <>
                <button
                  onClick={exportLog}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-clinical-border text-clinical-muted hover:text-white hover:border-clinical-blue-600 transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
                <button
                  onClick={clearLog}
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
            <p className="text-xs text-clinical-border mt-1">Select an action above and click "Log Action" to start recording</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-clinical-dark/90 backdrop-blur-sm">
                <tr className="border-b border-clinical-border">
                  {['#', 'Timestamp', 'User', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-clinical-muted">
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
                      ${entry.id === lastAdded ? 'bg-clinical-blue-600/10 animate-slide-in' : 'hover:bg-white/2'}
                    `}
                  >
                    <td className="px-4 py-2.5 text-xs font-mono text-clinical-border w-8">
                      {log.length - idx}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-clinical-muted whitespace-nowrap">
                      {formatTime(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-clinical-blue-500 font-mono whitespace-nowrap">
                      {entry.userId}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-clinical-text">
                      {entry.action}
                    </td>
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
