import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS, TEAMS, POINTS_CONFIG, getMatchPoints } from '@/lib/constants';
import { Match, Prediction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const [matchesRes, predictionsRes, jokersRes, triviaPtsRes, triviaRes, preTPredsRes, preTActualsRes] = await Promise.all([
      admin.from('matches').select('*').order('match_date').order('start_time'),
      admin.from('predictions').select('*'),
      admin.from('jokers').select('*'),
      admin.from('trivia_points').select('*'),
      admin.from('trivia').select('id, trivia_date'),
      admin.from('pre_tournament_predictions').select('*'),
      admin.from('pre_tournament_actuals').select('*').eq('id', 1).maybeSingle(),
    ]);

    const matches: Match[] = matchesRes.data || [];
    const predictions: Prediction[] = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaPoints = triviaPtsRes.data || [];
    const triviaDateMap = new Map<number, string>(
      (triviaRes.data || []).map((t: { id: number; trivia_date: string }) => [t.id, t.trivia_date])
    );
    const preTournamentPredictions = preTPredsRes.data || [];
    const preTournamentActuals = preTActualsRes.data || null;

    const leaderboard = calculateAllPlayerPoints(PARTICIPANTS, {
      matches,
      predictions,
      jokers,
      triviaPoints,
      preTournamentPredictions,
      preTournamentActuals,
    });
    const completedMatches = matches.filter(m => m.is_completed && m.winner);

    const pointsRace = buildPointsRace(completedMatches, predictions, jokers, triviaPoints);
    const teamPopularity = buildTeamPopularity(completedMatches, predictions);
    const accuracyByPlayer = leaderboard.map(p => ({
      id: p.participantId, name: p.participantName,
      accuracy: p.accuracy, correct: p.correctPredictions, total: p.totalPredictions,
    }));
    const weeklyPoints = buildWeeklyPoints(completedMatches, predictions, jokers, triviaPoints, triviaDateMap);
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
    const streakAchievements = buildStreakAchievements(leaderboard, completedMatches, predictions);

    // Wall of Shame data
    const wallOfShame = buildWallOfShame(completedMatches, predictions, jokers);

    // Points matrix
    const pointsMatrix = buildPointsMatrix(completedMatches, predictions, jokers, triviaPoints);

    // Trivia stats
    const triviaStats = buildTriviaStats(triviaPoints);

    // Votes tab data
    const ghostVoters = buildGhostVoters(completedMatches, predictions);
    const teamVoteTotals = buildTeamVoteTotals(matches, predictions);
    const voteSplits = buildVoteSplits(completedMatches, predictions);
    const participationRate = buildParticipationRate(completedMatches, predictions);
    const homeAwayBias = buildHomeAwayBias(completedMatches, predictions);

    // Crystal Ball: per-player breakdown for PointsMatrix sub-row
    const preTournamentByPlayer: Record<string, number> = {};
    leaderboard.forEach((p) => {
      if (p.preTournamentPoints > 0) preTournamentByPlayer[p.participantId] = p.preTournamentPoints;
    });

    // Inject into pointsMatrix so PointsMatrixChart receives it via its `data` prop
    const pointsMatrixWithCrystal = { ...pointsMatrix, preTournamentByPlayer };

    return NextResponse.json({
      leaderboard, matches, predictions, pointsRace, teamPopularity,
      accuracyByPlayer, weeklyPoints, crowdWisdom,
      contrarianData, matchDifficulty, formData, winRateByTeam,
      doubleHeaderData, doubleHeaderHeroes, heatmapData, streakData, streakAchievements, wallOfShame,
      pointsMatrix: pointsMatrixWithCrystal, triviaStats,
      ghostVoters, teamVoteTotals, voteSplits, participationRate, homeAwayBias,
      preTournamentByPlayer,
      preTournamentPredictions,
      preTournamentActuals,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Failed to compute insights' }, { status: 500 });
  }
}

function buildStreakAchievements(
  leaderboard: Awaited<ReturnType<typeof calculateAllPlayerPoints>>,
  matches: Match[],
  predictions: Prediction[]
) {
  const sortedMatches = [...matches].sort((a, b) => {
    const dateDiff = a.match_date.localeCompare(b.match_date);
    if (dateDiff !== 0) return dateDiff;
    return a.start_time.localeCompare(b.start_time);
  });

  const matchIndexById = new Map<number, number>();
  sortedMatches.forEach((match, idx) => {
    matchIndexById.set(match.id, idx);
  });

  return leaderboard
    .map((player) => {
      const streakInstances = player.streaks.map((streak, streakIndex) => {
        const startIdx = matchIndexById.get(streak.start);
        const endIdx = matchIndexById.get(streak.end);
        if (startIdx === undefined || endIdx === undefined) {
          return {
            id: `${player.participantId}-${streakIndex}`,
            startMatchId: streak.start,
            endMatchId: streak.end,
            length: streak.length,
            matches: [],
          };
        }

        const segment = sortedMatches.slice(startIdx, endIdx + 1);
        const matchDetails = segment.map((match) => {
          const playerPrediction = predictions.find(
            (pred) => pred.match_id === match.id && pred.participant_id === player.participantId
          );
          const winner = match.winner || '';
          const isAbandoned = winner === 'ABANDONED';
          const predicted = playerPrediction?.predicted_team || '';
          return {
            matchId: match.id,
            homeTeam: match.home_team,
            awayTeam: match.away_team,
            predicted,
            winner,
            isAbandoned,
            correct: isAbandoned ? true : predicted !== '' && predicted === winner,
          };
        });

        return {
          id: `${player.participantId}-${streakIndex}`,
          startMatchId: streak.start,
          endMatchId: streak.end,
          length: streak.length,
          matches: matchDetails,
        };
      });

      return {
        playerId: player.participantId,
        name: player.participantName,
        color: PARTICIPANTS.find((p) => p.id === player.participantId)?.avatar_color || '#666',
        streakCount: player.streaks.length,
        longestStreak: player.longestStreak,
        currentStreak: player.currentStreak,
        streaks: streakInstances,
      };
    })
    .sort((a, b) => b.streakCount - a.streakCount || b.longestStreak - a.longestStreak || a.name.localeCompare(b.name));
}

function buildPointsRace(matches: Match[], predictions: Prediction[], jokers: any[], triviaPoints: any[]) {
  const result: any[] = [];
  for (let i = 1; i <= matches.length; i++) {
    const subMatches = matches.slice(0, i);
    const matchIds = new Set(subMatches.map(m => m.id));
    const subPredictions = predictions.filter(p => matchIds.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: subMatches, predictions: subPredictions, jokers, triviaPoints,
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
      // Skip abandoned matches from accuracy calculation
      if (match.winner === 'ABANDONED') return;
      if (match.winner === team) correct++; else wrong++;
    });
    return { team, correct, wrong, total: correct + wrong };
  });
}

