'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TimingData {
  id: string;
  name: string;
  avgMinutesBefore: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  const days = Math.floor(minutes / 1440);
  const hrs = Math.round((minutes % 1440) / 60);
  return hrs > 0 ? `${days}d ${hrs}h` : `${days}d`;
}

export function PredictionTimingChart({ data }: { data: TimingData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data]
    .filter(d => d.avgMinutesBefore > 0)
    .sort((a, b) => b.avgMinutesBefore - a.avgMinutesBefore);

  // Convert to hours for the axis to keep numbers readable
  const chartData = sorted.map(d => ({
    ...d,
    avgHoursBefore: d.avgMinutesBefore / 60,
  }));

  const chartHeight = Math.max(500, chartData.length * 28);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 11 }}
            label={{ value: 'Avg hours before match', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as TimingData & { avgHoursBefore: number };
              return (
                <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-xl">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-emerald-400">Avg timing: {formatDuration(d.avgMinutesBefore)} before</p>
                </div>
              );
            }}
          />
          <Bar dataKey="avgHoursBefore" name="Hours Before" radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.avgMinutesBefore > 120 ? '#22c55e' : entry.avgMinutesBefore > 30 ? '#eab308' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No timing data yet</div>;
}
