import {
  Match,
  Prediction,
  Joker,
  TriviaPoints,
  PlayerPointsBreakdown,
  StreakInfo,
  PreTournamentPrediction,
  PreTournamentActuals,
  PreTournamentBreakdown,
} from './types';
import { POINTS_CONFIG, getMatchPoints, PRE_TOURNAMENT_POINTS } from './constants';

export interface ScoringData {
  matches: Match[];
  predictions: Prediction[];
  jokers: Joker[];
  triviaPoints: TriviaPoints[];
  preTournamentPredictions?: PreTournamentPrediction[];
  preTournamentActuals?: PreTournamentActuals | null;
}

const EMPTY_PRE_TOURNAMENT_BREAKDOWN: PreTournamentBreakdown = {
  total: 0,
  champion: 0,
  orangeCap: 0,
  purpleCap: 0,
  playoffTeams: 0,
  playoffCorrectCount: 0,
  tableTopper: 0,
  contestWinner: 0,
};

function normalizeTeam(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toUpperCase();
}

function parsePlayoffTeams(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((t) => normalizeTeam(t))
    .filter((t) => t.length > 0);
}

export function calculatePreTournamentPoints(
  participantId: string,
  prediction: PreTournamentPrediction | null | undefined,
  actuals: PreTournamentActuals | null | undefined
): PreTournamentBreakdown {
  if (!prediction || !actuals) return { ...EMPTY_PRE_TOURNAMENT_BREAKDOWN };

  const breakdown: PreTournamentBreakdown = { ...EMPTY_PRE_TOURNAMENT_BREAKDOWN };

  // Single-team questions: only score if actual is set (phased reveal)
  if (actuals.champion && normalizeTeam(prediction.champion) === normalizeTeam(actuals.champion)) {
    breakdown.champion = PRE_TOURNAMENT_POINTS.champion;
  }
  if (actuals.orange_cap && normalizeTeam(prediction.orange_cap) === normalizeTeam(actuals.orange_cap)) {
    breakdown.orangeCap = PRE_TOURNAMENT_POINTS.orangeCap;
  }
  if (actuals.purple_cap && normalizeTeam(prediction.purple_cap) === normalizeTeam(actuals.purple_cap)) {
    breakdown.purpleCap = PRE_TOURNAMENT_POINTS.purpleCap;
  }
  if (actuals.table_topper && normalizeTeam(prediction.table_topper) === normalizeTeam(actuals.table_topper)) {
    breakdown.tableTopper = PRE_TOURNAMENT_POINTS.tableTopper;
  }

  // Playoff Top 4: count intersection of predicted vs actual sets
  if (actuals.playoff_teams) {
    const actualSet = new Set(parsePlayoffTeams(actuals.playoff_teams));
    const predicted = parsePlayoffTeams(prediction.playoff_teams);
    let count = 0;
    const seen = new Set<string>();
    for (const t of predicted) {
      if (seen.has(t)) continue;
      seen.add(t);
      if (actualSet.has(t)) count++;
    }
    if (count > 4) count = 4;
    breakdown.playoffCorrectCount = count;
    breakdown.playoffTeams = PRE_TOURNAMENT_POINTS.playoffByCount[count] ?? 0;
  }

  // Contest winner: any player who correctly predicted the winner gets points
  // (case-insensitive participant id compare). participantId param kept for API
  // symmetry / future use.
  void participantId;
  if (actuals.contest_winner && prediction.contest_winner) {
    const a = actuals.contest_winner.toString().trim().toLowerCase();
    const p = prediction.contest_winner.toString().trim().toLowerCase();
    if (a && p && a === p) {
      breakdown.contestWinner = PRE_TOURNAMENT_POINTS.contestWinner;
    }
  }

  breakdown.total =
    breakdown.champion +
    breakdown.orangeCap +
    breakdown.purpleCap +
    breakdown.playoffTeams +
    breakdown.tableTopper +
    breakdown.contestWinner;

  return breakdown;
}

