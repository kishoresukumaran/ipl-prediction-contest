'use client';

interface CatchUpEntry {
  participantId: string;
  participantName: string;
  currentPoints: number;
  pointsBehindLeader: number;
  matchesRemaining: number;
  maxRemainingMatchPoints: number;
  doubleHeaderUpside: number;
  jokerAvailable: boolean;
  jokerUpside: number;
  preTournamentLockedPoints: number;
  preTournamentMaxRemaining: number;
  maxFinalPoints: number;
  status: 'champion-locked' | 'live' | 'eliminated';
  breakdownNote: string;
}

export function CatchUpPanel({ data }: { data: CatchUpEntry[] }) {
  if (!data?.length) return <div className="text-sm text-[var(--app-text-secondary)]">No catch-up data yet.</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--app-text-secondary)]">
        <span className="font-semibold text-[var(--app-text)]">Now → Best case</span> shows current points and the
        maximum a player could finish with if every remaining prediction (matches, double-headers, joker, and
        unresolved pre-tournament picks) lands perfectly.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((entry) => {
          const upsideTotal =
            entry.maxRemainingMatchPoints +
            entry.doubleHeaderUpside +
            entry.jokerUpside +
            entry.preTournamentMaxRemaining;
          return (
            <div
              key={entry.participantId}
              className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[var(--app-text)]">{entry.participantName}</p>
                <StatusPill status={entry.status} />
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[10px] uppercase tracking-wide text-[var(--app-text-tertiary)]">Now</span>
                <span
                  className="text-sm text-[var(--app-text-secondary)]"
                  title="Points earned so far (matches + bonuses + locked pre-tournament + trivia)"
                >
                  {entry.currentPoints}
                </span>
                <span className="text-[var(--app-text-tertiary)]">→</span>
                <span className="text-[10px] uppercase tracking-wide text-[var(--app-text-tertiary)]">Best case</span>
                <span
                  className="text-base font-semibold text-[var(--app-text)]"
                  title="Best-case final total if every remaining prediction lands perfectly"
                >
                  {entry.maxFinalPoints}
                </span>
              </div>
              <p className="text-xs text-[var(--app-text-secondary)] mb-2.5">
                Behind current leader: <span className="text-[var(--app-text)]">{entry.pointsBehindLeader}</span>
                {upsideTotal > 0 && (
                  <span className="text-[var(--app-text-tertiary)]"> · still up for grabs: +{upsideTotal}</span>
                )}
              </p>

              <p className="text-[10px] uppercase tracking-wide text-[var(--app-text-tertiary)] mb-1">
                Max points still gainable
              </p>
              <div className="space-y-1.5 text-[11px] text-[var(--app-text-tertiary)]">
                <Row
                  label="From remaining matches"
                  value={`+${entry.maxRemainingMatchPoints}`}
                  help={`Best-case points from the ${entry.matchesRemaining} unplayed ${entry.matchesRemaining === 1 ? 'match' : 'matches'} (every prediction correct, including underdog bonuses and playoff weights)`}
                />
                <Row
                  label="Double-header bonuses"
                  value={`+${entry.doubleHeaderUpside}`}
                  help="2 bonus pts per remaining double-header day if both predictions are correct"
                />
                <Row
                  label="Joker bonus"
                  value={entry.jokerAvailable ? `+${entry.jokerUpside}` : 'Used'}
                  help={
                    entry.jokerAvailable
                      ? `Joker still in hand — saves up to +${entry.jokerUpside} when played on a high-value match`
                      : 'Joker has already been played, so no upside left here'
                  }
                />
                <Row
                  label="Pre-tournament (still open)"
                  value={`+${entry.preTournamentMaxRemaining}`}
                  help="Max more points from pre-tournament predictions still to resolve (Orange Cap, Purple Cap, top scorer, etc.). Already-locked pre-tournament points are included in 'Now'."
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, help }: { label: string; value: string | number; help?: string }) {
  return (
    <div className="flex items-center justify-between gap-2" title={help}>
      <span>{label}</span>
      <span className="font-semibold text-[var(--app-text-secondary)]">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: CatchUpEntry['status'] }) {
  if (status === 'champion-locked')
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/25 text-amber-300"
        title="Mathematically guaranteed to finish on top — no one else can catch up"
      >
        Locked
      </span>
    );
  if (status === 'eliminated')
    return (
      <span
        className="px-2 py-0.5 rounded-full text-[10px] bg-slate-500/30 text-slate-300"
        title="Even with a perfect run from here, this player can no longer overtake the current leader"
      >
        Eliminated
      </span>
    );
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/25 text-emerald-300"
      title="Still mathematically in the title race"
    >
      Live
    </span>
  );
}
