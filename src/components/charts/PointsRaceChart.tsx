'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X } from 'lucide-react';
import { PARTICIPANTS, TEAMS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface PointsRaceData {
  matchId: number;
  matchDate: string;
  [playerId: string]: number | string;
}

interface MatchInfo {
  id: number;
  home_team: string;
  away_team: string;
  winner: string | null;
}

export function PointsRaceChart({ data, matches }: { data: PointsRaceData[]; matches?: MatchInfo[] }) {
  const chartTheme = useChartTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!data?.length) return <EmptyState message="No match data yet" />;

  const latestMatch = data[data.length - 1];
  const sortedParticipants = [...PARTICIPANTS].sort((a, b) => {
    const aPoints = (latestMatch?.[a.id] as number) || 0;
    const bPoints = (latestMatch?.[b.id] as number) || 0;
    return bPoints - aPoints;
  });

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
                  {(latestMatch?.[p.id] as number) || 0}
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

      <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="matchId" stroke={chartTheme.axis} tick={{ fontSize: 11 }} label={{ value: 'Match #', position: 'bottom', fill: chartTheme.label, fontSize: 11 }} />
            <YAxis stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ label, payload }) => {
                if (!payload?.length) return null;
                const matchInfo = matches?.find(m => m.id === Number(label));
                const sorted = [...payload].sort((a, b) => (b.value as number || 0) - (a.value as number || 0));
                const items = hasSelection
                  ? sorted.filter(p => selected.has(p.dataKey as string))
                  : sorted;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl max-w-[220px]">
                    <div className="mb-2 pb-1.5 border-b border-[var(--app-border)]">
                      <p className="font-bold">Match #{label}</p>
                      {matchInfo && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: TEAMS[matchInfo.home_team]?.color || '#666', color: TEAMS[matchInfo.home_team]?.textColor || '#fff' }}
                          >
                            {matchInfo.home_team}
                          </span>
                          <span className="text-[var(--app-text-tertiary)]">vs</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: TEAMS[matchInfo.away_team]?.color || '#666', color: TEAMS[matchInfo.away_team]?.textColor || '#fff' }}
                          >
                            {matchInfo.away_team}
                          </span>
                          {matchInfo.winner && (
                            <span className="text-emerald-400 font-semibold text-[10px]">· {matchInfo.winner} won</span>
                          )}
                        </div>
                      )}
                    </div>
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
            {sortedParticipants.map((p) => {
              const isSelected = selected.has(p.id);
              return (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.id}
                  name={p.name}
                  stroke={p.avatar_color}
                  strokeWidth={isSelected ? 4 : hasSelection ? 1 : 2}
                  strokeOpacity={hasSelection ? (isSelected ? 1 : 0.15) : 0.8}
                  dot={false}
                  activeDot={!hasSelection || isSelected ? { r: 4 } : false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Player legend */}
      <div className="flex flex-wrap gap-2 mt-4">
        {sortedParticipants.map((p) => {
          const pts = (latestMatch?.[p.id] as number) || 0;
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
