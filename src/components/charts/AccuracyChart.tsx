'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AccuracyData {
  id: string;
  name: string;
  accuracy: number;
  correct: number;
  total: number;
}

export function AccuracyChart({ data }: { data: AccuracyData[] }) {
  if (!data?.length) return <EmptyState />;

  const sorted = [...data].sort((a, b) => b.accuracy - a.accuracy);
  const maxAcc = Math.max(...sorted.map(d => d.accuracy));

  const chartHeight = Math.max(500, sorted.length * 28);

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} unit="%" />
          <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Accuracy']}
            labelFormatter={(name) => {
              const player = sorted.find(d => d.name === name);
              return player ? `${name} (${player.correct}/${player.total})` : String(name);
            }}
          />
          <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
            {sorted.map((entry) => (
              <Cell
                key={entry.id}
                fill={getAccuracyColor(entry.accuracy, maxAcc)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function getAccuracyColor(accuracy: number, max: number): string {
  const ratio = max > 0 ? accuracy / max : 0;
  if (ratio > 0.8) return '#22c55e';
  if (ratio > 0.6) return '#84cc16';
  if (ratio > 0.4) return '#eab308';
  if (ratio > 0.2) return '#f97316';
  return '#ef4444';
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
}
