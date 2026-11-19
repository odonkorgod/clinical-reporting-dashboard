import { useState } from 'react';
import { assessedPatients, riskCounts } from '../data/derived';
import type { AssessedPatient } from '../data/derived';
import { datasetMeta } from '../data/syntheticData';
import type { VitalScore } from '../lib/clinical';
import { AUTO_ACTIONS } from '../telemetry/actions';
import { logEvent, useAcknowledgements } from '../telemetry/store';
import { Heart, Activity, Thermometer, TrendingUp, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';

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

const formatUtcTime = (iso: string) => new Date(iso).toISOString().slice(11, 16);

const formatUtcDateTime = (iso: string) => new Date(iso).toISOString().slice(0, 16).replace('T', ' ');

// Chip colour follows the vital's NEWS2-style score: 3 = red, 2 = amber.
function VitalChip({ icon, value, label, score }: { icon: React.ReactNode; value: string; label: string; score: VitalScore }) {
  const tone =
    score === 3
      ? { chip: 'bg-red-900/30 text-red-300', icon: 'text-red-400' }
      : score === 2
        ? { chip: 'bg-amber-900/30 text-amber-200', icon: 'text-amber-400' }
        : { chip: 'bg-clinical-blue-900/30 text-clinical-text', icon: 'text-clinical-blue-500' };
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono ${tone.chip}`}>
      <span className={tone.icon}>{icon}</span>
      <span>{value}</span>
      <span className="text-clinical-muted text-[10px]">{label}</span>
    </div>
  );
}

interface PatientRowProps {
  patient: AssessedPatient;
  stressMode: boolean;
  expanded: boolean;
  acknowledged: boolean;
  onToggle: () => void;
  onAcknowledge: () => void;
}

function PatientRow({ patient, stressMode, expanded, acknowledged, onToggle, onAcknowledge }: PatientRowProps) {
  const { scores, total, risk: riskLevel } = patient.assessment;
  const risk = riskConfig[riskLevel];
  const isHighRisk = riskLevel === 'high';
  const alarming = isHighRisk && stressMode && !acknowledged;

  return (
    <>
      <tr
        className={`
          border-b border-clinical-border transition-colors duration-150 group
          ${alarming ? 'bg-red-950/20 animate-flash-border' : expanded ? 'bg-white/5' : 'hover:bg-white/[0.02]'}
        `}
      >
        {/* Patient ID & Name */}
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex items-center gap-3 text-left rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-clinical-blue-500"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              isHighRisk ? 'bg-red-900/60 text-red-300' : 'bg-clinical-blue-900/60 text-clinical-blue-500'
            }`}>
              {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="text-sm font-medium text-white group-hover:underline underline-offset-2">{patient.name}</p>
              <p className="text-[11px] text-clinical-muted font-mono">{patient.id} · {patient.ward}</p>
            </div>
            <ChevronDown size={14} className={`text-clinical-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </td>

        {/* Age */}
        <td className="px-4 py-3 text-sm text-clinical-muted text-center">{patient.age}y</td>

        {/* Vitals */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            <VitalChip icon={<Heart size={10} />} value={String(patient.heartRate)} label="bpm" score={scores.heartRate} />
            <VitalChip icon={<Activity size={10} />} value={`${patient.systolic}/${patient.diastolic}`} label="mmHg" score={scores.systolic} />
            <VitalChip icon={<TrendingUp size={10} />} value={`${patient.spo2}%`} label="SpO₂" score={scores.spo2} />
            <VitalChip icon={<Thermometer size={10} />} value={`${patient.temperature}°`} label="C" score={scores.temperature} />
          </div>
        </td>

        {/* Diagnosis */}
        <td className="px-4 py-3 text-sm text-clinical-text max-w-[200px]">
          <p className="truncate" title={patient.diagnosis}>{patient.diagnosis}</p>
        </td>

        {/* Risk Level */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {alarming && <AlertTriangle size={14} className="text-red-400 animate-pulse-alert flex-shrink-0" />}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${risk.badge}`}
              title={`Early-warning score ${total}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${risk.dot} ${alarming ? 'animate-pulse' : ''}`} />
              {risk.label} · {total}
            </span>
            {isHighRisk && (acknowledged ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400" title="Acknowledged this session">
                <CheckCircle2 size={12} /> Ack'd
              </span>
            ) : (
              <button
                type="button"
                onClick={onAcknowledge}
                className={`text-[11px] px-2 py-1 rounded-md border font-semibold transition-colors ${
                  stressMode
                    ? 'border-red-500/60 text-red-200 bg-red-600/30 hover:bg-red-600/50'
                    : 'border-clinical-border text-clinical-muted hover:text-white hover:border-clinical-blue-600'
                }`}
              >
                Acknowledge
              </button>
            ))}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-clinical-border bg-clinical-dark/60">
          <td colSpan={5} className="px-4 py-3">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-clinical-muted">Admitted</dt>
                <dd className="font-mono text-clinical-text">{formatUtcDateTime(patient.admittedAt)} UTC</dd>
              </div>
              <div>
                <dt className="text-clinical-muted">Diagnosis</dt>
                <dd className="text-clinical-text">{patient.diagnosis}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-clinical-muted">Early-warning score (simplified NEWS2)</dt>
                <dd className="font-mono text-clinical-text">
                  HR {scores.heartRate} · SBP {scores.systolic} · SpO₂ {scores.spo2} · Temp {scores.temperature} = {total}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

export default function PatientStatusBoard({ stressMode }: PatientStatusBoardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { patientIds: acknowledged } = useAcknowledgements();

  const toggle = (patient: AssessedPatient) => {
    const opening = expandedId !== patient.id;
    setExpandedId(opening ? patient.id : null);
    if (opening) logEvent({ source: 'patients', action: AUTO_ACTIONS.reviewedPatient, patientId: patient.id });
  };

  const acknowledge = (patient: AssessedPatient) =>
    logEvent({ source: 'patients', action: AUTO_ACTIONS.acknowledgedPatientAlert, patientId: patient.id });

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'High Risk', count: riskCounts.high, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/40' },
          { label: 'Medium Risk', count: riskCounts.medium, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/40' },
          { label: 'Low Risk', count: riskCounts.low, color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/40' },
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
            <p className="text-[11px] text-clinical-muted mt-0.5">
              {assessedPatients.length} patients · Updated {formatUtcTime(datasetMeta.generatedAt)} UTC
            </p>
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
              {assessedPatients.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  stressMode={stressMode}
                  expanded={expandedId === p.id}
                  acknowledged={acknowledged.has(p.id)}
                  onToggle={() => toggle(p)}
                  onAcknowledge={() => acknowledge(p)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
