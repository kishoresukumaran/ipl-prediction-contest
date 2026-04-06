import { Match, Prediction, Joker, TriviaPoints, PlayerPointsBreakdown, StreakInfo } from './types';
import { POINTS_CONFIG, getMatchPoints } from './constants';

export interface ScoringData {
  matches: Match[];
  predictions: Prediction[];
  jokers: Joker[];
  triviaPoints: TriviaPoints[];
}

export function calculatePlayerPoints(
  participantId: string,
  participantName: string,
  data: ScoringData
): PlayerPointsBreakdown {
  const { matches, predictions, jokers, triviaPoints } = data;

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

  const totalPoints = basePoints + powerMatchPoints + underdogBonus + jokerBonus +
    doubleHeaderBonus + streakBonus + abandonedPoints + triviaPointsTotal;

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
