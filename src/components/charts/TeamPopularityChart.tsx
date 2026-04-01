'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS } from '@/lib/constants';

interface TeamPopData {
  team: string;
  correct: number;
  wrong: number;
  total: number;
}

export function TeamPopularityChart({ data }: { data: TeamPopData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <YAxis dataKey="team" type="category" width={50} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            formatter={(value, name) => [value, name === 'correct' ? 'Correct' : 'Wrong']}
          />
          <Bar dataKey="correct" stackId="a" name="Correct" radius={[0, 0, 0, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.team} fill={TEAMS[entry.team]?.color || '#666'} fillOpacity={0.9} />
            ))}
          </Bar>
          <Bar dataKey="wrong" stackId="a" name="Wrong" fill="rgba(255,255,255,0.15)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
}
