'use client';

import { useState } from 'react';
import { TEAMS } from '@/lib/constants';

interface VoteSplitData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homePicks: number;
  awayPicks: number;
  totalVotes: number;
  consensusPct: number;
  majorityTeam: string;
  majorityCorrect: boolean;
  winner: string | null;
}

type SortMode = 'consensus' | 'divided';

export function VoteSplitChart({ data }: { data: VoteSplitData[] }) {
  const [sortMode, setSortMode] = useState<SortMode>('consensus');

  if (!data?.length) {
    return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
  }

  const sorted = [...data].sort((a, b) =>
    sortMode === 'consensus' ? b.consensusPct - a.consensusPct : a.consensusPct - b.consensusPct
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--app-text-tertiary)]">Sort:</span>
        {(['consensus', 'divided'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
              sortMode === mode
                ? 'bg-amber-500 text-black font-medium'
                : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)] hover:text-[var(--app-text)]'
            }`}
          >
            {mode === 'consensus' ? 'Most Unanimous' : 'Most Divided'}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {sorted.map(match => {
          const homeColor = TEAMS[match.homeTeam]?.color || '#666';
          const awayColor = TEAMS[match.awayTeam]?.color || '#666';
          const homePct = match.totalVotes > 0 ? (match.homePicks / match.totalVotes) * 100 : 50;
          const awayPct = 100 - homePct;

          return (
            <div key={match.matchId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--app-surface-alt)] transition-colors">
              <span className="text-[10px] text-[var(--app-text-tertiary)] w-7 text-right shrink-0">#{match.matchId}</span>

              <div className="w-10 text-right shrink-0">
                <span className="text-xs font-bold" style={{ color: homeColor }}>{match.homeTeam}</span>
              </div>
              <span className="text-[10px] text-[var(--app-text-tertiary)] shrink-0">{match.homePicks}</span>

              <div className="flex-1 h-5 rounded-full overflow-hidden flex bg-[var(--app-surface-alt)]">
                <div
                  className="h-full flex items-center justify-end pr-1 transition-all duration-300"
                  style={{ width: `${homePct}%`, backgroundColor: homeColor, opacity: 0.8 }}
                >
                  {homePct >= 15 && (
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">{homePct.toFixed(0)}%</span>
                  )}
                </div>
                <div
                  className="h-full flex items-center justify-start pl-1 transition-all duration-300"
                  style={{ width: `${awayPct}%`, backgroundColor: awayColor, opacity: 0.8 }}
                >
                  {awayPct >= 15 && (
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">{awayPct.toFixed(0)}%</span>
                  )}
                </div>
              </div>

              <span className="text-[10px] text-[var(--app-text-tertiary)] shrink-0">{match.awayPicks}</span>
              <div className="w-10 shrink-0">
                <span className="text-xs font-bold" style={{ color: awayColor }}>{match.awayTeam}</span>
              </div>

              {match.winner && (
                <span className={`text-[10px] shrink-0 rounded-full px-1.5 py-0.5 font-medium ${
                  match.majorityCorrect
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {match.majorityCorrect ? 'Crowd right' : 'Upset'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
