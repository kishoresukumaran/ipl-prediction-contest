import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS, TEAMS, POINTS_CONFIG, getMatchPoints } from '@/lib/constants';
import { Match, Prediction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [matchesRes, predictionsRes, jokersRes, triviaRes] = await Promise.all([
      supabase.from('matches').select('*').order('match_date').order('start_time'),
      supabase.from('predictions').select('*'),
      supabase.from('jokers').select('*'),
      supabase.from('trivia_responses').select('*'),
    ]);

    const matches: Match[] = matchesRes.data || [];
    const predictions: Prediction[] = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaResponses = triviaRes.data || [];

    const leaderboard = calculateAllPlayerPoints(PARTICIPANTS, { matches, predictions, jokers, triviaResponses });
    const completedMatches = matches.filter(m => m.is_completed && m.winner);

    const pointsRace = buildPointsRace(completedMatches, predictions, jokers, triviaResponses);
    const teamPopularity = buildTeamPopularity(completedMatches, predictions);
    const accuracyByPlayer = leaderboard.map(p => ({
      id: p.participantId, name: p.participantName,
      accuracy: p.accuracy, correct: p.correctPredictions, total: p.totalPredictions,
    }));
    const weeklyPoints = buildWeeklyPoints(completedMatches, predictions, jokers, triviaResponses);
    const crowdWisdom = buildCrowdWisdom(completedMatches, predictions);
    const contrarianData = buildContrarianData(completedMatches, predictions);
    const matchDifficulty = buildMatchDifficulty(completedMatches, predictions);
    const formData = buildFormData(completedMatches, predictions);
    const winRateByTeam = buildWinRateByTeam(completedMatches, predictions);
    const doubleHeaderData = buildDoubleHeaderData(completedMatches, predictions);
    const doubleHeaderHeroes = buildDoubleHeaderHeroes(completedMatches, predictions);
    const heatmapData = buildHeatmapData(matches, predictions);

    const streakData = leaderboard.map(p => ({
      name: p.participantName,
      longestStreak: p.longestStreak,
      currentStreak: p.currentStreak,
      color: PARTICIPANTS.find(pp => pp.id === p.participantId)?.avatar_color || '#666',
    }));

    // Wall of Shame data
    const wallOfShame = buildWallOfShame(completedMatches, predictions, jokers);

    // Copycat data
    const copycats = buildCopycats(completedMatches, predictions);

    // Points matrix
    const pointsMatrix = buildPointsMatrix(completedMatches, predictions, jokers);

    // Votes tab data
    const ghostVoters = buildGhostVoters(completedMatches, predictions);
    const teamVoteTotals = buildTeamVoteTotals(matches, predictions);
    const voteSplits = buildVoteSplits(completedMatches, predictions);
    const participationRate = buildParticipationRate(completedMatches, predictions);
    const homeAwayBias = buildHomeAwayBias(completedMatches, predictions);

    return NextResponse.json({
      leaderboard, matches, predictions, pointsRace, teamPopularity,
      accuracyByPlayer, weeklyPoints, crowdWisdom,
      contrarianData, matchDifficulty, formData, winRateByTeam,
      doubleHeaderData, doubleHeaderHeroes, heatmapData, streakData, wallOfShame, copycats,
      pointsMatrix,
      ghostVoters, teamVoteTotals, voteSplits, participationRate, homeAwayBias,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Failed to compute insights' }, { status: 500 });
  }
}

function buildPointsRace(matches: Match[], predictions: Prediction[], jokers: any[], triviaResponses: any[]) {
  const result: any[] = [];
  for (let i = 1; i <= matches.length; i++) {
    const subMatches = matches.slice(0, i);
    const matchIds = new Set(subMatches.map(m => m.id));
    const subPredictions = predictions.filter(p => matchIds.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: subMatches, predictions: subPredictions, jokers, triviaResponses,
    });
    const entry: any = { matchId: matches[i - 1].id, matchDate: matches[i - 1].match_date };
    scores.forEach(s => { entry[s.participantId] = s.totalPoints; });
    result.push(entry);
  }
  return result;
}

