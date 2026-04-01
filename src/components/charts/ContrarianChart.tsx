'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';

interface ContrarianData {
  name: string;
  contrarianPct: number;
  contrarianAccuracy: number;
  color: string;
}

export function ContrarianChart({ data }: { data: ContrarianData[] }) {
  const chartTheme = useChartTheme();
  if (!data?.length) return <EmptyState />;

  return (
    <div>
      <p className="text-xs text-[var(--app-text-secondary)] mb-2">X = How often they go against the majority. Y = Their accuracy on contrarian picks.</p>
      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis type="number" dataKey="contrarianPct" domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} unit="%" name="Contrarian %" />
            <YAxis type="number" dataKey="contrarianAccuracy" domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} unit="%" name="Accuracy %" />
            <Tooltip
              contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: '8px', color: chartTheme.tooltipText }}
              formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name === 'contrarianPct' ? 'Goes Against Crowd' : 'Contrarian Accuracy']}
              labelFormatter={() => ''}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as ContrarianData;
                return (
                  <div className="bg-white dark:bg-slate-800 border border-[var(--app-border)] rounded-lg p-2 text-xs text-[var(--app-text)]">
                    <p className="font-bold">{d.name}</p>
                    <p>Against crowd: {d.contrarianPct.toFixed(1)}%</p>
                    <p>Contrarian accuracy: {d.contrarianAccuracy.toFixed(1)}%</p>
                  </div>
                );
              }}
            />
            <ReferenceLine y={50} stroke={chartTheme.axis} strokeDasharray="5 5" />
            <ReferenceLine x={50} stroke={chartTheme.axis} strokeDasharray="5 5" />
            <Scatter data={data} fill="#8884d8">
              {data.map((entry, i) => (
                <circle key={i} fill={entry.color} r={6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
