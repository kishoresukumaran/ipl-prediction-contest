'use client';

interface CrowdTrapEntry {
  questionId: number;
  questionText: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  correctAnswer: string;
  totalResponses: number;
  wrongCount: number;
  correctCount: number;
  wrongPct: number;
  mostPopularWrongAnswer: string;
  mostPopularWrongCount: number;
}

function trapLabel(wrongPct: number): { label: string; color: string } {
  if (wrongPct >= 90) return { label: 'Absolute Massacre', color: 'text-red-400' };
  if (wrongPct >= 75) return { label: 'Total Disaster', color: 'text-orange-400' };
  return { label: 'Majority Fooled', color: 'text-amber-400' };
}

export function CrowdTrapChart({ data }: { data: CrowdTrapEntry[] }) {
  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-[var(--app-text-secondary)] text-sm gap-2">
        <span className="text-3xl">🪤</span>
        <p>No crowd traps yet — everyone's been suspiciously smart.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header summary */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3">
        <span className="text-2xl">🪤</span>
        <div>
          <p className="text-sm font-bold text-red-400">
            {data.length} crowd trap{data.length !== 1 ? 's' : ''} sprung so far
          </p>
          <p className="text-xs text-[var(--app-text-secondary)]">
            Questions where over half of you confidently got it wrong. Together.
          </p>
        </div>
      </div>

      {/* Trap cards */}
      {data.map((trap) => {
        const { label, color } = trapLabel(trap.wrongPct);
        const survivorText =
          trap.correctCount === 0
            ? 'Nobody got it right. Not a single soul.'
            : trap.correctCount === 1
            ? 'Only 1 person escaped. Lone genius or lucky guess?'
            : `Only ${trap.correctCount} out of ${trap.totalResponses} got it right.`;

        return (
          <div
            key={trap.questionId}
            className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl p-4 space-y-3"
          >
            {/* Match label + severity */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-[var(--app-text-tertiary)] bg-[var(--app-surface-alt)] px-2 py-0.5 rounded-full">
                Match #{trap.matchId} · {trap.homeTeam} vs {trap.awayTeam}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${color}`}>
                {label}
              </span>
            </div>

            {/* Question */}
            <p className="text-sm font-semibold text-[var(--app-text)] leading-snug">
              {trap.questionText}
            </p>

            {/* Wrong % bar */}
            <div>
              <div className="flex justify-between text-[10px] text-[var(--app-text-secondary)] mb-1">
                <span>{trap.wrongCount}/{trap.totalResponses} players got it wrong</span>
                <span className={`font-bold ${color}`}>{trap.wrongPct.toFixed(0)}% wrong</span>
              </div>
              <div className="h-2 bg-[var(--app-surface-alt)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all"
                  style={{ width: `${trap.wrongPct}%` }}
                />
              </div>
            </div>

            {/* Decoy + correct */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-wide mb-0.5">
                  The Decoy 🎭
                </p>
                <p className="text-xs font-semibold text-[var(--app-text)]">
                  {trap.mostPopularWrongAnswer}
                </p>
                <p className="text-[10px] text-[var(--app-text-secondary)]">
                  {trap.mostPopularWrongCount} player{trap.mostPopularWrongCount !== 1 ? 's' : ''} fell for it
                </p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide mb-0.5">
                  The Answer ✅
                </p>
                <p className="text-xs font-semibold text-[var(--app-text)]">
                  {trap.correctAnswer}
                </p>
                <p className="text-[10px] text-[var(--app-text-secondary)]">
                  {survivorText}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
