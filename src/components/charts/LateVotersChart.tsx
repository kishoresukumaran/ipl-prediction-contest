'use client';

import { useState } from 'react';
import { AlarmClock } from 'lucide-react';

interface LateMatch {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  minutesLate: number;
}

interface LateVoterData {
  id: string;
  name: string;
  color: string;
  lateCount: number;
  matches: LateMatch[];
}

function formatMinutesLate(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export function LateVotersChart({ data }: { data: LateVoterData[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data?.length) return (
    <div className="text-center py-8">
      <p className="text-[var(--app-text-tertiary)] text-sm">No late voters so far!</p>
      <p className="text-[var(--app-text-tertiary)] text-xs mt-1">Everyone&apos;s been on time. Impressive.</p>
    </div>
  );

  const maxLate = data[0]?.lateCount || 1;

  return (
    <div className="space-y-2">
      {data.map((voter, i) => {
        const isExpanded = expanded === voter.id;
        const barWidth = (voter.lateCount / maxLate) * 100;

        return (
          <div key={voter.id}>
            <div
              onClick={() => setExpanded(isExpanded ? null : voter.id)}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors ${
                isExpanded ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-[var(--app-surface)] hover:bg-[var(--app-surface-alt)]'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-orange-500 text-white' : i === 1 ? 'bg-orange-400 text-white' : i === 2 ? 'bg-orange-300 text-black' : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]'
              }`}>
                {i + 1}
              </span>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: voter.color }}>
                {voter.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--app-text)] font-medium truncate">{voter.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <AlarmClock className="h-3 w-3 text-orange-400" />
                    <span className="text-orange-400 text-sm font-bold">{voter.lateCount}</span>
                    <span className="text-[var(--app-text-tertiary)] text-[10px]">late</span>
                    <span className="text-[var(--app-text-tertiary)] text-xs ml-1">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--app-surface-alt)] rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="ml-9 mt-1 mb-2 space-y-1.5">
                <p className="text-[10px] text-[var(--app-text-tertiary)] px-3 mb-2">
                  Voted after the match started — prediction doesn&apos;t count for points
                </p>
                {voter.matches.map((m) => (
                  <div key={m.matchId} className="bg-[var(--app-surface)] rounded-lg px-3 py-2 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[var(--app-text)] font-medium">Match #{m.matchId}: </span>
                      <span className="text-[var(--app-text-secondary)]">{m.homeTeam} vs {m.awayTeam}</span>
                    </div>
                    <span className="text-orange-400 font-mono font-bold shrink-0">
                      +{formatMinutesLate(m.minutesLate)} late
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
