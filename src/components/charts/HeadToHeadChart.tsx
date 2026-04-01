'use client';

import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import { PARTICIPANTS } from '@/lib/constants';
import { PlayerPointsBreakdown } from '@/lib/types';
import { useChartTheme } from '@/hooks/useChartTheme';

export function HeadToHeadChart({ leaderboard }: { leaderboard: PlayerPointsBreakdown[] }) {
  const chartTheme = useChartTheme();
  const [player1, setPlayer1] = useState(PARTICIPANTS[0]?.id || '');
  const [player2, setPlayer2] = useState(PARTICIPANTS[1]?.id || '');

  if (!leaderboard?.length) return <EmptyState />;

  const p1Data = leaderboard.find(p => p.participantId === player1);
  const p2Data = leaderboard.find(p => p.participantId === player2);

  if (!p1Data || !p2Data) return <EmptyState />;

  const maxPoints = Math.max(p1Data.totalPoints, p2Data.totalPoints) || 1;
  const maxAcc = Math.max(p1Data.accuracy, p2Data.accuracy) || 1;
  const maxStreak = Math.max(p1Data.longestStreak, p2Data.longestStreak) || 1;
  const maxCorrect = Math.max(p1Data.correctPredictions, p2Data.correctPredictions) || 1;

  const radarData = [
    { metric: 'Points', p1: (p1Data.totalPoints / maxPoints) * 100, p2: (p2Data.totalPoints / maxPoints) * 100 },
    { metric: 'Accuracy', p1: p1Data.accuracy, p2: p2Data.accuracy },
    { metric: 'Streak', p1: (p1Data.longestStreak / maxStreak) * 100, p2: (p2Data.longestStreak / maxStreak) * 100 },
    { metric: 'Correct', p1: (p1Data.correctPredictions / maxCorrect) * 100, p2: (p2Data.correctPredictions / maxCorrect) * 100 },
    { metric: 'Bonuses', p1: maxPoints > 0 ? ((p1Data.totalPoints - p1Data.basePoints) / maxPoints) * 100 : 0, p2: maxPoints > 0 ? ((p2Data.totalPoints - p2Data.basePoints) / maxPoints) * 100 : 0 },
  ];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={player1}
          onChange={e => setPlayer1(e.target.value)}
          className="bg-blue-900/50 border border-blue-500/30 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          {PARTICIPANTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-[var(--app-text-secondary)] self-center text-sm">vs</span>
        <select
          value={player2}
          onChange={e => setPlayer2(e.target.value)}
          className="bg-red-900/50 border border-red-500/30 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          {PARTICIPANTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats comparison */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
        <div className="text-blue-400 font-bold">{p1Data.participantName}</div>
        <div className="text-[var(--app-text-tertiary)]">vs</div>
        <div className="text-red-400 font-bold">{p2Data.participantName}</div>

        <div className="text-blue-300">{p1Data.totalPoints}</div>
        <div className="text-[var(--app-text-tertiary)] text-xs">Points</div>
        <div className="text-red-300">{p2Data.totalPoints}</div>

        <div className="text-blue-300">{p1Data.accuracy.toFixed(1)}%</div>
        <div className="text-[var(--app-text-tertiary)] text-xs">Accuracy</div>
        <div className="text-red-300">{p2Data.accuracy.toFixed(1)}%</div>

        <div className="text-blue-300">{p1Data.longestStreak}</div>
        <div className="text-[var(--app-text-tertiary)] text-xs">Best Streak</div>
        <div className="text-red-300">{p2Data.longestStreak}</div>

        <div className="text-blue-300">{p1Data.correctPredictions}/{p1Data.totalPredictions}</div>
        <div className="text-[var(--app-text-tertiary)] text-xs">Correct</div>
        <div className="text-red-300">{p2Data.correctPredictions}/{p2Data.totalPredictions}</div>
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke={chartTheme.grid} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: chartTheme.label, fontSize: 11 }} />
            <PolarRadiusAxis tick={false} domain={[0, 100]} />
            <Radar name={p1Data.participantName} dataKey="p1" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} />
            <Radar name={p2Data.participantName} dataKey="p2" stroke="#f87171" fill="#f87171" fillOpacity={0.2} />
            <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tooltipText }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
