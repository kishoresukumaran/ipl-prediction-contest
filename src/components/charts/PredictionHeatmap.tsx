'use client';

import { useState } from 'react';
import { TEAMS } from '@/lib/constants';

interface HeatmapData {
  participants: { id: string; name: string }[];
  matches: { id: number; home_team: string; away_team: string }[];
  predictions: Record<string, Record<number, { predicted: string; correct: boolean | null }>>;
}

export function PredictionHeatmap({ data }: { data: HeatmapData }) {
  const [sortBy, setSortBy] = useState<'name' | 'accuracy'>('accuracy');

  if (!data?.participants?.length || !data?.matches?.length) {
    return <div className="flex items-center justify-center h-[300px] text-slate-400 text-sm">No data yet</div>;
  }

  const sortedParticipants = [...data.participants].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    const accA = getAccuracy(a.id, data);
    const accB = getAccuracy(b.id, data);
    return accB - accA;
  });

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setSortBy('accuracy')}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${sortBy === 'accuracy' ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-300'}`}
        >
          By Accuracy
        </button>
        <button
          onClick={() => setSortBy('name')}
          className={`text-xs px-3 py-1 rounded-full transition-colors ${sortBy === 'name' ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-300'}`}
        >
          By Name
        </button>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[600px]">
          {/* Match numbers header */}
          <div className="flex items-center mb-1">
            <div className="w-20 shrink-0" />
            {data.matches.map(m => (
              <div key={m.id} className="w-6 shrink-0 text-center text-[8px] text-slate-500">
                {m.id}
              </div>
            ))}
          </div>

          {/* Rows */}
          {sortedParticipants.map(p => (
            <div key={p.id} className="flex items-center mb-0.5">
              <div className="w-20 shrink-0 text-[10px] text-slate-300 truncate pr-1">
                {p.name}
              </div>
              {data.matches.map(m => {
                const pred = data.predictions[p.id]?.[m.id];
                let bgColor = 'bg-slate-800'; // no prediction
                if (pred) {
                  if (pred.correct === true) bgColor = 'bg-emerald-500';
                  else if (pred.correct === false) bgColor = 'bg-red-500';
                  else bgColor = 'bg-amber-500/50'; // pending
                }
                return (
                  <div
                    key={m.id}
                    className={`w-6 h-5 shrink-0 ${bgColor} border border-slate-700/50 rounded-[2px] mx-[1px] transition-transform hover:scale-150 hover:z-10 cursor-pointer`}
                    title={`${p.name} - Match #${m.id}: ${pred ? `Picked ${pred.predicted}${pred.correct === true ? ' ✓' : pred.correct === false ? ' ✗' : ' (pending)'}` : 'No prediction'}`}
                  />
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex gap-4 mt-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm" /> Correct</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm" /> Wrong</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500/50 rounded-sm" /> Pending</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-800 rounded-sm" /> None</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAccuracy(participantId: string, data: HeatmapData): number {
  const preds = data.predictions[participantId];
  if (!preds) return 0;
  const entries = Object.values(preds).filter(p => p.correct !== null);
  if (entries.length === 0) return 0;
  return entries.filter(p => p.correct).length / entries.length;
}
