'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface MatchDiffData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  groupAccuracy: number;
  totalPredictions: number;
}

export function MatchDifficultyChart({ data }: { data: MatchDiffData[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].sort((a, b) => a.groupAccuracy - b.groupAccuracy).slice(0, 20);
  const chartData = sorted.map(d => ({ ...d, label: `#${d.matchId} ${d.homeTeam} v ${d.awayTeam}` }));

  return (
    <div className="w-full h-[450px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis
            dataKey="label"
            stroke={chartTheme.axis}
            tick={{ fontSize: 10, angle: -45, textAnchor: 'end', fill: chartTheme.label }}
            interval={0}
            height={80}
          />
          <YAxis domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip
            contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: '8px', color: chartTheme.tooltipText }}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as MatchDiffData;
              return (
                <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2 text-xs text-[var(--app-text)]">
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
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