function buildTeamPopularity(matches: Match[], predictions: Prediction[]) {
  const teams = Object.keys(TEAMS);
  return teams.map(team => {
    let correct = 0, wrong = 0;
    predictions.forEach(p => {
      if (p.predicted_team !== team) return;
      const match = matches.find(m => m.id === p.match_id);
      if (!match) return;
      if (match.winner === team) correct++; else wrong++;
    });
    return { team, correct, wrong, total: correct + wrong };
  });
}

function buildWeeklyPoints(matches: Match[], predictions: Prediction[], jokers: any[], triviaResponses: any[]) {
  const weeks: Record<string, Match[]> = {};
  matches.forEach(m => {
    const date = new Date(m.match_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(m);
  });
  return Object.entries(weeks).map(([week, weekMatches]) => {
    const matchIds = new Set(weekMatches.map(m => m.id));
    const weekPreds = predictions.filter(p => matchIds.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: weekMatches, predictions: weekPreds, jokers: [], triviaResponses: [],
    });
    const entry: any = { week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };
    scores.forEach(s => { entry[s.participantId] = s.totalPoints; });
    return entry;
  });
}

function buildCrowdWisdom(matches: Match[], predictions: Prediction[]) {
  let runningCorrect = 0;
  return matches.map((match, i) => {
    const matchPreds = predictions.filter(p => p.match_id === match.id);
    const homePicks = matchPreds.filter(p => p.predicted_team === match.home_team).length;
    const awayPicks = matchPreds.filter(p => p.predicted_team === match.away_team).length;
    const majorityTeam = homePicks >= awayPicks ? match.home_team : match.away_team;
    const majorityPct = matchPreds.length > 0 ? (Math.max(homePicks, awayPicks) / matchPreds.length) * 100 : 0;
    const crowdCorrect = majorityTeam === match.winner;
    if (crowdCorrect) runningCorrect++;
    return { matchId: match.id, homeTeam: match.home_team, awayTeam: match.away_team, majorityTeam, majorityPct, crowdCorrect, runningAccuracy: ((runningCorrect / (i + 1)) * 100) };
  });
}

function buildContrarianData(matches: Match[], predictions: Prediction[]) {
  return PARTICIPANTS.map(p => {
    let contrarianPicks = 0, contrarianCorrect = 0, totalPreds = 0;
    matches.forEach(match => {
      const matchPreds = predictions.filter(pr => pr.match_id === match.id);
      const playerPred = matchPreds.find(pr => pr.participant_id === p.id);
      if (!playerPred) return;
      totalPreds++;
      const homePicks = matchPreds.filter(pr => pr.predicted_team === match.home_team).length;
      const awayPicks = matchPreds.filter(pr => pr.predicted_team === match.away_team).length;
      const majorityTeam = homePicks >= awayPicks ? match.home_team : match.away_team;
      if (playerPred.predicted_team !== majorityTeam) {
        contrarianPicks++;
        if (playerPred.predicted_team === match.winner) contrarianCorrect++;
      }
    });
    return {
      name: p.name,
      contrarianPct: totalPreds > 0 ? (contrarianPicks / totalPreds) * 100 : 0,
      contrarianAccuracy: contrarianPicks > 0 ? (contrarianCorrect / contrarianPicks) * 100 : 0,
      color: p.avatar_color,
    };
  });
}

function buildMatchDifficulty(matches: Match[], predictions: Prediction[]) {
  return matches.map(match => {
    const matchPreds = predictions.filter(p => p.match_id === match.id);
    const correct = matchPreds.filter(p => p.predicted_team === match.winner).length;
    return {
      matchId: match.id, homeTeam: match.home_team, awayTeam: match.away_team,
      groupAccuracy: matchPreds.length > 0 ? (correct / matchPreds.length) * 100 : 0,
      totalPredictions: matchPreds.length,
    };
  });
}

