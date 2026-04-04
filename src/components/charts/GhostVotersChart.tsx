'use client';

import { useState } from 'react';
import { TEAMS } from '@/lib/constants';

interface GhostVoterData {
  name: string;
  color: string;
  missedCount: number;
  noVoteCount: number;
  lateCount: number;
  participationRate: number;
  totalMatches: number;
  missedMatches: { matchId: number; homeTeam: string; awayTeam: string; matchDate: string; reason: 'no_vote' | 'late' }[];
}

export function GhostVotersChart({ data }: { data: GhostVoterData[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data?.length) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
  }

  const withMisses = data.filter(d => d.missedCount > 0);
  const perfect = data.filter(d => d.missedCount === 0);

  return (
    <div className="space-y-4">
      {withMisses.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-lg font-semibold text-emerald-400">100% attendance!</p>
          <p className="text-xs text-[var(--app-text-secondary)] mt-1">Everyone voted on time for every match. Impressive.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {withMisses.map((player, i) => {
            const isExpanded = expanded === player.name;
            const barWidth = player.totalMatches > 0 ? (player.missedCount / player.totalMatches) * 100 : 0;
            return (
              <div key={player.name}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : player.name)}
                  className="w-full text-left"
                >
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--app-surface-alt)] transition-colors">
                    <span className="text-xs font-bold text-[var(--app-text-tertiary)] w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--app-text)] truncate">{player.name}</span>
                        <span className="text-[10px] text-[var(--app-text-tertiary)]">
                          {player.participationRate.toFixed(0)}% participation
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-emerald-500/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400/70 transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-lg font-black text-red-400 tabular-nums">{player.missedCount}</span>
                      <span className="text-[10px] text-[var(--app-text-tertiary)] ml-1">missed</span>
                    </div>
                    <div className="shrink-0 flex gap-1">
                      {player.noVoteCount > 0 && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-1.5 py-0.5">
                          {player.noVoteCount} no vote
                        </span>
                      )}
                      {player.lateCount > 0 && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-1.5 py-0.5">
                          {player.lateCount} late
                        </span>
                      )}
                    </div>
                    <svg className={`h-4 w-4 text-[var(--app-text-tertiary)] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {isExpanded && player.missedMatches.length > 0 && (
                  <div className="ml-16 mr-3 mt-1 mb-2 space-y-1">
                    {player.missedMatches.map(m => (
                      <div key={m.matchId} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded bg-[var(--app-surface-alt)]">
                        <span className="text-[var(--app-text-tertiary)]">#{m.matchId}</span>
                        <span style={{ color: TEAMS[m.homeTeam]?.color }}>{m.homeTeam}</span>
                        <span className="text-[var(--app-text-tertiary)]">vs</span>
                        <span style={{ color: TEAMS[m.awayTeam]?.color }}>{m.awayTeam}</span>
                        <span className="text-[var(--app-text-tertiary)] ml-auto">{m.matchDate}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          m.reason === 'late'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {m.reason === 'late' ? 'Late' : 'No vote'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {perfect.length > 0 && (
        <div className="pt-3 border-t border-[var(--app-border)]">
          <p className="text-xs text-emerald-400 font-semibold mb-2">Perfect Attendance ({perfect.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {perfect.map(p => (
              <div key={p.name} className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full pl-1 pr-2.5 py-0.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0)}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
