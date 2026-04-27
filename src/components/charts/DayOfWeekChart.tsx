'use client';

interface DayCell {
  day: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface DayOfWeekEntry {
  participantId: string;
  participantName: string;
  values: DayCell[];
}

const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

function isDayCellArray(data: DayOfWeekEntry[] | DayCell[]): data is DayCell[] {
  return data.length > 0 && Object.prototype.hasOwnProperty.call(data[0], 'day');
}

export function DayOfWeekChart({
  data,
  playerId,
}: {
  data: DayOfWeekEntry[] | DayCell[];
  playerId?: string;
}) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <div className="text-sm text-[var(--app-text-secondary)]">No day-of-week data yet.</div>;
  }

  if (playerId) {
    const scoped = isDayCellArray(data) ? data : [];
    return <PlayerDayBars values={scoped} />;
  }

  const rows = data as DayOfWeekEntry[];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {rows.map((row) => (
        <div key={row.participantId} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-2.5">
          <p className="text-xs font-semibold text-[var(--app-text)] mb-2">{row.participantName}</p>
          <MiniBars values={row.values} />
        </div>
      ))}
    </div>
  );
}

function PlayerDayBars({ values }: { values: DayCell[] }) {
  return (
    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-3">
      <p className="text-sm font-semibold text-[var(--app-text)] mb-2">Day-of-Week Performance</p>
      <MiniBars values={values} />
    </div>
  );
}

function MiniBars({ values }: { values: DayCell[] }) {
  return (
    <div className="space-y-1.5">
      {values.map((item) => (
        <div key={item.day}>
          <div className="flex items-center justify-between text-[10px] text-[var(--app-text-tertiary)] mb-0.5">
            <span>{DAY_SHORT[item.day] || item.day.slice(0, 3)}</span>
            <span>{item.accuracy.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded bg-[var(--app-surface-alt)] overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${item.accuracy}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
