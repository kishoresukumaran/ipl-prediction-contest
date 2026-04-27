import { NextResponse } from 'next/server';
import { fetchAllRows, getSupabaseAdmin } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS, getMatchPoints } from '@/lib/constants';
import { Joker, Match, Prediction, TriviaPoints } from '@/lib/types';
import {
  computeDayOfWeekPerf,
  computePlayerJourney,
  computeRankStats,
  computeWeeklyPlayerDeltas,
  deriveRankHistory,
} from '@/lib/rank-stats';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    // Predictions and trivia_points cross PostgREST's default 1000-row cap once
    // ~30 matches × 29 players are filled in, so we paginate them via
    // `fetchAllRows` to avoid silently truncating the latest matches.
    const [matchesRes, predictionsRes, jokersRes, triviaPtsRes, triviaRes, preTPredsRes, preTActualsRes] = await Promise.all([
      admin.from('matches').select('*').order('match_date').order('start_time'),
      fetchAllRows<Prediction>(() => admin.from('predictions').select('*')),
      admin.from('jokers').select('*'),
      fetchAllRows<TriviaPoints>(() => admin.from('trivia_points').select('*')),
      admin.from('trivia').select('id, question, trivia_date, correct_answer'),
      admin.from('pre_tournament_predictions').select('*'),
      admin.from('pre_tournament_actuals').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (matchesRes.error) {
      return NextResponse.json({ error: matchesRes.error.message }, { status: 500 });
    }
    if (predictionsRes.error) {
      return NextResponse.json({ error: predictionsRes.error.message }, { status: 500 });
    }
    if (jokersRes.error) {
      return NextResponse.json({ error: jokersRes.error.message }, { status: 500 });
    }
    if (triviaPtsRes.error) {
      return NextResponse.json({ error: triviaPtsRes.error.message }, { status: 500 });
    }
    if (triviaRes.error) {
      return NextResponse.json({ error: triviaRes.error.message }, { status: 500 });
    }
    if (preTPredsRes.error) console.error('Pre-tournament predictions query error:', preTPredsRes.error);
    if (preTActualsRes.error) console.error('Pre-tournament actuals query error:', preTActualsRes.error);

    const matches = matchesRes.data || [];
    const predictions = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaPoints = triviaPtsRes.data || [];
    const trivia = triviaRes.data || [];
    const preTournamentPredictions = preTPredsRes.data || [];
    const preTournamentActuals = preTActualsRes.data || null;
    const triviaById = new Map(
      trivia.map((t) => [
        t.id,
        {
          question: t.question || null,
          triviaDate: t.trivia_date || null,
          correctAnswer: t.correct_answer || null,
        },
      ])
    );

    const leaderboard = calculateAllPlayerPoints(PARTICIPANTS, {
      matches,
      predictions,
      jokers,
      triviaPoints,
      preTournamentPredictions,
      preTournamentActuals,
    });
    const completedMatches = matches.filter((m) => m.is_completed && m.winner);
    const pointsRace = buildPointsRace(completedMatches, predictions, jokers, triviaPoints);
    const rankHistory = deriveRankHistory(pointsRace, leaderboard);
    const rankStats = computeRankStats(rankHistory);
    const dayOfWeekPerf = computeDayOfWeekPerf(completedMatches, predictions);
    const weeklyDeltas = computeWeeklyPlayerDeltas(
      matches,
      predictions,
      jokers,
      triviaPoints,
      preTournamentPredictions,
      preTournamentActuals
    );

    const players = leaderboard.map((player) => {
      const participant = PARTICIPANTS.find((p) => p.id === player.participantId);
      const playerJoker = jokers.find((j) => j.participant_id === player.participantId);

      // Team affinity: count how many times they predicted each team
      const playerPreds = predictions.filter((p) => p.participant_id === player.participantId);
      const teamCounts: Record<string, number> = {};
      playerPreds.forEach((p) => {
        teamCounts[p.predicted_team] = (teamCounts[p.predicted_team] || 0) + 1;
      });
      const teamAffinity = Object.entries(teamCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([team, count]) => ({ team, count }));

      // Per-match prediction history
      const orderedCompletedMatches = matches
        .filter((m) => m.is_completed && m.winner)
        .sort((a, b) => {
          const dateCompare = a.match_date.localeCompare(b.match_date);
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        });

      const predictionHistory = orderedCompletedMatches.map((match) => {
        const pred = playerPreds.find((p) => p.match_id === match.id);
        let isCorrect: boolean | 'abandoned' = false;
        if (pred) {
          if (match.winner === 'ABANDONED') {
            isCorrect = 'abandoned';
          } else {
            isCorrect = pred.predicted_team === match.winner;
          }
        }
        return {
          matchId: match.id,
          matchDate: match.match_date,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          winner: match.winner,
          predictedTeam: pred?.predicted_team || null,
          isCorrect,
        };
      });

      // The Hater: which team they bet against the most
      const betAgainst: Record<string, number> = {};
      orderedCompletedMatches.forEach(match => {
        const pred = playerPreds.find(p => p.match_id === match.id);
        if (!pred) return;
        // They bet against the team they didn't pick
        const against = pred.predicted_team === match.home_team ? match.away_team : match.home_team;
        betAgainst[against] = (betAgainst[against] || 0) + 1;
      });
      const hatedTeams = Object.entries(betAgainst)
        .sort((a, b) => b[1] - a[1])
        .map(([team, count]) => ({ team, count }));

      // Most Profitable Team: which team earned them the most points when picked
      const teamProfit: Record<string, number> = {};
      orderedCompletedMatches.forEach(match => {
        const pred = playerPreds.find(p => p.match_id === match.id);
        if (!pred || pred.predicted_team !== match.winner) return;
        const pts = getMatchPoints(match.match_type, match.is_power_match);
        teamProfit[pred.predicted_team] = (teamProfit[pred.predicted_team] || 0) + pts;
      });
      const profitableTeams = Object.entries(teamProfit)
        .sort((a, b) => b[1] - a[1])
        .map(([team, points]) => ({ team, points }));

      // Pre-tournament prediction for this player (matched on display name, case-insensitive)
      const preTournamentPrediction =
        preTournamentPredictions.find(
          (pt) => pt.player.toLowerCase() === player.participantName.toLowerCase()
        ) || null;
      const triviaHistory = triviaPoints
        .filter((tp) => (tp.player || '').toLowerCase() === player.participantName.toLowerCase())
        .map((tp) => {
          const triviaMeta = triviaById.get(tp.trivia_id);
          return {
            triviaId: tp.trivia_id,
            question: triviaMeta?.question || null,
            triviaDate: triviaMeta?.triviaDate || null,
            prediction: tp.prediction || null,
            correctAnswer: tp.correct_answer || triviaMeta?.correctAnswer || null,
            isCorrect: tp.correct_check === 1,
            points: tp.points_earned || 0,
          };
        })
        .sort((a, b) => a.triviaId - b.triviaId);

      return {
        ...player,
        avatarColor: participant?.avatar_color || '#666',
        jokerMatchId: playerJoker?.match_id || null,
        jokerUsed: !!playerJoker?.match_id,
        teamAffinity,
        hatedTeams,
        profitableTeams,
        predictionHistory,
        triviaHistory,
        preTournamentPrediction,
        preTournamentActuals,
        journey: computePlayerJourney(
          player.participantId,
          rankHistory,
          rankStats,
          dayOfWeekPerf,
          weeklyDeltas
        ),
      };
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error('Players API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildPointsRace(matches: Match[], predictions: Prediction[], jokers: Joker[], triviaPoints: TriviaPoints[]) {
  const result: Array<{ matchId: number; matchDate: string; [key: string]: number | string }> = [];
  for (let i = 1; i <= matches.length; i++) {
    const subMatches = matches.slice(0, i);
    const matchIds = new Set(subMatches.map((m) => m.id));
    const subPredictions = predictions.filter((p) => matchIds.has(p.match_id));
    const scores = calculateAllPlayerPoints(PARTICIPANTS, {
      matches: subMatches,
      predictions: subPredictions,
      jokers,
      triviaPoints,
    });
    const entry: { matchId: number; matchDate: string; [key: string]: number | string } = {
      matchId: matches[i - 1].id,
      matchDate: matches[i - 1].match_date,
    };
    scores.forEach((score) => {
      entry[score.participantId] = score.totalPoints;
    });
    result.push(entry);
  }
  return result;
}
