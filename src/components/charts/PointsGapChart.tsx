'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { PlayerPointsBreakdown } from '@/lib/types';

export function PointsGapChart({ data }: { data: PlayerPointsBreakdown[] }) {
  if (!data?.length || data.length < 2) return <EmptyState />;

  const sorted = [...data].sort((a, b) => b.totalPoints - a.totalPoints);
  const leader = sorted[0].totalPoints;

  const chartData = sorted.map((p, i) => ({
    name: p.participantName,
    gap: leader - p.totalPoints,
    points: p.totalPoints,
    rank: i + 1,
  }));

  const chartHeight = Math.max(500, chartData.length * 28);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} label={{ value: 'Points behind leader', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11, offset: 0 }} />
          <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as { name: string; gap: number; points: number };
              return (
                <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-xl">
                  <p className="font-bold">{d.name}</p>
                  <p className="text-amber-400">{d.points} total points</p>
                  <p className="text-slate-300">{d.gap} points behind leader</p>
                </div>
              );
            }}
          />
          <Bar dataKey="gap" radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.gap === 0 ? '#fbbf24' : entry.gap < 5 ? '#22c55e' : entry.gap < 15 ? '#60a5fa' : '#94a3b8'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
}
