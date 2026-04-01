'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

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
  const chartTheme = useChartTheme();
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
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="matchId" stroke={chartTheme.axis} tick={{ fontSize: 11 }} label={{ value: 'Match #', position: 'bottom', fill: chartTheme.label, fontSize: 11, offset: 0 }} />
            <YAxis domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as CrowdData;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl">
                    <p className="font-bold">Match #{d.matchId}: {d.homeTeam} vs {d.awayTeam}</p>
                    <p className="text-emerald-400 mt-1">Crowd accuracy: {d.runningAccuracy.toFixed(1)}%</p>
                    <p className="text-[var(--app-text-secondary)]">Majority picked: {d.majorityTeam} ({d.majorityPct.toFixed(0)}%)</p>
                    <p className={d.crowdCorrect ? 'text-emerald-400' : 'text-red-400'}>
                      {d.crowdCorrect ? 'Crowd was right' : 'Crowd was wrong'}
                    </p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={50} stroke={chartTheme.axis} strokeDasharray="5 5" label={{ value: '50%', fill: chartTheme.label, fontSize: 10 }} />
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
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
