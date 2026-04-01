'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Clock, ChevronRight, TrendingUp, Zap, Star, Target, Layers } from 'lucide-react';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';
import { matchTimeToIrish, matchDateTimeUTC } from '@/lib/utils';
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

const MATCH_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [phase, setPhase] = useState<'countdown' | 'live' | 'awaiting'>('countdown');

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        const elapsed = -diff;
        if (elapsed < MATCH_DURATION_MS) {
          setPhase('live');
        } else {
          setPhase('awaiting');
        }
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setPhase('countdown');
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (phase === 'live') {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-sm font-bold text-red-500 dark:text-red-400 tracking-wide uppercase">Match in progress</span>
      </div>
    );
  }

  if (phase === 'awaiting') {
    return (
      <div className="flex items-center justify-center gap-2 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
        <span className="text-sm font-medium text-amber-600 dark:text-amber-400 tracking-wide">Results being updated…</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 justify-center">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div className="bg-indigo-500/20 rounded-lg px-3 py-2 min-w-[48px] text-center shadow-sm">
            <span className="text-xl font-bold text-amber-400 tabular-nums">
              {String(item.value).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] text-[var(--app-text-secondary)] mt-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-[var(--app-surface-alt)] rounded w-1/3 mb-3" />
      <div className="h-8 bg-[var(--app-surface-alt)] rounded w-2/3 mb-2" />
      <div className="h-4 bg-[var(--app-surface-alt)] rounded w-1/2" />
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
  // Check if next match day is a double header
  const nextMatchDayMatches = nextMatch
    ? upcomingMatches.filter((m) => m.match_date === nextMatch.match_date)
    : [];
  const isDoubleHeaderDay = nextMatchDayMatches.length >= 2;

  const completedMatches = matches
    ?.filter((m) => m.is_completed && m.winner)
    ?.sort((a, b) => {
      const dateCompare = b.match_date.localeCompare(a.match_date);
      if (dateCompare !== 0) return dateCompare;
      return b.start_time.localeCompare(a.start_time);
    }) || [];
  const recentResults = completedMatches.slice(0, 3);

  const leaders = leaderboardData?.leaderboard?.filter(p => p.rank === 1) || [];
  const top5 = leaderboardData?.leaderboard?.filter(p => (p.rank || 0) <= 5) || [];

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
          <span className="text-[var(--app-text)]">League 2026</span>
        </h1>
        <p className="text-[var(--app-text-secondary)] text-sm">
          {PARTICIPANTS.length} players competing across {totalMatches} matches
        </p>
      </div>

      {/* Tournament Progress */}
      {!loading && totalMatches > 0 && (
        <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--app-text-secondary)] font-medium">Tournament Progress</span>
            <span className="text-xs text-amber-400 font-bold">
              {completedCount}/{totalMatches} matches
            </span>
          </div>
          <div className="w-full bg-[var(--app-surface-alt)] rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-2.5 rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-[var(--app-text-tertiary)]">Started</span>
            <span className="text-[10px] text-[var(--app-text-tertiary)]">{Math.round(progressPct)}% complete</span>
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
      {!loading && nextMatch && !isDoubleHeaderDay && (
        <Link href={`/matches/${nextMatch.id}`}>
          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm border border-indigo-400/30 rounded-xl p-4 hover:border-indigo-400/50 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-medium text-indigo-500 dark:text-indigo-300">Next Match</span>
              </div>
              <span className="text-xs text-[var(--app-text-secondary)]">
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
                <span className="text-[var(--app-text-secondary)] text-xs font-medium">vs</span>
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
              <ChevronRight className="h-4 w-4 text-[var(--app-text-tertiary)]" />
            </div>

            <div className="text-xs text-[var(--app-text-secondary)] mb-3">
              <Clock className="inline h-3 w-3 mr-1" />
              {new Date(nextMatch.match_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at {matchTimeToIrish(nextMatch.match_date, nextMatch.start_time)}
              <span className="text-[var(--app-text-tertiary)] ml-1">(Irish Time)</span>
            </div>

            <CountdownTimer targetDate={matchDateTimeUTC(nextMatch.match_date, nextMatch.start_time).toISOString()} />
          </div>
        </Link>
      )}

      {/* Double Header Day Card */}
      {!loading && nextMatch && isDoubleHeaderDay && (
        <div className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 backdrop-blur-sm border border-indigo-400/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span className="text-xs font-medium text-indigo-500 dark:text-indigo-300">Double Header Day</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                <Layers className="h-2.5 w-2.5" />
                2 GAMES
              </span>
            </div>
            <span className="text-xs text-[var(--app-text-secondary)]">
              {new Date(nextMatch.match_date).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </span>
          </div>

          <div className="space-y-3">
            {nextMatchDayMatches.map((match, idx) => (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <div className="bg-[var(--app-surface)] rounded-xl p-3 hover:bg-[var(--app-surface-hover)] transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-[var(--app-text-tertiary)] font-mono">
                      Game {idx + 1} · #{match.id}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--app-text-secondary)]">
                      <Clock className="h-3 w-3" />
                      {matchTimeToIrish(match.match_date, match.start_time)}
                      <span className="text-[var(--app-text-tertiary)]">(Irish)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-lg text-sm font-bold"
                        style={{
                          backgroundColor: TEAMS[match.home_team]?.color || '#666',
                          color: TEAMS[match.home_team]?.textColor || '#fff',
                        }}
                      >
                        {match.home_team}
                      </span>
                      <span className="text-[var(--app-text-secondary)] text-xs">vs</span>
                      <span
                        className="px-2.5 py-1 rounded-lg text-sm font-bold"
                        style={{
                          backgroundColor: TEAMS[match.away_team]?.color || '#666',
                          color: TEAMS[match.away_team]?.textColor || '#fff',
                        }}
                      >
                        {match.away_team}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--app-text-tertiary)]" />
                  </div>
                  <div className="mt-2">
                    <CountdownTimer targetDate={matchDateTimeUTC(match.match_date, match.start_time).toISOString()} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Today's Matches */}
      {!loading && todayMatches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--app-text)] flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            Today&apos;s Matches
          </h2>
          {todayMatches.map((match) => (
            <Link key={match.id} href={`/matches/${match.id}`}>
              <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-3 hover:bg-[var(--app-surface-alt)] transition-all shadow-sm">
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
                    <span className="text-[var(--app-text-tertiary)] text-xs">vs</span>
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
                      <span className="text-xs text-[var(--app-text-secondary)]">{matchTimeToIrish(match.match_date, match.start_time)}</span>
                    )}
                    <ChevronRight className="h-4 w-4 text-[var(--app-text-tertiary)]" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Current Leader Spotlight */}
      {!loading && leaders.length === 1 && (
        <div className="bg-gradient-to-br from-amber-500/15 to-yellow-600/10 backdrop-blur-sm border border-amber-400/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300">Current Leader</span>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0 ring-2 ring-amber-400/50"
              style={{ backgroundColor: leaders[0].avatarColor }}
            >
              {leaders[0].participantName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-[var(--app-text)] truncate">{leaders[0].participantName}</h3>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{leaders[0].totalPoints}</div>
                  <div className="text-[10px] text-[var(--app-text-secondary)]">Points</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-400">
                    {leaders[0].accuracy.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-[var(--app-text-secondary)]">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">{leaders[0].currentStreak}</div>
                  <div className="text-[10px] text-[var(--app-text-secondary)]">Streak</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tied Leaders Spotlight */}
      {!loading && leaders.length > 1 && (
        <div className="bg-gradient-to-br from-amber-500/15 to-yellow-600/10 backdrop-blur-sm border border-amber-400/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-300">
              Current Leaders — {leaders.length}-way tie!
            </span>
          </div>
          <div className="flex justify-center -space-x-3 mb-3">
            {leaders.map((l) => (
              <Link key={l.participantId} href={`/players/${l.participantId}`}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ring-2 ring-amber-400/50 ring-offset-2 ring-offset-[var(--app-bg)] hover:scale-110 transition-transform"
                  style={{ backgroundColor: l.avatarColor }}
                >
                  {l.participantName.charAt(0)}
                </div>
              </Link>
            ))}
          </div>
          <h3 className="text-center text-lg font-bold text-[var(--app-text)]">
            {leaders.map(l => l.participantName).join(' & ')}
          </h3>
          <div className="flex justify-center gap-6 mt-3">
            <div className="text-center">
              <div className="text-xl font-bold text-amber-400">{leaders[0].totalPoints}</div>
              <div className="text-[10px] text-[var(--app-text-secondary)]">Points each</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-400">
                {leaders[0].accuracy.toFixed(0)}%
              </div>
              <div className="text-[10px] text-[var(--app-text-secondary)]">Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Leaderboard */}
      {!loading && top5.length > 0 && (
        <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--app-text)] flex items-center gap-2">
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
            {top5.map((player) => {
              const rank = player.rank || 0;
              return (
                <Link key={player.participantId} href={`/players/${player.participantId}`}>
                  <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--app-surface)] transition-all">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        rank === 1
                          ? 'bg-amber-400 text-black'
                          : rank === 2
                          ? 'bg-slate-300 text-black'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]'
                      }`}
                    >
                      {rank}
                    </span>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ backgroundColor: player.avatarColor }}
                    >
                      {player.participantName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[var(--app-text)] truncate block">
                        {player.participantName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-amber-400">{player.totalPoints}</span>
                      <span className="text-xs text-[var(--app-text-tertiary)] ml-1">pts</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {!loading && recentResults.length > 0 && (
        <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--app-text)] flex items-center gap-2">
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
                <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[var(--app-surface)] transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--app-text-tertiary)] w-6">#{match.id}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{
                        backgroundColor: TEAMS[match.home_team]?.color || '#666',
                        color: TEAMS[match.home_team]?.textColor || '#fff',
                      }}
                    >
                      {match.home_team}
                    </span>
                    <span className="text-[var(--app-text-tertiary)] text-xs">vs</span>
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
                    <ChevronRight className="h-3 w-3 text-[var(--app-text-tertiary)]" />
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
            <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 text-center hover:bg-[var(--app-surface-alt)] transition-all shadow-sm active:scale-95">
              <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <span className="text-sm font-semibold text-[var(--app-text)]">Leaderboard</span>
            </div>
          </Link>
          <Link href="/players">
            <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 text-center hover:bg-[var(--app-surface-alt)] transition-all shadow-sm active:scale-95">
              <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-semibold text-[var(--app-text)]">Players</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
