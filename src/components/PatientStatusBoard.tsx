import { patients } from '../data/syntheticData';
import type { Patient } from '../data/syntheticData';
import { Heart, Activity, Thermometer, TrendingUp, AlertTriangle } from 'lucide-react';

interface PatientStatusBoardProps {
  stressMode: boolean;
}

const riskConfig = {
  high: {
    label: 'High',
    badge: 'bg-red-500/20 text-red-400 border border-red-500/40 ring-1 ring-red-500/20',
    dot: 'bg-red-500',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    dot: 'bg-amber-500',
  },
  low: {
    label: 'Low',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
    dot: 'bg-emerald-500',
  },
};

function VitalChip({ icon, value, label, danger }: { icon: React.ReactNode; value: string; label: string; danger?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono ${danger ? 'bg-red-900/30 text-red-300' : 'bg-clinical-blue-900/30 text-clinical-text'}`}>
      <span className={danger ? 'text-red-400' : 'text-clinical-blue-500'}>{icon}</span>
      <span>{value}</span>
      <span className="text-clinical-muted text-[10px]">{label}</span>
    </div>
  );
}

function PatientRow({ patient, stressMode }: { patient: Patient; stressMode: boolean }) {
  const risk = riskConfig[patient.riskLevel];
  const isHighRisk = patient.riskLevel === 'high';
  const hrDanger = patient.heartRate > 120 || patient.heartRate < 50;
  const bpDanger = patient.systolic > 160 || patient.systolic < 90;
  const spo2Danger = patient.spo2 < 92;

  return (
    <tr
      className={`
        border-b border-clinical-border transition-colors duration-150 group
        ${isHighRisk && stressMode ? 'bg-red-950/20' : 'hover:bg-white/2'}
        ${isHighRisk && stressMode ? 'animate-flash-border' : ''}
      `}
    >
      {/* Patient ID & Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
            isHighRisk ? 'bg-red-900/60 text-red-300' : 'bg-clinical-blue-900/60 text-clinical-blue-500'
          }`}>
            {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{patient.name}</p>
            <p className="text-[11px] text-clinical-muted font-mono">{patient.id} · {patient.ward}</p>
          </div>
        </div>
      </td>

      {/* Age */}
      <td className="px-4 py-3 text-sm text-clinical-muted text-center">{patient.age}y</td>

      {/* Vitals */}
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          <VitalChip
            icon={<Heart size={10} />}
            value={String(patient.heartRate)}
            label="bpm"
            danger={hrDanger}
          />
          <VitalChip
            icon={<Activity size={10} />}
            value={`${patient.systolic}/${patient.diastolic}`}
            label="mmHg"
            danger={bpDanger}
          />
          <VitalChip
            icon={<TrendingUp size={10} />}
            value={`${patient.spo2}%`}
            label="SpO₂"
            danger={spo2Danger}
          />
          <VitalChip
            icon={<Thermometer size={10} />}
            value={`${patient.temperature}°`}
            label="C"
            danger={patient.temperature > 38.5}
          />
        </div>
      </td>

      {/* Diagnosis */}
      <td className="px-4 py-3 text-sm text-clinical-text max-w-[200px]">
        <p className="truncate" title={patient.diagnosis}>{patient.diagnosis}</p>
      </td>

      {/* Risk Level */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isHighRisk && stressMode && (
            <AlertTriangle size={14} className="text-red-400 animate-pulse-alert flex-shrink-0" />
          )}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${risk.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} ${isHighRisk ? 'animate-pulse' : ''}`} />
            {risk.label}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function PatientStatusBoard({ stressMode }: PatientStatusBoardProps) {
  const highCount = patients.filter(p => p.riskLevel === 'high').length;
  const medCount = patients.filter(p => p.riskLevel === 'medium').length;
  const lowCount = patients.filter(p => p.riskLevel === 'low').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'High Risk', count: highCount, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40' },
          { label: 'Medium Risk', count: medCount, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40' },
          { label: 'Low Risk', count: lowCount, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border p-3 ${stat.bg} ${stressMode && stat.label === 'High Risk' ? 'animate-flash-border' : ''}`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-clinical-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-clinical-border overflow-hidden">
        <div className="px-4 py-3 bg-clinical-panel flex items-center justify-between border-b border-clinical-border">
          <div>
            <h3 className="text-sm font-semibold text-white">Patient Status Board</h3>
            <p className="text-[11px] text-clinical-muted mt-0.5">{patients.length} patients · Updated 04:25 UTC</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-clinical-muted">Live</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-clinical-dark/60 border-b border-clinical-border">
                {['Patient', 'Age', 'Vitals', 'Diagnosis', 'Risk Level'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] uppercase tracking-wider font-semibold text-clinical-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <PatientRow key={p.id} patient={p} stressMode={stressMode} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
