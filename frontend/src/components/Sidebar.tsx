import { useState } from 'react';
import {
  Users,
  Activity,
  FlaskConical,
  ClipboardList,
  ChevronRight,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { wardCensus } from '../data/derived';
import type { Ward } from '../data/types';
import type { Section } from '../sections';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeSection: Section;
  onNavigate: (section: Section) => void;
  stressMode: boolean;
}

const navItems: NavItem[] = [
  { id: 'patients', label: 'Patients', icon: <Users size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <Activity size={18} /> },
  { id: 'diagnostics', label: 'Diagnostics', icon: <FlaskConical size={18} /> },
  { id: 'logs', label: 'Interaction Logs', icon: <ClipboardList size={18} /> },
];

const wardColors: Record<Ward, string> = {
  ICU: 'bg-red-500',
  Emergency: 'bg-amber-500',
  General: 'bg-blue-500',
  Cardiology: 'bg-purple-500',
  Neurology: 'bg-cyan-500',
  Obstetrics: 'bg-pink-500',
  Oncology: 'bg-emerald-500',
  Pulmonology: 'bg-indigo-500',
};

export default function Sidebar({ activeSection, onNavigate, stressMode }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        flex flex-col bg-clinical-panel border-r border-clinical-border transition-all duration-300 flex-shrink-0
        ${collapsed ? 'w-16' : 'w-60'}
        ${stressMode ? 'border-r-red-700' : ''}
      `}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo / Header */}
      <div className={`flex items-center border-b border-clinical-border ${stressMode ? 'border-b-red-700' : ''} ${collapsed ? 'justify-center py-4 px-2' : 'gap-3 px-4 py-5'}`}>
        {!collapsed && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${stressMode ? 'bg-red-600 animate-pulse-alert' : 'bg-clinical-blue-600'}`}>
            <Heart size={16} className="text-white" />
          </div>
        )}
        {!collapsed && (
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">ClinFlow</p>
            <p className="text-[10px] text-clinical-muted uppercase tracking-widest">VR Sim Platform</p>
          </div>
        )}
        {/* Toggle button — always visible and centered when collapsed */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            flex-shrink-0 flex items-center justify-center rounded-lg transition-colors
            text-clinical-muted hover:text-white hover:bg-white/10
            ${collapsed ? 'w-10 h-10' : 'w-7 h-7'}
          `}
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest text-clinical-muted px-2 mb-2">Navigation</p>
        )}
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            aria-current={activeSection === item.id ? 'page' : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 w-full text-left group
              ${activeSection === item.id
                ? stressMode
                  ? 'bg-red-900/40 text-red-400 border border-red-700/60'
                  : 'bg-clinical-blue-600/20 text-clinical-blue-500 border border-clinical-blue-600/30'
                : 'text-clinical-muted hover:text-white hover:bg-white/5 border border-transparent'}
            `}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && activeSection === item.id && (
              <ChevronRight size={14} className="ml-auto opacity-60" />
            )}
          </button>
        ))}
      </nav>

      {/* Ward Snapshot */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-clinical-border">
          <p className="text-[10px] uppercase tracking-widest text-clinical-muted mb-3">Ward Occupancy</p>
          <div className="flex flex-col gap-2">
            {wardCensus.map((ward) => (
              <div key={ward.ward} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${wardColors[ward.ward]}`} />
                  <span className="text-xs text-clinical-muted">{ward.ward}</span>
                </div>
                <span className="text-xs font-mono text-clinical-text">{ward.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom indicator */}
      {stressMode && !collapsed && (
        <div className="px-4 py-3 border-t border-red-800 bg-red-950/40">
          <div className="flex items-center gap-2 animate-pulse-alert">
            <AlertTriangle size={12} className="text-red-400" />
            <span className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">High-Stress Active</span>
          </div>
        </div>
      )}

      {/* Bottom system status */}
      <div className={`px-4 py-3 border-t border-clinical-border ${stressMode ? 'border-t-red-700' : ''}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stressMode ? 'bg-red-500 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
          {!collapsed && (
            <span className="text-[10px] text-clinical-muted">
              {stressMode ? 'ALERT MODE' : 'System Online'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
