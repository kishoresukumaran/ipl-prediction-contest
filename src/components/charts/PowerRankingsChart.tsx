'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';
import { PlayerPointsBreakdown } from '@/lib/types';
import { useChartTheme } from '@/hooks/useChartTheme';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
const MEDAL_LABELS = ['🥇', '🥈', '🥉'] as const;

function medalBg(rank: number): string {
  if (rank === 0) return 'bg-amber-400 text-black';
  if (rank === 1) return 'bg-slate-300 text-black';
  if (rank === 2) return 'bg-orange-700 text-white';
  return 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]';
}

function barFill(avatarColor: string, rank: number, isHighlighted: boolean, hasHighlight: boolean): string {
  if (hasHighlight && !isHighlighted) return avatarColor + '25';
  return avatarColor;
}

interface PowerRankingsChartProps {
  data: PlayerPointsBreakdown[];
}

export function PowerRankingsChart({ data }: PowerRankingsChartProps) {
  const chartTheme = useChartTheme();
  const [highlighted, setHighlighted] = useState<string | null>(null);

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">
        No data yet
      </div>
    );
  }

  const sorted = [...data]
    .sort((a, b) => b.totalPoints - a.totalPoints || b.accuracy - a.accuracy)
    .map((p, i) => {
      const participant = PARTICIPANTS.find(pp => pp.id === p.participantId);
      return {
        id: p.participantId,
        name: p.participantName,
        shortName: p.participantName.length > 6 ? p.participantName.slice(0, 6) : p.participantName,
        totalPoints: p.totalPoints,
        basePoints: p.basePoints,
        powerMatchPoints: p.powerMatchPoints,
        underdogBonus: p.underdogBonus,
        jokerBonus: p.jokerBonus,
        streakBonus: p.streakBonus,
        doubleHeaderBonus: p.doubleHeaderBonus,
        triviaPoints: p.triviaPoints,
        preTournamentPoints: p.preTournamentPoints,
        accuracy: p.accuracy,
        rank: i,
        color: participant?.avatar_color || '#666',
      };
    });

  const hasHighlight = highlighted !== null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-xl text-xs text-[var(--app-text)] shadow-xl p-3 min-w-[180px]">
        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[var(--app-border)]">
          {p.rank < 3 && <span className="text-base">{MEDAL_LABELS[p.rank]}</span>}
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: p.color }}>
            {p.name.charAt(0)}
          </span>
          <span className="font-bold text-sm text-[var(--app-text)]">{p.name}</span>
          <span className="ml-auto font-bold text-amber-500 text-sm">{p.totalPoints} pts</span>
        </div>
        <div className="space-y-1">
          {p.basePoints > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">Base</span>
              <span className="font-semibold text-blue-400">{p.basePoints}</span>
            </div>
          )}
          {p.powerMatchPoints > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">Power Match</span>
              <span className="font-semibold text-orange-400">{p.powerMatchPoints}</span>
            </div>
          )}
          {p.underdogBonus > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">Underdog</span>
              <span className="font-semibold text-emerald-400">{p.underdogBonus}</span>
            </div>
          )}
          {p.jokerBonus > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">Joker</span>
              <span className="font-semibold text-amber-400">{p.jokerBonus}</span>
            </div>
          )}
          {p.streakBonus > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">Streak</span>
              <span className="font-semibold text-purple-400">{p.streakBonus}</span>
            </div>
          )}
          {p.doubleHeaderBonus > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">DH Bonus</span>
              <span className="font-semibold text-pink-400">{p.doubleHeaderBonus}</span>
            </div>
          )}
          {p.triviaPoints > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">Trivia</span>
              <span className="font-semibold text-cyan-400">{p.triviaPoints}</span>
            </div>
          )}
          {p.preTournamentPoints > 0 && (
            <div className="flex justify-between gap-4">
              <span className="text-[var(--app-text-secondary)]">🔮 Pre-Tournament</span>
              <span className="font-semibold text-indigo-400">{p.preTournamentPoints}</span>
            </div>
          )}
          <div className="flex justify-between gap-4 pt-1 mt-1 border-t border-[var(--app-border)]">
            <span className="text-[var(--app-text-secondary)]">Accuracy</span>
            <span className="font-semibold text-[var(--app-text)]">{p.accuracy.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomLabel = ({ x, y, width, height, value, index }: any) => {
    const player = sorted[index];
    if (!player) return null;
    const labelX = x + width + 6;
    const cy = y + height / 2;
    const dimmed = hasHighlight && highlighted !== player.id;
    return (
      <g>
        <text x={labelX} y={cy - 5} textAnchor="start" fontSize={9} fill={dimmed ? chartTheme.axis + '60' : chartTheme.axis}>
          {player.rank < 3 ? MEDAL_LABELS[player.rank] : `#${player.rank + 1}`}
        </text>
        <text x={labelX} y={cy + 6} textAnchor="start" fontSize={11} fontWeight={600} fill={dimmed ? chartTheme.axis : chartTheme.label}>
          {value}
        </text>
      </g>
    );
  };

  const chartHeight = Math.max(sorted.length * 20 + 48, 140);

  return (
    <div>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={sorted}
            margin={{ top: 8, right: 64, left: 8, bottom: 8 }}
            barCategoryGap="12%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
            <XAxis type="number" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              stroke={chartTheme.axis}
              tick={{ fontSize: 11, fill: chartTheme.axis }}
              width={80}
              interval={0}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="totalPoints" radius={[0, 4, 4, 0]}>
              {sorted.map((p, i) => (
                <Cell
                  key={p.id}
                  fill={barFill(p.color, i, highlighted === p.id, hasHighlight)}
                  stroke={i < 3 ? MEDAL_COLORS[i] : 'transparent'}
                  strokeWidth={i < 3 ? 2 : 0}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onClick={() => setHighlighted(prev => prev === p.id ? null : p.id)}
                />
              ))}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Player legend pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {sorted.map((p, i) => {
          const isActive = highlighted === p.id;
          const isDimmed = hasHighlight && !isActive;
          return (
            <button
              key={p.id}
              onClick={() => setHighlighted(prev => prev === p.id ? null : p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                isActive
                  ? 'bg-[var(--app-surface-alt)]'
                  : isDimmed
                  ? 'border-transparent opacity-35'
                  : 'border-transparent hover:bg-[var(--app-surface)]'
              }`}
              style={isActive ? { borderColor: p.color + '88' } : {}}
            >
              {i < 3 && <span className="text-[10px]">{MEDAL_LABELS[i]}</span>}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <span className="text-[var(--app-text-secondary)]">{p.name}</span>
              <span className="text-[var(--app-text-tertiary)] font-mono">{p.totalPoints}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