const WEEKLY_CATEGORIES = [
  'basePoints', 'powerMatchPoints', 'underdogBonus', 'jokerBonus',
  'streakBonus', 'doubleHeaderBonus', 'abandonedPoints', 'triviaPoints',
] as const;

function buildWeeklyPoints(
  matches: Match[],
  predictions: Prediction[],
  jokers: any[],
  triviaPoints: any[],
  triviaDateMap: Map<number, string>,
) {
  // Group matches by week (Sunday start)
  const weeks: Record<string, Match[]> = {};
  matches.forEach(m => {
    const date = new Date(m.match_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(m);
  });

  // Group trivia points by week using the trivia date map
  const weeklyTriviaMap: Record<string, any[]> = {};
  for (const tp of triviaPoints) {
    const date = triviaDateMap.get(tp.trivia_id);
    if (!date) continue;
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    const key = d.toISOString().split('T')[0];
    if (!weeklyTriviaMap[key]) weeklyTriviaMap[key] = [];
    weeklyTriviaMap[key].push(tp);
  }

  // Cumulative diff: correctly handles cross-week streaks, jokers, and now trivia.
  // Each week's points = total with all data up to this week minus previous week's cumulative total.
  const sortedWeekKeys = Object.keys(weeks).sort();
  const result = [];
  let cumulativeMatches: Match[] = [];
  let cumulativeTriviaPoints: any[] = [];
  const prevTotals: Record<string, number> = {};
  const prevCatTotals: Record<string, number> = {};

  for (const weekKey of sortedWeekKeys) {
    cumulativeMatches = [...cumulativeMatches, ...weeks[weekKey]];
    cumulativeTriviaPoints = [...cumulativeTriviaPoints, ...(weeklyTriviaMap[weekKey] || [])];

    const matchIds = new Set(cumulativeMatches.map(m => m.id));
    const cumulativePreds = predictions.filter(p => matchIds.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: cumulativeMatches, predictions: cumulativePreds, jokers,
      triviaPoints: cumulativeTriviaPoints,
    });

    const entry: any = { week: new Date(weekKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) };

    // Per-player point diffs
    scores.forEach(s => {
      entry[s.participantId] = s.totalPoints - (prevTotals[s.participantId] || 0);
      prevTotals[s.participantId] = s.totalPoints;
    });

    // Per-category totals across all players (underscore-prefixed; Recharts ignores them for rendering)
    for (const cat of WEEKLY_CATEGORIES) {
      const cumTotal = scores.reduce((sum, s) => sum + ((s as any)[cat] || 0), 0);
      entry[`_${cat}`] = cumTotal - (prevCatTotals[cat] || 0);
      prevCatTotals[cat] = cumTotal;
    }

    result.push(entry);
  }

  return result;
}

