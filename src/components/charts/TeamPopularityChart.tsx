'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TEAMS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface TeamPopData {
  team: string;
  correct: number;
  wrong: number;
  total: number;
  accuracy: number;
}

export function TeamPopularityChart({ data }: { data: Omit<TeamPopData, 'accuracy'>[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const sorted: TeamPopData[] = [...data]
    .sort((a, b) => b.total - a.total)
    .map(d => ({ ...d, accuracy: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0 }));

  return (
    <div>
      <p className="text-xs text-[var(--app-text-secondary)] mb-3">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Solid</span> = correct &nbsp;·&nbsp;
        <span className="text-[var(--app-text-tertiary)] font-medium">Faded</span> = wrong &nbsp;·&nbsp;
        <span className="text-[var(--app-text-secondary)] font-medium">%</span> = accuracy shown at end
      </p>
      <div className="w-full h-[440px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 5, right: 52, left: 10, bottom: 5 }}
            barSize={22}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis type="number" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <YAxis
              dataKey="team"
              type="category"
              width={72}
              stroke="none"
              tick={(props: { x: string | number; y: string | number; payload: { value: string } }) => {
                const x = Number(props.x);
                const y = Number(props.y);
                const { payload } = props;
                const entry = sorted.find(d => d.team === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={-6} textAnchor="end" dominantBaseline="middle" fontSize={11} fontWeight={700} fill={chartTheme.axis}>
                      {payload.value}
                    </text>
                    <text x={0} y={9} textAnchor="end" dominantBaseline="middle" fontSize={9} fill={chartTheme.label}>
                      {entry?.total} picks
                    </text>
                  </g>
                );
              }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as TeamPopData;
                const teamColor = TEAMS[d.team]?.color || '#666';
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-3 text-xs text-[var(--app-text)] shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: teamColor }} />
                      <p className="font-bold">{d.team} — {d.total} picks</p>
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-400">✓ Correct: {d.correct}</p>
                    <p className="text-red-500 dark:text-red-400">✗ Wrong: {d.wrong}</p>
                    <p className="text-[var(--app-text-secondary)] mt-1.5 font-semibold border-t border-[var(--app-border)] pt-1.5">{d.accuracy}% accuracy</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="correct" stackId="a" name="Correct" radius={[0, 0, 0, 0]}>
              {sorted.map((entry) => (
                <Cell key={`correct-${entry.team}`} fill={TEAMS[entry.team]?.color || '#666'} fillOpacity={1} />
              ))}
            </Bar>
            <Bar dataKey="wrong" stackId="a" name="Wrong" radius={[0, 4, 4, 0]}>
              {sorted.map((entry) => (
                <Cell
                  key={`wrong-${entry.team}`}
                  fill={TEAMS[entry.team]?.color || '#888'}
                  fillOpacity={chartTheme.isDark ? 0.3 : 0.25}
                />
              ))}
              <LabelList
                dataKey="accuracy"
                position="right"
                formatter={(v: unknown) => `${v}%`}
                style={{ fontSize: 10, fontWeight: 700, fill: chartTheme.label }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
