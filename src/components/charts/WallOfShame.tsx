'use client';

import { useState } from 'react';
import { TEAMS } from '@/lib/constants';

interface JinxMatch {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  favorite: string;
  winner: string | null;
  jinxed: boolean;
  voteShare: number;
  totalVotes: number;
}

interface WallOfShameData {
  wastedJokers: { name: string; matchId: number; homeTeam: string; awayTeam: string; picked: string; winner: string; color: string }[];
  jinxers: { name: string; pickedFavorite: number; favoriteWon: number; favoriteLost: number; jinxRate: number; color: string; jinxMatches: JinxMatch[] }[];
  losingStreaks: { name: string; currentLosingStreak: number; longestLosingStreak: number; color: string }[];
}

export function WallOfShame({ data }: { data: WallOfShameData }) {
  const [expandedJinxer, setExpandedJinxer] = useState<string | null>(null);

  if (!data) return <div className="text-[var(--app-text-secondary)] text-sm text-center py-10">No data yet</div>;

  return (
    <div className="space-y-6">
      {/* Wasted Jokers - The Clown Car */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
        <h3 className="text-base font-semibold text-[var(--app-text)] mb-1 flex items-center gap-2">
          <span className="text-2xl">🤡</span> The Clown Car
        </h3>
        <p className="text-xs text-[var(--app-text-secondary)] mb-4">Confidently played the +10 Joker... and lost</p>

        {data.wastedJokers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-[var(--app-text-tertiary)] text-sm">No wasted jokers yet. Everyone&apos;s playing it safe...</p>
            <p className="text-[var(--app-text-tertiary)] text-xs mt-1">Or maybe they&apos;re just smart</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.wastedJokers.map((j, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: j.color }}>
                  {j.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{j.name}</p>
                  <p className="text-[var(--app-text-secondary)] text-xs">
                    Match #{j.matchId}:
                    <span className="mx-1" style={{ color: TEAMS[j.homeTeam]?.color }}>{j.homeTeam}</span>
                    vs
                    <span className="mx-1" style={{ color: TEAMS[j.awayTeam]?.color }}>{j.awayTeam}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-red-400 text-xs">Picked <span className="font-bold">{j.picked}</span></p>
                  <p className="text-emerald-400 text-xs">Winner: <span className="font-bold">{j.winner}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Jinxer */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
        <h3 className="text-base font-semibold text-[var(--app-text)] mb-1 flex items-center gap-2">
          <span className="text-2xl">🧿</span> The Jinxer
        </h3>
        <p className="text-xs text-[var(--app-text-secondary)] mb-4">Highest failure rate when picking the crowd favorite. When they back the favorite, it loses.</p>

        {data.jinxers.length === 0 ? (
          <div className="text-center py-6 text-[var(--app-text-tertiary)] text-sm">No data yet</div>
        ) : (
          <div className="space-y-1.5">
            {data.jinxers.slice(0, 15).map((j, i) => {
              const isExpanded = expandedJinxer === j.name;
              const jinxedMatches = j.jinxMatches.filter(m => m.jinxed);
              const safeMatches = j.jinxMatches.filter(m => !m.jinxed);
              return (
                <div key={j.name} className="rounded-lg overflow-hidden border border-transparent hover:border-[var(--app-border)] transition-colors">
                  {/* Main row */}
                  <button
                    className="w-full flex items-center gap-3 py-2 px-3 bg-[var(--app-surface)] hover:bg-[var(--app-surface-alt)] transition-colors cursor-pointer text-left"
                    onClick={() => setExpandedJinxer(isExpanded ? null : j.name)}
                    aria-expanded={isExpanded}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-red-400/80 text-white' : i === 2 ? 'bg-red-400/60 text-white' : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: j.color }}>
                      {j.name.charAt(0)}
                    </div>
                    <span className="text-sm text-[var(--app-text)] flex-1">{j.name}</span>
                    <div className="text-right">
                      <span className="text-red-400 text-sm font-bold">{j.jinxRate.toFixed(0)}%</span>
                      <span className="text-[var(--app-text-tertiary)] text-xs ml-1">jinx rate</span>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <span className="text-[var(--app-text-secondary)] text-xs">{j.favoriteLost}/{j.pickedFavorite} lost</span>
                    </div>
                    <span className={`text-[var(--app-text-tertiary)] text-[10px] ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="bg-[var(--app-surface-alt)] border-t border-[var(--app-border)] px-4 py-3 space-y-3">
                      {/* Explanation */}
                      <p className="text-xs text-[var(--app-text-secondary)] leading-relaxed">
                        <span className="font-semibold text-[var(--app-text)]">{j.name}</span> picked the crowd&apos;s favourite team in{' '}
                        <span className="font-semibold text-[var(--app-text)]">{j.pickedFavorite} matches</span>.
                        The crowd was wrong <span className="font-semibold text-red-400">{j.favoriteLost} of those times</span> — giving a jinx rate of{' '}
                        <span className="font-semibold text-red-400">{j.jinxRate.toFixed(0)}%</span>.
                        {j.favoriteWon > 0 && (
                          <> The crowd&apos;s pick did win <span className="font-semibold text-emerald-400">{j.favoriteWon} {j.favoriteWon === 1 ? 'time' : 'times'}</span>.</>
                        )}
                      </p>

                      {/* Jinxed matches */}
                      {jinxedMatches.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-1.5">Jinxed — crowd fave lost ({jinxedMatches.length})</p>
                          <div className="space-y-1">
                            {jinxedMatches.map(m => (
                              <div key={m.matchId} className="flex items-center gap-2 text-xs">
                                <span className="text-[var(--app-text-tertiary)] font-mono w-8 shrink-0">#{m.matchId}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                                  style={{ backgroundColor: TEAMS[m.favorite]?.color || '#ef4444', color: TEAMS[m.favorite]?.textColor || '#fff' }}
                                >
                                  {m.favorite}
                                </span>
                                <span className="text-[var(--app-text-tertiary)]">vs {m.homeTeam === m.favorite ? m.awayTeam : m.homeTeam}</span>
                                <span className="text-[var(--app-text-tertiary)] ml-auto shrink-0">{m.voteShare}% backed {m.favorite}</span>
                                {m.winner && (
                                  <span className="text-emerald-400 font-semibold shrink-0">→ {m.winner} won</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Safe matches */}
                      {safeMatches.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">Safe — crowd fave won ({safeMatches.length})</p>
                          <div className="space-y-1">
                            {safeMatches.map(m => (
                              <div key={m.matchId} className="flex items-center gap-2 text-xs opacity-60">
                                <span className="text-[var(--app-text-tertiary)] font-mono w-8 shrink-0">#{m.matchId}</span>
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                                  style={{ backgroundColor: TEAMS[m.favorite]?.color || '#10b981', color: TEAMS[m.favorite]?.textColor || '#fff' }}
                                >
                                  {m.favorite}
                                </span>
                                <span className="text-[var(--app-text-tertiary)]">vs {m.homeTeam === m.favorite ? m.awayTeam : m.homeTeam}</span>
                                <span className="text-[var(--app-text-tertiary)] ml-auto shrink-0">{m.voteShare}% backed {m.favorite}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Zero-Streak Club */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
        <h3 className="text-base font-semibold text-[var(--app-text)] mb-1 flex items-center gap-2">
          <span className="text-2xl">🥶</span> Zero-Streak Club
        </h3>
        <p className="text-xs text-[var(--app-text-secondary)] mb-4">Longest current losing streaks. How long can you get it wrong?</p>

        {data.losingStreaks.filter(l => l.currentLosingStreak > 0).length === 0 ? (
          <div className="text-center py-6 text-[var(--app-text-tertiary)] text-sm">Everyone got at least one right recently!</div>
        ) : (
          <div className="space-y-1.5">
            {data.losingStreaks.filter(l => l.currentLosingStreak > 0).map((l, i) => (
              <div key={l.name} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--app-surface)] hover:bg-[var(--app-surface-alt)] transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-blue-500 text-white' : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]'
                }`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: l.color }}>
                  {l.name.charAt(0)}
                </div>
                <span className="text-sm text-[var(--app-text)] flex-1">{l.name}</span>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-blue-400 text-sm font-bold">{l.currentLosingStreak}</span>
                    <span className="text-[var(--app-text-tertiary)] text-xs ml-1">current</span>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="text-[var(--app-text-secondary)] text-xs">worst: {l.longestLosingStreak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
