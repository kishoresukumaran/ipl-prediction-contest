'use client';

import { Fragment, useMemo, useState } from 'react';
import { PARTICIPANTS } from '@/lib/constants';
import { PlayerPointsBreakdown } from '@/lib/types';

interface MatrixMatch {
  id: number;
  home_team: string;
  away_team: string;
  match_type: string;
  is_power_match: boolean;
  is_abandoned?: boolean;
}

interface CellBreakdown {
  total: number;
  base: number;
  powerMatch: number;
  underdog: number;
  joker: number;
  streak: number;
  doubleHeader: number;
  abandoned: number;
}

interface PointsMatrixData {
  matches: MatrixMatch[];
  matrix: Record<string, Record<number, CellBreakdown>>;
  triviaByPlayer: Record<string, number>;
  preTournamentByPlayer?: Record<string, number>;
}

const BREAKDOWN_ROWS = [
  { key: 'base' as const, label: 'Base', color: 'text-blue-400 dark:text-blue-300' },
  { key: 'powerMatch' as const, label: 'Power Match', color: 'text-orange-400 dark:text-orange-300' },
  { key: 'underdog' as const, label: 'Underdog', color: 'text-emerald-500 dark:text-emerald-300' },
  { key: 'joker' as const, label: 'Joker', color: 'text-amber-500 dark:text-amber-300' },
  { key: 'streak' as const, label: 'Streak', color: 'text-purple-500 dark:text-purple-300' },
  { key: 'doubleHeader' as const, label: 'DH Bonus', color: 'text-pink-500 dark:text-pink-300' },
  { key: 'abandoned' as const, label: 'Abandoned', color: 'text-slate-500 dark:text-slate-400' },
] as const;

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
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

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

  const headerBg = 'bg-[#f0ecf6] dark:bg-[#1a1040]';
  const stickyColBg = 'bg-[#eeeaf4] dark:bg-[#1a1040]';
  const stickyColBgAlt = 'bg-[#e8e3ef] dark:bg-[#1e1348]';
  const subRowBg = 'bg-[#f5f2fa] dark:bg-[#150e30]';

  return (
    <div className="relative overflow-auto rounded-lg border border-[var(--app-border)]" style={{ maxHeight: '70vh' }}>
      <table className="border-collapse text-[11px] w-max min-w-full">
        <thead className="sticky top-0 z-20">
          <tr>
            <th
              className={`sticky left-0 z-30 ${headerBg} border-b-2 border-r border-[var(--app-border)] px-2 text-left text-[var(--app-text-secondary)] font-semibold`}
              style={{ minWidth: 110, verticalAlign: 'bottom', height: 90, paddingBottom: 6 }}
            >
              Player
            </th>

            {data.matches.map(m => (
              <th
                key={m.id}
                className={`${headerBg} border-b-2 border-[var(--app-border)] px-0 relative overflow-visible`}
                style={{ minWidth: 34, height: 90 }}
              >
                <div
                  className="absolute bottom-2 left-[50%] origin-bottom-left whitespace-nowrap"
                  style={{ transform: 'rotate(-55deg) translateX(-2px)', fontSize: 9, lineHeight: 1.2 }}
                >
                  <span className="font-bold text-[var(--app-text)]">#{m.id}</span>
                  {m.is_abandoned && <span className="ml-1 inline-block px-1 py-0 bg-slate-400/30 rounded text-[8px] text-slate-600 dark:text-slate-400 font-semibold">A</span>}
                  {' '}
                  <span className="text-[var(--app-text-tertiary)]">{m.home_team} v {m.away_team}</span>
                </div>
              </th>
            ))}

            <th
              className={`sticky right-0 z-30 ${headerBg} border-b-2 border-l border-[var(--app-border)] px-2 text-center text-amber-600 dark:text-amber-400 font-bold`}
              style={{ minWidth: 48, verticalAlign: 'bottom', height: 90, paddingBottom: 6 }}
            >
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedPlayers.map((player, rowIdx) => {
            const isAlt = rowIdx % 2 !== 0;
            const rowBg = isAlt ? 'bg-[var(--app-surface-alt)]' : '';
            const isExpanded = expandedPlayer === player.id;

            return (
              <Fragment key={player.id}>
                {/* Main player row */}
                <tr
                  className={`${rowBg} hover:bg-[var(--app-surface-hover)] transition-colors cursor-pointer select-none`}
                  onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                >
                  <td className={`sticky left-0 z-10 border-r border-[var(--app-border)] px-2 py-1.5 whitespace-nowrap ${isAlt ? stickyColBgAlt : stickyColBg}`}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] text-[var(--app-text-tertiary)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                      >
                        ▶
                      </span>
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

                  {data.matches.map(m => {
                    const cell = data.matrix[player.id]?.[m.id];
                    const pts = cell?.total ?? 0;
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

                  <td className={`sticky right-0 z-10 border-l border-[var(--app-border)] px-2 py-1.5 text-center font-bold text-amber-600 dark:text-amber-400 ${isAlt ? stickyColBgAlt : stickyColBg}`}>
                    {player.total}
                  </td>
                </tr>

                {/* Expanded breakdown sub-rows */}
                {isExpanded && (
                  <>
                    {BREAKDOWN_ROWS.map(({ key, label, color }) => {
                      const rowTotal = data.matches.reduce((sum, m) => {
                        const cell = data.matrix[player.id]?.[m.id];
                        return sum + (cell?.[key] ?? 0);
                      }, 0);
                      return (
                        <tr key={key} className={`${subRowBg} text-[10px]`}>
                          <td className={`sticky left-0 z-10 border-r border-[var(--app-border)] pl-9 pr-2 py-1 whitespace-nowrap ${subRowBg}`}>
                            <span className={`${color} font-medium`}>{label}</span>
                          </td>
                          {data.matches.map(m => {
                            const val = data.matrix[player.id]?.[m.id]?.[key] ?? 0;
                            return (
                              <td
                                key={m.id}
                                className={`text-center px-0 py-1 ${val > 0 ? color : 'text-[var(--app-text-tertiary)]'}`}
                                style={{ minWidth: 32, opacity: val > 0 ? 1 : 0.3 }}
                              >
                                {val > 0 ? val : '-'}
                              </td>
                            );
                          })}
                          <td className={`sticky right-0 z-10 border-l border-[var(--app-border)] px-2 py-1 text-center font-semibold ${color} ${subRowBg}`}>
                            {rowTotal > 0 ? rowTotal : '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Trivia sub-row */}
                    <tr className={`${subRowBg} text-[10px]`}>
                      <td className={`sticky left-0 z-10 border-r border-[var(--app-border)] pl-9 pr-2 py-1 whitespace-nowrap ${subRowBg}`}>
                        <span className="text-cyan-500 dark:text-cyan-300 font-medium">Trivia</span>
                      </td>
                      {data.matches.map(m => (
                        <td
                          key={m.id}
                          className="text-center px-0 py-1 text-[var(--app-text-tertiary)]"
                          style={{ minWidth: 32, opacity: 0.3 }}
                        >
                          -
                        </td>
                      ))}
                      <td className={`sticky right-0 z-10 border-l border-[var(--app-border)] px-2 py-1 text-center font-semibold text-cyan-500 dark:text-cyan-300 ${subRowBg}`}>
                        {data.triviaByPlayer?.[player.id] || '-'}
                      </td>
                    </tr>

                    {/* Crystal Ball (Pre-Tournament) sub-row */}
                    <tr className={`${subRowBg} text-[10px] border-b border-[var(--app-border)]`}>
                      <td className={`sticky left-0 z-10 border-r border-[var(--app-border)] pl-9 pr-2 py-1 whitespace-nowrap ${subRowBg}`}>
                        <span className="text-indigo-500 dark:text-indigo-300 font-medium">🔮 Pre-Tournament</span>
                      </td>
                      {data.matches.map(m => (
                        <td
                          key={m.id}
                          className="text-center px-0 py-1 text-[var(--app-text-tertiary)]"
                          style={{ minWidth: 32, opacity: 0.3 }}
                        >
                          -
                        </td>
                      ))}
                      <td className={`sticky right-0 z-10 border-l border-[var(--app-border)] px-2 py-1 text-center font-semibold text-indigo-500 dark:text-indigo-300 ${subRowBg}`}>
                        {data.preTournamentByPlayer?.[player.id] || '-'}
                      </td>
                    </tr>
                  </>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
