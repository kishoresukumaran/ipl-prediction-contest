'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Trophy,
  Zap,
  Award,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';
import { Match, Prediction } from '@/lib/types';

interface MatchWithPredictions extends Match {
  predictions: Prediction[];
}

type SortBy = 'name' | 'prediction_time' | 'correct';

function TeamBadge({ team, size = 'sm' }: { team: string; size?: 'sm' | 'lg' }) {
  const teamConfig = TEAMS[team];
  const classes =
    size === 'lg'
      ? 'px-4 py-2 rounded-xl text-base font-extrabold'
      : 'px-2 py-1 rounded text-xs font-bold';
  return (
    <span
      className={classes}
      style={{
        backgroundColor: teamConfig?.color || '#666',
        color: teamConfig?.textColor || '#fff',
      }}
    >
      {team}
    </span>
  );
}

export default function MatchDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const [match, setMatch] = useState<MatchWithPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('name');

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then((r) => r.json())
      .then(setMatch)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto text-center">
        <p className="text-slate-400">Match not found</p>
        <Link href="/matches" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
          Back to matches
        </Link>
      </div>
    );
  }

  const predictions = match.predictions || [];
  const homeTeamConfig = TEAMS[match.home_team];
  const awayTeamConfig = TEAMS[match.away_team];

  // Prediction consensus
  const homePicks = predictions.filter((p) => p.predicted_team === match.home_team).length;
  const awayPicks = predictions.filter((p) => p.predicted_team === match.away_team).length;
  const totalPicks = predictions.length;
  const homePct = totalPicks > 0 ? (homePicks / totalPicks) * 100 : 50;
  const awayPct = totalPicks > 0 ? (awayPicks / totalPicks) * 100 : 50;

  // Accuracy stats (only if completed)
  const correctPicks = match.is_completed && match.winner
    ? predictions.filter((p) => p.predicted_team === match.winner).length
    : 0;
  const accuracy = totalPicks > 0 && match.is_completed ? (correctPicks / totalPicks) * 100 : 0;

  // Enriched predictions with participant data
  const enrichedPredictions = PARTICIPANTS.map((participant) => {
    const pred = predictions.find((p) => p.participant_id === participant.id);
    const isCorrect = match.is_completed && match.winner && pred
      ? pred.predicted_team === match.winner
      : null;
    return {
      ...participant,
      predictedTeam: pred?.predicted_team || null,
      predictionTime: pred?.prediction_time || null,
      isCorrect,
    };
  });

  // Sort predictions
  const sortedPredictions = [...enrichedPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'prediction_time':
        if (!a.predictionTime && !b.predictionTime) return 0;
        if (!a.predictionTime) return 1;
        if (!b.predictionTime) return -1;
        return a.predictionTime.localeCompare(b.predictionTime);
      case 'correct':
        if (a.isCorrect === b.isCorrect) return a.name.localeCompare(b.name);
        if (a.isCorrect === true) return -1;
        if (b.isCorrect === true) return 1;
        if (a.isCorrect === false) return -1;
        return 1;
      default:
        return 0;
    }
  });

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Matches
      </Link>

      {/* Match Header */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-slate-500 font-mono">Match #{match.id}</span>
          <div className="flex gap-2">
            {match.is_power_match && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                <Zap className="h-3 w-3" />
                POWER
              </span>
            )}
            {match.underdog_team && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold">
                <Award className="h-3 w-3" />
                UNDERDOG: {match.underdog_team}
              </span>
            )}
          </div>
        </div>

        {/* Teams - Large */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
          <div className="text-center flex-1">
            <TeamBadge team={match.home_team} size="lg" />
            <div className="text-xs text-slate-400 mt-2">{homeTeamConfig?.name}</div>
          </div>
          <div className="text-slate-500 font-bold text-lg">vs</div>
          <div className="text-center flex-1">
            <TeamBadge team={match.away_team} size="lg" />
            <div className="text-xs text-slate-400 mt-2">{awayTeamConfig?.name}</div>
          </div>
        </div>

        {/* Result */}
        {match.is_completed && match.winner && (
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold">
              <Trophy className="h-4 w-4" />
              {match.winner} won!
            </span>
          </div>
        )}

        {/* Match Info */}
        <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(match.match_date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {match.start_time}
          </span>
        </div>
        <div className="text-center mt-2 text-xs text-slate-500 inline-flex items-center gap-1 justify-center w-full">
          <MapPin className="h-3 w-3" />
          {match.venue}
        </div>
      </div>

      {/* Prediction Consensus Bar */}
      {totalPicks > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            Prediction Consensus
          </h2>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TeamBadge team={match.home_team} />
              <span className="text-sm font-bold text-white">{homePct.toFixed(0)}%</span>
              <span className="text-xs text-slate-500">({homePicks})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">({awayPicks})</span>
              <span className="text-sm font-bold text-white">{awayPct.toFixed(0)}%</span>
              <TeamBadge team={match.away_team} />
            </div>
          </div>

          <div className="flex h-3 rounded-full overflow-hidden">
            <div
              className="transition-all duration-500"
              style={{
                width: `${homePct}%`,
                backgroundColor: homeTeamConfig?.color || '#666',
              }}
            />
            <div
              className="transition-all duration-500"
              style={{
                width: `${awayPct}%`,
                backgroundColor: awayTeamConfig?.color || '#666',
              }}
            />
          </div>

          {match.is_completed && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-xs text-slate-400">Group Accuracy</span>
              <span className="text-sm font-bold text-emerald-400">{accuracy.toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      {match.is_completed && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{totalPicks}</div>
            <div className="text-[10px] text-slate-400">Predictions</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{correctPicks}</div>
            <div className="text-[10px] text-slate-400">Correct</div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{accuracy.toFixed(0)}%</div>
            <div className="text-[10px] text-slate-400">Accuracy</div>
          </div>
        </div>
      )}

      {/* Prediction Grid */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-400" />
            All Predictions ({totalPicks}/{PARTICIPANTS.length})
          </h2>
          <div className="flex gap-1">
            {(['name', 'prediction_time', 'correct'] as SortBy[]).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  sortBy === s
                    ? 'bg-indigo-500/30 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s === 'name' ? 'Name' : s === 'prediction_time' ? 'Time' : 'Result'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {sortedPredictions.map((pred) => (
            <Link key={pred.id} href={`/players/${pred.id}`}>
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-all">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: pred.avatar_color }}
                >
                  {pred.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white block truncate">{pred.name}</span>
                  {pred.predictionTime && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(pred.predictionTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {pred.predictedTeam ? (
                    <TeamBadge team={pred.predictedTeam} />
                  ) : (
                    <span className="text-xs text-slate-600 italic">No pick</span>
                  )}
                  {match.is_completed && match.winner && pred.predictedTeam && (
                    pred.isCorrect ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
