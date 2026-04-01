'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';
import { PARTICIPANTS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface PointsRaceData {
  matchId: number;
  matchDate: string;
  [playerId: string]: number | string;
}

export function PointsRaceChart({ data }: { data: PointsRaceData[] }) {
  const chartTheme = useChartTheme();
  const [highlighted, setHighlighted] = useState<string | null>(null);

  if (!data?.length) return <EmptyState message="No match data yet" />;

  const latestMatch = data[data.length - 1];
  const sortedParticipants = [...PARTICIPANTS].sort((a, b) => {
    const aPoints = (latestMatch?.[a.id] as number) || 0;
    const bPoints = (latestMatch?.[b.id] as number) || 0;
    return bPoints - aPoints;
  });

  const highlightedPlayer = highlighted
    ? sortedParticipants.find(p => p.id === highlighted)
    : null;

  return (
    <div>
      {/* Selection hint / active selection banner */}
      <div className="mb-3 min-h-[28px]">
        {highlighted && highlightedPlayer ? (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border"
            style={{
              backgroundColor: highlightedPlayer.avatar_color + '22',
              borderColor: highlightedPlayer.avatar_color + '66',
            }}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: highlightedPlayer.avatar_color }} />
            <span style={{ color: highlightedPlayer.avatar_color }}>{highlightedPlayer.name}</span>
            <span className="text-[var(--app-text-tertiary)]">·</span>
            <span className="font-bold" style={{ color: highlightedPlayer.avatar_color }}>
              {(latestMatch?.[highlighted] as number) || 0} pts
            </span>
            <button
              onClick={() => setHighlighted(null)}
              className="ml-1 text-[var(--app-text-tertiary)] hover:text-[var(--app-text)] active:scale-90"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-[var(--app-text-tertiary)]">Tap a name below to isolate their line</p>
        )}
      </div>

      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="matchId" stroke={chartTheme.axis} tick={{ fontSize: 11 }} label={{ value: 'Match #', position: 'bottom', fill: chartTheme.label, fontSize: 11 }} />
            <YAxis stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ label, payload }) => {
                if (!payload?.length) return null;
                const sorted = [...payload].sort((a, b) => (b.value as number || 0) - (a.value as number || 0));
                const items = highlighted
                  ? sorted.filter(p => p.dataKey === highlighted)
                  : sorted;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl">
                    <p className="font-bold mb-1.5">Match #{label}</p>
                    <div className="grid grid-cols-2 gap-x-4">
                      {items.map(item => (
                        <div key={item.dataKey as string} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="truncate" style={{ color: item.color }}>{item.name}</span>
                          <span className="ml-auto font-bold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            {sortedParticipants.map((p) => (
              <Line
                key={p.id}
                type="monotone"
                dataKey={p.id}
                name={p.name}
                stroke={p.avatar_color}
                strokeWidth={highlighted === p.id ? 4 : highlighted ? 1 : 2}
                strokeOpacity={highlighted ? (highlighted === p.id ? 1 : 0.15) : 0.8}
                dot={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Player legend — larger tap targets, ranked order */}
      <div className="flex flex-wrap gap-2 mt-4">
        {sortedParticipants.map((p) => {
          const pts = (latestMatch?.[p.id] as number) || 0;
          const isActive = highlighted === p.id;
          const isDimmed = highlighted !== null && !isActive;
          return (
            <button
              key={p.id}
              onClick={() => setHighlighted(prev => prev === p.id ? null : p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                isActive
                  ? 'border-[var(--app-border-strong)] bg-[var(--app-surface-alt)]'
                  : isDimmed
                  ? 'border-transparent opacity-35'
                  : 'border-transparent hover:bg-[var(--app-surface)]'
              }`}
              style={isActive ? { borderColor: p.avatar_color + '88' } : {}}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.avatar_color }} />
              <span className="text-[var(--app-text-secondary)]">{p.name}</span>
              <span className="text-[var(--app-text-tertiary)] font-mono">{pts}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">
      {message}
    </div>
  );
}