export function calculatePlayerPoints(
  participantId: string,
  participantName: string,
  data: ScoringData
): PlayerPointsBreakdown {
  const { matches, predictions, jokers, triviaPoints, preTournamentPredictions, preTournamentActuals } = data;

  const completedMatches = matches
    .filter(m => m.is_completed && m.winner)
    .sort((a, b) => {
      const dateCompare = a.match_date.localeCompare(b.match_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

  const playerPredictions = predictions.filter(p => p.participant_id === participantId);
  const playerJoker = jokers.find(j => j.participant_id === participantId);
  const playerTriviaPoints = triviaPoints.filter(t => t.player === participantName);

  let basePoints = 0;
  let powerMatchPoints = 0;
  let underdogBonus = 0;
  let jokerBonus = 0;
  let streakBonus = 0;
  let doubleHeaderBonus = 0;
  let abandonedPoints = 0;
  let correctPredictions = 0;
  let totalPredictions = 0;

  let currentStreak = 0;
  let longestStreak = 0;
  let streakStart: number | null = null;
  const streaks: StreakInfo[] = [];

  const correctByDate: Record<string, number[]> = {};
  const matchCountByDate: Record<string, number> = {};

  for (const match of completedMatches) {
    matchCountByDate[match.match_date] = (matchCountByDate[match.match_date] || 0) + 1;
  }

  for (const match of completedMatches) {
    // Handle abandoned matches: all players get 2 points, streak advances, counts for double header
    if (match.winner === 'ABANDONED') {
      abandonedPoints += 2;

      currentStreak++;
      if (currentStreak === 1) streakStart = match.id;
      if (currentStreak > longestStreak) longestStreak = currentStreak;

      // Also counts as "correct" for double header bonus
      if (!correctByDate[match.match_date]) correctByDate[match.match_date] = [];
      correctByDate[match.match_date].push(match.id);

      continue;
    }

    const prediction = playerPredictions.find(p => p.match_id === match.id);

    if (!prediction) {
      if (currentStreak >= POINTS_CONFIG.minStreak) {
        streakBonus += currentStreak;
        streaks.push({ start: streakStart!, end: match.id, length: currentStreak });
      }
      currentStreak = 0;
      streakStart = null;
      continue;
    }

    totalPredictions++;
    const isCorrect = prediction.predicted_team === match.winner;

    if (isCorrect) {
      correctPredictions++;

      const matchPts = getMatchPoints(match.match_type, match.is_power_match);
      if (match.is_power_match && match.match_type === 'league') {
        powerMatchPoints += matchPts;
      } else {
        basePoints += matchPts;
      }

      if (match.underdog_team && prediction.predicted_team === match.underdog_team) {
        underdogBonus += POINTS_CONFIG.underdogBonus;
      }

      if (playerJoker && playerJoker.match_id === match.id) {
        jokerBonus += POINTS_CONFIG.jokerBonus;
      }

      if (!correctByDate[match.match_date]) correctByDate[match.match_date] = [];
      correctByDate[match.match_date].push(match.id);

      currentStreak++;
      if (currentStreak === 1) streakStart = match.id;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      if (currentStreak >= POINTS_CONFIG.minStreak) {
        streakBonus += currentStreak;
        streaks.push({ start: streakStart!, end: match.id, length: currentStreak });
      }
      currentStreak = 0;
      streakStart = null;
    }
  }

  if (currentStreak >= POINTS_CONFIG.minStreak) {
    streakBonus += currentStreak;
    const lastMatch = completedMatches[completedMatches.length - 1];
    streaks.push({ start: streakStart!, end: lastMatch?.id || 0, length: currentStreak });
  }

  for (const [date, correctMatchIds] of Object.entries(correctByDate)) {
    const totalMatchesOnDay = matchCountByDate[date] || 0;
    if (totalMatchesOnDay >= 2 && correctMatchIds.length >= 2) {
      doubleHeaderBonus += POINTS_CONFIG.doubleHeaderBonus;
    }
  }

  const triviaPointsTotal = playerTriviaPoints.reduce((sum, t) => sum + t.points_earned, 0);

  // Pre-tournament ("Crystal Ball") points
  const playerPreTournament = preTournamentPredictions?.find(
    (p) => p.player.toLowerCase() === participantName.toLowerCase()
  );
  const preTournamentBreakdown = calculatePreTournamentPoints(
    participantId,
    playerPreTournament,
    preTournamentActuals
  );
  const preTournamentPointsTotal = preTournamentBreakdown.total;

  const totalPoints = basePoints + powerMatchPoints + underdogBonus + jokerBonus +
    doubleHeaderBonus + streakBonus + abandonedPoints + triviaPointsTotal + preTournamentPointsTotal;

  return {
    participantId,
    participantName,
    totalPoints,
    basePoints,
    powerMatchPoints,
    underdogBonus,
    jokerBonus,
    doubleHeaderBonus,
    streakBonus,
    abandonedPoints,
    triviaPoints: triviaPointsTotal,
    preTournamentPoints: preTournamentPointsTotal,
    preTournamentBreakdown,
    correctPredictions,
    totalPredictions,
    accuracy: totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0,
    currentStreak,
    longestStreak,
    streaks,
  };
}

export function calculateAllPlayerPoints(
  participants: { id: string; name: string }[],
  data: ScoringData
): PlayerPointsBreakdown[] {
  const results = participants.map(p =>
    calculatePlayerPoints(p.id, p.name, data)
  );

  results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.correctPredictions - a.correctPredictions;
  });

  // Assign dense ranks: ties share rank, next rank increments by 1
  let currentRank = 1;
  results.forEach((r, i) => {
    if (i === 0) {
      r.rank = 1;
    } else if (r.totalPoints === results[i - 1].totalPoints) {
      r.rank = results[i - 1].rank;
    } else {
      currentRank++;
      r.rank = currentRank;
    }
  });

  return results;
}
