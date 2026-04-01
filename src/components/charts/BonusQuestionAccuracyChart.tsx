'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface BonusAccuracyData {
  name: string;
  correct: number;
  total: number;
  accuracy: number;
  points: number;
  color: string;
}

export function BonusQuestionAccuracyChart({ data }: { data: BonusAccuracyData[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length || data.every(d => d.total === 0)) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No bonus question data yet</div>;
  }

  const filtered = data.filter(d => d.total > 0).sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[var(--app-surface)] rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{filtered.length > 0 ? filtered[0].name : '-'}</div>
          <div className="text-[10px] text-[var(--app-text-secondary)]">Best Accuracy</div>
        </div>
        <div className="bg-[var(--app-surface)] rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">
            {filtered.reduce((max, d) => d.correct > max ? d.correct : max, 0)}
          </div>
          <div className="text-[10px] text-[var(--app-text-secondary)]">Most Correct</div>
        </div>
        <div className="bg-[var(--app-surface)] rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {filtered.reduce((max, d) => d.points > max ? d.points : max, 0)}
          </div>
          <div className="text-[10px] text-[var(--app-text-secondary)]">Most Bonus Pts</div>
        </div>
      </div>

      <div className="w-full" style={{ height: Math.max(500, filtered.length * 28) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filtered} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis type="number" domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} unit="%" />
            <YAxis dataKey="name" type="category" width={90} stroke={chartTheme.axis} tick={{ fontSize: 11 }} interval={0} />
            <Tooltip
              contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: '8px', color: chartTheme.tooltipText }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as BonusAccuracyData;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)]">
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-amber-400">Accuracy: {d.accuracy.toFixed(0)}%</p>
                    <p className="text-[var(--app-text-secondary)]">Correct: {d.correct}/{d.total}</p>
                    <p className="text-emerald-400">Bonus points earned: {d.points}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="accuracy" name="Bonus Accuracy" radius={[0, 6, 6, 0]}>
              {filtered.map((entry) => (
                <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
