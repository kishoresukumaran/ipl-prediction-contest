import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calculateAllPlayerPoints } from '@/lib/scoring';
import { PARTICIPANTS, TEAMS, getMatchPoints } from '@/lib/constants';

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

      // Bonus question history for this player
      const playerBonusResponses = bonusResponses.filter(
        (r: any) => r.participant_id === player.participantId
      );
      const bonusHistory = playerBonusResponses
        .map((r: any) => {
          const question = bonusQuestions.find((q: any) => q.id === r.bonus_question_id);
          if (!question) return null;
          const match = matches.find((m: any) => m.id === question.match_id);
          return {
            questionId: question.id as number,
            questionText: question.question as string,
            matchId: question.match_id as number,
            homeTeam: match?.home_team || '',
            awayTeam: match?.away_team || '',
            selectedOption: r.selected_option as string,
            correctAnswer: question.correct_answer as string | null,
            isCorrect: r.is_correct as boolean,
            points: r.is_correct ? (question.points ?? 1) : 0,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.matchId - b.matchId);

      return {
        ...player,
        avatarColor: participant?.avatar_color || '#666',
        jokerMatchId: playerJoker?.match_id || null,
        jokerUsed: !!playerJoker?.match_id,
        teamAffinity,
        hatedTeams,
        profitableTeams,
        predictionHistory,
        bonusHistory,
      };
    });

    return NextResponse.json(players);
  } catch (err) {
    console.error('Players API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
