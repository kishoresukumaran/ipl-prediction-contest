'use client';

import { useState, useMemo } from 'react';
import { TEAMS, POINTS_CONFIG } from '@/lib/constants';

interface MatchDetail {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  predicted: string;
  winner: string;
  correct: boolean;
}

interface DHInstance {
  date: string;
  matches: MatchDetail[];
  swept: boolean;
}

interface DHHeroData {
  name: string;
  color: string;
  totalDays: number;
  sweptDays: number;
  totalBonusPoints: number;
  successRate: number;
  instances: DHInstance[];
}

interface DayEntry {
  matches: MatchDetail[];
  swept: { name: string; color: string; predictions: MatchDetail[] }[];
  missed: { name: string; color: string; predictions: MatchDetail[] }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DoubleHeaderDayViewChart({ data }: { data: DHHeroData[] }) {
  const dayMap = useMemo<Record<string, DayEntry>>(() => {
    const map: Record<string, DayEntry> = {};

    for (const player of data) {
      for (const inst of player.instances) {
        if (!map[inst.date]) {
          map[inst.date] = { matches: inst.matches, swept: [], missed: [] };
        }
        // Use matches from whichever player has the most complete set
        if (inst.matches.length > map[inst.date].matches.length) {
          map[inst.date].matches = inst.matches;
        }
        const entry = { name: player.name, color: player.color, predictions: inst.matches };
        if (inst.swept) {
          map[inst.date].swept.push(entry);
        } else {
          map[inst.date].missed.push(entry);
        }
      }
    }

    return map;
  }, [data]);

  const sortedDates = useMemo(
    () => Object.keys(dayMap).sort((a, b) => a.localeCompare(b)),
    [dayMap]
  );

  const [selectedDate, setSelectedDate] = useState<string>(() => sortedDates[sortedDates.length - 1] ?? '');

  if (!sortedDates.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-[var(--app-text-secondary)]">
        <p className="text-sm">No double header days yet</p>
        <p className="text-xs text-[var(--app-text-tertiary)] mt-1">Check back when there are multi-match days</p>
      </div>
    );
  }

  const day = dayMap[selectedDate];

  return (
    <div className="space-y-4">
      {/* Date pill selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {sortedDates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedDate === date
                ? 'bg-amber-500 border-amber-500 text-[#1a1040] shadow-md shadow-amber-500/20'
                : 'bg-[var(--app-surface-alt)] border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-amber-500/40 hover:text-amber-400'
            }`}
          >
            {formatDate(date)}
          </button>
        ))}
      </div>

      {day && (
        <div className="space-y-4">
          {/* Match cards for the day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {day.matches.map(m => (
              <div
                key={m.matchId}
                className="flex items-center gap-2 bg-[var(--app-surface-alt)] border border-[var(--app-border)] rounded-lg px-3 py-2"
              >
                <span className="text-[10px] text-[var(--app-text-tertiary)] shrink-0">#{m.matchId}</span>
                <span style={{ color: TEAMS[m.homeTeam]?.color }} className="text-xs font-semibold">{m.homeTeam}</span>
                <span className="text-[var(--app-text-tertiary)] text-xs">vs</span>
                <span style={{ color: TEAMS[m.awayTeam]?.color }} className="text-xs font-semibold">{m.awayTeam}</span>
                <span className="text-[var(--app-text-tertiary)] text-xs ml-auto shrink-0">W:</span>
                <span style={{ color: TEAMS[m.winner]?.color }} className="text-xs font-bold shrink-0">{m.winner || '—'}</span>
              </div>
            ))}
          </div>

          {/* Sweepers of the Day */}
          {day.swept.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-base">⚡</span>
                <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Sweepers of the Day</h4>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-medium">
                  +{POINTS_CONFIG.doubleHeaderBonus} pts each
                </span>
                <span className="ml-auto text-[10px] text-[var(--app-text-tertiary)]">{day.swept.length} of {day.swept.length + day.missed.length}</span>
              </div>

              <div className="space-y-1.5">
                {day.swept.map((player, i) => (
                  <div
                    key={player.name}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15"
                  >
                    <span className="text-sm w-5 text-center shrink-0">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-xs text-[var(--app-text-tertiary)]">{i + 1}</span>}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-[var(--app-text)] flex-1">{player.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {player.predictions.map(m => (
                        <span
                          key={m.matchId}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            color: TEAMS[m.predicted]?.color ?? 'var(--app-text)',
                            backgroundColor: `${TEAMS[m.predicted]?.color ?? '#fff'}18`,
                          }}
                        >
                          {m.predicted || '—'}
                        </span>
                      ))}
                    </div>
                    <div className="shrink-0 bg-amber-400/15 border border-amber-400/30 rounded-lg px-2 py-0.5 text-center">
                      <span className="text-sm font-black text-amber-400">+{POINTS_CONFIG.doubleHeaderBonus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {day.swept.length > 0 && day.missed.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--app-border)]" />
              <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">left empty-handed</span>
              <div className="flex-1 h-px bg-[var(--app-border)]" />
            </div>
          )}

          {/* Missed players */}
          {day.missed.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {day.missed.map(p => (
                <div
                  key={p.name}
                  className="flex items-center gap-1.5 bg-[var(--app-surface-alt)] border border-[var(--app-border)] rounded-full pl-1 pr-2.5 py-0.5"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold opacity-60"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-[11px] text-[var(--app-text-tertiary)]">{p.name}</span>
                  <span className="text-[10px] text-red-400/70">✗</span>
                </div>
              ))}
            </div>
          )}

          {/* All swept state */}
          {day.missed.length === 0 && day.swept.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <span className="text-sm">🏆</span>
              <span className="text-xs text-emerald-400 font-medium">Everyone swept this day — a rare clean sweep!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
