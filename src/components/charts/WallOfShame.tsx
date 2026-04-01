'use client';

import { TEAMS } from '@/lib/constants';

interface WallOfShameData {
  wastedJokers: { name: string; matchId: number; homeTeam: string; awayTeam: string; picked: string; winner: string; color: string }[];
  jinxers: { name: string; pickedFavorite: number; favoriteWon: number; favoriteLost: number; jinxRate: number; color: string }[];
  losingStreaks: { name: string; currentLosingStreak: number; longestLosingStreak: number; color: string }[];
}

export function WallOfShame({ data }: { data: WallOfShameData }) {
  if (!data) return <div className="text-slate-400 text-sm text-center py-10">No data yet</div>;

  return (
    <div className="space-y-6">
      {/* Wasted Jokers - The Clown Car */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          <span className="text-2xl">🤡</span> The Clown Car
        </h3>
        <p className="text-xs text-slate-400 mb-4">Confidently played the +10 Joker... and lost</p>

        {data.wastedJokers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-500 text-sm">No wasted jokers yet. Everyone&apos;s playing it safe...</p>
            <p className="text-slate-600 text-xs mt-1">Or maybe they&apos;re just smart</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.wastedJokers.map((j, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0" style={{ backgroundColor: j.color }}>
                  {j.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{j.name}</p>
                  <p className="text-slate-400 text-xs">
                    Match #{j.matchId}:
                    <span className="mx-1" style={{ color: TEAMS[j.homeTeam]?.color }}>{j.homeTeam}</span>
                    vs
                    <span className="mx-1" style={{ color: TEAMS[j.awayTeam]?.color }}>{j.awayTeam}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-red-400 text-xs">Picked <span className="font-bold">{j.picked}</span></p>
                  <p className="text-emerald-400 text-xs">Winner: <span className="font-bold">{j.winner}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* The Jinxer */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          <span className="text-2xl">🧿</span> The Jinxer
        </h3>
        <p className="text-xs text-slate-400 mb-4">Highest failure rate when picking the crowd favorite. When they back the favorite, it loses.</p>

        {data.jinxers.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">No data yet</div>
        ) : (
          <div className="space-y-1.5">
            {data.jinxers.slice(0, 15).map((j, i) => (
              <div key={j.name} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-red-400/80 text-white' : i === 2 ? 'bg-red-400/60 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: j.color }}>
                  {j.name.charAt(0)}
                </div>
                <span className="text-sm text-white flex-1">{j.name}</span>
                <div className="text-right">
                  <span className="text-red-400 text-sm font-bold">{j.jinxRate.toFixed(0)}%</span>
                  <span className="text-slate-500 text-xs ml-1">jinx rate</span>
                </div>
                <div className="text-right min-w-[60px]">
                  <span className="text-slate-400 text-xs">{j.favoriteLost}/{j.pickedFavorite} lost</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zero-Streak Club */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          <span className="text-2xl">🥶</span> Zero-Streak Club
        </h3>
        <p className="text-xs text-slate-400 mb-4">Longest current losing streaks. How long can you get it wrong?</p>

        {data.losingStreaks.filter(l => l.currentLosingStreak > 0).length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">Everyone got at least one right recently!</div>
        ) : (
          <div className="space-y-1.5">
            {data.losingStreaks.filter(l => l.currentLosingStreak > 0).map((l, i) => (
              <div key={l.name} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-400'
                }`}>
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: l.color }}>
                  {l.name.charAt(0)}
                </div>
                <span className="text-sm text-white flex-1">{l.name}</span>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-blue-400 text-sm font-bold">{l.currentLosingStreak}</span>
                    <span className="text-slate-500 text-xs ml-1">current</span>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="text-slate-400 text-xs">worst: {l.longestLosingStreak}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
