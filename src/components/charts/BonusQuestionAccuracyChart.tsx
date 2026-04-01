'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BonusAccuracyData {
  name: string;
  correct: number;
  total: number;
  accuracy: number;
  points: number;
  color: string;
}

export function BonusQuestionAccuracyChart({ data }: { data: BonusAccuracyData[] }) {
  if (!data?.length || data.every(d => d.total === 0)) {
    return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No bonus question data yet</div>;
  }

  const filtered = data.filter(d => d.total > 0).sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-amber-400">{filtered.length > 0 ? filtered[0].name : '-'}</div>
          <div className="text-[10px] text-slate-400">Best Accuracy</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">
            {filtered.reduce((max, d) => d.correct > max ? d.correct : max, 0)}
          </div>
          <div className="text-[10px] text-slate-400">Most Correct</div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {filtered.reduce((max, d) => d.points > max ? d.points : max, 0)}
          </div>
          <div className="text-[10px] text-slate-400">Most Bonus Pts</div>
        </div>
      </div>

      <div className="w-full" style={{ height: Math.max(500, filtered.length * 28) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filtered} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} unit="%" />
            <YAxis dataKey="name" type="category" width={90} stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} interval={0} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload as BonusAccuracyData;
                return (
                  <div className="bg-slate-800 border border-white/10 rounded-lg p-2.5 text-xs text-white">
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-amber-400">Accuracy: {d.accuracy.toFixed(0)}%</p>
                    <p className="text-slate-300">Correct: {d.correct}/{d.total}</p>
                    <p className="text-emerald-400">Bonus points earned: {d.points}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="accuracy" name="Bonus Accuracy" radius={[0, 6, 6, 0]}>
              {filtered.map((entry) => (
                <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