function buildCrowdWisdom(matches: Match[], predictions: Prediction[]) {
  const nonAbandonedMatches = matches.filter(m => m.winner !== 'ABANDONED');
  let runningCorrect = 0;
  return nonAbandonedMatches.map((match, i) => {
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
  const nonAbandonedMatches = matches.filter(m => m.winner !== 'ABANDONED');
  return PARTICIPANTS.map(p => {
    let contrarianPicks = 0, contrarianCorrect = 0, totalPreds = 0;
    nonAbandonedMatches.forEach(match => {
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
  const nonAbandonedMatches = matches.filter(m => m.winner !== 'ABANDONED');
  return nonAbandonedMatches.map(match => {
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
  const nonAbandonedMatches = matches.filter(m => m.winner !== 'ABANDONED');
  return nonAbandonedMatches.map((_, i) => {
    const entry: any = { matchId: nonAbandonedMatches[i].id };
    PARTICIPANTS.forEach(p => {
      const start = Math.max(0, i - windowSize + 1);
      const window = nonAbandonedMatches.slice(start, i + 1);
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
        // Skip abandoned matches from win rate calculation
        if (match && match.winner !== 'ABANDONED' && match.winner === team) correct++;
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
  const predMap: Record<string, Record<number, { predicted: string; correct: boolean | null | 'abandoned' }>> = {};
  PARTICIPANTS.forEach(p => {
    predMap[p.id] = {};
    relevantMatches.forEach(m => {
      const pred = predictions.find(pr => pr.match_id === m.id && pr.participant_id === p.id);
      if (pred) {
        let correct: boolean | null | 'abandoned';
        if (m.is_completed) {
          if (m.winner === 'ABANDONED') {
            correct = 'abandoned';
          } else {
            correct = pred.predicted_team === m.winner;
          }
        } else {
          correct = null;
        }
        predMap[p.id][m.id] = { predicted: pred.predicted_team, correct };
      }
    });
  });
  return {
    participants: PARTICIPANTS.map(p => ({ id: p.id, name: p.name })),
    matches: relevantMatches.map(m => ({ id: m.id, home_team: m.home_team, away_team: m.away_team, is_abandoned: m.winner === 'ABANDONED' })),
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
    // Skip abandoned matches (joker is invalidated, not wasted)
    if (match.winner === 'ABANDONED') return;
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
    const jinxMatches: { matchId: number; homeTeam: string; awayTeam: string; favorite: string; winner: string | null; jinxed: boolean; voteShare: number; totalVotes: number }[] = [];
    matches.forEach(match => {
      const matchPreds = predictions.filter(pr => pr.match_id === match.id);
      const playerPred = matchPreds.find(pr => pr.participant_id === p.id);
      if (!playerPred) return;
      const homePicks = matchPreds.filter(pr => pr.predicted_team === match.home_team).length;
      const awayPicks = matchPreds.filter(pr => pr.predicted_team === match.away_team).length;
      const favorite = homePicks >= awayPicks ? match.home_team : match.away_team;
      const favoriteVotes = Math.max(homePicks, awayPicks);
      const totalVotes = matchPreds.length;
      if (playerPred.predicted_team === favorite) {
        pickedFavorite++;
        const won = match.winner === favorite;
        if (won) favoriteWon++;
        jinxMatches.push({
          matchId: match.id,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          favorite,
          winner: match.winner || null,
          jinxed: !won,
          voteShare: totalVotes > 0 ? Math.round((favoriteVotes / totalVotes) * 100) : 0,
          totalVotes,
        });
      }
    });
    return {
      name: p.name,
      pickedFavorite,
      favoriteWon,
      favoriteLost: pickedFavorite - favoriteWon,
      jinxRate: pickedFavorite > 0 ? ((pickedFavorite - favoriteWon) / pickedFavorite) * 100 : 0,
      color: p.avatar_color,
      jinxMatches,
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

interface CellData {
  total: number;
  base: number;
  powerMatch: number;
  underdog: number;
  joker: number;
  streak: number;
  doubleHeader: number;
  abandoned: number;
}

function buildPointsMatrix(
  matches: Match[],
  predictions: Prediction[],
  jokers: any[],
  triviaPoints: any[]
): {
  matches: Array<{ id: number; home_team: string; away_team: string; match_type: string; is_power_match: boolean; is_abandoned: boolean }>;
  matrix: Record<string, Record<number, CellData>>;
  triviaByPlayer: Record<string, number>;
} {
  const sorted = [...matches].sort((a, b) => {
    const d = a.match_date.localeCompare(b.match_date);
    return d !== 0 ? d : a.start_time.localeCompare(b.start_time);
  });

  const matchCountByDate: Record<string, number> = {};
  sorted.forEach(m => {
    matchCountByDate[m.match_date] = (matchCountByDate[m.match_date] || 0) + 1;
  });

  const emptyCell = (): CellData => ({ total: 0, base: 0, powerMatch: 0, underdog: 0, joker: 0, streak: 0, doubleHeader: 0, abandoned: 0 });
  const matrix: Record<string, Record<number, CellData>> = {};

  for (const p of PARTICIPANTS) {
    matrix[p.id] = {};
    const playerPreds = predictions.filter(pr => pr.participant_id === p.id);
    const playerJoker = jokers.find((j: any) => j.participant_id === p.id);

    let currentStreak = 0;
    let streakStart: number | null = null;
    const correctByDate: Record<string, number[]> = {};

    for (const match of sorted) {
      const cell = emptyCell();
      const pred = playerPreds.find(pr => pr.match_id === match.id);

      // Handle abandoned matches: all players get 2 points
      if (match.winner === 'ABANDONED') {
        cell.abandoned = 2;
        cell.total = 2;

        currentStreak++;
        if (currentStreak === 1) streakStart = match.id;

        // Counts as correct for double header bonus
        if (!correctByDate[match.match_date]) correctByDate[match.match_date] = [];
        correctByDate[match.match_date].push(match.id);

        matrix[p.id][match.id] = cell;
        continue;
      }

      if (!pred) {
        if (currentStreak >= POINTS_CONFIG.minStreak) {
          cell.streak = currentStreak;
          cell.total = currentStreak;
        }
        currentStreak = 0;
        streakStart = null;
        matrix[p.id][match.id] = cell;
        continue;
      }

      const isCorrect = pred.predicted_team === match.winner;

      if (isCorrect) {
        const matchPts = getMatchPoints(match.match_type, match.is_power_match);
        if (match.is_power_match && match.match_type === 'league') {
          cell.powerMatch = matchPts;
        } else {
          cell.base = matchPts;
        }

        if (match.underdog_team && pred.predicted_team === match.underdog_team) {
          cell.underdog = POINTS_CONFIG.underdogBonus;
        }

        if (playerJoker && playerJoker.match_id === match.id) {
          cell.joker = POINTS_CONFIG.jokerBonus;
        }

        if (!correctByDate[match.match_date]) correctByDate[match.match_date] = [];
        correctByDate[match.match_date].push(match.id);

        currentStreak++;
        if (currentStreak === 1) streakStart = match.id;
      } else {
        if (currentStreak >= POINTS_CONFIG.minStreak) {
          cell.streak = currentStreak;
        }
        currentStreak = 0;
        streakStart = null;
      }

      cell.total = cell.base + cell.powerMatch + cell.underdog + cell.joker + cell.streak;
      matrix[p.id][match.id] = cell;
    }

    // Ongoing streak at the end — attribute to last match
    if (currentStreak >= POINTS_CONFIG.minStreak && sorted.length > 0) {
      const lastMatch = sorted[sorted.length - 1];
      const cell = matrix[p.id][lastMatch.id];
      cell.streak += currentStreak;
      cell.total += currentStreak;
    }

    // Double header bonus — attribute to 2nd match of the DH day
    for (const [date, correctIds] of Object.entries(correctByDate)) {
      const totalOnDay = matchCountByDate[date] || 0;
      if (totalOnDay >= 2 && correctIds.length >= 2) {
        const dayMatches = sorted.filter(m => m.match_date === date);
        const secondMatch = dayMatches[dayMatches.length - 1];
        if (secondMatch) {
          const cell = matrix[p.id][secondMatch.id];
          cell.doubleHeader += POINTS_CONFIG.doubleHeaderBonus;
          cell.total += POINTS_CONFIG.doubleHeaderBonus;
        }
      }
    }
  }

  // Build trivia totals per player (keyed by participant id)
  const triviaByPlayer: Record<string, number> = {};
  for (const p of PARTICIPANTS) {
    const playerTrivia = triviaPoints.filter(
      (tp: any) => tp.player?.toLowerCase() === p.name.toLowerCase()
    );
    const total = playerTrivia.reduce((sum: number, tp: any) => sum + (tp.points_earned || 0), 0);
    if (total > 0) triviaByPlayer[p.id] = total;
  }

  return {
    matches: sorted.map(m => ({
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      match_type: m.match_type,
      is_power_match: m.is_power_match,
      is_abandoned: m.winner === 'ABANDONED',
    })),
    matrix,
    triviaByPlayer,
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
      }
    });
    return {
      name: p.name,
      color: p.avatar_color,
      missedCount: missedMatches.length,
      noVoteCount: missedMatches.filter(m => m.reason === 'no_vote').length,
      lateCount: 0,
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
    const homePicks = matchPreds.filter(p => p.predicted_team === match.home_team).length;
    const awayPicks = matchPreds.filter(p => p.predicted_team === match.away_team).length;
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
    const matchPreds = predictions.filter(p => p.match_id === match.id);
    const rate = (matchPreds.length / totalParticipants) * 100;
    runningTotal += rate;
    return {
      matchId: match.id,
      matchLabel: `#${match.id}`,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      matchDate: match.match_date,
      voterCount: matchPreds.length,
      totalParticipants,
      rate,
      runningAvg: runningTotal / (i + 1),
    };
  });
}

function buildTriviaStats(triviaPoints: any[]) {
  // byPlayer
  const playerMap: Record<string, {
    name: string;
    color: string;
    total: number;
    correct: number;
    attempted: number;
    rounds: { triviaId: number; prediction: string; correctAnswer: string; correct: boolean; points: number }[];
  }> = {};

  for (const p of PARTICIPANTS) {
    playerMap[p.name.toLowerCase()] = {
      name: p.name,
      color: p.avatar_color,
      total: 0,
      correct: 0,
      attempted: 0,
      rounds: [],
    };
  }

  for (const row of triviaPoints) {
    const key = (row.player || '').toLowerCase();
    if (!playerMap[key]) continue;
    const entry = playerMap[key];
    entry.attempted++;
    entry.total += row.points_earned || 0;
    const isCorrect = row.correct_check === 1;
    if (isCorrect) entry.correct++;
    entry.rounds.push({
      triviaId: row.trivia_id,
      prediction: row.prediction || '',
      correctAnswer: row.correct_answer || '',
      correct: isCorrect,
      points: row.points_earned || 0,
    });
  }

  const byPlayer = Object.values(playerMap)
    .map(p => ({
      ...p,
      accuracy: p.attempted > 0 ? (p.correct / p.attempted) * 100 : 0,
      allCorrect: p.attempted > 0 && p.correct === p.attempted,
      rounds: p.rounds.sort((a, b) => a.triviaId - b.triviaId),
    }))
    .sort((a, b) => b.total - a.total || b.correct - a.correct);

  // byQuestion
  const questionMap: Record<number, {
    triviaId: number;
    correctAnswer: string;
    results: { name: string; color: string; prediction: string; correct: boolean; points: number }[];
  }> = {};

  for (const row of triviaPoints) {
    const qid = row.trivia_id;
    if (!questionMap[qid]) {
      questionMap[qid] = {
        triviaId: qid,
        correctAnswer: row.correct_answer || '',
        results: [],
      };
    }
    // Prefer whichever row has a non-empty correct_answer
    if (row.correct_answer && !questionMap[qid].correctAnswer) {
      questionMap[qid].correctAnswer = row.correct_answer;
    }
    const participant = PARTICIPANTS.find(p => p.name.toLowerCase() === (row.player || '').toLowerCase());
    if (!participant) continue;
    questionMap[qid].results.push({
      name: participant.name,
      color: participant.avatar_color,
      prediction: row.prediction || '',
      correct: row.correct_check === 1,
      points: row.points_earned || 0,
    });
  }

  const byQuestion = Object.values(questionMap)
    .map(q => {
      const attempted = q.results.length;
      const correctCount = q.results.filter(r => r.correct).length;
      return {
        ...q,
        totalAttempted: attempted,
        correctCount,
        stumpedEveryone: attempted > 0 && correctCount === 0,
        easyRound: attempted > 0 && correctCount === attempted,
        results: q.results.sort((a, b) => Number(b.correct) - Number(a.correct) || b.points - a.points),
      };
    })
    .sort((a, b) => a.triviaId - b.triviaId);

  return { byPlayer, byQuestion };
}

function buildHomeAwayBias(matches: Match[], predictions: Prediction[]) {
  let groupHomePicks = 0, groupTotalPicks = 0;

  const perPlayer = PARTICIPANTS.map(p => {
    let homePicks = 0, awayPicks = 0;
    matches.forEach(match => {
      const pred = predictions.find(pr => pr.match_id === match.id && pr.participant_id === p.id);
      if (!pred) return;
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
