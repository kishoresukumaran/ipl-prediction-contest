'use client';

import { useMemo } from 'react';
import { PARTICIPANTS } from '@/lib/constants';
import { PlayerPointsBreakdown } from '@/lib/types';

interface MatrixMatch {
  id: number;
  home_team: string;
  away_team: string;
  match_type: string;
  is_power_match: boolean;
}

interface PointsMatrixData {
  matches: MatrixMatch[];
  matrix: Record<string, Record<number, number>>;
}

function cellColor(pts: number, isDark: boolean): string {
  if (pts === 0) return '';
  if (pts >= 10) return isDark ? 'bg-amber-500/30 text-amber-300 font-bold' : 'bg-amber-500/25 text-amber-700 font-bold';
  if (pts >= 5) return isDark ? 'bg-emerald-500/30 text-emerald-300 font-semibold' : 'bg-emerald-500/25 text-emerald-700 font-semibold';
  if (pts >= 3) return isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/15 text-emerald-600';
  return isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-500/10 text-emerald-600';
}

export function PointsMatrixChart({
  data,
  leaderboard,
}: {
  data: PointsMatrixData;
  leaderboard: PlayerPointsBreakdown[];
}) {
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const sortedPlayers = useMemo(() => {
    return [...leaderboard]
      .sort((a, b) => b.totalPoints - a.totalPoints || b.accuracy - a.accuracy)
      .map(p => {
        const participant = PARTICIPANTS.find(pp => pp.id === p.participantId);
        return {
          id: p.participantId,
          name: p.participantName,
          total: p.totalPoints,
          color: participant?.avatar_color || '#666',
        };
      });
  }, [leaderboard]);

  if (!data?.matches?.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--app-text-secondary)] text-sm">
        No completed matches yet
      </div>
    );
  }

  return (
    <div className="relative overflow-auto rounded-lg border border-[var(--app-border)]" style={{ maxHeight: '70vh' }}>
      <table className="border-collapse text-[11px] w-max min-w-full">
        <thead className="sticky top-0 z-20">
          <tr>
            {/* Top-left corner cell — player header */}
            <th
              className="sticky left-0 z-30 bg-[var(--app-surface)] border-b-2 border-r border-[var(--app-border)] px-2 text-left text-[var(--app-text-secondary)] font-semibold"
              style={{ minWidth: 110, verticalAlign: 'bottom', height: 120, paddingBottom: 6 }}
            >
              Player
            </th>

            {/* Match columns — slanted headers */}
            {data.matches.map(m => (
              <th
                key={m.id}
                className="bg-[var(--app-surface)] border-b-2 border-[var(--app-border)] px-0 relative overflow-visible"
                style={{ minWidth: 34, height: 120 }}
              >
                <div
                  className="absolute bottom-2 left-[50%] origin-bottom-left text-[var(--app-text-secondary)] whitespace-nowrap"
                  style={{ transform: 'rotate(-55deg) translateX(-2px)', fontSize: 9, lineHeight: 1.2 }}
                >
                  <span className="font-bold text-[var(--app-text)]">#{m.id}</span>{' '}
                  <span className="text-[var(--app-text-tertiary)]">{m.home_team} v {m.away_team}</span>
                </div>
              </th>
            ))}

            {/* Total column */}
            <th
              className="sticky right-0 z-30 bg-[var(--app-surface)] border-b-2 border-l border-[var(--app-border)] px-2 text-center text-amber-600 dark:text-amber-400 font-bold"
              style={{ minWidth: 48, verticalAlign: 'bottom', height: 120, paddingBottom: 6 }}
            >
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedPlayers.map((player, rowIdx) => {
            const rowBg = rowIdx % 2 === 0 ? '' : 'bg-[var(--app-surface-alt)]';
            return (
              <tr key={player.id} className={`${rowBg} hover:bg-[var(--app-surface-hover)] transition-colors`}>
                {/* Sticky player name column */}
                <td className={`sticky left-0 z-10 border-r border-[var(--app-border)] px-2 py-1.5 whitespace-nowrap ${rowBg || 'bg-[var(--app-surface)]'}`}>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0)}
                    </span>
                    <span className="text-[var(--app-text)] font-medium truncate max-w-[80px]">
                      {player.name}
                    </span>
                  </div>
                </td>

                {/* Points cells */}
                {data.matches.map(m => {
                  const pts = data.matrix[player.id]?.[m.id] ?? 0;
                  const colorClass = cellColor(pts, isDark);
                  return (
                    <td
                      key={m.id}
                      className={`text-center px-0 py-1.5 border-[var(--app-border)] ${colorClass} ${
                        pts === 0 ? 'text-[var(--app-text-tertiary)]' : ''
                      }`}
                      style={{ minWidth: 32 }}
                    >
                      {pts}
                    </td>
                  );
                })}

                {/* Sticky total column */}
                <td className={`sticky right-0 z-10 border-l border-[var(--app-border)] px-2 py-1.5 text-center font-bold text-amber-600 dark:text-amber-400 ${rowBg || 'bg-[var(--app-surface)]'}`}>
                  {player.total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
