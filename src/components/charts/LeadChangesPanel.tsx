'use client';

import { useState } from 'react';
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
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (!data?.segments?.length) {
    return (
      <div className="text-sm text-[var(--app-text-secondary)]">
        Need completed matches before we can track who has held Rank #1.
      </div>
    );
  }

  const totalSpan = data.segments.reduce((sum, s) => sum + s.length, 0);
  const activeSegment = activeIdx !== null ? data.segments[activeIdx] : null;
  const longestReign = data.segments.reduce(
    (best, s) => (s.length > best.length ? s : best),
    data.segments[0]
  );
  const longestParticipant = PARTICIPANTS.find((p) => p.id === longestReign.holderId);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--app-text-secondary)]">
        Tracks who has held the <span className="font-semibold text-[var(--app-text)]">Rank #1</span> spot on the
        leaderboard, match by match.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Stat title="Times Rank #1 changed hands" value={data.leadChanges} />
        <Stat title="Different players who have led" value={data.uniqueLeaders} />
      </div>

      <div>
        <p className="text-[11px] text-[var(--app-text-tertiary)] mb-1.5">
          Timeline of Rank #1 across matches (each colored block is one continuous reign)
        </p>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex min-w-[560px] h-8 rounded-lg overflow-hidden border border-[var(--app-border)]">
            {data.segments.map((segment, idx) => {
              const participant = PARTICIPANTS.find((p) => p.id === segment.holderId);
              const widthPct = (segment.length / totalSpan) * 100;
              const isActive = activeIdx === idx;
              return (
                <button
                  key={`${segment.holderId}-${segment.fromMatchId}`}
                  type="button"
                  onClick={() => setActiveIdx(isActive ? null : idx)}
                  className={`h-full transition-opacity active:scale-95 ${
                    activeIdx === null || isActive ? 'opacity-100' : 'opacity-60'
                  }`}
                  style={{
                    width: `${Math.max(widthPct, 4)}%`,
                    backgroundColor: participant?.avatar_color || '#666',
                  }}
                  title={`${segment.holderName} held Rank #1 (Match ${segment.fromMatchId} → ${segment.toMatchId})`}
                  aria-label={`${segment.holderName} held Rank #1 from match ${segment.fromMatchId} to ${segment.toMatchId}`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {activeSegment ? (
        <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor:
                  PARTICIPANTS.find((p) => p.id === activeSegment.holderId)?.avatar_color || '#666',
              }}
            />
            <span className="font-semibold text-[var(--app-text)]">{activeSegment.holderName}</span>
          </div>
          <p className="text-[var(--app-text-secondary)]">
            Held Rank #1 from Match #{activeSegment.fromMatchId} to Match #{activeSegment.toMatchId}
            {' '}({activeSegment.length} {activeSegment.length === 1 ? 'match' : 'matches'})
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-[var(--app-text-tertiary)]">
          Tip: tap a colored block above to see who led and for how long. Longest reign so far:{' '}
          <span className="font-semibold text-[var(--app-text-secondary)]">
            {longestParticipant?.name || longestReign.holderName}
          </span>{' '}
          for {longestReign.length} {longestReign.length === 1 ? 'match' : 'matches'}.
        </p>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
      <p className="text-[11px] text-[var(--app-text-tertiary)] leading-tight">{title}</p>
      <p className="text-lg font-semibold text-[var(--app-text)] mt-0.5">{value}</p>
    </div>
  );
}
