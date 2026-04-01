'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StreakData {
  name: string;
  longestStreak: number;
  currentStreak: number;
  color: string;
}

export function StreakChart({ data }: { data: StreakData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].sort((a, b) => b.longestStreak - a.longestStreak);

  return (
    <div className="w-full" style={{ height: Math.max(500, sorted.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
          />
          <Bar dataKey="longestStreak" name="Longest Streak" radius={[0, 6, 6, 0]}>
            {sorted.map((entry) => (
              <Cell key={entry.name} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
          <Bar dataKey="currentStreak" name="Current Streak" fill="#fbbf24" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No streak data yet</div>;
}
