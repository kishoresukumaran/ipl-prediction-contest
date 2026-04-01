'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';

interface PointsRaceData {
  matchId: number;
  matchDate: string;
  [playerId: string]: number | string;
}

export function PointsRaceChart({ data }: { data: PointsRaceData[] }) {
  if (!data?.length) return <EmptyState message="No match data yet" />;

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="matchId" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} label={{ value: 'Match #', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
          <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }}
            labelFormatter={(v) => `Match #${v}`}
          />
          {PARTICIPANTS.slice(0, 15).map((p) => (
            <Line
              key={p.id}
              type="monotone"
              dataKey={p.id}
              name={p.name}
              stroke={p.avatar_color}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
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
