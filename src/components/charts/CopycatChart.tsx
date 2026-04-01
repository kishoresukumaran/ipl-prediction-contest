'use client';

import { useState } from 'react';
import { TEAMS } from '@/lib/constants';

interface CopyInstance {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  team: string;
  targetTime: string;
  copierTime: string;
  gapMinutes: number;
}

interface CopycatData {
  copier: string;
  copierName: string;
  copierColor: string;
  target: string;
  targetName: string;
  targetColor: string;
  count: number;
  matches: number;
  instances: CopyInstance[];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IE', {
    timeZone: 'Europe/Dublin',
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function CopycatChart({ data }: { data: CopycatData[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!data?.length) return (
    <div className="text-center py-8">
      <p className="text-slate-500 text-sm">No copycat patterns detected yet.</p>
      <p className="text-slate-600 text-xs mt-1">Need more matches with timestamps to find the copycats</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {data.map((pair, i) => {
        const key = `${pair.copier}-${pair.target}`;
        const isExpanded = expanded === key;

        return (
          <div key={key}>
            <div
              onClick={() => setExpanded(isExpanded ? null : key)}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors ${
                isExpanded ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-purple-500 text-white' : i === 1 ? 'bg-purple-400 text-white' : i === 2 ? 'bg-purple-300 text-black' : 'bg-white/10 text-slate-400'
              }`}>
                {i + 1}
              </span>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: pair.copierColor }}>
                  {pair.copierName.charAt(0)}
                </div>
                <span className="text-sm text-white font-medium truncate">{pair.copierName}</span>
                <span className="text-slate-500 text-xs shrink-0">copies</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: pair.targetColor }}>
                  {pair.targetName.charAt(0)}
                </div>
                <span className="text-sm text-white font-medium truncate">{pair.targetName}</span>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <span className="text-purple-400 text-sm font-bold">{pair.count}x</span>
                <span className="text-slate-500 text-[10px]">/ {pair.matches}</span>
                <span className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {isExpanded && pair.instances && (
              <div className="ml-9 mt-1 mb-2 space-y-1.5">
                <p className="text-[10px] text-slate-500 px-3 mb-2">Evidence: voted after {pair.targetName} within 60 min, picked the same team</p>
                {pair.instances.map((inst, j) => {
                  const teamConfig = TEAMS[inst.team];
                  return (
                    <div key={j} className="bg-white/[0.03] rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-white font-medium">Match #{inst.matchId}: {inst.homeTeam} vs {inst.awayTeam}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: teamConfig?.color || '#666', color: teamConfig?.textColor || '#fff' }}
                        >
                          Both picked {inst.team}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <div>
                          <span className="text-slate-500">{pair.targetName} voted: </span>
                          <span className="text-emerald-400">{formatTime(inst.targetTime)}</span>
                        </div>
                        <span className="text-slate-600">→</span>
                        <div>
                          <span className="text-slate-500">{pair.copierName} voted: </span>
                          <span className="text-purple-400">{formatTime(inst.copierTime)}</span>
                        </div>
                        <span className="text-red-400 font-mono ml-auto">{inst.gapMinutes}m later</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
