'use client';

import { useState } from 'react';

interface TriviaResult {
  name: string;
  color: string;
  prediction: string;
  correct: boolean;
  points: number;
}

interface TriviaQuestion {
  triviaId: number;
  correctAnswer: string;
  totalAttempted: number;
  correctCount: number;
  stumpedEveryone: boolean;
  easyRound: boolean;
  results: TriviaResult[];
}

interface Props {
  data: TriviaQuestion[];
}

export function TriviaInterrogationRoom({ data }: Props) {
  const [selectedId, setSelectedId] = useState<number>(() => data[0]?.triviaId ?? -1);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-[var(--app-text-secondary)]">
        <span className="text-3xl mb-2">🔍</span>
        <p className="text-sm">No trivia questions yet</p>
        <p className="text-xs text-[var(--app-text-tertiary)] mt-1">Questions will appear here once trivia starts</p>
      </div>
    );
  }

  const question = data.find(q => q.triviaId === selectedId);

  const gotIt = question?.results.filter(r => r.correct) ?? [];
  const stumped = question?.results.filter(r => !r.correct) ?? [];

  return (
    <div className="space-y-4">
      {/* Question pill selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {data.map(q => {
          const isSelected = selectedId === q.triviaId;
          const allCorrect = q.easyRound;
          const noneCorrect = q.stumpedEveryone;
          return (
            <button
              key={q.triviaId}
              onClick={() => setSelectedId(q.triviaId)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-violet-500 border-violet-500 text-white shadow-md shadow-violet-500/20'
                  : allCorrect
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40'
                  : noneCorrect
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:border-red-500/40'
                  : 'bg-[var(--app-surface-alt)] border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-violet-500/40 hover:text-violet-400'
              }`}
            >
              Q{q.triviaId}
            </button>
          );
        })}
      </div>

      {question && (
        <div className="space-y-4">
          {/* Correct answer hero */}
          <div className="rounded-xl bg-violet-500/8 border border-violet-500/20 px-4 py-3">
            <p className="text-[10px] text-violet-400/70 font-semibold uppercase tracking-widest mb-1">Correct Answer</p>
            <p className="text-base font-bold text-violet-300">{question.correctAnswer || '—'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] text-[var(--app-text-tertiary)]">
                {question.correctCount} of {question.totalAttempted} got it right
              </span>
              {question.stumpedEveryone && (
                <span className="text-[9px] bg-red-500/15 border border-red-500/20 text-red-400 rounded-full px-2 py-0.5 font-bold uppercase">
                  Stumped Everyone
                </span>
              )}
              {question.easyRound && (
                <span className="text-[9px] bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-full px-2 py-0.5 font-bold uppercase">
                  Easy Round
                </span>
              )}
            </div>
          </div>

          {/* Got it right */}
          {gotIt.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">🎯</span>
                <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">Got It</h4>
                <span className="ml-auto text-[10px] text-[var(--app-text-tertiary)]">{gotIt.length} player{gotIt.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-1.5">
                {gotIt.map((r, i) => (
                  <div
                    key={r.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15"
                  >
                    <span className="text-sm w-5 text-center shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-[var(--app-text-tertiary)]">{i + 1}</span>}
                    </span>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: r.color }}
                    >
                      {r.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[var(--app-text)] flex-1">{r.name}</span>
                    <span className="text-xs font-semibold text-emerald-400 shrink-0">{r.prediction}</span>
                    <div className="shrink-0 bg-amber-400/15 border border-amber-400/30 rounded px-1.5 py-0.5">
                      <span className="text-xs font-black text-amber-400">+{r.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stumped */}
          {stumped.length > 0 && (
            <>
              {gotIt.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--app-border)]" />
                  <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">stumped</span>
                  <div className="flex-1 h-px bg-[var(--app-border)]" />
                </div>
              )}
              <div>
                {gotIt.length === 0 && (
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="text-base">🤦</span>
                    <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Stumped</h4>
                    <span className="ml-auto text-[10px] text-[var(--app-text-tertiary)]">{stumped.length} player{stumped.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {stumped.map(r => (
                    <div
                      key={r.name}
                      className="flex items-center gap-1.5 bg-[var(--app-surface-alt)] border border-[var(--app-border)] rounded-lg pl-1.5 pr-3 py-1"
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-70"
                        style={{ backgroundColor: r.color }}
                      >
                        {r.name.charAt(0)}
                      </div>
                      <span className="text-[11px] text-[var(--app-text-secondary)]">{r.name}</span>
                      {r.prediction && (
                        <>
                          <span className="text-[10px] text-[var(--app-text-tertiary)]">said</span>
                          <span className="text-[11px] font-semibold text-red-400">{r.prediction}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
