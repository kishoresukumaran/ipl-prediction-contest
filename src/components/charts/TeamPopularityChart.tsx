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
    <div>
      <p className="text-xs text-slate-400 mb-3">
        <span className="text-emerald-400">Correct</span> = picked this team and they won | <span className="text-slate-300">Wrong</span> = picked this team but they lost
      </p>
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <YAxis dataKey="team" type="category" width={50} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as TeamPopData;
              return (
                <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-xl">
                  <p className="font-bold">{d.team} ({d.total} picks)</p>
                  <p className="text-emerald-400">Correct: {d.correct}</p>
                  <p className="text-red-400">Wrong: {d.wrong}</p>
                </div>
              );
            }}
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
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
}
