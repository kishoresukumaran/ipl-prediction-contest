import { Match, Prediction, Joker, TriviaResponse, BonusResponse, BonusQuestion, PlayerPointsBreakdown, StreakInfo } from './types';
import { POINTS_CONFIG, getMatchPoints } from './constants';

export interface ScoringData {
  matches: Match[];
  predictions: Prediction[];
  jokers: Joker[];
  triviaResponses: TriviaResponse[];
  bonusQuestions?: BonusQuestion[];
  bonusResponses?: BonusResponse[];
}

export function calculatePlayerPoints(
  participantId: string,
  participantName: string,
  data: ScoringData
): PlayerPointsBreakdown {
  const { matches, predictions, jokers, triviaResponses, bonusQuestions = [], bonusResponses = [] } = data;

  const completedMatches = matches
    .filter(m => m.is_completed && m.winner)
    .sort((a, b) => {
      const dateCompare = a.match_date.localeCompare(b.match_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

  const playerPredictions = predictions.filter(p => p.participant_id === participantId);
  const playerJoker = jokers.find(j => j.participant_id === participantId);
  const playerTriviaResponses = triviaResponses.filter(t => t.participant_id === participantId);
  const playerBonusResponses = bonusResponses.filter(b => b.participant_id === participantId);

  let basePoints = 0;
  let powerMatchPoints = 0;
  let underdogBonus = 0;
  let jokerBonus = 0;
  let streakBonus = 0;
  let doubleHeaderBonus = 0;
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

  const triviaPoints = playerTriviaResponses.filter(t => t.is_correct).length * POINTS_CONFIG.triviaCorrect;

  // Bonus question points
  let bonusPoints = 0;
  for (const response of playerBonusResponses) {
    if (response.is_correct) {
      const question = bonusQuestions.find(q => q.id === response.bonus_question_id);
      bonusPoints += question?.points || 1;
    }
  }

  const totalPoints = basePoints + powerMatchPoints + underdogBonus + jokerBonus +
    doubleHeaderBonus + streakBonus + triviaPoints + bonusPoints;

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
    triviaPoints,
    bonusPoints,
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

  // Assign tied ranks: players with same points get same rank
  results.forEach((r, i) => {
    if (i === 0) {
      r.rank = 1;
    } else if (r.totalPoints === results[i - 1].totalPoints) {
      r.rank = results[i - 1].rank;
    } else {
      r.rank = i + 1;
    }
  });

  return results;
}
