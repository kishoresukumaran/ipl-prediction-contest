import { PARTICIPANTS, POINTS_CONFIG, PRE_TOURNAMENT_POINTS, getMatchPoints } from './constants';
import { calculateAllPlayerPoints } from './scoring';
import {
  Joker,
  Match,
  PlayerPointsBreakdown,
  Prediction,
  PreTournamentActuals,
  PreTournamentPrediction,
  TriviaPoints,
} from './types';

export interface RankHistoryEntry {
  matchId: number;
  matchDate: string;
  [participantId: string]: number | string;
}

export interface RankDelta {
  delta: number;
  fromRank: number;
  toRank: number;
  matchId: number;
}

export interface RankStatsEntry {
  participantId: string;
  participantName: string;
  throneTime: number;
  top3Time: number;
  cellarTime: number;
  bestRank: number;
  worstRank: number;
  biggestClimb: RankDelta | null;
  biggestCrash: RankDelta | null;
}

export interface LeadSegment {
  holderId: string;
  holderName: string;
  fromMatchId: number;
  toMatchId: number;
  length: number;
}

export interface LeadChangesData {
  leadChanges: number;
  uniqueLeaders: number;
  segments: LeadSegment[];
}

export type CatchUpStatus = 'champion-locked' | 'live' | 'eliminated';

export interface CatchUpEntry {
  participantId: string;
  participantName: string;
  currentPoints: number;
  pointsBehindLeader: number;
  matchesRemaining: number;
  maxRemainingMatchPoints: number;
  doubleHeaderUpside: number;
  jokerAvailable: boolean;
  jokerUpside: number;
  preTournamentLockedPoints: number;
  preTournamentMaxRemaining: number;
  maxFinalPoints: number;
  status: CatchUpStatus;
  breakdownNote: string;
}

