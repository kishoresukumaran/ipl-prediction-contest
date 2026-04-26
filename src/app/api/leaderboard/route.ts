import { NextResponse } from 'next/server';
import { fetchAllRows, getSupabaseAdmin } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS } from '@/lib/constants';
import { Prediction, TriviaPoints } from '@/lib/types';

export const revalidate = 30;

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    // Predictions and trivia_points cross PostgREST's default 1000-row cap
    // once predictions accumulate, so we paginate them via `fetchAllRows`
    // instead of relying on a single capped `select('*')`.
    const [matchesRes, predictionsRes, jokersRes, triviaPtsRes, preTPredsRes, preTActualsRes] = await Promise.all([
      admin.from('matches').select('*').order('match_date').order('start_time'),
      fetchAllRows<Prediction>(() => admin.from('predictions').select('*')),
      admin.from('jokers').select('*'),
      fetchAllRows<TriviaPoints>(() => admin.from('trivia_points').select('*')),
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
      console.error('Trivia Points query error:', triviaPtsRes.error);
      return NextResponse.json({ error: triviaPtsRes.error.message }, { status: 500 });
    }
    if (preTPredsRes.error) {
      console.error('Pre-tournament predictions query error:', preTPredsRes.error);
    }
    if (preTActualsRes.error) {
      console.error('Pre-tournament actuals query error:', preTActualsRes.error);
    }

    const matches = matchesRes.data || [];
    const predictions = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaPoints = triviaPtsRes.data || [];
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

    // Add avatar color and last 5 match results for each player
    const completedMatches = matches
      .filter((m) => m.is_completed && m.winner)
      .sort((a, b) => {
        const dateCompare = a.match_date.localeCompare(b.match_date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });

    const enriched = leaderboard.map((player) => {
      const participant = PARTICIPANTS.find((p) => p.id === player.participantId);
      const playerPreds = predictions.filter((p) => p.participant_id === player.participantId);

      // Last 5 completed matches result (correct/wrong/abandoned/no prediction)
      const last5 = completedMatches.slice(-5).map((match) => {
        const pred = playerPreds.find((p) => p.match_id === match.id);
        if (!pred) return 'none';
        if (match.winner === 'ABANDONED') return 'abandoned';
        return pred.predicted_team === match.winner ? 'correct' : 'wrong';
      });

      return {
        ...player,
        avatarColor: participant?.avatar_color || '#666',
        last5Results: last5,
      };
    });

    return NextResponse.json({
      leaderboard: enriched,
      totalMatches: matches.length,
      completedMatches: completedMatches.length,
    });
  } catch (err) {
    console.error('Leaderboard API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
