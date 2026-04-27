'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';

interface JourneyItem {
  participantId: string;
  participantName: string;
  rankHistory: Array<{ matchId: number; rank: number }>;
  bestWeek: { week: string; points: number } | null;
  worstWeek: { week: string; points: number } | null;
  longestClimbStreak: number;
  biggestSingleMatchClimb: { delta: number; matchId: number } | null;
  biggestSingleMatchCrash: { delta: number; matchId: number } | null;
}

export function PersonalBestGrid({ data }: { data: JourneyItem[] }) {
  if (!data?.length) return <div className="text-sm text-[var(--app-text-secondary)]">No journey data yet.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((item) => {
        const participant = PARTICIPANTS.find((p) => p.id === item.participantId);
        return (
          <div key={item.participantId} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: participant?.avatar_color || '#666' }} />
              <p className="text-sm font-semibold text-[var(--app-text)]">{item.participantName}</p>
            </div>

            <div className="h-[70px] mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={item.rankHistory}>
                  <Line type="monotone" dataKey="rank" stroke={participant?.avatar_color || '#8884d8'} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <Cell label="Best Week" value={item.bestWeek ? `${item.bestWeek.week} (+${item.bestWeek.points})` : '-'} />
              <Cell label="Worst Week" value={item.worstWeek ? `${item.worstWeek.week} (${item.worstWeek.points})` : '-'} />
              <Cell label="Biggest Climb" value={item.biggestSingleMatchClimb ? `+${item.biggestSingleMatchClimb.delta}` : '-'} />
              <Cell label="Biggest Crash" value={item.biggestSingleMatchCrash ? `${item.biggestSingleMatchCrash.delta}` : '-'} />
            </div>
            <p className="mt-2 text-[10px] text-[var(--app-text-tertiary)]">Longest climb streak: {item.longestClimbStreak}</p>
          </div>
        );
      })}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--app-border)] px-2 py-1">
      <p className="text-[var(--app-text-tertiary)]">{label}</p>
      <p className="text-[var(--app-text-secondary)] truncate">{value}</p>
    </div>
  );
}
