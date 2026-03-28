import { AlertTriangle, Zap } from 'lucide-react';

interface StressModeToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export default function StressModeToggle({ enabled, onToggle }: StressModeToggleProps) {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200
        ${enabled
          ? 'bg-red-900/30 border-red-600/60 shadow-lg shadow-red-900/30'
          : 'bg-clinical-panel border-clinical-border hover:border-clinical-blue-600/40'}
      `}
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
    >
      <div className={`flex-shrink-0 ${enabled ? 'text-red-400 animate-pulse-alert' : 'text-clinical-muted'}`}>
        {enabled ? <AlertTriangle size={16} /> : <Zap size={16} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-tight ${enabled ? 'text-red-300' : 'text-clinical-text'}`}>
          Simulate High-Stress Mode
        </p>
        <p className={`text-[10px] mt-0.5 ${enabled ? 'text-red-400' : 'text-clinical-muted'}`}>
          {enabled ? 'ACTIVE — Clinical alarms simulated' : 'Tests user response to clinical alerts'}
        </p>
      </div>

      {/* Toggle pill */}
      <div
        className={`
          relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200
          ${enabled ? 'bg-red-600' : 'bg-clinical-border'}
        `}
      >
        <span
          className={`
            absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </div>
    </div>
  );
}
