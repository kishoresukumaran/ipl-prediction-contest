import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS } from '@/lib/constants';

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

    if (matchesRes.error) {
      return NextResponse.json({ error: matchesRes.error.message }, { status: 500 });
    }
    if (predictionsRes.error) {
      return NextResponse.json({ error: predictionsRes.error.message }, { status: 500 });
    }
    if (jokersRes.error) {
      return NextResponse.json({ error: jokersRes.error.message }, { status: 500 });
    }
    if (triviaRes.error) {
      return NextResponse.json({ error: triviaRes.error.message }, { status: 500 });
    }

    const matches = matchesRes.data || [];
    const predictions = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaResponses = triviaRes.data || [];
    const bonusQuestions = bonusQRes.data || [];
    const bonusResponses = bonusRRes.data || [];

    const leaderboard = calculateAllPlayerPoints(PARTICIPANTS, {
      matches,
      predictions,
      jokers,
      triviaResponses,
      bonusQuestions,
      bonusResponses,
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

      // Last 5 completed matches result (correct/wrong/no prediction)
      const last5 = completedMatches.slice(-5).map((match) => {
        const pred = playerPreds.find((p) => p.match_id === match.id);
        if (!pred) return 'none';
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