export interface DayOfWeekCell {
  day: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface DayOfWeekEntry {
  participantId: string;
  participantName: string;
  values: DayOfWeekCell[];
}

export interface PlayerJourney {
  rankHistory: Array<{ matchId: number; rank: number }>;
  bestWeek: { week: string; points: number } | null;
  worstWeek: { week: string; points: number } | null;
  longestClimbStreak: number;
  biggestSingleMatchClimb: RankDelta | null;
  biggestSingleMatchCrash: RankDelta | null;
  dayOfWeekBreakdown: DayOfWeekCell[];
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function sortableLeaderboard(
  row: RankHistoryEntry,
  leaderboardById: Map<string, PlayerPointsBreakdown>
) {
  return PARTICIPANTS.map((p) => {
    const score = Number(row[p.id] ?? 0);
    const lb = leaderboardById.get(p.id);
    return {
      id: p.id,
      score,
      accuracy: lb?.accuracy ?? 0,
      correct: lb?.correctPredictions ?? 0,
    };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.correct - a.correct;
  });
}

export function deriveRankHistory(
  pointsRace: Array<{ matchId: number; matchDate: string; [key: string]: number | string }>,
  leaderboard: PlayerPointsBreakdown[]
): RankHistoryEntry[] {
  const leaderboardById = new Map(leaderboard.map((p) => [p.participantId, p]));

  return pointsRace.map((row) => {
    const ordered = sortableLeaderboard(row as RankHistoryEntry, leaderboardById);
    const out: RankHistoryEntry = { matchId: row.matchId, matchDate: row.matchDate };
    ordered.forEach((entry, idx) => {
      out[entry.id] = idx + 1;
    });
    return out;
  });
}

export function computeRankStats(rankHistory: RankHistoryEntry[]): RankStatsEntry[] {
  const playerCount = PARTICIPANTS.length;

  return PARTICIPANTS.map((player) => {
    const ranks = rankHistory.map((row) => Number(row[player.id] ?? playerCount));
    let throneTime = 0;
    let top3Time = 0;
    let cellarTime = 0;
    let bestRank = playerCount;
    let worstRank = 1;
    let biggestClimb: RankDelta | null = null;
    let biggestCrash: RankDelta | null = null;

    ranks.forEach((rank, idx) => {
      if (rank === 1) throneTime++;
      if (rank <= 3) top3Time++;
      if (rank === playerCount) cellarTime++;
      if (rank < bestRank) bestRank = rank;
      if (rank > worstRank) worstRank = rank;

      if (idx === 0) return;
      const prev = ranks[idx - 1];
      const delta = prev - rank;
      const payload: RankDelta = {
        delta,
        fromRank: prev,
        toRank: rank,
        matchId: rankHistory[idx].matchId,
      };
      if (delta > 0 && (!biggestClimb || delta > biggestClimb.delta)) biggestClimb = payload;
      if (delta < 0 && (!biggestCrash || delta < biggestCrash.delta)) biggestCrash = payload;
    });

    return {
      participantId: player.id,
      participantName: player.name,
      throneTime,
      top3Time,
      cellarTime,
      bestRank,
      worstRank,
      biggestClimb,
      biggestCrash,
    };
  });
}

export function computeLeadChanges(rankHistory: RankHistoryEntry[]): LeadChangesData {
  const segments: LeadSegment[] = [];
  let currentLeader = '';

  for (const row of rankHistory) {
    const leader = PARTICIPANTS.find((p) => Number(row[p.id]) === 1);
    if (!leader) continue;
    if (currentLeader !== leader.id) {
      segments.push({
        holderId: leader.id,
        holderName: leader.name,
        fromMatchId: row.matchId,
        toMatchId: row.matchId,
        length: 1,
      });
      currentLeader = leader.id;
      continue;
    }
    const last = segments[segments.length - 1];
    last.toMatchId = row.matchId;
    last.length += 1;
  }

  return {
    leadChanges: Math.max(0, segments.length - 1),
    uniqueLeaders: new Set(segments.map((s) => s.holderId)).size,
    segments,
  };
}

function getMaxRemainingPreTournamentPoints(
  prediction: PreTournamentPrediction | undefined,
  actuals: PreTournamentActuals | null | undefined
) {
  if (!prediction) return 0;
  const resolved = actuals ?? null;
  let total = 0;
  if (!resolved?.champion && prediction.champion) total += PRE_TOURNAMENT_POINTS.champion;
  if (!resolved?.orange_cap && prediction.orange_cap) total += PRE_TOURNAMENT_POINTS.orangeCap;
  if (!resolved?.purple_cap && prediction.purple_cap) total += PRE_TOURNAMENT_POINTS.purpleCap;
  if (!resolved?.playoff_teams && prediction.playoff_teams) total += PRE_TOURNAMENT_POINTS.playoffByCount[4];
  if (!resolved?.table_topper && prediction.table_topper) total += PRE_TOURNAMENT_POINTS.tableTopper;
  if (!resolved?.contest_winner && prediction.contest_winner) total += PRE_TOURNAMENT_POINTS.contestWinner;
  return total;
}

export function computeCatchUp(
  leaderboard: PlayerPointsBreakdown[],
  matches: Match[],
  jokers: Joker[],
  preTournamentPredictions: PreTournamentPrediction[],
  preTournamentActuals: PreTournamentActuals | null | undefined
): CatchUpEntry[] {
  const sorted = [...leaderboard].sort((a, b) => b.totalPoints - a.totalPoints);
  const leaderPoints = sorted[0]?.totalPoints ?? 0;
  const remainingMatches = matches.filter((m) => !m.is_completed && !m.winner);
  const byDate: Record<string, number> = {};
  for (const match of remainingMatches) byDate[match.match_date] = (byDate[match.match_date] || 0) + 1;
  const remainingDH = Object.values(byDate).filter((count) => count >= 2).length;
  const maxRemainingMatchPoints = remainingMatches.reduce((sum, match) => {
    return sum + getMatchPoints(match.match_type, match.is_power_match) + (match.underdog_team ? POINTS_CONFIG.underdogBonus : 0);
  }, 0);
  const doubleHeaderUpside = remainingDH * POINTS_CONFIG.doubleHeaderBonus;
  const currentLeaderMax = Math.max(
    ...sorted.map((entry) => {
      const playerPre = preTournamentPredictions.find((p) => p.player.toLowerCase() === entry.participantName.toLowerCase());
      const playerJoker = jokers.find((j) => j.participant_id === entry.participantId);
      const jokerUpside = playerJoker ? 0 : POINTS_CONFIG.jokerBonus;
      const preMax = getMaxRemainingPreTournamentPoints(playerPre, preTournamentActuals);
      return entry.totalPoints + maxRemainingMatchPoints + doubleHeaderUpside + jokerUpside + preMax;
    })
  );

  return sorted.map((entry) => {
    const playerPre = preTournamentPredictions.find((p) => p.player.toLowerCase() === entry.participantName.toLowerCase());
    const playerJoker = jokers.find((j) => j.participant_id === entry.participantId);
    const jokerAvailable = !playerJoker;
    const jokerUpside = jokerAvailable ? POINTS_CONFIG.jokerBonus : 0;
    const preTournamentMaxRemaining = getMaxRemainingPreTournamentPoints(playerPre, preTournamentActuals);
    const maxFinalPoints = entry.totalPoints + maxRemainingMatchPoints + doubleHeaderUpside + jokerUpside + preTournamentMaxRemaining;

    let status: CatchUpStatus = 'live';
    if (entry.totalPoints >= currentLeaderMax) {
      status = 'champion-locked';
    } else {
      const bestRivalCurrent = Math.max(...sorted.filter((p) => p.participantId !== entry.participantId).map((p) => p.totalPoints), 0);
      if (maxFinalPoints < bestRivalCurrent) status = 'eliminated';
    }

    const pointsBehindLeader = Math.max(0, leaderPoints - entry.totalPoints);
    const noteParts = [
      `${remainingMatches.length} matches left`,
      `max match upside ${maxRemainingMatchPoints}`,
      jokerAvailable ? `joker +${POINTS_CONFIG.jokerBonus}` : 'joker used',
    ];
    if (preTournamentMaxRemaining > 0) noteParts.push(`pre-tournament +${preTournamentMaxRemaining}`);

    return {
      participantId: entry.participantId,
      participantName: entry.participantName,
      currentPoints: entry.totalPoints,
      pointsBehindLeader,
      matchesRemaining: remainingMatches.length,
      maxRemainingMatchPoints,
      doubleHeaderUpside,
      jokerAvailable,
      jokerUpside,
      preTournamentLockedPoints: entry.preTournamentPoints,
      preTournamentMaxRemaining,
      maxFinalPoints,
      status,
      breakdownNote: noteParts.join(' | '),
    };
  });
}

export function computeDayOfWeekPerf(matches: Match[], predictions: Prediction[]): DayOfWeekEntry[] {
  const completed = matches.filter((m) => m.is_completed && m.winner && m.winner !== 'ABANDONED');

  return PARTICIPANTS.map((player) => {
    const map: Record<string, { correct: number; total: number }> = {};
    DAY_ORDER.forEach((day) => {
      map[day] = { correct: 0, total: 0 };
    });

    completed.forEach((match) => {
      const day = DAY_ORDER.includes(match.day_of_week) ? match.day_of_week : 'Sunday';
      const pred = predictions.find((p) => p.match_id === match.id && p.participant_id === player.id);
      if (!pred) return;
      map[day].total += 1;
      if (pred.predicted_team === match.winner) map[day].correct += 1;
    });

    return {
      participantId: player.id,
      participantName: player.name,
      values: DAY_ORDER.map((day) => {
        const total = map[day].total;
        const correct = map[day].correct;
        return {
          day,
          correct,
          total,
          accuracy: total > 0 ? (correct / total) * 100 : 0,
        };
      }),
    };
  });
}

export function computeWeeklyPlayerDeltas(
  matches: Match[],
  predictions: Prediction[],
  jokers: Joker[],
  triviaPoints: TriviaPoints[],
  preTournamentPredictions: PreTournamentPrediction[],
  preTournamentActuals: PreTournamentActuals | null | undefined
) {
  const completedMatches = matches
    .filter((m) => m.is_completed && m.winner)
    .sort((a, b) => a.match_date.localeCompare(b.match_date) || a.start_time.localeCompare(b.start_time));
  const weeks: Record<string, Match[]> = {};
  completedMatches.forEach((m) => {
    const date = new Date(m.match_date);
    date.setDate(date.getDate() - date.getDay());
    const key = date.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(m);
  });

  const prevTotals: Record<string, number> = {};
  const out: Array<{ week: string; values: Record<string, number> }> = [];
  let cumulativeMatches: Match[] = [];

  Object.keys(weeks).sort().forEach((weekKey) => {
    cumulativeMatches = [...cumulativeMatches, ...weeks[weekKey]];
    const ids = new Set(cumulativeMatches.map((m) => m.id));
    const cumulativePreds = predictions.filter((p) => ids.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: cumulativeMatches,
      predictions: cumulativePreds,
      jokers,
      triviaPoints,
      preTournamentPredictions,
      preTournamentActuals,
    });
    const values: Record<string, number> = {};
    scores.forEach((score) => {
      values[score.participantId] = score.totalPoints - (prevTotals[score.participantId] || 0);
      prevTotals[score.participantId] = score.totalPoints;
    });
    out.push({
      week: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      values,
    });
  });

