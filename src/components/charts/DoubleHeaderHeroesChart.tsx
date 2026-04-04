'use client';

import { useState } from 'react';
import { TEAMS, POINTS_CONFIG } from '@/lib/constants';

interface MatchDetail {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  predicted: string;
  winner: string;
  correct: boolean;
}

interface DHInstance {
  date: string;
  matches: MatchDetail[];
  swept: boolean;
}

interface DHHeroData {
  name: string;
  color: string;
  totalDays: number;
  sweptDays: number;
  totalBonusPoints: number;
  successRate: number;
  instances: DHInstance[];
}

function MedalBadge({ rank }: { rank: number }) {
  if (rank === 0) return <span className="text-lg">🥇</span>;
  if (rank === 1) return <span className="text-lg">🥈</span>;
  if (rank === 2) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]">
      {rank + 1}
    </span>
  );
}

export function DoubleHeaderHeroesChart({ data }: { data: DHHeroData[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-[var(--app-text-secondary)]">
        <p className="text-sm">No double header days yet</p>
        <p className="text-xs text-[var(--app-text-tertiary)] mt-1">Check back when there are multi-match days</p>
      </div>
    );
  }

  const heroes = data.filter(d => d.sweptDays > 0);
  const mortals = data.filter(d => d.sweptDays === 0);

  return (
    <div className="space-y-5">
      {/* Heroes section */}
      {heroes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧹</span>
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">The Sweepers</h4>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-medium">
              +{POINTS_CONFIG.doubleHeaderBonus} pts per sweep
            </span>
          </div>

          <div className="space-y-1.5">
            {heroes.map((player, i) => {
              const isExpanded = expanded === player.name;
              return (
                <div key={player.name}>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : player.name)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--app-surface-alt)] transition-colors">
                      <MedalBadge rank={i} />
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--app-text)] truncate">{player.name}</p>
                        <p className="text-[10px] text-[var(--app-text-tertiary)]">
                          {player.sweptDays}/{player.totalDays} days swept &middot; {player.successRate.toFixed(0)}% rate
                        </p>
                      </div>
                      <div className="shrink-0 bg-amber-400/15 border border-amber-400/30 rounded-lg px-2.5 py-1 text-center">
                        <span className="text-lg font-black text-amber-400 tabular-nums">+{player.totalBonusPoints}</span>
                        <p className="text-[9px] text-amber-400/70 font-medium -mt-0.5">BONUS</p>
                      </div>
                      <svg className={`h-4 w-4 text-[var(--app-text-tertiary)] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="ml-14 mr-3 mt-1 mb-2 space-y-2">
                      {player.instances.map((inst) => (
                        <div
                          key={inst.date}
                          className={`rounded-lg border px-3 py-2 ${
                            inst.swept
                              ? 'bg-emerald-500/5 border-emerald-500/20'
                              : 'bg-[var(--app-surface-alt)] border-[var(--app-border)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-medium text-[var(--app-text-secondary)]">{inst.date}</span>
                            {inst.swept ? (
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 rounded-full px-1.5 py-0.5 font-bold">SWEPT +{POINTS_CONFIG.doubleHeaderBonus}</span>
                            ) : (
                              <span className="text-[10px] bg-red-500/10 text-red-400 rounded-full px-1.5 py-0.5 font-medium">MISSED</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            {inst.matches.map(m => (
                              <div key={m.matchId} className="flex items-center gap-2 text-xs">
                                <span className="text-[var(--app-text-tertiary)] w-6">#{m.matchId}</span>
                                <span style={{ color: TEAMS[m.homeTeam]?.color }} className="font-medium">{m.homeTeam}</span>
                                <span className="text-[var(--app-text-tertiary)]">vs</span>
                                <span style={{ color: TEAMS[m.awayTeam]?.color }} className="font-medium">{m.awayTeam}</span>
                                <span className="text-[var(--app-text-tertiary)] mx-1">→</span>
                                <span className={`font-semibold ${m.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {m.predicted || '—'}
                                </span>
                                {m.correct ? (
                                  <span className="text-emerald-400 text-[10px]">✓</span>
                                ) : (
                                  <span className="text-red-400 text-[10px]">✗ (W: {m.winner})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      {heroes.length > 0 && mortals.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--app-border)]" />
          <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">0 sweeps</span>
          <div className="flex-1 h-px bg-[var(--app-border)]" />
        </div>
      )}

      {/* Mortals section */}
      {mortals.length > 0 && (
        <div>
          <div className="flex flex-wrap gap-1.5">
            {mortals.map(p => (
              <div key={p.name} className="flex items-center gap-1.5 bg-[var(--app-surface-alt)] border border-[var(--app-border)] rounded-full pl-1 pr-2.5 py-0.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-60"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0)}
                </div>
                <span className="text-[11px] text-[var(--app-text-tertiary)]">{p.name}</span>
                <span className="text-[10px] text-[var(--app-text-tertiary)]">0/{p.totalDays}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
