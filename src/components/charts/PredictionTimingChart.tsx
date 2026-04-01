'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TimingData {
  id: string;
  name: string;
  avgMinutesBefore: number;
}

export function PredictionTimingChart({ data }: { data: TimingData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data]
    .filter(d => d.avgMinutesBefore > 0)
    .sort((a, b) => b.avgMinutesBefore - a.avgMinutesBefore);

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            type="number"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 11 }}
            label={{ value: 'Avg minutes before match', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <YAxis dataKey="name" type="category" width={80} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => [`${Math.round(Number(value))} min before`, 'Avg Timing']}
          />
          <Bar dataKey="avgMinutesBefore" name="Minutes Before" radius={[0, 6, 6, 0]}>
            {sorted.map((entry, i) => (
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
