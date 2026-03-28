import { useState } from 'react';
import Sidebar from './components/Sidebar';
import PatientStatusBoard from './components/PatientStatusBoard';
import AnalyticsOverview from './components/AnalyticsOverview';
import InteractionLogger from './components/InteractionLogger';
import StressModeToggle from './components/StressModeToggle';
import { Activity, Users, ClipboardList, FlaskConical, Bell, Shield } from 'lucide-react';

type Section = 'patients' | 'analytics' | 'diagnostics' | 'logs';

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

function DiagnosticsPlaceholder({ stressMode }: { stressMode: boolean }) {
  const items = [
    { test: 'Full Blood Count', patient: 'PT-004', status: 'Critical', time: '03:58', urgent: true },
    { test: 'Troponin I', patient: 'PT-001', status: 'Pending', time: '04:10', urgent: false },
    { test: 'Chest X-Ray', patient: 'PT-005', status: 'Completed', time: '03:30', urgent: false },
    { test: 'CT Brain', patient: 'PT-002', status: 'In Progress', time: '04:05', urgent: false },
    { test: 'Blood Culture', patient: 'PT-004', status: 'Critical', time: '04:00', urgent: true },
    { test: 'ABG Analysis', patient: 'PT-008', status: 'Pending', time: '04:20', urgent: false },
  ];

  const statusStyle: Record<string, string> = {
    Critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
    Pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    Completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    'In Progress': 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${stressMode ? 'border-red-700/50' : 'border-clinical-border'}`}>
      <div className="px-4 py-3 bg-clinical-panel border-b border-clinical-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Diagnostic Queue</h3>
          <p className="text-[11px] text-clinical-muted mt-0.5">6 pending results this shift</p>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800/40">2 Critical</span>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-clinical-dark/60 border-b border-clinical-border">
            {['Test', 'Patient', 'Status', 'Time'].map(h => (
              <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wider text-clinical-muted font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={`border-b border-clinical-border/50 ${item.urgent && stressMode ? 'bg-red-950/20' : 'hover:bg-white/2'}`}>
              <td className="px-4 py-3 text-sm text-clinical-text">{item.test}</td>
              <td className="px-4 py-3 text-sm font-mono text-clinical-blue-500">{item.patient}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle[item.status]}`}>{item.status}</span>
              </td>
              <td className="px-4 py-3 text-sm font-mono text-clinical-muted">{item.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('patients');
  const [stressMode, setStressMode] = useState(false);
  const [notifCount] = useState(3);

  const meta = sectionMeta[activeSection];

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
        onNavigate={(s) => setActiveSection(s as Section)}
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
            <StressModeToggle enabled={stressMode} onToggle={() => setStressMode(!stressMode)} />

            {/* Notification bell */}
            <div className="relative">
              <button className={`p-2 rounded-lg border transition-colors ${stressMode ? 'border-red-700/40 text-red-400 bg-red-900/20 animate-pulse-alert' : 'border-clinical-border text-clinical-muted hover:text-white hover:border-clinical-blue-600'}`}>
                <Bell size={16} />
              </button>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">
                  {notifCount}
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
            {activeSection === 'diagnostics' && <DiagnosticsPlaceholder stressMode={stressMode} />}
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
          <span className="text-clinical-muted font-mono">Shift: Night · 04:25 UTC</span>
          <span className="text-clinical-border">|</span>
          <span className="text-clinical-muted">Wards: 4 active · 130 beds monitored</span>
          <span className="ml-auto text-clinical-border font-mono">ClinFlow v0.1.0 — VR Precursor Build</span>
        </footer>
      </main>
    </div>
  );
}
