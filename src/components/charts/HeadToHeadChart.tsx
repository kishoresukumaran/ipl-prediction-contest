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
          className="bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-500/30 rounded-lg px-3 py-1.5 text-sm text-blue-800 dark:text-white font-medium"
        >
          {PARTICIPANTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="text-[var(--app-text-secondary)] self-center text-sm font-medium">vs</span>
        <select
          value={player2}
          onChange={e => setPlayer2(e.target.value)}
          className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-500/30 rounded-lg px-3 py-1.5 text-sm text-red-800 dark:text-white font-medium"
        >
          {PARTICIPANTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Stats comparison */}
      <div className="grid grid-cols-3 gap-y-3 mb-4 text-center text-sm">
        <div className="text-blue-600 dark:text-blue-400 font-bold">{p1Data.participantName}</div>
        <div className="text-[var(--app-text-tertiary)] font-medium">vs</div>
        <div className="text-red-600 dark:text-red-400 font-bold">{p2Data.participantName}</div>

        {[
          { p1: p1Data.totalPoints, label: 'Points', p2: p2Data.totalPoints },
          { p1: `${p1Data.accuracy.toFixed(1)}%`, label: 'Accuracy', p2: `${p2Data.accuracy.toFixed(1)}%` },
          { p1: p1Data.longestStreak, label: 'Best Streak', p2: p2Data.longestStreak },
          { p1: `${p1Data.correctPredictions}/${p1Data.totalPredictions}`, label: 'Correct', p2: `${p2Data.correctPredictions}/${p2Data.totalPredictions}` },
        ].map(({ p1, label, p2 }) => {
          const p1Num = parseFloat(String(p1));
          const p2Num = parseFloat(String(p2));
          const p1Wins = !isNaN(p1Num) && !isNaN(p2Num) && p1Num > p2Num;
          const p2Wins = !isNaN(p1Num) && !isNaN(p2Num) && p2Num > p1Num;
          return (
            <>
              <div className={`text-blue-600 dark:text-blue-300 font-semibold ${p1Wins ? 'text-base' : 'opacity-80'}`}>{p1}</div>
              <div className="text-[var(--app-text-tertiary)] text-xs self-center">{label}</div>
              <div className={`text-red-600 dark:text-red-300 font-semibold ${p2Wins ? 'text-base' : 'opacity-80'}`}>{p2}</div>
            </>
          );
        })}
      </div>

      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke={chartTheme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'} />
            <PolarAngleAxis dataKey="metric" tick={{ fill: chartTheme.axis, fontSize: 12, fontWeight: 600 }} />
            <PolarRadiusAxis tick={false} domain={[0, 100]} />
            <Radar name={p1Data.participantName} dataKey="p1" stroke={chartTheme.isDark ? '#60a5fa' : '#2563eb'} strokeWidth={2} fill={chartTheme.isDark ? '#60a5fa' : '#3b82f6'} fillOpacity={chartTheme.isDark ? 0.25 : 0.35} />
            <Radar name={p2Data.participantName} dataKey="p2" stroke={chartTheme.isDark ? '#f87171' : '#dc2626'} strokeWidth={2} fill={chartTheme.isDark ? '#f87171' : '#ef4444'} fillOpacity={chartTheme.isDark ? 0.25 : 0.35} />
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
