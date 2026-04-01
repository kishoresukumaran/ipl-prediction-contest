'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MatchDiffData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  groupAccuracy: number;
  totalPredictions: number;
}

export function MatchDifficultyChart({ data }: { data: MatchDiffData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].sort((a, b) => a.groupAccuracy - b.groupAccuracy).slice(0, 20);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} margin={{ top: 5, right: 20, left: -10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="matchId"
            stroke="rgba(255,255,255,0.5)"
            tick={{ fontSize: 10 }}
            label={{ value: 'Match #', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as MatchDiffData;
              return (
                <div className="bg-slate-800 border border-white/10 rounded-lg p-2 text-xs text-white">
                  <p className="font-bold">Match #{d.matchId}: {d.homeTeam} vs {d.awayTeam}</p>
                  <p>Group accuracy: {d.groupAccuracy.toFixed(1)}%</p>
                  <p>Predictions: {d.totalPredictions}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="groupAccuracy" name="Group Accuracy" radius={[4, 4, 0, 0]}>
            {sorted.map((entry) => (
              <Cell
                key={entry.matchId}
                fill={entry.groupAccuracy < 30 ? '#ef4444' : entry.groupAccuracy < 50 ? '#f97316' : entry.groupAccuracy < 70 ? '#eab308' : '#22c55e'}
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
