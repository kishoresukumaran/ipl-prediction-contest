'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface CrowdData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  majorityTeam: string;
  majorityPct: number;
  crowdCorrect: boolean;
  runningAccuracy: number;
}

export function CrowdWisdomChart({ data }: { data: CrowdData[] }) {
  if (!data?.length) return <EmptyState />;

  return (
    <div>
      <div className="flex gap-4 mb-3 text-sm">
        <span className="text-emerald-400">
          Crowd right: {data.filter(d => d.crowdCorrect).length}/{data.length}
          ({((data.filter(d => d.crowdCorrect).length / data.length) * 100).toFixed(0)}%)
        </span>
      </div>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="matchId" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} label={{ value: 'Match #', position: 'bottom', fill: 'rgba(255,255,255,0.5)', fontSize: 11, offset: 0 }} />
            <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as CrowdData;
                return (
                  <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white shadow-xl">
                    <p className="font-bold">Match #{d.matchId}: {d.homeTeam} vs {d.awayTeam}</p>
                    <p className="text-emerald-400 mt-1">Crowd accuracy: {d.runningAccuracy.toFixed(1)}%</p>
                    <p className="text-slate-300">Majority picked: {d.majorityTeam} ({d.majorityPct.toFixed(0)}%)</p>
                    <p className={d.crowdCorrect ? 'text-emerald-400' : 'text-red-400'}>
                      {d.crowdCorrect ? 'Crowd was right' : 'Crowd was wrong'}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.3)" strokeDasharray="5 5" label={{ value: '50%', fill: '#94a3b8', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="runningAccuracy"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
}
