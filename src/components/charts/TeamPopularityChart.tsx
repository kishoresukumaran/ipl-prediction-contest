'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TEAMS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface TeamPopData {
  team: string;
  correct: number;
  wrong: number;
  total: number;
}

export function TeamPopularityChart({ data }: { data: TeamPopData[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].sort((a, b) => b.total - a.total);

  return (
    <div>
      <p className="text-xs text-[var(--app-text-secondary)] mb-3">
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Solid</span> = correct picks &nbsp;·&nbsp; <span className="text-[var(--app-text-tertiary)] font-medium">Faded</span> = wrong picks
      </p>
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis type="number" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
          <YAxis dataKey="team" type="category" width={50} stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as TeamPopData;
              return (
                <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl">
                  <p className="font-bold">{d.team} ({d.total} picks)</p>
                  <p className="text-emerald-400">Correct: {d.correct}</p>
                  <p className="text-red-400">Wrong: {d.wrong}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="correct" stackId="a" name="Correct" radius={[0, 0, 0, 0]}>
            {sorted.map((entry) => (
              <Cell
                key={`correct-${entry.team}`}
                fill={TEAMS[entry.team]?.color || '#666'}
                fillOpacity={1}
              />
            ))}
          </Bar>
          {/* Wrong bar uses same team color at reduced opacity so the team identity is always visible */}
          <Bar dataKey="wrong" stackId="a" name="Wrong" radius={[0, 4, 4, 0]}>
            {sorted.map((entry) => (
              <Cell
                key={`wrong-${entry.team}`}
                fill={TEAMS[entry.team]?.color || '#888'}
                fillOpacity={chartTheme.isDark ? 0.3 : 0.25}
              />
            ))}
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
