'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import { PARTICIPANTS } from '@/lib/constants';
import { useChartTheme } from '@/hooks/useChartTheme';

interface FormData {
  matchId: number;
  [playerId: string]: number | string;
}

export function FormChart({ data }: { data: FormData[] }) {
  const chartTheme = useChartTheme();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(
    PARTICIPANTS.slice(0, 5).map(p => p.id)
  );

  if (!data?.length) return <EmptyState />;

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-3">
        {PARTICIPANTS.map(p => (
          <button
            key={p.id}
            onClick={() => togglePlayer(p.id)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
              selectedPlayers.includes(p.id)
                ? 'text-black font-bold'
                : 'bg-[var(--app-surface)] text-[var(--app-text-tertiary)] hover:bg-[var(--app-surface-alt)]'
            }`}
            style={selectedPlayers.includes(p.id) ? { backgroundColor: p.avatar_color } : {}}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="w-full h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
            <XAxis dataKey="matchId" stroke={chartTheme.axis} tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} stroke={chartTheme.axis} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: '8px', color: chartTheme.tooltipText, fontSize: 11 }}
              labelFormatter={(v) => `After Match #${v}`}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
            />
            {selectedPlayers.map(id => {
              const p = PARTICIPANTS.find(pp => pp.id === id);
              if (!p) return null;
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={p.name}
                  stroke={p.avatar_color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No form data yet</div>;
}
