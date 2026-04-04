'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface TeamVoteData {
  team: string;
  teamName: string;
  color: string;
  textColor: string;
  total: number;
  correct: number;
  wrong: number;
  pending: number;
  winRate: number;
}

export function TeamVoteTotalsChart({ data }: { data: TeamVoteData[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
  }

  return (
    <div>
      <p className="text-xs text-[var(--app-text-secondary)] mb-3">
        <span className="text-emerald-400 font-medium">Solid</span> = correct pick &nbsp;·&nbsp;
        <span className="text-[var(--app-text-tertiary)] font-medium">Faded</span> = wrong pick &nbsp;·&nbsp;
        <span className="text-blue-400 font-medium">Blue</span> = pending
      </p>
      <div className="w-full h-[440px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 52, left: 10, bottom: 5 }} barSize={22} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis type="number" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <YAxis
              dataKey="team"
              type="category"
              width={72}
              stroke="none"
              tick={(props: { x: string | number; y: string | number; payload: { value: string } }) => {
                const x = Number(props.x);
                const y = Number(props.y);
                const entry = data.find(d => d.team === props.payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={-6} textAnchor="end" dominantBaseline="middle" fontSize={11} fontWeight={700} fill={chartTheme.axis}>
                      {props.payload.value}
                    </text>
                    <text x={0} y={9} textAnchor="end" dominantBaseline="middle" fontSize={9} fill={chartTheme.label}>
                      {entry?.total} votes
                    </text>
                  </g>
                );
              }}
              interval={0}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as TeamVoteData;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-3 text-xs text-[var(--app-text)] shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                      <p className="font-bold">{d.teamName}</p>
                    </div>
                    <p>Total votes: <span className="font-semibold">{d.total}</span></p>
                    <p className="text-emerald-400">Correct: {d.correct}</p>
                    <p className="text-red-400">Wrong: {d.wrong}</p>
                    {d.pending > 0 && <p className="text-blue-400">Pending: {d.pending}</p>}
                    <p className="text-[var(--app-text-secondary)] mt-1.5 font-semibold border-t border-[var(--app-border)] pt-1.5">
                      {d.winRate.toFixed(0)}% win rate
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="correct" stackId="a" name="Correct">
              {data.map(entry => (
                <Cell key={`c-${entry.team}`} fill={entry.color} fillOpacity={1} />
              ))}
            </Bar>
            <Bar dataKey="wrong" stackId="a" name="Wrong">
              {data.map(entry => (
                <Cell key={`w-${entry.team}`} fill={entry.color} fillOpacity={chartTheme.isDark ? 0.3 : 0.25} />
              ))}
            </Bar>
            <Bar dataKey="pending" stackId="a" name="Pending" radius={[0, 4, 4, 0]}>
              {data.map(entry => (
                <Cell key={`p-${entry.team}`} fill="#3b82f6" fillOpacity={0.4} />
              ))}
              <LabelList
                dataKey="winRate"
                position="right"
                formatter={(v: unknown) => `${Number(v).toFixed(0)}%`}
                style={{ fontSize: 10, fontWeight: 700, fill: chartTheme.label }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
