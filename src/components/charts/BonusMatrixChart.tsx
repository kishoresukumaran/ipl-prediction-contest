'use client';

import { useMemo, useState } from 'react';
import { PARTICIPANTS } from '@/lib/constants';
import { PlayerPointsBreakdown } from '@/lib/types';

interface BonusQuestion {
  id: number;
  questionText: string;
  correctAnswer: string | null;
  matchId: number;
  points: number;
}

interface BonusMatrixData {
  questions: BonusQuestion[];
  matrix: Record<string, Record<number, number>>;
}

export function BonusMatrixChart({
  data,
  leaderboard,
}: {
  data: BonusMatrixData;
  leaderboard: PlayerPointsBreakdown[];
}) {
  const [tooltipId, setTooltipId] = useState<number | null>(null);

  const sortedPlayers = useMemo(() => {
    return [...leaderboard]
      .sort((a, b) => b.totalPoints - a.totalPoints || b.accuracy - a.accuracy)
      .map(p => {
        const participant = PARTICIPANTS.find(pp => pp.id === p.participantId);
        return {
          id: p.participantId,
          name: p.participantName,
          color: participant?.avatar_color || '#666',
        };
      });
  }, [leaderboard]);

  if (!data?.questions?.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[var(--app-text-secondary)] text-sm">
        No bonus questions yet
      </div>
    );
  }

  const headerBg = 'bg-[#f0ecf6] dark:bg-[#1a1040]';
  const stickyColBg = 'bg-[#eeeaf4] dark:bg-[#1a1040]';
  const stickyColBgAlt = 'bg-[#e8e3ef] dark:bg-[#1e1348]';

  const tooltipQuestion = data.questions.find(q => q.id === tooltipId);

  return (
    <div className="space-y-3">
      {/* Tooltip panel — shown when a header is active */}
      {tooltipQuestion && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs space-y-1">
          <p className="font-bold text-amber-400">
            BQ{data.questions.indexOf(tooltipQuestion) + 1} · Match #{tooltipQuestion.matchId}
          </p>
          <p className="text-[var(--app-text)] leading-snug">{tooltipQuestion.questionText}</p>
          {tooltipQuestion.correctAnswer ? (
            <p className="text-emerald-400 font-semibold">Answer: {tooltipQuestion.correctAnswer}</p>
          ) : (
            <p className="text-[var(--app-text-tertiary)] italic">Answer pending</p>
          )}
        </div>
      )}

      <div
        className="relative overflow-auto rounded-lg border border-[var(--app-border)]"
        style={{ maxHeight: '70vh' }}
      >
        <table className="border-collapse text-[11px] w-max min-w-full">
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Top-left corner */}
              <th
                className={`sticky left-0 z-30 ${headerBg} border-b-2 border-r border-[var(--app-border)] px-2 text-left text-[var(--app-text-secondary)] font-semibold`}
                style={{ minWidth: 110, verticalAlign: 'bottom', height: 90, paddingBottom: 6 }}
              >
                Player
              </th>

              {/* Question columns — slanted, numbered */}
              {data.questions.map((q, idx) => {
                const isActive = tooltipId === q.id;
                return (
                  <th
                    key={q.id}
                    className={`${headerBg} border-b-2 border-[var(--app-border)] px-0 relative overflow-visible cursor-pointer select-none`}
                    style={{ minWidth: 34, height: 90 }}
                    onClick={() => setTooltipId(isActive ? null : q.id)}
                    title={q.questionText}
                  >
                    <div
                      className={`absolute bottom-2 left-[50%] origin-bottom-left whitespace-nowrap transition-colors ${
                        isActive ? 'text-amber-400' : ''
                      }`}
                      style={{ transform: 'rotate(-55deg) translateX(-2px)', fontSize: 9, lineHeight: 1.2 }}
                    >
                      <span className={`font-bold ${isActive ? 'text-amber-400' : 'text-[var(--app-text)]'}`}>
                        BQ{idx + 1}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Total column */}
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
              const rowTotal = data.questions.reduce(
                (sum, q) => sum + (data.matrix[player.id]?.[q.id] ?? 0),
                0
              );
              return (
                <tr
                  key={player.id}
                  className={`${rowBg} hover:bg-[var(--app-surface-hover)] transition-colors`}
                >
                  {/* Sticky player name */}
                  <td
                    className={`sticky left-0 z-10 border-r border-[var(--app-border)] px-2 py-1.5 whitespace-nowrap ${
                      isAlt ? stickyColBgAlt : stickyColBg
                    }`}
                  >
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

                  {/* 0 / 1 cells */}
                  {data.questions.map(q => {
                    const val = data.matrix[player.id]?.[q.id] ?? 0;
                    const isActive = tooltipId === q.id;
                    return (
                      <td
                        key={q.id}
                        className={`text-center px-0 py-1.5 border-[var(--app-border)] transition-colors ${
                          val === 1
                            ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                            : 'text-[var(--app-text-tertiary)]'
                        } ${isActive ? 'ring-1 ring-inset ring-amber-400/40' : ''}`}
                        style={{ minWidth: 32 }}
                      >
                        {val}
                      </td>
                    );
                  })}

                  {/* Sticky total */}
                  <td
                    className={`sticky right-0 z-10 border-l border-[var(--app-border)] px-2 py-1.5 text-center font-bold text-amber-600 dark:text-amber-400 ${
                      isAlt ? stickyColBgAlt : stickyColBg
                    }`}
                  >
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[var(--app-text-tertiary)] text-center">
        Click a column header to see the question and correct answer
      </p>
    </div>
  );
}
