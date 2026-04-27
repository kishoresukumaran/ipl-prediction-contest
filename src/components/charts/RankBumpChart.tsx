'use client';

import { useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { X } from 'lucide-react';
import { PARTICIPANTS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface RankHistoryEntry {
  matchId: number;
  matchDate: string;
  [participantId: string]: number | string;
}

export function RankBumpChart({ data }: { data: RankHistoryEntry[] }) {
  const chartTheme = useChartTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!data?.length) return <EmptyState message="No completed matches yet" />;

  const lastRow = data[data.length - 1];
  const sortedParticipants = [...PARTICIPANTS].sort(
    (a, b) => Number(lastRow[a.id] ?? PARTICIPANTS.length) - Number(lastRow[b.id] ?? PARTICIPANTS.length)
  );
  const hasSelection = selected.size > 0;
  const maxRank = PARTICIPANTS.length;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <div className="mb-3 min-h-[32px]">
        {hasSelection ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {sortedParticipants
              .filter((p) => selected.has(p.id))
              .map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{ backgroundColor: `${p.avatar_color}22`, borderColor: `${p.avatar_color}66` }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.avatar_color }} />
                  <span style={{ color: p.avatar_color }}>{p.name}</span>
                  <span className="font-bold" style={{ color: p.avatar_color }}>
                    #{Number(lastRow[p.id] ?? maxRank)}
                  </span>
                  <button onClick={() => toggle(p.id)} className="text-[var(--app-text-tertiary)]" aria-label={`Remove ${p.name}`}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            <button
              onClick={() => setSelected(new Set())}
              className="text-[10px] text-[var(--app-text-tertiary)] px-2 py-1 rounded-full border border-[var(--app-border)]"
            >
              Clear all
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-[var(--app-text-tertiary)]">Tap names below to isolate players</p>
        )}
      </div>

      <div className="w-full h-[300px] sm:h-[380px] lg:h-[440px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 8 }}>
            <XAxis dataKey="matchId" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <YAxis
              stroke={chartTheme.axis}
              domain={[1, maxRank]}
              ticks={[1, 5, 10, 15, 20, 25, maxRank]}
              reversed
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              label={{ value: 'Rank', angle: -90, position: 'insideLeft', fill: chartTheme.label, fontSize: 11 }}
            />
            <Tooltip
              content={({ label, payload }) => {
                if (!payload || !Array.isArray(payload) || payload.length === 0) return null;
                const sourceRows = hasSelection ? payload.filter((row) => selected.has(String(row.dataKey))) : payload;
                const rows = [...sourceRows].sort(
                  (a, b) => Number(a.value ?? maxRank) - Number(b.value ?? maxRank)
                );
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl max-w-[220px]">
                    <p className="font-bold mb-1">After Match #{label}</p>
                    <div className="space-y-1">
                      {rows.map((row) => (
                        <div key={String(row.dataKey)} className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                          <span className="truncate" style={{ color: row.color }}>
                            {row.name}
                          </span>
                          <span className="ml-auto font-bold">#{Number(row.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            {sortedParticipants.map((p) => {
              const active = selected.has(p.id);
              return (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.id}
                  name={p.name}
                  stroke={p.avatar_color}
                  strokeWidth={active ? 3.5 : hasSelection ? 1.2 : 2}
                  strokeOpacity={hasSelection ? (active ? 1 : 0.15) : 0.85}
                  dot={false}
                  activeDot={!hasSelection || active ? { r: 4 } : false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {sortedParticipants.map((p) => {
          const active = selected.has(p.id);
          const dimmed = hasSelection && !active;
          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                active ? 'bg-[var(--app-surface-alt)]' : dimmed ? 'border-transparent opacity-35' : 'border-transparent hover:bg-[var(--app-surface)]'
              }`}
              style={active ? { borderColor: `${p.avatar_color}88` } : {}}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.avatar_color }} />
              <span className="text-[var(--app-text-secondary)]">{p.name}</span>
              <span className="text-[var(--app-text-tertiary)]">#{Number(lastRow[p.id] ?? maxRank)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex items-center justify-center h-[240px] text-[var(--app-text-secondary)] text-sm">{message}</div>;
}
