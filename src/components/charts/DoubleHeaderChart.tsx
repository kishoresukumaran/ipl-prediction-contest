'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DoubleHeaderData {
  name: string;
  totalDoubleHeaders: number;
  bothCorrect: number;
  successRate: number;
  color: string;
}

export function DoubleHeaderChart({ data }: { data: DoubleHeaderData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].filter(d => d.totalDoubleHeaders > 0).sort((a, b) => b.successRate - a.successRate);

  return (
    <div className="w-full" style={{ height: Math.max(500, sorted.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} unit="%" />
          <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as DoubleHeaderData;
              return (
                <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-xl">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-emerald-400">Success rate: {d.successRate.toFixed(0)}%</p>
                  <p className="text-slate-300">Both correct: {d.bothCorrect}/{d.totalDoubleHeaders}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="successRate" name="Success Rate" radius={[0, 6, 6, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No double header data yet</div>;
}
