'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';

interface WeeklyData {
  week: string;
  [playerId: string]: number | string;
}

export function WeeklyPointsChart({ data }: { data: WeeklyData[] }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  if (!data?.length) return <EmptyState />;

  return (
    <div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="week" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 10 }} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} label={{ value: 'Points gained this week', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.5)', fontSize: 11, offset: 15 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 11 }}
              itemSorter={(item) => -(item.value as number || 0)}
              content={({ label, payload }) => {
                if (!payload?.length) return null;
                const sorted = [...payload]
                  .filter(p => (p.value as number) > 0)
                  .sort((a, b) => (b.value as number || 0) - (a.value as number || 0));
                const items = highlighted
                  ? sorted.filter(p => p.dataKey === highlighted)
                  : sorted.slice(0, 10);
                const remaining = highlighted ? 0 : Math.max(0, sorted.length - 10);
                return (
                  <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-xl">
                    <p className="font-bold mb-1.5">Week of {label}</p>
                    {items.map(item => (
                      <div key={item.dataKey as string} className="flex items-center gap-2 py-0.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span style={{ color: item.color }}>{item.name}</span>
                        <span className="ml-auto font-bold">{item.value}</span>
                      </div>
                    ))}
                    {remaining > 0 && <p className="text-slate-500 mt-1">+{remaining} more</p>}
                  </div>
                );
              }}
            />
            {PARTICIPANTS.map(p => (
              <Bar
                key={p.id}
                dataKey={p.id}
                name={p.name}
                stackId="a"
                fill={p.avatar_color}
                fillOpacity={highlighted ? (highlighted === p.id ? 1 : 0.15) : 0.85}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Player legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {PARTICIPANTS.map(p => (
          <button
            key={p.id}
            onMouseEnter={() => setHighlighted(p.id)}
            onMouseLeave={() => setHighlighted(null)}
            onClick={() => setHighlighted(prev => prev === p.id ? null : p.id)}
            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-all ${
              highlighted === p.id ? 'bg-white/10 scale-105' : highlighted ? 'opacity-40' : ''
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.avatar_color }} />
            <span className="text-slate-300">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No weekly data yet</div>;
}
