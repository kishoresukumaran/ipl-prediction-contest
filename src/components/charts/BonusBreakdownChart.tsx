'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PlayerPointsBreakdown } from '@/lib/types';

export function BonusBreakdownChart({ data }: { data: PlayerPointsBreakdown[] }) {
  if (!data?.length) return <EmptyState />;

  const chartData = data
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 20)
    .map(p => ({
      name: p.participantName,
      Base: p.basePoints,
      Power: p.powerMatchPoints,
      Underdog: p.underdogBonus,
      Joker: p.jokerBonus,
      'Double Header': p.doubleHeaderBonus,
      Streak: p.streakBonus,
      Trivia: p.triviaPoints,
      Bonus: p.bonusPoints,
    }));

  return (
    <div className="w-full" style={{ height: Math.max(500, chartData.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
          <Bar dataKey="Base" stackId="a" fill="#60a5fa" />
          <Bar dataKey="Power" stackId="a" fill="#f59e0b" />
          <Bar dataKey="Underdog" stackId="a" fill="#34d399" />
          <Bar dataKey="Joker" stackId="a" fill="#a78bfa" />
          <Bar dataKey="Double Header" stackId="a" fill="#fb7185" />
          <Bar dataKey="Streak" stackId="a" fill="#38bdf8" />
          <Bar dataKey="Trivia" stackId="a" fill="#4ade80" />
          <Bar dataKey="Bonus" stackId="a" fill="#fbbf24" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
}
