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

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="rounded-md border border-amber-400/35 bg-amber-400/15 px-2.5 py-1 text-center min-w-[96px]">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-300/90">Streaks Attained</p>
                        <p className="text-sm font-black text-amber-300 tabular-nums">{player.streakCount}</p>
                      </div>
                      <div className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-1 text-center min-w-[80px]">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--app-text-tertiary)]">Best Length</p>
                        <p className="text-sm font-black text-[var(--app-text)] tabular-nums">{player.longestStreak}</p>
                      </div>
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
