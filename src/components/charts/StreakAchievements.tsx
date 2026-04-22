'use client';

import { useState } from 'react';
import { TEAMS } from '@/lib/constants';

interface StreakMatchDetail {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  predicted: string;
  winner: string;
  isAbandoned: boolean;
  correct: boolean;
}

interface StreakInstance {
  id: string;
  startMatchId: number;
  endMatchId: number;
  length: number;
  matches: StreakMatchDetail[];
}

interface StreakAchievementPlayer {
  playerId: string;
  name: string;
  color: string;
  streakCount: number;
  longestStreak: number;
  currentStreak: number;
  streaks: StreakInstance[];
}

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.526 2.339-6.074 4.5-8.5.69-.775 1.5-1.6 1.5-1.6s.81.825 1.5 1.6C14.661 9.926 17 12.474 17 16c0 3.866-3.134 7-5 7zm0-2c1.657 0 3-1.343 3-3 0-1.8-1.2-3.2-2.2-4.4-.3-.35-.6-.7-.8-.95-.2.25-.5.6-.8.95C10.2 14.8 9 16.2 9 18c0 1.657 1.343 3 3 3z" />
    </svg>
  );
}

export function StreakAchievements({ data }: { data: StreakAchievementPlayer[] }) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-[var(--app-text-secondary)] text-sm">
        No streak achievements yet
      </div>
    );
  }

  const achievers = data.filter((player) => player.streakCount > 0);
  const yetToStreak = data.filter((player) => player.streakCount === 0);

  return (
    <div className="space-y-5">
      {achievers.length > 0 ? (
        <div className="space-y-2">
          {achievers.map((player, index) => {
            const isExpanded = expandedPlayerId === player.playerId;
            const isActiveStreak = player.currentStreak >= 3;
            const totalStreaks = player.streakCount;

            return (
              <div key={player.playerId} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)]/40">
                <button
                  onClick={() => setExpandedPlayerId(isExpanded ? null : player.playerId)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--app-surface-alt)] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--app-text-tertiary)] w-5 text-right">{index + 1}</span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[var(--app-text)] truncate">{player.name}</p>
                        {isActiveStreak && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            LIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--app-text-tertiary)]">
                        {totalStreaks} streak{totalStreaks !== 1 ? 's' : ''} attained
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalStreaks, 5) }).map((_, idx) => (
                        <FlameIcon key={`${player.playerId}-flame-${idx}`} className="h-3.5 w-3.5 text-amber-400" />
                      ))}
                      {totalStreaks > 5 && (
                        <span className="text-[10px] font-bold text-amber-400">x{totalStreaks}</span>
                      )}
                    </div>

                    <div className="shrink-0 rounded-md border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-center">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-400/80">Personal Best</p>
                      <p className="text-sm font-black text-amber-400 tabular-nums">{player.longestStreak}</p>
                    </div>

                    <svg
                      className={`h-4 w-4 text-[var(--app-text-tertiary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3">
                    <div className="ml-8 space-y-2">
                      {player.streaks.map((streak, streakIndex) => (
                        <div key={streak.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-amber-400">
                              Streak #{streakIndex + 1} · {streak.length} matches
                            </p>
                            <p className="text-[10px] text-[var(--app-text-tertiary)]">
                              #{streak.startMatchId} to #{streak.endMatchId}
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            {streak.matches.map((match) => (
                              <div
                                key={`${streak.id}-${match.matchId}`}
                                className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-1.5"
                              >
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                  <span className="text-[var(--app-text-tertiary)]">#{match.matchId}</span>
                                  <span className="font-medium" style={{ color: TEAMS[match.homeTeam]?.color }}>
                                    {match.homeTeam}
                                  </span>
                                  <span className="text-[var(--app-text-tertiary)]">vs</span>
                                  <span className="font-medium" style={{ color: TEAMS[match.awayTeam]?.color }}>
                                    {match.awayTeam}
                                  </span>
                                  <span className="text-[var(--app-text-tertiary)]">Pick:</span>
                                  <span className="font-semibold text-[var(--app-text)]">{match.predicted || 'No Pick'}</span>
                                  <span className="text-[var(--app-text-tertiary)]">Winner:</span>
                                  <span className={`font-semibold ${match.isAbandoned ? 'text-slate-300' : 'text-emerald-400'}`}>
                                    {match.winner || '—'}
                                  </span>
                                  <span
                                    className={`ml-auto text-[10px] font-bold ${
                                      match.isAbandoned ? 'text-slate-300' : match.correct ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                                  >
                                    {match.isAbandoned ? 'ABD' : match.correct ? '✓ CORRECT' : '✗'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)] p-4 text-sm text-[var(--app-text-secondary)]">
          No player has reached the streak zone yet.
        </div>
      )}

      {yetToStreak.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-[var(--app-border)]" />
            <span className="text-[10px] uppercase tracking-widest text-[var(--app-text-tertiary)]">Yet to streak</span>
            <div className="h-px flex-1 bg-[var(--app-border)]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {yetToStreak.map((player) => (
              <div
                key={player.playerId}
                className="flex items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface-alt)] px-2 py-1"
              >
                <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: player.color }}>
                  {player.name.charAt(0)}
                </div>
                <span className="text-[11px] text-[var(--app-text-secondary)]">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
