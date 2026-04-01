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

  return (
    <div className="w-full h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} label={{ value: 'Points behind leader', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={80} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => [`${value} points behind`, 'Gap']}
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
