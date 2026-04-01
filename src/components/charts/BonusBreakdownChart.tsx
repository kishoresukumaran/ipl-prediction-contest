'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { PlayerPointsBreakdown } from '@/lib/types';
import { useChartTheme } from '@/hooks/useChartTheme';

const CATEGORIES = [
  { key: 'Base', fill: '#60a5fa' },
  { key: 'Power', fill: '#f59e0b' },
  { key: 'Underdog', fill: '#34d399' },
  { key: 'Joker', fill: '#a78bfa' },
  { key: 'Double Header', fill: '#fb7185' },
  { key: 'Streak', fill: '#38bdf8' },
  { key: 'Trivia', fill: '#4ade80' },
  { key: 'Bonus', fill: '#fbbf24' },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SegmentLabel(props: any) {
  const x = Number(props.x) || 0;
  const y = Number(props.y) || 0;
  const width = Number(props.width) || 0;
  const height = Number(props.height) || 0;
  const value = Number(props.value) || 0;
  if (!value || width < 20) return null;
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={10}
      fontWeight="bold"
      fill="#fff"
      stroke="rgba(0,0,0,0.45)"
      strokeWidth={2.5}
      paintOrder="stroke"
    >
      {value}
    </text>
  );
}

export function BonusBreakdownChart({ data }: { data: PlayerPointsBreakdown[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length) return <EmptyState />;

  const chartData = data
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map(p => ({
      name: p.participantName,
      Base: p.basePoints,
      Power: p.powerMatchPoints,
      Underdog: p.underdogBonus,
      Joker: p.jokerBonus,
      'Double Header': p.doubleHeaderBonus,
      Streak: p.streakBonus,
      Trivia: p.triviaPoints,
      Bonus: p.bonusPoints,
    }));

  return (
    <div className="w-full" style={{ height: Math.max(500, chartData.length * 28) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
          <XAxis type="number" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
          <YAxis dataKey="name" type="category" width={90} stroke={chartTheme.axis} tick={{ fontSize: 11 }} interval={0} />
          <Tooltip contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: '8px', color: chartTheme.tooltipText }} />
          <Legend wrapperStyle={{ fontSize: 11, color: chartTheme.label }} />
          {CATEGORIES.map(cat => (
            <Bar key={cat.key} dataKey={cat.key} stackId="a" fill={cat.fill}>
              <LabelList dataKey={cat.key} position="center" content={SegmentLabel} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
