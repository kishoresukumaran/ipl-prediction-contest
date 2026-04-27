'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';

interface Journey {
  rankHistory: Array<{ matchId: number; rank: number }>;
  bestWeek: { week: string; points: number } | null;
  worstWeek: { week: string; points: number } | null;
  longestClimbStreak: number;
  biggestSingleMatchClimb: { delta: number; matchId: number } | null;
  biggestSingleMatchCrash: { delta: number; matchId: number } | null;
}

export function PersonalBestCard({ journey, participantId }: { journey: Journey; participantId: string }) {
  const participant = PARTICIPANTS.find((p) => p.id === participantId);
  return (
    <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-2">Journey Snapshot</h3>
      <div className="h-[120px] mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={journey.rankHistory}>
            <Line type="monotone" dataKey="rank" stroke={participant?.avatar_color || '#8884d8'} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Cell label="Best Week" value={journey.bestWeek ? `${journey.bestWeek.week} (+${journey.bestWeek.points})` : '-'} />
        <Cell label="Worst Week" value={journey.worstWeek ? `${journey.worstWeek.week} (${journey.worstWeek.points})` : '-'} />
        <Cell label="Biggest Climb" value={journey.biggestSingleMatchClimb ? `+${journey.biggestSingleMatchClimb.delta}` : '-'} />
        <Cell label="Biggest Crash" value={journey.biggestSingleMatchCrash ? `${journey.biggestSingleMatchCrash.delta}` : '-'} />
      </div>
      <p className="mt-3 text-xs text-[var(--app-text-secondary)]">Longest climb streak: {journey.longestClimbStreak}</p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--app-border)] px-2 py-1.5">
      <p className="text-[var(--app-text-tertiary)]">{label}</p>
      <p className="text-[var(--app-text)] truncate">{value}</p>
    </div>
  );
}
