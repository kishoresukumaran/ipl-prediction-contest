'use client';

import { useMemo } from 'react';
import { TEAMS, POINTS_CONFIG } from '@/lib/constants';

interface Prediction {
  match_id: number;
  participant_id: string;
  predicted_team: string;
}

interface Match {
  id: number;
  home_team: string;
  away_team: string;
  winner: string | null;
  match_date: string;
  is_power_match: boolean;
}

interface PlayerBreakdown {
  participantId: string;
  participantName: string;
  jokerBonus: number;
}

interface WastedJoker {
  name: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  picked: string;
  winner: string;
  color: string;
}

interface PointsMatrix {
  matrix: Record<string, Record<string, { joker: number }>>;
}

interface GhostVoter {
  name: string;
  color: string;
}

interface Props {
  leaderboard: PlayerBreakdown[];
  predictions: Prediction[];
  matches: Match[];
  pointsMatrix: PointsMatrix;
  wastedJokers: WastedJoker[];
  ghostVoters: GhostVoter[];
}

interface JokerHit {
  name: string;
  color: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  picked: string;
  winner: string;
  isPowerMatch: boolean;
}

interface JokerBurn {
  name: string;
  color: string;
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  picked: string;
  winner: string;
}

function TeamTag({ team }: { team: string }) {
  const color = TEAMS[team]?.color;
  return (
    <span
      className="text-[11px] font-bold px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}20` }}
    >
      {team}
    </span>
  );
}

export function JokerFilesChart({ leaderboard, predictions, matches, pointsMatrix, wastedJokers, ghostVoters }: Props) {
  const { hits, burns, holding } = useMemo(() => {
    const colorMap: Record<string, string> = {};
    for (const gv of ghostVoters) {
      colorMap[gv.name] = gv.color;
    }

    const wastedNames = new Set(wastedJokers.map(j => j.name));

    const hitList: JokerHit[] = [];
    for (const player of leaderboard) {
      if (player.jokerBonus <= 0) continue;

      const playerMatrix = pointsMatrix.matrix[player.participantId];
      if (!playerMatrix) continue;

      const jokerEntry = Object.entries(playerMatrix).find(([, v]) => v.joker > 0);
      if (!jokerEntry) continue;

      const jokerMatchId = Number(jokerEntry[0]);
      const match = matches.find(m => m.id === jokerMatchId);
      if (!match) continue;

      const prediction = predictions.find(
        p => p.match_id === jokerMatchId && p.participant_id === player.participantId
      );

      hitList.push({
        name: player.participantName,
        color: colorMap[player.participantName] ?? '#888',
        matchId: jokerMatchId,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        picked: prediction?.predicted_team ?? '?',
        winner: match.winner ?? '?',
        isPowerMatch: match.is_power_match,
      });
    }

    const burnList: JokerBurn[] = wastedJokers.map(j => ({
      name: j.name,
      color: j.color,
      matchId: j.matchId,
      homeTeam: j.homeTeam,
      awayTeam: j.awayTeam,
      picked: j.picked,
      winner: j.winner,
    }));

    const usedNames = new Set([...hitList.map(h => h.name), ...wastedNames]);
    const holdingList = ghostVoters.filter(gv => !usedNames.has(gv.name));

    return { hits: hitList, burns: burnList, holding: holdingList };
  }, [leaderboard, predictions, matches, pointsMatrix, wastedJokers, ghostVoters]);

  const hasAny = hits.length > 0 || burns.length > 0;

  if (!hasAny && holding.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-[var(--app-text-secondary)]">
        <span className="text-3xl mb-2">🃏</span>
        <p className="text-sm">No jokers played yet</p>
        <p className="text-xs text-[var(--app-text-tertiary)] mt-1">Check back after some wild cards are thrown</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Cashed In */}
      {hits.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎯</span>
            <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Cashed In</h4>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-2 py-0.5 font-medium">
              +{POINTS_CONFIG.jokerBonus} pts
            </span>
          </div>

          <div className="space-y-2">
            {hits.map(player => (
              <div
                key={player.name}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--app-text)]">{player.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-[var(--app-text-tertiary)]">#{player.matchId}</span>
                    <TeamTag team={player.homeTeam} />
                    <span className="text-[10px] text-[var(--app-text-tertiary)]">vs</span>
                    <TeamTag team={player.awayTeam} />
                    {player.isPowerMatch && (
                      <span className="text-[9px] bg-purple-500/15 border border-purple-500/25 text-purple-400 rounded-full px-1.5 py-0.5 font-bold">
                        POWER
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <TeamTag team={player.picked} />
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                    <p className="text-[9px] text-[var(--app-text-tertiary)] mt-0.5 text-right">correct pick</p>
                  </div>
                  <div className="bg-amber-400/15 border border-amber-400/30 rounded-lg px-2.5 py-1 text-center">
                    <span className="text-base font-black text-amber-400">+{POINTS_CONFIG.jokerBonus}</span>
                    <p className="text-[9px] text-amber-400/70 font-medium -mt-0.5">JOKER</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider between hits and burns */}
      {hits.length > 0 && burns.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--app-border)]" />
          <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">burned it</span>
          <div className="flex-1 h-px bg-[var(--app-border)]" />
        </div>
      )}

      {/* Burned */}
      {burns.length > 0 && (
        <div>
          {hits.length === 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">💀</span>
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide">Burned</h4>
              <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 rounded-full px-2 py-0.5 font-medium">
                0 pts earned
              </span>
            </div>
          )}

          <div className="space-y-2">
            {burns.map(player => (
              <div
                key={player.name}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-red-500/5 border border-red-500/15"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 opacity-70"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--app-text)]">{player.name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-[var(--app-text-tertiary)]">#{player.matchId}</span>
                    <TeamTag team={player.homeTeam} />
                    <span className="text-[10px] text-[var(--app-text-tertiary)]">vs</span>
                    <TeamTag team={player.awayTeam} />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: '#f87171', backgroundColor: '#f8717118' }}
                      >
                        {player.picked}
                      </span>
                      <span className="text-red-400 text-xs">✗</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 justify-end">
                      <span className="text-[9px] text-[var(--app-text-tertiary)]">won:</span>
                      <TeamTag team={player.winner} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Still Holding */}
      {holding.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--app-border)]" />
            <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">still sitting on it</span>
            <div className="flex-1 h-px bg-[var(--app-border)]" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {holding.map(p => (
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
                <span className="text-[10px]">🃏</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
