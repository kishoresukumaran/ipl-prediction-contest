import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS, TEAMS } from '@/lib/constants';
import { Match, Prediction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [matchesRes, predictionsRes, jokersRes, triviaRes, bonusQRes, bonusRRes] = await Promise.all([
      supabase.from('matches').select('*').order('match_date').order('start_time'),
      supabase.from('predictions').select('*'),
      supabase.from('jokers').select('*'),
      supabase.from('trivia_responses').select('*'),
      supabase.from('bonus_questions').select('*'),
      supabase.from('bonus_responses').select('*'),
    ]);

    const matches: Match[] = matchesRes.data || [];
    const predictions: Prediction[] = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaResponses = triviaRes.data || [];
    const bonusQuestions = bonusQRes.data || [];
    const bonusResponses = bonusRRes.data || [];

    const leaderboard = calculateAllPlayerPoints(PARTICIPANTS, { matches, predictions, jokers, triviaResponses, bonusQuestions, bonusResponses });
    const completedMatches = matches.filter(m => m.is_completed && m.winner);

    const pointsRace = buildPointsRace(completedMatches, predictions, jokers, triviaResponses, bonusQuestions, bonusResponses);
    const teamPopularity = buildTeamPopularity(completedMatches, predictions);
    const accuracyByPlayer = leaderboard.map(p => ({
      id: p.participantId, name: p.participantName,
      accuracy: p.accuracy, correct: p.correctPredictions, total: p.totalPredictions,
    }));
    const predictionTimings = buildPredictionTimings(matches, predictions);
    const weeklyPoints = buildWeeklyPoints(completedMatches, predictions, jokers, triviaResponses, bonusQuestions, bonusResponses);
    const crowdWisdom = buildCrowdWisdom(completedMatches, predictions);
    const contrarianData = buildContrarianData(completedMatches, predictions);
    const matchDifficulty = buildMatchDifficulty(completedMatches, predictions);
    const formData = buildFormData(completedMatches, predictions);
    const winRateByTeam = buildWinRateByTeam(completedMatches, predictions);
    const doubleHeaderData = buildDoubleHeaderData(completedMatches, predictions);
    const heatmapData = buildHeatmapData(matches, predictions);

    const streakData = leaderboard.map(p => ({
      name: p.participantName,
      longestStreak: p.longestStreak,
      currentStreak: p.currentStreak,
      color: PARTICIPANTS.find(pp => pp.id === p.participantId)?.avatar_color || '#666',
    }));

    // Bonus question accuracy per player
    const bonusAccuracy = buildBonusAccuracy(bonusQuestions, bonusResponses);

    return NextResponse.json({
      leaderboard, matches, predictions, pointsRace, teamPopularity,
      accuracyByPlayer, predictionTimings, weeklyPoints, crowdWisdom,
      contrarianData, matchDifficulty, formData, winRateByTeam,
      doubleHeaderData, heatmapData, streakData, bonusAccuracy,
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Failed to compute insights' }, { status: 500 });
  }
}

function buildPointsRace(matches: Match[], predictions: Prediction[], jokers: any[], triviaResponses: any[], bonusQuestions: any[] = [], bonusResponses: any[] = []) {
  const result: any[] = [];
  for (let i = 1; i <= matches.length; i++) {
    const subMatches = matches.slice(0, i);
    const matchIds = new Set(subMatches.map(m => m.id));
    const subPredictions = predictions.filter(p => matchIds.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: subMatches, predictions: subPredictions, jokers, triviaResponses, bonusQuestions, bonusResponses,
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

function buildPredictionTimings(matches: Match[], predictions: Prediction[]) {
  return PARTICIPANTS.map(participant => {
    const preds = predictions.filter(p => p.participant_id === participant.id && p.prediction_time);
    if (preds.length === 0) return { id: participant.id, name: participant.name, avgMinutesBefore: 0 };
    let totalMinutes = 0, count = 0;
    preds.forEach(p => {
      const match = matches.find(m => m.id === p.match_id);
      if (!match || !p.prediction_time) return;
      const matchTime = new Date(`${match.match_date}T${match.start_time}:00+05:30`);
      const predTime = new Date(p.prediction_time);
      const diff = (matchTime.getTime() - predTime.getTime()) / 60000;
      if (diff > 0) { totalMinutes += diff; count++; }
    });
    return { id: participant.id, name: participant.name, avgMinutesBefore: count > 0 ? totalMinutes / count : 0 };
  });
}

function buildWeeklyPoints(matches: Match[], predictions: Prediction[], jokers: any[], triviaResponses: any[], bonusQuestions: any[] = [], bonusResponses: any[] = []) {
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
    return { matchId: match.id, majorityTeam, majorityPct, crowdCorrect, runningAccuracy: ((runningCorrect / (i + 1)) * 100) };
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

function buildBonusAccuracy(bonusQuestions: any[], bonusResponses: any[]) {
  if (!bonusQuestions.length) return [];

  return PARTICIPANTS.map(p => {
    const responses = bonusResponses.filter((r: any) => r.participant_id === p.id);
    const correct = responses.filter((r: any) => r.is_correct).length;
    const total = responses.length;

    // Calculate total bonus points earned
    let points = 0;
    responses.forEach((r: any) => {
      if (r.is_correct) {
        const q = bonusQuestions.find((q: any) => q.id === r.bonus_question_id);
        points += q?.points || 1;
      }
    });

    return {
      name: p.name,
      correct,
      total,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      points,
      color: p.avatar_color,
    };
  });
}
