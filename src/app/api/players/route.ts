import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS, TEAMS, getMatchPoints } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const [matchesRes, predictionsRes, jokersRes, triviaPtsRes] = await Promise.all([
      admin.from('matches').select('*').order('match_date').order('start_time'),
      admin.from('predictions').select('*'),
      admin.from('jokers').select('*'),
      admin.from('trivia_points').select('*'),
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

    const matches = matchesRes.data || [];
    const predictions = predictionsRes.data || [];
    const jokers = jokersRes.data || [];
    const triviaPoints = triviaPtsRes.data || [];

    const leaderboard = calculateAllPlayerPoints(PARTICIPANTS, {
      matches,
      predictions,
      jokers,
      triviaPoints,
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
      completedMatches.forEach(match => {
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
      completedMatches.forEach(match => {
        const pred = playerPreds.find(p => p.match_id === match.id);
        if (!pred || pred.predicted_team !== match.winner) return;
        const pts = getMatchPoints(match.match_type, match.is_power_match);
        teamProfit[pred.predicted_team] = (teamProfit[pred.predicted_team] || 0) + pts;
      });
      const profitableTeams = Object.entries(teamProfit)
        .sort((a, b) => b[1] - a[1])
        .map(([team, points]) => ({ team, points }));

      return {
        ...player,
        avatarColor: participant?.avatar_color || '#666',
        jokerMatchId: playerJoker?.match_id || null,
        jokerUsed: !!playerJoker?.match_id,
        teamAffinity,
        hatedTeams,
        profitableTeams,
        predictionHistory,
      };
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error('Players API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
