'use client';

import { PARTICIPANTS } from '@/lib/constants';

interface RankStatsEntry {
  participantId: string;
  participantName: string;
  throneTime: number;
  top3Time: number;
  cellarTime: number;
}

export function ThroneAndCellarChart({ data }: { data: RankStatsEntry[] }) {
  if (!data?.length) return <div className="text-sm text-[var(--app-text-secondary)]">No rank stats yet.</div>;

  const sorted = [...data].sort((a, b) => b.throneTime - a.throneTime || b.top3Time - a.top3Time);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {sorted.map((row) => {
        const participant = PARTICIPANTS.find((p) => p.id === row.participantId);
        return (
          <div key={row.participantId} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: participant?.avatar_color || '#666' }} />
              <p className="text-sm font-semibold text-[var(--app-text)]">{row.participantName}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              <Pill label="Throne" value={row.throneTime} />
              <Pill label="Top 3" value={row.top3Time} />
              <Pill label="Cellar" value={row.cellarTime} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--app-border)] px-2 py-0.5 text-[var(--app-text-secondary)]">
      <span>{label}</span>
      <span className="font-semibold text-[var(--app-text)]">{value}</span>
    </span>
  );
}
