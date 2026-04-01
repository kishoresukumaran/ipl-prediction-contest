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
      const completedMatches = matches
        .filter((m) => m.is_completed && m.winner)
        .sort((a, b) => {
          const dateCompare = a.match_date.localeCompare(b.match_date);
          if (dateCompare !== 0) return dateCompare;
          return a.start_time.localeCompare(b.start_time);
        });

      const predictionHistory = completedMatches.map((match) => {
        const pred = playerPreds.find((p) => p.match_id === match.id);
        return {
          matchId: match.id,
          matchDate: match.match_date,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          winner: match.winner,
          predictedTeam: pred?.predicted_team || null,
          isCorrect: pred ? pred.predicted_team === match.winner : false,
          predictionTime: pred?.prediction_time || null,
        };
      });

      return {
        ...player,
        avatarColor: participant?.avatar_color || '#666',
        jokerMatchId: playerJoker?.match_id || null,
        jokerUsed: !!playerJoker?.match_id,
        teamAffinity,
        predictionHistory,
      };
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error('Players API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