  return out;
}

export function computePlayerJourney(
  participantId: string,
  rankHistory: RankHistoryEntry[],
  rankStats: RankStatsEntry[],
  dayOfWeek: DayOfWeekEntry[],
  weekly: Array<{ week: string; values: Record<string, number> }>
): PlayerJourney {
  const playerRankHistory = rankHistory.map((row) => ({
    matchId: row.matchId,
    rank: Number(row[participantId]),
  }));
  const playerStats = rankStats.find((row) => row.participantId === participantId);

  let bestWeek: { week: string; points: number } | null = null;
  let worstWeek: { week: string; points: number } | null = null;
  weekly.forEach((week) => {
    const points = week.values[participantId] ?? 0;
    if (!bestWeek || points > bestWeek.points) bestWeek = { week: week.week, points };
    if (!worstWeek || points < worstWeek.points) worstWeek = { week: week.week, points };
  });

  let longestClimbStreak = 0;
  let currentClimbStreak = 0;
  for (let i = 1; i < playerRankHistory.length; i++) {
    const prev = playerRankHistory[i - 1].rank;
    const curr = playerRankHistory[i].rank;
    if (curr <= prev) {
      currentClimbStreak++;
      if (currentClimbStreak > longestClimbStreak) longestClimbStreak = currentClimbStreak;
    } else {
      currentClimbStreak = 0;
    }
  }

  return {
    rankHistory: playerRankHistory,
    bestWeek,
    worstWeek,
    longestClimbStreak,
    biggestSingleMatchClimb: playerStats?.biggestClimb ?? null,
    biggestSingleMatchCrash: playerStats?.biggestCrash ?? null,
    dayOfWeekBreakdown: dayOfWeek.find((item) => item.participantId === participantId)?.values ?? [],
  };
}
