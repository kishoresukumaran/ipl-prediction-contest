'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, useXAxisScale, useYAxisScale } from 'recharts';
import { X } from 'lucide-react';
import { PARTICIPANTS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface WeeklyData {
  week: string;
  [playerId: string]: number | string;
}

// Renders total labels above each stacked bar column.
// Uses Recharts v3 hooks (useXAxisScale, useYAxisScale) for correct pixel positioning,
// rendered directly inside BarChart without needing the deprecated Customized wrapper.
function StackTotalLabels({ chartData, labelFill }: {
  chartData: (WeeklyData & { _total: number })[];
  labelFill: string;
}) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();

  if (!xScale || !yScale || !chartData?.length) return null;

  return (
    <g>
      {chartData.map((entry, i) => {
        const total = entry._total;
        if (!total) return null;

        const x = xScale(entry.week, { position: 'middle' });
        const y = yScale(total);

        if (x == null || y == null) return null;

        return (
          <text
            key={i}
            x={x}
            y={y - 6}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={labelFill}
          >
            {total}
          </text>
        );
      })}
    </g>
  );
}

export function WeeklyPointsChart({ data }: { data: WeeklyData[] }) {
  const chartTheme = useChartTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!data?.length) return <EmptyState />;

  const hasSelection = selected.size > 0;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const remove = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  // Total points per player across all weeks (for legend labels)
  const totalByPlayer: Record<string, number> = {};
  for (const p of PARTICIPANTS) {
    totalByPlayer[p.id] = data.reduce((sum, week) => sum + ((week[p.id] as number) || 0), 0);
  }

  const sortedParticipants = [...PARTICIPANTS].sort(
    (a, b) => (totalByPlayer[b.id] || 0) - (totalByPlayer[a.id] || 0)
  );

  const chartData = data.map(weekEntry => {
    const playersToSum = hasSelection ? PARTICIPANTS.filter(p => selected.has(p.id)) : PARTICIPANTS;
    const total = playersToSum.reduce((sum, p) => sum + ((weekEntry[p.id] as number) || 0), 0);
    return { ...weekEntry, _total: total };
  });

  const selectedPlayers = sortedParticipants.filter(p => selected.has(p.id));

  return (
    <div>
      {/* Active filter pills / hint */}
      <div className="mb-3 min-h-[32px]">
        {hasSelection ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedPlayers.map(p => (
              <div
                key={p.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: p.avatar_color + '22',
                  borderColor: p.avatar_color + '66',
                }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.avatar_color }} />
                <span style={{ color: p.avatar_color }}>{p.name}</span>
                <span className="font-bold" style={{ color: p.avatar_color }}>
                  {totalByPlayer[p.id] || 0}
                </span>
                <button
                  onClick={() => remove(p.id)}
                  className="ml-0.5 text-[var(--app-text-tertiary)] hover:text-[var(--app-text)] active:scale-90"
                  aria-label={`Remove ${p.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setSelected(new Set())}
              className="text-[10px] text-[var(--app-text-tertiary)] hover:text-[var(--app-text)] px-2 py-1 rounded-full border border-[var(--app-border)] active:scale-95"
            >
              Clear all
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-[var(--app-text-tertiary)]">Tap names below to compare players</p>
        )}
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 24, right: 5, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="week" stroke={chartTheme.axis} tick={{ fontSize: 10 }} />
            <YAxis stroke={chartTheme.axis} tick={{ fontSize: 11 }} label={{ value: 'Points gained this week', angle: -90, position: 'insideLeft', fill: chartTheme.label, fontSize: 11, offset: 15 }} />
            <Tooltip
              content={({ label, payload }) => {
                if (!payload?.length) return null;
                const sorted = [...payload]
                  .filter(p => (p.value as number) > 0)
                  .sort((a, b) => (b.value as number || 0) - (a.value as number || 0));
                const items = hasSelection
                  ? sorted.filter(p => selected.has(p.dataKey as string))
                  : sorted;
                const weekData = payload[0]?.payload as any;
                const categoryBreakdown = [
                  { key: '_basePoints',        label: 'Base' },
                  { key: '_powerMatchPoints',  label: 'Power' },
                  { key: '_underdogBonus',     label: 'Underdog' },
                  { key: '_jokerBonus',        label: 'Joker' },
                  { key: '_streakBonus',       label: 'Streak' },
                  { key: '_doubleHeaderBonus', label: 'DH Bonus' },
                  { key: '_abandonedPoints',   label: 'Abandoned' },
                  { key: '_triviaPoints',      label: 'Trivia' },
                ].filter(c => (weekData?.[c.key] || 0) > 0);
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg text-xs text-[var(--app-text)] shadow-xl p-2.5">
                    <p className="font-bold mb-1.5">Week of {label}</p>
                    <div className="grid grid-cols-2 gap-x-4">
                      {items.map(item => (
                        <div key={item.dataKey as string} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate" style={{ color: item.color }}>{item.name}</span>
                          <span className="ml-auto font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    {categoryBreakdown.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--app-border)]">
                        <p className="text-[var(--app-text-tertiary)] mb-1.5">Points breakdown</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {categoryBreakdown.map(c => (
                            <div key={c.key} className="flex items-center justify-between gap-2">
                              <span className="text-[var(--app-text-secondary)]">{c.label}</span>
                              <span className="font-bold">{weekData[c.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            {sortedParticipants.map(p => {
              const isSelected = selected.has(p.id);
              return (
                <Bar
                  key={p.id}
                  dataKey={p.id}
                  name={p.name}
                  stackId="a"
                  fill={p.avatar_color}
                  fillOpacity={hasSelection ? (isSelected ? 1 : 0.1) : 0.85}
                />
              );
            })}
            <StackTotalLabels chartData={chartData} labelFill={chartTheme.label} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Player legend */}
      <div className="flex flex-wrap gap-2 mt-4">
        {sortedParticipants.map(p => {
          const isActive = selected.has(p.id);
          const isDimmed = hasSelection && !isActive;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                isActive
                  ? 'bg-[var(--app-surface-alt)]'
                  : isDimmed
                  ? 'border-transparent opacity-35'
                  : 'border-transparent hover:bg-[var(--app-surface)]'
              }`}
              style={isActive ? { borderColor: p.avatar_color + '88' } : {}}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.avatar_color }} />
              <span className="text-[var(--app-text-secondary)]">{p.name}</span>
              <span className="text-[var(--app-text-tertiary)] font-mono">{totalByPlayer[p.id] || 0}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No weekly data yet</div>;
}
