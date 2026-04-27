'use client';

import { PARTICIPANTS } from '@/lib/constants';

interface LeadSegment {
  holderId: string;
  holderName: string;
  fromMatchId: number;
  toMatchId: number;
  length: number;
}

interface LeadChangesData {
  leadChanges: number;
  uniqueLeaders: number;
  segments: LeadSegment[];
}

export function LeadChangesPanel({ data }: { data: LeadChangesData }) {
  if (!data?.segments?.length) {
    return <div className="text-sm text-[var(--app-text-secondary)]">Need completed matches to compute lead shifts.</div>;
  }

  const totalSpan = data.segments.reduce((sum, s) => sum + s.length, 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Stat title="Lead Changes" value={data.leadChanges} />
        <Stat title="Unique Leaders" value={data.uniqueLeaders} />
        <Stat title="Leader Segments" value={data.segments.length} />
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex min-w-[560px] h-8 rounded-lg overflow-hidden border border-[var(--app-border)]">
          {data.segments.map((segment) => {
            const participant = PARTICIPANTS.find((p) => p.id === segment.holderId);
            const widthPct = (segment.length / totalSpan) * 100;
            return (
              <div
                key={`${segment.holderId}-${segment.fromMatchId}`}
                className="h-full relative"
                style={{ width: `${Math.max(widthPct, 4)}%`, backgroundColor: participant?.avatar_color || '#666' }}
                title={`${segment.holderName} (Match ${segment.fromMatchId} - ${segment.toMatchId})`}
              />
            );
          })}
        </div>
      </div>
      <p className="text-xs text-[var(--app-text-tertiary)]">Timeline shows who held Rank #1 across matches.</p>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
      <p className="text-[11px] text-[var(--app-text-tertiary)]">{title}</p>
      <p className="text-lg font-semibold text-[var(--app-text)]">{value}</p>
    </div>
  );
}
