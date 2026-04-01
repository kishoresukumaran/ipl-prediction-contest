'use client';

interface TimingData {
  id: string;
  name: string;
  avgMinutesBefore: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return 'at the buzzer';
  if (minutes < 60) return `${Math.round(minutes)}m before`;
  if (minutes < 1440) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m before` : `${hrs}h before`;
  }
  const days = Math.floor(minutes / 1440);
  const hrs = Math.round((minutes % 1440) / 60);
  return hrs > 0 ? `${days}d ${hrs}h before` : `${days}d before`;
}

function getPanicEmoji(minutes: number): string {
  if (minutes < 5) return '🔥🔥🔥';
  if (minutes < 15) return '🔥🔥';
  if (minutes < 30) return '🔥';
  if (minutes < 60) return '😰';
  if (minutes < 120) return '😅';
  return '😌';
}

function getPanicLevel(minutes: number): string {
  if (minutes < 5) return 'EXTREME PANIC';
  if (minutes < 15) return 'Full Panic Mode';
  if (minutes < 30) return 'Sweating';
  if (minutes < 60) return 'Cutting it close';
  if (minutes < 120) return 'Kinda relaxed';
  return 'Zen master';
}

export function LastMinutePanicker({ data }: { data: TimingData[] }) {
  if (!data?.length) return <div className="text-slate-400 text-sm text-center py-10">No timing data yet</div>;

  const panickers = [...data]
    .filter(d => d.avgMinutesBefore > 0)
    .sort((a, b) => a.avgMinutesBefore - b.avgMinutesBefore)
    .slice(0, 10);

  if (panickers.length === 0) return <div className="text-slate-400 text-sm text-center py-10">No timing data yet</div>;

  const maxTime = Math.max(...panickers.map(d => d.avgMinutesBefore));

  return (
    <div className="space-y-2">
      {panickers.map((p, i) => (
        <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-500 text-white' : i === 2 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white font-medium">{p.name}</span>
              <span className="text-xs">{getPanicEmoji(p.avgMinutesBefore)}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.max(5, 100 - (p.avgMinutesBefore / maxTime) * 100)}%`,
                    backgroundColor: p.avgMinutesBefore < 30 ? '#ef4444' : p.avgMinutesBefore < 60 ? '#f97316' : '#eab308',
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">{getPanicLevel(p.avgMinutesBefore)}</span>
            </div>
          </div>
          <span className="text-xs text-red-400 font-mono shrink-0">{formatDuration(p.avgMinutesBefore)}</span>
        </div>
      ))}
    </div>
  );
}
