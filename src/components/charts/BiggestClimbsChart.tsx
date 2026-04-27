'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { ReactNode } from 'react';

interface RankDelta {
  delta: number;
  fromRank: number;
  toRank: number;
  matchId: number;
}

interface RankStatsEntry {
  participantId: string;
  participantName: string;
  biggestClimb: RankDelta | null;
  biggestCrash: RankDelta | null;
}

export function BiggestClimbsChart({ data }: { data: RankStatsEntry[] }) {
  if (!data?.length) return <div className="text-sm text-[var(--app-text-secondary)]">No climb data yet.</div>;

  const climbs = data
    .filter((p) => p.biggestClimb && p.biggestClimb.delta > 0)
    .sort((a, b) => (b.biggestClimb?.delta || 0) - (a.biggestClimb?.delta || 0))
    .slice(0, 5);
  const crashes = data
    .filter((p) => p.biggestCrash && p.biggestCrash.delta < 0)
    .sort((a, b) => (a.biggestCrash?.delta || 0) - (b.biggestCrash?.delta || 0))
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <List title="Biggest Climbs" icon={<ArrowUp className="h-4 w-4 text-emerald-400" />} rows={climbs} kind="climb" />
      <List title="Biggest Crashes" icon={<ArrowDown className="h-4 w-4 text-rose-400" />} rows={crashes} kind="crash" />
    </div>
  );
}

function List({
  title,
  icon,
  rows,
  kind,
}: {
  title: string;
  icon: ReactNode;
  rows: RankStatsEntry[];
  kind: 'climb' | 'crash';
}) {
  return (
    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-sm font-semibold text-[var(--app-text)]">{title}</p>
      </div>
      <div className="space-y-2">
        {rows.map((row) => {
          const delta = kind === 'climb' ? row.biggestClimb : row.biggestCrash;
          if (!delta) return null;
          return (
            <div key={row.participantId} className="rounded-md border border-[var(--app-border)] px-2.5 py-2 text-xs">
              <p className="font-semibold text-[var(--app-text)]">{row.participantName}</p>
              <p className="text-[var(--app-text-secondary)]">
                {delta.fromRank} → {delta.toRank} ({delta.delta > 0 ? '+' : ''}
                {delta.delta}) on Match #{delta.matchId}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
