'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface PlayerBias {
  name: string;
  color: string;
  homePicks: number;
  awayPicks: number;
  total: number;
  homeBias: number;
}

interface HomeAwayData {
  players: PlayerBias[];
  groupAvg: number;
}

export function HomeAwayBiasChart({ data }: { data: HomeAwayData }) {
  const chartTheme = useChartTheme();

  if (!data?.players?.length) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
  }

  const chartData = data.players.filter(p => p.total > 0);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--app-text-secondary)]">
        Dashed line = group average ({data.groupAvg.toFixed(0)}% home picks).
        Higher % means more likely to back the home team.
      </p>

      <div className="w-full" style={{ height: Math.max(500, chartData.length * 26) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 50, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke={chartTheme.axis}
              tick={{ fontSize: 11 }}
              tickFormatter={v => `${v}%`}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={90}
              stroke={chartTheme.axis}
              tick={{ fontSize: 11 }}
              interval={0}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as PlayerBias;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2.5 text-xs text-[var(--app-text)] shadow-xl">
                    <p className="font-bold">{d.name}</p>
                    <p className="text-orange-400">Home picks: {d.homePicks} ({d.homeBias.toFixed(1)}%)</p>
                    <p className="text-blue-400">Away picks: {d.awayPicks} ({(100 - d.homeBias).toFixed(1)}%)</p>
                    <p className="text-[var(--app-text-tertiary)] mt-1">Total votes: {d.total}</p>
                  </div>
                );
              }}
            />
            <ReferenceLine x={data.groupAvg} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
            <ReferenceLine x={50} stroke={chartTheme.grid} strokeWidth={1} />
            <Bar dataKey="homeBias" name="Home Bias %" radius={[0, 6, 6, 0]}>
              {chartData.map(entry => {
                const deviation = Math.abs(entry.homeBias - 50);
                const opacity = 0.5 + (deviation / 50) * 0.5;
                return (
                  <Cell
                    key={entry.name}
                    fill={entry.homeBias > 50 ? '#f97316' : '#3b82f6'}
                    fillOpacity={opacity}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-[var(--app-text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-500/60" />
          <span>Home-biased</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-500/60" />
          <span>Away-biased</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-0.5" style={{ borderTop: '1.5px dashed #f59e0b' }} />
          <span>Group average</span>
        </div>
      </div>
    </div>
  );
}
