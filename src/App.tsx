import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import PatientStatusBoard from './components/PatientStatusBoard';
import AnalyticsOverview from './components/AnalyticsOverview';
import DiagnosticsQueue from './components/DiagnosticsQueue';
import InteractionLogger from './components/InteractionLogger';
import StressModeToggle from './components/StressModeToggle';
import { criticalResultIds, highRiskPatientIds, wardCensus } from './data/derived';
import { patients } from './data/syntheticData';
import { INITIAL_SECTION } from './sections';
import type { Section } from './sections';
import { recordNavigation, recordStressMode, useAcknowledgements } from './telemetry/store';
import { Activity, Users, ClipboardList, FlaskConical, Bell, Shield } from 'lucide-react';

const sectionMeta: Record<Section, { label: string; icon: React.ReactNode; description: string }> = {
  patients: {
    label: 'Patient Status Board',
    icon: <Users size={16} />,
    description: 'Real-time vitals and risk stratification for all admitted patients.',
  },
  analytics: {
    label: 'Analytics Overview',
    icon: <Activity size={16} />,
    description: 'Department performance metrics and flow analytics.',
  },
  diagnostics: {
    label: 'Diagnostics',
    icon: <FlaskConical size={16} />,
    description: 'Lab results, imaging queue, and diagnostic turnaround times.',
  },
  logs: {
    label: 'Interaction Logs',
    icon: <ClipboardList size={16} />,
    description: 'VR simulation interaction tracking and audit log.',
  },
};

/** Current time, refreshed every `intervalMs`. */
function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Day shift 07:00–19:00 UTC, night shift otherwise. */
function shiftLabel(now: Date): string {
  const hour = now.getUTCHours();
  const shift = hour >= 7 && hour < 19 ? 'Day' : 'Night';
  return `Shift: ${shift} · ${now.toISOString().slice(11, 16)} UTC`;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>(INITIAL_SECTION);
  const [stressMode, setStressMode] = useState(false);
  const now = useNow(30_000);
  const acknowledgements = useAcknowledgements();

  // Open alerts = high-risk patients and critical results not yet acknowledged this session.
  const openAlerts =
    highRiskPatientIds.filter((id) => !acknowledgements.patientIds.has(id)).length +
    criticalResultIds.filter((id) => !acknowledgements.resultIds.has(id)).length;

  const meta = sectionMeta[activeSection];

  const navigate = (section: Section) => {
    if (section === activeSection) return;
    setActiveSection(section);
    recordNavigation(section);
  };

  const toggleStressMode = () => {
    const next = !stressMode;
    setStressMode(next);
    recordStressMode(next);
  };

  return (
    <div className={`flex h-screen overflow-hidden ${stressMode ? 'stress-mode' : ''}`}>
      {/* Stress-mode global alert banner */}
      {stressMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 animate-pulse-alert flex items-center justify-center gap-2 py-1.5 text-white text-xs font-semibold uppercase tracking-widest shadow-lg shadow-red-900/50">
          <Bell size={12} className="animate-bounce" />
          HIGH-STRESS SIMULATION ACTIVE — CLINICAL ALARM MODE ENGAGED
          <Bell size={12} className="animate-bounce" />
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={navigate}
        stressMode={stressMode}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className={`
            flex-shrink-0 flex items-center justify-between px-6 py-3 border-b
            ${stressMode
              ? 'border-red-700/60 bg-red-950/20 mt-8'
              : 'border-clinical-border bg-clinical-panel mt-0'}
          `}
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${stressMode ? 'bg-red-800/40 text-red-400' : 'bg-clinical-blue-600/20 text-clinical-blue-500'}`}>
              {meta.icon}
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">{meta.label}</h1>
              <p className="text-[11px] text-clinical-muted hidden sm:block">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stress mode toggle */}
            <StressModeToggle enabled={stressMode} onToggle={toggleStressMode} />

            {/* Notification bell */}
            <div className="relative">
              <button
                type="button"
                aria-label={`${openAlerts} unacknowledged alert${openAlerts === 1 ? '' : 's'}`}
                title={`${openAlerts} unacknowledged alert${openAlerts === 1 ? '' : 's'}`}
                className={`p-2 rounded-lg border transition-colors ${stressMode ? 'border-red-700/40 text-red-400 bg-red-900/20 animate-pulse-alert' : 'border-clinical-border text-clinical-muted hover:text-white hover:border-clinical-blue-600'}`}>
                <Bell size={16} />
              </button>
              {openAlerts > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {openAlerts > 99 ? '99+' : openAlerts}
                </span>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-clinical-blue-600/30 border border-clinical-blue-600/40 flex items-center justify-center">
                <Shield size={13} className="text-clinical-blue-400" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-white font-medium leading-tight">Dr. G. Odonkor</p>
                <p className="text-[10px] text-clinical-muted">Senior Clinician</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className={`transition-all duration-200 ${stressMode ? 'ring-1 ring-red-600/30 rounded-xl' : ''}`}
          >
            {activeSection === 'patients' && <PatientStatusBoard stressMode={stressMode} />}
            {activeSection === 'analytics' && <AnalyticsOverview stressMode={stressMode} />}
            {activeSection === 'diagnostics' && <DiagnosticsQueue stressMode={stressMode} />}
            {activeSection === 'logs' && <InteractionLogger stressMode={stressMode} />}
          </div>
        </div>

        {/* Footer status bar */}
        <footer className={`flex-shrink-0 px-6 py-2 border-t flex items-center gap-4 text-[11px] ${stressMode ? 'border-red-800/50 bg-red-950/20' : 'border-clinical-border bg-clinical-panel'}`}>
          <span className="flex items-center gap-1.5 text-clinical-muted">
            <span className={`w-1.5 h-1.5 rounded-full ${stressMode ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
            {stressMode ? 'Simulation Active' : 'Connected to HIS'}
          </span>
          <span className="text-clinical-border">|</span>
          <span className="text-clinical-muted font-mono">{shiftLabel(now)}</span>
          <span className="text-clinical-border">|</span>
          <span className="text-clinical-muted">Wards: {wardCensus.length} active · {patients.length} patients monitored</span>
          <span className="ml-auto text-clinical-border font-mono">ClinFlow v0.1.0 — VR Precursor Build</span>
        </footer>
      </main>
    </div>
  );
}
