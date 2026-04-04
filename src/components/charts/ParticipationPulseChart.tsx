'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { TEAMS } from '@/lib/constants';

interface ParticipationData {
  matchId: number;
  matchLabel: string;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  voterCount: number;
  totalParticipants: number;
  rate: number;
  runningAvg: number;
}

export function ParticipationPulseChart({ data }: { data: ParticipationData[] }) {
  const chartTheme = useChartTheme();

  if (!data?.length) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
  }

  const avgRate = data.reduce((sum, d) => sum + d.rate, 0) / data.length;
  const minEntry = data.reduce((min, d) => d.rate < min.rate ? d : min, data[0]);
  const maxEntry = data.reduce((max, d) => d.rate > max.rate ? d : max, data[0]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-xs">
        <div className="bg-[var(--app-surface-alt)] rounded-lg px-3 py-2">
          <span className="text-[var(--app-text-tertiary)]">Average</span>
          <p className="text-base font-bold text-[var(--app-text)]">{avgRate.toFixed(1)}%</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <span className="text-emerald-400">Best</span>
          <p className="text-base font-bold text-emerald-400">{maxEntry.rate.toFixed(0)}%</p>
          <p className="text-[10px] text-[var(--app-text-tertiary)]">#{maxEntry.matchId} {maxEntry.homeTeam} v {maxEntry.awayTeam}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <span className="text-red-400">Worst</span>
          <p className="text-base font-bold text-red-400">{minEntry.rate.toFixed(0)}%</p>
          <p className="text-[10px] text-[var(--app-text-tertiary)]">#{minEntry.matchId} {minEntry.homeTeam} v {minEntry.awayTeam}</p>
        </div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="participationGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis
              dataKey="matchLabel"
              stroke={chartTheme.axis}
              tick={{ fontSize: 9 }}
              interval={Math.max(0, Math.floor(data.length / 12) - 1)}
            />
            <YAxis
              domain={[0, 100]}
              stroke={chartTheme.axis}
              tick={{ fontSize: 11 }}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as ParticipationData;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl">
                    <p className="font-bold mb-1">
                      <span style={{ color: TEAMS[d.homeTeam]?.color }}>{d.homeTeam}</span>
                      {' vs '}
                      <span style={{ color: TEAMS[d.awayTeam]?.color }}>{d.awayTeam}</span>
                    </p>
                    <p className="text-[var(--app-text-tertiary)]">{d.matchDate} (Match #{d.matchId})</p>
                    <p className="text-amber-400 mt-1">{d.voterCount}/{d.totalParticipants} voted ({d.rate.toFixed(1)}%)</p>
                    <p className="text-blue-400">Running avg: {d.runningAvg.toFixed(1)}%</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={avgRate} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#participationGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b' }}
            />
            <Area
              type="monotone"
              dataKey="runningAvg"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-[var(--app-text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-amber-500 rounded" />
          <span>Participation rate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-blue-500 rounded border-dashed" style={{ borderTop: '1.5px dashed #3b82f6', height: 0 }} />
          <span>Running average</span>
        </div>
      </div>
    </div>
  );
}