function buildFormData(matches: Match[], predictions: Prediction[]) {
  const windowSize = 5;
  return matches.map((_, i) => {
    const entry: any = { matchId: matches[i].id };
    PARTICIPANTS.forEach(p => {
      const start = Math.max(0, i - windowSize + 1);
      const window = matches.slice(start, i + 1);
      let correct = 0, total = 0;
      window.forEach(m => {
        const pred = predictions.find(pr => pr.match_id === m.id && pr.participant_id === p.id);
        if (pred) { total++; if (pred.predicted_team === m.winner) correct++; }
      });
      entry[p.id] = total > 0 ? (correct / total) * 100 : 0;
    });
    return entry;
  });
}

function buildWinRateByTeam(matches: Match[], predictions: Prediction[]) {
  const teams = Object.keys(TEAMS);
  const data: Record<string, Record<string, { correct: number; total: number; rate: number }>> = {};
  PARTICIPANTS.forEach(p => {
    data[p.id] = {};
    teams.forEach(team => {
      const preds = predictions.filter(pr => pr.participant_id === p.id && pr.predicted_team === team);
      let correct = 0;
      preds.forEach(pr => {
        const match = matches.find(m => m.id === pr.match_id);
        if (match && match.winner === team) correct++;
      });
      data[p.id][team] = { correct, total: preds.length, rate: preds.length > 0 ? (correct / preds.length) * 100 : 0 };
    });
  });
  return { participants: PARTICIPANTS.map(p => ({ id: p.id, name: p.name })), teams, data };
}

function buildDoubleHeaderData(matches: Match[], predictions: Prediction[]) {
  const dateMap: Record<string, Match[]> = {};
  matches.forEach(m => {
    if (!dateMap[m.match_date]) dateMap[m.match_date] = [];
    dateMap[m.match_date].push(m);
  });
  const doubleHeaders = Object.entries(dateMap).filter(([, ms]) => ms.length >= 2);
  return PARTICIPANTS.map(p => {
    let totalDH = 0, bothCorrect = 0;
    doubleHeaders.forEach(([, ms]) => {
      const predsForDay = ms.map(m => predictions.find(pr => pr.match_id === m.id && pr.participant_id === p.id));
      if (predsForDay.every(pr => pr)) {
        totalDH++;
        if (ms.every((m, i) => predsForDay[i]?.predicted_team === m.winner)) bothCorrect++;
      }
    });
    return { name: p.name, totalDoubleHeaders: totalDH, bothCorrect, successRate: totalDH > 0 ? (bothCorrect / totalDH) * 100 : 0, color: p.avatar_color };
  });
}

function buildDoubleHeaderHeroes(matches: Match[], predictions: Prediction[]) {
  const dateMap: Record<string, Match[]> = {};
  matches.forEach(m => {
    if (!dateMap[m.match_date]) dateMap[m.match_date] = [];
    dateMap[m.match_date].push(m);
  });
  const dhDays = Object.entries(dateMap).filter(([, ms]) => ms.length >= 2);

  return PARTICIPANTS.map(p => {
    const instances: {
      date: string;
      matches: { matchId: number; homeTeam: string; awayTeam: string; predicted: string; winner: string; correct: boolean }[];
      swept: boolean;
    }[] = [];

    let totalDays = 0;
    let sweptDays = 0;
    let totalBonusPoints = 0;

    dhDays.forEach(([date, dayMatches]) => {
      const preds = dayMatches.map(m => {
        const pred = predictions.find(pr => pr.match_id === m.id && pr.participant_id === p.id);
        return {
          matchId: m.id,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          predicted: pred?.predicted_team || '',
          winner: m.winner || '',
          correct: pred ? pred.predicted_team === m.winner : false,
        };
      });

      const allVoted = preds.every(pr => pr.predicted);
      if (!allVoted) return;

      totalDays++;
      const swept = preds.every(pr => pr.correct);
      if (swept) {
        sweptDays++;
        totalBonusPoints += POINTS_CONFIG.doubleHeaderBonus;
      }

      instances.push({ date, matches: preds, swept });
    });

    return {
      name: p.name,
      color: p.avatar_color,
      totalDays,
      sweptDays,
      totalBonusPoints,
      successRate: totalDays > 0 ? (sweptDays / totalDays) * 100 : 0,
      instances: instances.sort((a, b) => b.date.localeCompare(a.date)),
    };
  })
    .filter(p => p.totalDays > 0)
    .sort((a, b) => b.sweptDays - a.sweptDays || b.successRate - a.successRate);
}

