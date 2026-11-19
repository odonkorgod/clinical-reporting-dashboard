import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { waitingTimes } from '../data/syntheticData';
import { Clock, TrendingDown } from 'lucide-react';

interface AnalyticsOverviewProps {
  stressMode: boolean;
}

const barColors = [
  '#ef4444', // Emergency — fastest should be red (high urgency)
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#ec4899',
  '#64748b',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-clinical-panel border border-clinical-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-semibold text-white">{label}</p>
        <p className="text-clinical-blue-500 font-mono mt-1">
          {payload[0].value} min avg wait
        </p>
        <p className="text-clinical-muted text-xs mt-0.5">
          {waitingTimes.find(d => d.department === label)?.patientCount} patients queued
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsOverview({ stressMode }: AnalyticsOverviewProps) {
  const sorted = [...waitingTimes].sort((a, b) => a.avgWait - b.avgWait);
  const avgOverall = Math.round(waitingTimes.reduce((s, d) => s + d.avgWait, 0) / waitingTimes.length);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="flex flex-col gap-4">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Overall Avg Wait',
            value: `${avgOverall} min`,
            sub: 'Across all departments',
            icon: <Clock size={16} className="text-clinical-blue-500" />,
            bg: 'bg-clinical-panel border-clinical-border',
          },
          {
            label: 'Best Dept',
            value: best.department,
            sub: `${best.avgWait} min avg`,
            icon: <TrendingDown size={16} className="text-emerald-400" />,
            bg: 'bg-emerald-900/10 border-emerald-800/30',
          },
          {
            label: 'Bottleneck Dept',
            value: worst.department,
            sub: `${worst.avgWait} min avg`,
            icon: <Clock size={16} className="text-amber-400" />,
            bg: stressMode ? 'bg-red-900/20 border-red-700/50' : 'bg-amber-900/10 border-amber-800/30',
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl border p-4 ${kpi.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              {kpi.icon}
              <span className="text-[11px] text-clinical-muted uppercase tracking-wider">{kpi.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-clinical-muted mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className={`rounded-xl border p-4 ${stressMode ? 'border-red-700/50 bg-red-950/10' : 'border-clinical-border bg-clinical-panel'}`}>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-white">Average Waiting Time per Department</h3>
          <p className="text-[11px] text-clinical-muted mt-0.5">Minutes · Simulated current shift data</p>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={waitingTimes} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
            <XAxis
              dataKey="department"
              tick={{ fill: '#6b87a5', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b87a5', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit=" min"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="avgWait" radius={[4, 4, 0, 0]}>
              {waitingTimes.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={stressMode ? (waitingTimes[index].avgWait > 40 ? '#ef4444' : '#b91c1c') : barColors[index % barColors.length]}
                  fillOpacity={0.85}
                />
              ))}
              <LabelList dataKey="avgWait" position="top" style={{ fill: '#6b87a5', fontSize: 11 }} formatter={(v: unknown) => `${v}m`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
