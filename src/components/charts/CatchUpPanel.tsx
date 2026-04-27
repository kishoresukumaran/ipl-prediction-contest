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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((entry) => (
        <div key={entry.participantId} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[var(--app-text)]">{entry.participantName}</p>
            <StatusPill status={entry.status} />
          </div>
          <p className="text-xs text-[var(--app-text-secondary)] mb-1">
            {entry.currentPoints} → <span className="font-semibold text-[var(--app-text)]">{entry.maxFinalPoints}</span>
          </p>
          <p className="text-xs text-[var(--app-text-secondary)] mb-2">
            Behind leader: <span className="text-[var(--app-text)]">{entry.pointsBehindLeader}</span>
          </p>

          <div className="space-y-1.5 text-[11px] text-[var(--app-text-tertiary)]">
            <Row label="Matches left" value={entry.matchesRemaining} />
            <Row label="Match upside" value={entry.maxRemainingMatchPoints} />
            <Row label="Double-header upside" value={entry.doubleHeaderUpside} />
            <Row label="Joker" value={entry.jokerAvailable ? `+${entry.jokerUpside}` : 'Used'} />
            <Row label="Pre-tournament (locked)" value={entry.preTournamentLockedPoints} />
            <Row label="Pre-tournament (remaining)" value={`+${entry.preTournamentMaxRemaining}`} />
          </div>
          <p className="mt-2 text-[10px] text-[var(--app-text-tertiary)]">{entry.breakdownNote}</p>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="font-semibold text-[var(--app-text-secondary)]">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: CatchUpEntry['status'] }) {
  if (status === 'champion-locked') return <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/25 text-amber-300">Locked</span>;
  if (status === 'eliminated') return <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-500/30 text-slate-300">Eliminated</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/25 text-emerald-300">Live</span>;
}