function buildHeatmapData(matches: Match[], predictions: Prediction[]) {
  const relevantMatches = matches.filter(m => m.is_completed || predictions.some(p => p.match_id === m.id));
  const predMap: Record<string, Record<number, { predicted: string; correct: boolean | null }>> = {};
  PARTICIPANTS.forEach(p => {
    predMap[p.id] = {};
    relevantMatches.forEach(m => {
      const pred = predictions.find(pr => pr.match_id === m.id && pr.participant_id === p.id);
      if (pred) {
        predMap[p.id][m.id] = { predicted: pred.predicted_team, correct: m.is_completed ? pred.predicted_team === m.winner : null };
      }
    });
  });
  return {
    participants: PARTICIPANTS.map(p => ({ id: p.id, name: p.name })),
    matches: relevantMatches.map(m => ({ id: m.id, home_team: m.home_team, away_team: m.away_team })),
    predictions: predMap,
  };
}

function buildWallOfShame(matches: Match[], predictions: Prediction[], jokers: any[]) {
  // 1. Wasted Jokers
  const wastedJokers: { name: string; matchId: number; homeTeam: string; awayTeam: string; picked: string; winner: string; color: string }[] = [];
  jokers.forEach((j: any) => {
    if (!j.match_id) return;
    const match = matches.find(m => m.id === j.match_id);
    if (!match || !match.is_completed) return;
    const pred = predictions.find(p => p.match_id === j.match_id && p.participant_id === j.participant_id);
    if (!pred) return;
    if (pred.predicted_team !== match.winner) {
      const participant = PARTICIPANTS.find(p => p.id === j.participant_id);
      wastedJokers.push({
        name: participant?.name || j.participant_id,
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        picked: pred.predicted_team,
        winner: match.winner!,
        color: participant?.avatar_color || '#666',
      });
    }
  });

  // 2. The Jinxer - lowest success when picking the crowd favorite
  const jinxers = PARTICIPANTS.map(p => {
    let pickedFavorite = 0;
    let favoriteWon = 0;
    matches.forEach(match => {
      const matchPreds = predictions.filter(pr => pr.match_id === match.id);
      const playerPred = matchPreds.find(pr => pr.participant_id === p.id);
      if (!playerPred) return;
      const homePicks = matchPreds.filter(pr => pr.predicted_team === match.home_team).length;
      const awayPicks = matchPreds.filter(pr => pr.predicted_team === match.away_team).length;
      const favorite = homePicks >= awayPicks ? match.home_team : match.away_team;
      if (playerPred.predicted_team === favorite) {
        pickedFavorite++;
        if (match.winner === favorite) favoriteWon++;
      }
    });
    return {
      name: p.name,
      pickedFavorite,
      favoriteWon,
      favoriteLost: pickedFavorite - favoriteWon,
      jinxRate: pickedFavorite > 0 ? ((pickedFavorite - favoriteWon) / pickedFavorite) * 100 : 0,
      color: p.avatar_color,
    };
  }).filter(j => j.pickedFavorite > 0).sort((a, b) => b.jinxRate - a.jinxRate);

  // 3. Zero-Streak Club - current and longest losing streaks
  const losingStreaks = PARTICIPANTS.map(p => {
    let currentLosing = 0;
    let longestLosing = 0;
    const sortedMatches = [...matches].sort((a, b) => {
      const d = a.match_date.localeCompare(b.match_date);
      return d !== 0 ? d : a.start_time.localeCompare(b.start_time);
    });
    sortedMatches.forEach(match => {
      const pred = predictions.find(pr => pr.match_id === match.id && pr.participant_id === p.id);
      if (!pred || pred.predicted_team !== match.winner) {
        currentLosing++;
      } else {
        currentLosing = 0;
      }
      if (currentLosing > longestLosing) longestLosing = currentLosing;
    });
    return {
      name: p.name,
      currentLosingStreak: currentLosing,
      longestLosingStreak: longestLosing,
      color: p.avatar_color,
    };
  }).sort((a, b) => b.currentLosingStreak - a.currentLosingStreak);

  return { wastedJokers, jinxers, losingStreaks };
}

