'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';

interface WeeklyData {
  week: string;
  [playerId: string]: number | string;
}

export function WeeklyPointsChart({ data }: { data: WeeklyData[] }) {
  if (!data?.length) return <EmptyState />;

  // Show top 10 players
  const topPlayers = PARTICIPANTS.slice(0, 10);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
          <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {topPlayers.map(p => (
            <Bar key={p.id} dataKey={p.id} name={p.name} fill={p.avatar_color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No weekly data yet</div>;
}
