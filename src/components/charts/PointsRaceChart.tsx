'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';

interface PointsRaceData {
  matchId: number;
  matchDate: string;
  [playerId: string]: number | string;
}

export function PointsRaceChart({ data }: { data: PointsRaceData[] }) {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  if (!data?.length) return <EmptyState message="No match data yet" />;

  // Get the latest match data to sort players by points (highest first)
  const latestMatch = data[data.length - 1];
  const sortedParticipants = [...PARTICIPANTS].sort((a, b) => {
    const aPoints = (latestMatch?.[a.id] as number) || 0;
    const bPoints = (latestMatch?.[b.id] as number) || 0;
    return bPoints - aPoints;
  });

  return (
    <div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="matchId" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} label={{ value: 'Match #', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 11, maxHeight: '200px', overflowY: 'auto' }}
              labelFormatter={(v) => `Match #${v}`}
              itemSorter={(item) => -(item.value as number || 0)}
            />
            {sortedParticipants.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.name}
                stroke={p.avatar_color}
                strokeWidth={highlighted === p.id ? 4 : highlighted ? 1 : 2}
                strokeOpacity={highlighted ? (highlighted === p.id ? 1 : 0.2) : 0.8}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Player legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {sortedParticipants.map((p) => {
          const pts = (latestMatch?.[p.id] as number) || 0;
          return (
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
              <span className="text-slate-500 font-mono">{pts}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">
      {message}
    </div>
  );
}