interface CopyInstance {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  team: string;
  targetTime: string;
  copierTime: string;
  gapMinutes: number;
}

function buildCopycats(matches: Match[], predictions: Prediction[]) {
  const pairData: Record<string, {
    copier: string; copierName: string; copierColor: string;
    target: string; targetName: string; targetColor: string;
    count: number; matches: number; instances: CopyInstance[];
  }> = {};

  matches.forEach(match => {
    const matchPreds = predictions
      .filter(p => p.match_id === match.id && p.prediction_time)
      .sort((a, b) => new Date(a.prediction_time!).getTime() - new Date(b.prediction_time!).getTime());

    for (let i = 0; i < matchPreds.length; i++) {
      for (let j = i + 1; j < matchPreds.length; j++) {
        const earlier = matchPreds[i];
        const later = matchPreds[j];
        const timeDiff = (new Date(later.prediction_time!).getTime() - new Date(earlier.prediction_time!).getTime()) / 60000;

        if (timeDiff <= 60 && earlier.predicted_team === later.predicted_team) {
          const key = `${later.participant_id}→${earlier.participant_id}`;
          if (!pairData[key]) {
            const copier = PARTICIPANTS.find(p => p.id === later.participant_id);
            const target = PARTICIPANTS.find(p => p.id === earlier.participant_id);
            pairData[key] = {
              copier: later.participant_id,
              copierName: copier?.name || later.participant_id,
              copierColor: copier?.avatar_color || '#666',
              target: earlier.participant_id,
              targetName: target?.name || earlier.participant_id,
              targetColor: target?.avatar_color || '#666',
              count: 0, matches: 0, instances: [],
            };
          }
          pairData[key].count++;
          pairData[key].instances.push({
            matchId: match.id,
            homeTeam: match.home_team,
            awayTeam: match.away_team,
            team: earlier.predicted_team,
            targetTime: earlier.prediction_time!,
            copierTime: later.prediction_time!,
            gapMinutes: Math.round(timeDiff),
          });
        }
      }
    }
  });

  Object.values(pairData).forEach(pair => {
    pair.matches = matches.filter(m =>
      predictions.some(p => p.match_id === m.id && p.participant_id === pair.copier && p.prediction_time) &&
      predictions.some(p => p.match_id === m.id && p.participant_id === pair.target && p.prediction_time)
    ).length;
  });

  return Object.values(pairData)
    .filter(p => p.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function buildPointsMatrix(
  matches: Match[],
  predictions: Prediction[],
  jokers: any[]
) {
  const sorted = [...matches].sort((a, b) => {
    const d = a.match_date.localeCompare(b.match_date);
    return d !== 0 ? d : a.start_time.localeCompare(b.start_time);
  });

  const matchCountByDate: Record<string, number> = {};
  sorted.forEach(m => {
    matchCountByDate[m.match_date] = (matchCountByDate[m.match_date] || 0) + 1;
  });

  const matrix: Record<string, Record<number, number>> = {};

  for (const p of PARTICIPANTS) {
    matrix[p.id] = {};
    const playerPreds = predictions.filter(pr => pr.participant_id === p.id);
    const playerJoker = jokers.find((j: any) => j.participant_id === p.id);

    let currentStreak = 0;
    let streakStart: number | null = null;
    const correctByDate: Record<string, number[]> = {};

    for (const match of sorted) {
      let matchPoints = 0;
      const pred = playerPreds.find(pr => pr.match_id === match.id);

      if (!pred) {
        if (currentStreak >= POINTS_CONFIG.minStreak) {
          matrix[p.id][match.id] = (matrix[p.id][match.id] || 0) + currentStreak;
        }
        currentStreak = 0;
        streakStart = null;
        matrix[p.id][match.id] = matrix[p.id][match.id] || 0;
        continue;
      }

      const isCorrect = pred.predicted_team === match.winner;

      if (isCorrect) {
        matchPoints += getMatchPoints(match.match_type, match.is_power_match);

        if (match.underdog_team && pred.predicted_team === match.underdog_team) {
          matchPoints += POINTS_CONFIG.underdogBonus;
        }

        if (playerJoker && playerJoker.match_id === match.id) {
          matchPoints += POINTS_CONFIG.jokerBonus;
        }

        if (!correctByDate[match.match_date]) correctByDate[match.match_date] = [];
        correctByDate[match.match_date].push(match.id);

        currentStreak++;
        if (currentStreak === 1) streakStart = match.id;
      } else {
        if (currentStreak >= POINTS_CONFIG.minStreak) {
          matchPoints += currentStreak;
        }
        currentStreak = 0;
        streakStart = null;
      }

      matrix[p.id][match.id] = matchPoints;
    }

    // Ongoing streak at the end — attribute to last match
    if (currentStreak >= POINTS_CONFIG.minStreak && sorted.length > 0) {
      const lastMatch = sorted[sorted.length - 1];
      matrix[p.id][lastMatch.id] = (matrix[p.id][lastMatch.id] || 0) + currentStreak;
    }

    // Double header bonus — attribute to 2nd match of the DH day
    for (const [date, correctIds] of Object.entries(correctByDate)) {
      const totalOnDay = matchCountByDate[date] || 0;
      if (totalOnDay >= 2 && correctIds.length >= 2) {
        const dayMatches = sorted.filter(m => m.match_date === date);
        const secondMatch = dayMatches[dayMatches.length - 1];
        if (secondMatch) {
          matrix[p.id][secondMatch.id] = (matrix[p.id][secondMatch.id] || 0) + POINTS_CONFIG.doubleHeaderBonus;
        }
      }
    }
  }

  return {
    matches: sorted.map(m => ({
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      match_type: m.match_type,
      is_power_match: m.is_power_match,
    })),
    matrix,
  };
}

function buildGhostVoters(matches: Match[], predictions: Prediction[]) {
  const totalCompleted = matches.length;
  return PARTICIPANTS.map(p => {
    const missedMatches: { matchId: number; homeTeam: string; awayTeam: string; matchDate: string; reason: 'no_vote' | 'late' }[] = [];
    matches.forEach(match => {
      const pred = predictions.find(pr => pr.match_id === match.id && pr.participant_id === p.id);
      if (!pred) {
        missedMatches.push({ matchId: match.id, homeTeam: match.home_team, awayTeam: match.away_team, matchDate: match.match_date, reason: 'no_vote' });
      } else if (isPredictionLate(pred.prediction_time, match.match_date, match.start_time)) {
        missedMatches.push({ matchId: match.id, homeTeam: match.home_team, awayTeam: match.away_team, matchDate: match.match_date, reason: 'late' });
      }
    });
    return {
      name: p.name,
      color: p.avatar_color,
      missedCount: missedMatches.length,
      noVoteCount: missedMatches.filter(m => m.reason === 'no_vote').length,
      lateCount: missedMatches.filter(m => m.reason === 'late').length,
      participationRate: totalCompleted > 0 ? ((totalCompleted - missedMatches.length) / totalCompleted) * 100 : 100,
      totalMatches: totalCompleted,
      missedMatches,
    };
  }).sort((a, b) => b.missedCount - a.missedCount);
}

function buildTeamVoteTotals(matches: Match[], predictions: Prediction[]) {
  const teams = Object.keys(TEAMS);
  const completedMatchIds = new Set(matches.filter(m => m.is_completed && m.winner).map(m => m.id));
  return teams.map(team => {
    let total = 0, correct = 0, wrong = 0, pending = 0;
    predictions.forEach(p => {
      if (p.predicted_team !== team) return;
      total++;
      if (completedMatchIds.has(p.match_id)) {
        const match = matches.find(m => m.id === p.match_id);
        if (match?.winner === team) correct++; else wrong++;
      } else {
        pending++;
      }
    });
    return {
      team,
      teamName: TEAMS[team]?.name || team,
      color: TEAMS[team]?.color || '#666',
      textColor: TEAMS[team]?.textColor || '#fff',
      total,
      correct,
      wrong,
      pending,
      winRate: (correct + wrong) > 0 ? (correct / (correct + wrong)) * 100 : 0,
    };
  }).sort((a, b) => b.total - a.total);
}

function buildVoteSplits(matches: Match[], predictions: Prediction[]) {
  return matches.map(match => {
    const matchPreds = predictions.filter(p => p.match_id === match.id);
    const validPreds = matchPreds.filter(p => !isPredictionLate(p.prediction_time, match.match_date, match.start_time));
    const homePicks = validPreds.filter(p => p.predicted_team === match.home_team).length;
    const awayPicks = validPreds.filter(p => p.predicted_team === match.away_team).length;
    const totalVotes = homePicks + awayPicks;
    const majorityPct = totalVotes > 0 ? (Math.max(homePicks, awayPicks) / totalVotes) * 100 : 0;
    const majorityTeam = homePicks >= awayPicks ? match.home_team : match.away_team;
    return {
      matchId: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      homePicks,
      awayPicks,
      totalVotes,
      consensusPct: majorityPct,
      majorityTeam,
      majorityCorrect: majorityTeam === match.winner,
      winner: match.winner,
    };
  }).sort((a, b) => b.consensusPct - a.consensusPct);
}

function buildParticipationRate(matches: Match[], predictions: Prediction[]) {
  const totalParticipants = PARTICIPANTS.length;
  let runningTotal = 0;
  const sorted = [...matches].sort((a, b) => {
    const d = a.match_date.localeCompare(b.match_date);
    return d !== 0 ? d : a.start_time.localeCompare(b.start_time);
  });
  return sorted.map((match, i) => {
    const validPreds = predictions.filter(p =>
      p.match_id === match.id && !isPredictionLate(p.prediction_time, match.match_date, match.start_time)
    );
    const rate = (validPreds.length / totalParticipants) * 100;
    runningTotal += rate;
    return {
      matchId: match.id,
      matchLabel: `#${match.id}`,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      matchDate: match.match_date,
      voterCount: validPreds.length,
      totalParticipants,
      rate,
      runningAvg: runningTotal / (i + 1),
    };
  });
}

function buildHomeAwayBias(matches: Match[], predictions: Prediction[]) {
  let groupHomePicks = 0, groupTotalPicks = 0;

  const perPlayer = PARTICIPANTS.map(p => {
    let homePicks = 0, awayPicks = 0;
    matches.forEach(match => {
      const pred = predictions.find(pr => pr.match_id === match.id && pr.participant_id === p.id);
      if (!pred) return;
      if (isPredictionLate(pred.prediction_time, match.match_date, match.start_time)) return;
      if (pred.predicted_team === match.home_team) homePicks++;
      else awayPicks++;
    });
    const total = homePicks + awayPicks;
    groupHomePicks += homePicks;
    groupTotalPicks += total;
    return {
      name: p.name,
      color: p.avatar_color,
      homePicks,
      awayPicks,
      total,
      homeBias: total > 0 ? (homePicks / total) * 100 : 50,
    };
  }).sort((a, b) => b.homeBias - a.homeBias);

  const groupAvg = groupTotalPicks > 0 ? (groupHomePicks / groupTotalPicks) * 100 : 50;
  return { players: perPlayer, groupAvg };
}
