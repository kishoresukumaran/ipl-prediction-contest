'use client';

import { useState } from 'react';

interface TriviaRound {
  triviaId: number;
  prediction: string;
  correctAnswer: string;
  correct: boolean;
  points: number;
}

interface TriviaPlayerData {
  name: string;
  color: string;
  total: number;
  correct: number;
  attempted: number;
  accuracy: number;
  allCorrect: boolean;
  rounds: TriviaRound[];
}

interface Props {
  data: TriviaPlayerData[];
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

export function TriviaThrone({ data }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const players = data.filter(p => p.attempted > 0);
  const yetToPlay = data.filter(p => p.attempted === 0);

  if (!players.length && !yetToPlay.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-[var(--app-text-secondary)]">
        <span className="text-3xl mb-2">👑</span>
        <p className="text-sm">No trivia rounds yet</p>
        <p className="text-xs text-[var(--app-text-tertiary)] mt-1">Check back after trivia questions are posted</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {players.length > 0 && (
        <div className="space-y-1.5">
          {players.map((player, i) => {
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--app-text)]">{player.name}</p>
                        {player.allCorrect && (
                          <span className="text-[9px] bg-violet-500/15 border border-violet-500/25 text-violet-400 rounded-full px-1.5 py-0.5 font-bold tracking-wide uppercase">
                            Perfect
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--app-text-tertiary)]">
                        {player.correct}/{player.attempted} correct &middot; {player.accuracy.toFixed(0)}% accuracy
                      </p>
                    </div>
                    <div className="shrink-0 bg-amber-400/15 border border-amber-400/30 rounded-lg px-2.5 py-1 text-center">
                      <span className="text-lg font-black text-amber-400 tabular-nums">{player.total}</span>
                      <p className="text-[9px] text-amber-400/70 font-medium -mt-0.5">PTS</p>
                    </div>
                    <svg className={`h-4 w-4 text-[var(--app-text-tertiary)] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="ml-14 mr-3 mt-1 mb-2 space-y-1.5">
                    {player.rounds.map(round => (
                      <div
                        key={round.triviaId}
                        className={`rounded-lg border px-3 py-2 ${
                          round.correct
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : 'bg-red-500/5 border-red-500/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[var(--app-text-tertiary)] shrink-0">
                            Q{round.triviaId}
                          </span>
                          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-medium ${round.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                              {round.prediction || '—'}
                            </span>
                            {!round.correct && round.correctAnswer && (
                              <>
                                <span className="text-[10px] text-[var(--app-text-tertiary)]">→</span>
                                <span className="text-[10px] text-[var(--app-text-secondary)]">
                                  {round.correctAnswer}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {round.correct
                              ? <span className="text-emerald-400 text-xs">✓</span>
                              : <span className="text-red-400 text-xs">✗</span>
                            }
                            {round.correct && (
                              <span className="text-[10px] font-bold text-amber-400">+{round.points}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {yetToPlay.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--app-border)]" />
            <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">yet to play</span>
            <div className="flex-1 h-px bg-[var(--app-border)]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {yetToPlay.map(p => (
              <div
                key={p.name}
                className="flex items-center gap-1.5 bg-[var(--app-surface-alt)] border border-[var(--app-border)] rounded-full pl-1 pr-2.5 py-0.5"
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-60"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0)}
                </div>
                <span className="text-[11px] text-[var(--app-text-tertiary)]">{p.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
