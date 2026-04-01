'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Clock, ChevronRight, TrendingUp, Zap, Star, Target } from 'lucide-react';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';
import { Match, PlayerPointsBreakdown } from '@/lib/types';

interface LeaderboardEntry extends PlayerPointsBreakdown {
  avatarColor: string;
  last5Results: string[];
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalMatches: number;
  completedMatches: number;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex gap-3 justify-center">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[48px] text-center">
            <span className="text-xl font-bold text-amber-400 tabular-nums">
              {String(item.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
      <div className="h-8 bg-white/10 rounded w-2/3 mb-2" />
      <div className="h-4 bg-white/10 rounded w-1/2" />
    </div>
  );
}

export default function Home() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/matches').then((r) => r.json()),
      fetch('/api/leaderboard').then((r) => r.json()),
    ])
      .then(([matchesData, lbData]) => {
        setMatches(matchesData);
        setLeaderboardData(lbData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const todayStr = now.toISOString().split('T')[0];
  const todayMatches = matches?.filter((m) => m.match_date === todayStr) || [];

  const upcomingMatches = matches
    ?.filter((m) => !m.is_completed)
    ?.sort((a, b) => {
      const dateCompare = a.match_date.localeCompare(b.match_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    }) || [];
  const nextMatch = upcomingMatches[0] || null;

  const completedMatches = matches
    ?.filter((m) => m.is_completed && m.winner)
    ?.sort((a, b) => {
      const dateCompare = b.match_date.localeCompare(a.match_date);
      if (dateCompare !== 0) return dateCompare;
      return b.start_time.localeCompare(a.start_time);
    }) || [];
  const recentResults = completedMatches.slice(0, 3);

  const top5 = leaderboardData?.leaderboard?.slice(0, 5) || [];
  const leader = leaderboardData?.leaderboard?.[0] || null;

  const totalMatches = leaderboardData?.totalMatches || 0;
  const completedCount = leaderboardData?.completedMatches || 0;
  const progressPct = totalMatches > 0 ? (completedCount / totalMatches) * 100 : 0;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium">
          <Zap className="h-3 w-3" />
          SEASON 2026
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold">
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            IPL Prediction
          </span>
          <br />
          <span className="text-white">League 2026</span>
        </h1>
        <p className="text-slate-400 text-sm">
          {PARTICIPANTS.length} players competing across {totalMatches} matches
        </p>
      </div>

      {/* Tournament Progress */}
      {!loading && totalMatches > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Tournament Progress</span>
            <span className="text-xs text-amber-400 font-bold">
              {completedCount}/{totalMatches} matches
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-500">Started</span>
            <span className="text-[10px] text-slate-500">{Math.round(progressPct)}% complete</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Next Match Card */}
      {!loading && nextMatch && (
        <Link href={`/matches/${nextMatch.id}`}>
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm border border-indigo-400/20 rounded-xl p-4 hover:border-indigo-400/40 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-medium text-indigo-300">Next Match</span>
              </div>
              <span className="text-xs text-slate-400">
                Match #{nextMatch.id}
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: TEAMS[nextMatch.home_team]?.color || '#666',
                    color: TEAMS[nextMatch.home_team]?.textColor || '#fff',
                  }}
                >
                  {nextMatch.home_team}
                </span>
                <span className="text-slate-400 text-xs font-medium">vs</span>
                <span
                  className="px-3 py-1.5 rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: TEAMS[nextMatch.away_team]?.color || '#666',
                    color: TEAMS[nextMatch.away_team]?.textColor || '#fff',
                  }}
                >
                  {nextMatch.away_team}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </div>

            <div className="text-xs text-slate-400 mb-3">
              <Clock className="inline h-3 w-3 mr-1" />
              {new Date(nextMatch.match_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at {nextMatch.start_time}
            </div>

            <CountdownTimer targetDate={`${nextMatch.match_date}T${nextMatch.start_time}`} />
          </div>
        </Link>
      )}

      {/* Today's Matches */}
      {!loading && todayMatches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            Today&apos;s Matches
          </h2>
          {todayMatches.map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: TEAMS[match.home_team]?.color || '#666',
                        color: TEAMS[match.home_team]?.textColor || '#fff',
                      }}
                    >
                      {match.home_team}
                    </span>
                    <span className="text-slate-500 text-xs">vs</span>
                    <span
                      className="px-2 py-1 rounded text-xs font-bold"
                      style={{
                        backgroundColor: TEAMS[match.away_team]?.color || '#666',
                        color: TEAMS[match.away_team]?.textColor || '#fff',
                      }}
                    >
                      {match.away_team}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.is_completed && match.winner ? (
                      <span className="text-xs font-bold text-emerald-400">
                        {match.winner} won
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">{match.start_time}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Current Leader Spotlight */}
      {!loading && leader && (
        <div className="bg-gradient-to-br from-amber-500/15 to-yellow-600/10 backdrop-blur-sm border border-amber-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-300">Current Leader</span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ring-2 ring-amber-400/50"
              style={{ backgroundColor: leader.avatarColor }}
            >
              {leader.participantName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate">{leader.participantName}</h3>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{leader.totalPoints}</div>
                  <div className="text-[10px] text-slate-400">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {leader.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-slate-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{leader.currentStreak}</div>
                  <div className="text-[10px] text-slate-400">Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Leaderboard */}
      {!loading && top5.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Top 5 Standings
            </h2>
            <Link
              href="/leaderboard"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {top5.map((player, idx) => (
              <Link key={player.participantId} href={`/players/${player.participantId}`}>
                <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-all">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-amber-400 text-black'
                        : idx === 1
                        ? 'bg-slate-300 text-black'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.participantName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-white truncate block">
                      {player.participantName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-400">{player.totalPoints}</span>
                    <span className="text-xs text-slate-500 ml-1">pts</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {!loading && recentResults.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              Recent Results
            </h2>
            <Link
              href="/matches"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              All Matches <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentResults.map((match) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-6">#{match.id}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: TEAMS[match.home_team]?.color || '#666',
                        color: TEAMS[match.home_team]?.textColor || '#fff',
                      }}
                    >
                      {match.home_team}
                    </span>
                    <span className="text-slate-600 text-xs">vs</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: TEAMS[match.away_team]?.color || '#666',
                        color: TEAMS[match.away_team]?.textColor || '#fff',
                      }}
                    >
                      {match.away_team}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400"
                    >
                      {match.winner}
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/leaderboard">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all">
              <Trophy className="h-6 w-6 text-amber-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-slate-300">Leaderboard</span>
            </div>
          </Link>
          <Link href="/players">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-all">
              <TrendingUp className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <span className="text-sm font-medium text-slate-300">Players</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
