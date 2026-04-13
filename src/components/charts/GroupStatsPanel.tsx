'use client';

import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, LineChart, Line,
} from 'recharts';
import { useChartTheme } from '@/hooks/useChartTheme';
import { PlayerPointsBreakdown } from '@/lib/types';
import {
  Trophy, Target, Flame, Zap, Users, CheckCircle2, Lock,
  TrendingUp, TrendingDown, Brain, HeartPulse, Medal, Star,
} from 'lucide-react';

// ─── Prop types (sliced from InsightsAPIData) ───────────────────────────────

interface CrowdWisdomEntry {
  matchId: number; homeTeam: string; awayTeam: string;
  majorityTeam: string; majorityPct: number; crowdCorrect: boolean; runningAccuracy: number;
}
interface VoteSplitEntry {
  matchId: number; homeTeam: string; awayTeam: string;
  homePicks: number; awayPicks: number; totalVotes: number;
  consensusPct: number; majorityTeam: string; majorityCorrect: boolean; winner: string | null;
}
interface ParticipationEntry {
  matchId: number; matchLabel: string; homeTeam: string; awayTeam: string;
  matchDate: string; voterCount: number; totalParticipants: number; rate: number; runningAvg: number;
}
interface GhostVoterEntry {
  name: string; color: string; missedCount: number; noVoteCount: number;
  lateCount: number; participationRate: number; totalMatches: number;
  missedMatches: { matchId: number; homeTeam: string; awayTeam: string; matchDate: string; reason: 'no_vote' | 'late' }[];
}
interface MatchDifficultyEntry {
  matchId: number; homeTeam: string; awayTeam: string;
  groupAccuracy: number; totalPredictions: number;
}
interface StreakEntry { name: string; longestStreak: number; currentStreak: number; color: string; }

export interface GroupStatsPanelProps {
  leaderboard: PlayerPointsBreakdown[];
  crowdWisdom: CrowdWisdomEntry[];
  voteSplits: VoteSplitEntry[];
  participationRate: ParticipationEntry[];
  ghostVoters: GhostVoterEntry[];
  matchDifficulty: MatchDifficultyEntry[];
  streakData: StreakEntry[];
  pointsRace: { matchId: number; matchDate: string; [key: string]: number | string }[];
  formData: { matchId: number; [key: string]: number | string }[];
  completedMatches: number;
  totalMatches: number;
}

// ─── Colour palette for the donut chart ─────────────────────────────────────
const BREAKDOWN_COLORS: Record<string, string> = {
  Base: '#6366f1',
  Power: '#f59e0b',
  Underdog: '#10b981',
  Joker: '#ec4899',
  Streak: '#f97316',
  'Double Header': '#3b82f6',
  Abandoned: '#64748b',
  Trivia: '#8b5cf6',
};

// ─── Card wrapper ────────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon, title, subtitle, accent, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; subtitle: string;
  accent: string; // tailwind gradient classes
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border)] overflow-hidden">
      <div className={`px-4 py-3 ${accent} border-b border-[var(--app-border)]`}>
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="h-4 w-4 opacity-80" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-xs opacity-70">{subtitle}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────────
function StatTile({ label, value, sub, highlight }: {
  label: string; value: string | number; sub?: string; highlight?: string;
}) {
  return (
    <div className="bg-[var(--app-surface-alt)] rounded-lg p-3">
      <p className={`text-xl font-bold ${highlight ?? 'text-[var(--app-text)]'}`}>{value}</p>
      <p className="text-xs text-[var(--app-text-secondary)] mt-0.5 leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-[var(--app-text-tertiary)] mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Milestone row ───────────────────────────────────────────────────────────
function Milestone({ label, current, target, unit = '' }: {
  label: string; current: number; target: number; unit?: string;
}) {
  const pct = Math.min(100, (current / target) * 100);
  const done = current >= target;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {done
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            : <Lock className="h-3.5 w-3.5 text-[var(--app-text-tertiary)] shrink-0" />}
          <span className="text-xs text-[var(--app-text)]">{label}</span>
        </div>
        <span className="text-xs font-medium text-[var(--app-text-secondary)]">
          {current.toLocaleString()}{unit} / {target.toLocaleString()}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--app-surface-alt)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Record card ─────────────────────────────────────────────────────────────
function RecordCard({ emoji, label, value, sub, color = 'text-[var(--app-text)]' }: {
  emoji: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-[var(--app-surface-alt)] rounded-lg p-3">
      <span className="text-xl leading-none mt-0.5">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-[var(--app-text-tertiary)]">{label}</p>
        <p className={`text-sm font-semibold ${color} truncate`}>{value}</p>
        {sub && <p className="text-[10px] text-[var(--app-text-secondary)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export function GroupStatsPanel({
  leaderboard, crowdWisdom, voteSplits, participationRate,
  ghostVoters, matchDifficulty, streakData, pointsRace, formData,
  completedMatches, totalMatches,
}: GroupStatsPanelProps) {
  const chartTheme = useChartTheme();

  // ── Derived group-level metrics ──────────────────────────────────────────
  const metrics = useMemo(() => {
    const groupTotalPoints    = leaderboard.reduce((s, p) => s + p.totalPoints, 0);
    const groupCorrect        = leaderboard.reduce((s, p) => s + p.correctPredictions, 0);
    const groupTotalPreds     = leaderboard.reduce((s, p) => s + p.totalPredictions, 0);
    const groupWrong          = groupTotalPreds - groupCorrect;
    const groupAccuracy       = groupTotalPreds > 0 ? (groupCorrect / groupTotalPreds) * 100 : 0;
    const pointsPerMatch      = completedMatches > 0 ? groupTotalPoints / completedMatches : 0;
    const activeStreakers     = leaderboard.filter(p => p.currentStreak >= 3).length;
    const maxLongestStreak    = Math.max(...leaderboard.map(p => p.longestStreak), 0);
    const breakdown = [
      { name: 'Base',          value: leaderboard.reduce((s, p) => s + p.basePoints, 0) },
      { name: 'Power',         value: leaderboard.reduce((s, p) => s + p.powerMatchPoints, 0) },
      { name: 'Underdog',      value: leaderboard.reduce((s, p) => s + p.underdogBonus, 0) },
      { name: 'Joker',         value: leaderboard.reduce((s, p) => s + p.jokerBonus, 0) },
      { name: 'Streak',        value: leaderboard.reduce((s, p) => s + p.streakBonus, 0) },
      { name: 'Double Header', value: leaderboard.reduce((s, p) => s + p.doubleHeaderBonus, 0) },
      { name: 'Abandoned',     value: leaderboard.reduce((s, p) => s + p.abandonedPoints, 0) },
      { name: 'Trivia',        value: leaderboard.reduce((s, p) => s + p.triviaPoints, 0) },
    ].filter(c => c.value > 0);

    return { groupTotalPoints, groupCorrect, groupWrong, groupAccuracy, pointsPerMatch, activeStreakers, maxLongestStreak, breakdown };
  }, [leaderboard, completedMatches]);

  // ── Crowd / hive mind ────────────────────────────────────────────────────
  const hive = useMemo(() => {
    if (!crowdWisdom.length) return null;
    const correct = crowdWisdom.filter(d => d.crowdCorrect).length;
    const crowdAccuracy = (correct / crowdWisdom.length) * 100;

    const highConsensus = voteSplits.filter(v => v.consensusPct >= 70 && v.winner);
    const lowConsensus  = voteSplits.filter(v => v.consensusPct < 60 && v.winner);
    const whenAgreed    = highConsensus.length > 0
      ? (highConsensus.filter(v => v.majorityCorrect).length / highConsensus.length) * 100 : null;
    const whenDivided   = lowConsensus.length > 0
      ? (lowConsensus.filter(v => v.majorityCorrect).length / lowConsensus.length) * 100 : null;

    const unanimous = voteSplits.filter(v => v.consensusPct >= 90 && v.winner);
    const unanimousCorrect = unanimous.filter(v => v.majorityCorrect).length;

    const mostDivided = [...voteSplits]
      .filter(v => v.winner)
      .sort((a, b) => Math.abs(a.consensusPct - 50) - Math.abs(b.consensusPct - 50))[0] ?? null;

    return { crowdAccuracy, correct, total: crowdWisdom.length, whenAgreed, whenDivided, unanimous: unanimous.length, unanimousCorrect, mostDivided };
  }, [crowdWisdom, voteSplits]);

  // ── Participation ────────────────────────────────────────────────────────
  const participation = useMemo(() => {
    if (!participationRate.length) return null;
    const avg = participationRate.reduce((s, r) => s + r.rate, 0) / participationRate.length;
    const perfect = participationRate.filter(r => r.rate >= 99.9).length;
    const totalMissed = ghostVoters.reduce((s, g) => s + g.missedCount, 0);
    const recent5 = participationRate.slice(-5);
    const recentAvg = recent5.length > 0 ? recent5.reduce((s, r) => s + r.rate, 0) / recent5.length : avg;

    let label: string; let labelColor: string;
    if (recentAvg >= 90) { label = 'All In'; labelColor = 'text-emerald-400'; }
    else if (recentAvg >= 75) { label = 'Engaged'; labelColor = 'text-teal-400'; }
    else if (recentAvg >= 55) { label = 'Drifting'; labelColor = 'text-amber-400'; }
    else { label = 'Ghost Town'; labelColor = 'text-red-400'; }

    const sparkline = participationRate.map(r => ({ matchId: r.matchId, rate: Math.round(r.rate) }));

    return { avg, perfect, totalMissed, recentAvg, label, labelColor, sparkline };
  }, [participationRate, ghostVoters]);

  // ── Group records ────────────────────────────────────────────────────────
  const records = useMemo(() => {
    const sorted = [...matchDifficulty].filter(m => m.totalPredictions > 0)
      .sort((a, b) => b.groupAccuracy - a.groupAccuracy);
    const best    = sorted[0] ?? null;
    const worst   = sorted[sorted.length - 1] ?? null;
    const perfect = sorted.filter(m => m.groupAccuracy >= 99.9)[0] ?? null;
    const wipeout = sorted.filter(m => m.groupAccuracy <= 0.1).slice(-1)[0] ?? null;
    const onFire  = streakData.filter(s => s.currentStreak >= 3);

    return { best, worst, perfect, wipeout, onFire };
  }, [matchDifficulty, streakData]);

  // ── Milestone targets ────────────────────────────────────────────────────
  const milestones = useMemo(() => {
    const { groupTotalPoints, groupCorrect, groupAccuracy, maxLongestStreak } = metrics;
    const pointTargets   = [5000, 6000, 7000, 8000, 9000, 10000];
    const correctTargets = [700, 800, 900, 1000, 1100];

    const nextPointTarget   = pointTargets.find(t => groupTotalPoints < t) ?? pointTargets[pointTargets.length - 1];
    const nextCorrectTarget = correctTargets.find(t => groupCorrect < t) ?? correctTargets[correctTargets.length - 1];

    return [
      { label: `Hit ${nextPointTarget.toLocaleString()} group points`, current: groupTotalPoints, target: nextPointTarget },
      { label: `${nextCorrectTarget} correct picks as a group`, current: groupCorrect, target: nextCorrectTarget },
      { label: 'Group accuracy above 60%', current: Math.round(groupAccuracy), target: 60, unit: '%' },
      { label: 'Someone hits a 10-match streak', current: maxLongestStreak, target: 10 },
    ];
  }, [metrics]);

  // ── Group cumulative points over time ────────────────────────────────────
  const groupPointsOverTime = useMemo(() => {
    if (!pointsRace.length) return [];
    const playerIds = Object.keys(pointsRace[0]).filter(k => k !== 'matchId' && k !== 'matchDate');
    return pointsRace.map(row => ({
      matchId: row.matchId as number,
      matchDate: row.matchDate as string,
      total: playerIds.reduce((s, id) => s + ((row[id] as number) || 0), 0),
    }));
  }, [pointsRace]);

  // ── Group rolling form (avg of all players' last-5 accuracy) ─────────────
  const groupFormOverTime = useMemo(() => {
    if (!formData.length) return [];
    const playerIds = Object.keys(formData[0]).filter(k => k !== 'matchId');
    return formData.map(row => {
      const values = playerIds.map(id => (row[id] as number) || 0);
      const avg = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
      return { matchId: row.matchId as number, avg: parseFloat(avg.toFixed(1)) };
    });
  }, [formData]);

  if (!leaderboard.length) return <div className="text-center text-sm text-[var(--app-text-secondary)] py-12">No data yet</div>;

  const bonusTotal = metrics.breakdown
    .filter(b => b.name !== 'Base')
    .reduce((s, b) => s + b.value, 0);
  const bonusPct = metrics.groupTotalPoints > 0
    ? Math.round((bonusTotal / metrics.groupTotalPoints) * 100) : 0;

  return (
    <div className="space-y-6">

      {/* ─── 1. Group Pulse ─────────────────────────────────────────────── */}
      <SectionCard
        icon={Zap}
        title="Group Pulse"
        subtitle="The heartbeat of the squad — your collective stats at a glance."
        accent="bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-indigo-200"
      >
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatTile label="Total Points" value={metrics.groupTotalPoints.toLocaleString()} highlight="text-indigo-400" />
          <StatTile label="Group Accuracy" value={`${metrics.groupAccuracy.toFixed(1)}%`} />
          <StatTile
            label="Matches"
            value={`${completedMatches}/${totalMatches}`}
            sub={`${Math.round((completedMatches / Math.max(totalMatches, 1)) * 100)}% done`}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Pts / Match" value={metrics.pointsPerMatch.toFixed(1)} sub="group average" />
          <StatTile label="Correct Picks" value={metrics.groupCorrect.toLocaleString()} highlight="text-emerald-400" />
          <StatTile label="Wrong Picks" value={metrics.groupWrong.toLocaleString()} highlight="text-red-400" />
        </div>
        {metrics.activeStreakers > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
            <Flame className="h-3.5 w-3.5 shrink-0" />
            <span><strong>{metrics.activeStreakers} player{metrics.activeStreakers > 1 ? 's' : ''}</strong> currently on a streak of 3+. Keep the fire burning!</span>
          </div>
        )}
      </SectionCard>

      {/* ─── 2. Group Milestones ────────────────────────────────────────── */}
      <SectionCard
        icon={Trophy}
        title="Group Milestones"
        subtitle="Collective goals for the whole squad. Unlock them together."
        accent="bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-200"
      >
        <div className="space-y-4">
          {milestones.map(m => (
            <Milestone key={m.label} {...m} />
          ))}
        </div>
        <p className="text-[10px] text-[var(--app-text-tertiary)] mt-4 text-center">
          Milestones track the group's collective journey through the season
        </p>
      </SectionCard>

      {/* ─── 3. The Hive Mind ───────────────────────────────────────────── */}
      {hive && (
        <SectionCard
          icon={Brain}
          title="The Hive Mind"
          subtitle="When the group votes together, do they win together? The collective intelligence report."
          accent="bg-gradient-to-r from-teal-500/20 to-emerald-500/10 text-teal-200"
        >
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatTile
              label="Crowd Accuracy"
              value={`${hive.crowdAccuracy.toFixed(1)}%`}
              sub={`${hive.correct}/${hive.total} matches`}
              highlight={hive.crowdAccuracy >= 50 ? 'text-emerald-400' : 'text-red-400'}
            />
            <StatTile
              label="Unanimous Calls"
              value={`${hive.unanimous}`}
              sub={`${hive.unanimousCorrect} correct`}
            />
            {hive.whenAgreed !== null && (
              <StatTile
                label="When We Agree (70%+)"
                value={`${hive.whenAgreed.toFixed(1)}%`}
                sub="accuracy when in sync"
                highlight={hive.whenAgreed >= 55 ? 'text-emerald-400' : 'text-red-400'}
              />
            )}
            {hive.whenDivided !== null && (
              <StatTile
                label="When We Differ (<60%)"
                value={`${hive.whenDivided.toFixed(1)}%`}
                sub="accuracy when split"
              />
            )}
          </div>

          {/* Running crowd accuracy sparkline */}
          <div className="h-[100px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={crowdWisdom} margin={{ top: 4, right: 4, left: -40, bottom: 0 }}>
                <XAxis dataKey="matchId" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as CrowdWisdomEntry;
                    return (
                      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                        <p className="font-semibold text-[var(--app-text)]">Match #{d.matchId}: {d.homeTeam} vs {d.awayTeam}</p>
                        <p className="text-teal-400">Running accuracy: {d.runningAccuracy.toFixed(1)}%</p>
                        <p className={d.crowdCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {d.crowdCorrect ? 'Crowd got it right' : 'Crowd got it wrong'}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone" dataKey="runningAccuracy"
                  stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.15} strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-center text-[var(--app-text-tertiary)] mt-1">Running crowd accuracy over time</p>

          {hive.mostDivided && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-[var(--app-surface-alt)] rounded-lg px-3 py-2">
              <span className="text-lg">⚖️</span>
              <div>
                <span className="text-[var(--app-text-secondary)]">Most divided match: </span>
                <span className="font-semibold text-[var(--app-text)]">
                  {hive.mostDivided.homeTeam} vs {hive.mostDivided.awayTeam}
                </span>
                <span className="text-[var(--app-text-tertiary)]"> — {hive.mostDivided.consensusPct.toFixed(0)}% consensus</span>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ─── 4. Participation Health ────────────────────────────────────── */}
      {participation && (
        <SectionCard
          icon={HeartPulse}
          title="Participation Health"
          subtitle="Is the group staying engaged? Missed votes are the silent killer of leaderboard dreams."
          accent="bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-rose-200"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[var(--app-text-secondary)]">Recent form</p>
              <p className={`text-lg font-bold ${participation.labelColor}`}>{participation.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--app-text-secondary)]">Season avg</p>
              <p className="text-lg font-bold text-[var(--app-text)]">{participation.avg.toFixed(1)}%</p>
            </div>
          </div>

          <div className="h-[80px] w-full mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={participation.sparkline} margin={{ top: 4, right: 4, left: -40, bottom: 0 }}>
                <XAxis dataKey="matchId" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as { matchId: number; rate: number };
                    return (
                      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded px-2 py-1 text-xs shadow-xl">
                        <p className="text-[var(--app-text)]">Match #{d.matchId}: {d.rate}% voted</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone" dataKey="rate"
                  stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-center text-[var(--app-text-tertiary)] mb-3">Participation rate per match</p>

          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Perfect Matches" value={participation.perfect} sub="100% voted" highlight="text-emerald-400" />
            <StatTile label="Missed Votes" value={participation.totalMissed.toLocaleString()} highlight="text-red-400" />
            <StatTile label="Recent Avg" value={`${participation.recentAvg.toFixed(0)}%`} sub="last 5 matches" />
          </div>
        </SectionCard>
      )}

      {/* ─── 5. Group Records ───────────────────────────────────────────── */}
      <SectionCard
        icon={Medal}
        title="Group Records"
        subtitle="The moments that defined the season — best, worst, and everything legendary in between."
        accent="bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-200"
      >
        <div className="grid grid-cols-1 gap-2">
          {records.perfect && (
            <RecordCard
              emoji="💯"
              label="Perfect Match — Everyone Nailed It"
              value={`${records.perfect.homeTeam} vs ${records.perfect.awayTeam}`}
              sub="100% group accuracy — a moment of pure collective genius"
              color="text-emerald-400"
            />
          )}
          {records.best && !records.perfect && (
            <RecordCard
              emoji="🏆"
              label="Best Group Match"
              value={`${records.best.homeTeam} vs ${records.best.awayTeam}`}
              sub={`${records.best.groupAccuracy.toFixed(0)}% group accuracy`}
              color="text-emerald-400"
            />
          )}
          {records.wipeout && (
            <RecordCard
              emoji="💀"
              label="Total Wipeout — Nobody Got It"
              value={`${records.wipeout.homeTeam} vs ${records.wipeout.awayTeam}`}
              sub="0% group accuracy — even flipping a coin would've helped"
              color="text-red-400"
            />
          )}
          {records.worst && !records.wipeout && (
            <RecordCard
              emoji="😬"
              label="Worst Group Match"
              value={`${records.worst.homeTeam} vs ${records.worst.awayTeam}`}
              sub={`${records.worst.groupAccuracy.toFixed(0)}% group accuracy`}
              color="text-red-400"
            />
          )}
          <RecordCard
            emoji="🔥"
            label="Longest Streak (All Time)"
            value={`${metrics.maxLongestStreak} consecutive correct`}
            sub={`by ${streakData.find(s => s.longestStreak === metrics.maxLongestStreak)?.name ?? 'someone legendary'}`}
            color="text-amber-400"
          />
          {records.onFire.length > 0 && (
            <RecordCard
              emoji="⚡"
              label="Currently on Fire (3+ streak)"
              value={records.onFire.map(s => s.name).join(', ')}
              sub={`${records.onFire.length} player${records.onFire.length > 1 ? 's' : ''} riding hot streaks right now`}
              color="text-orange-400"
            />
          )}
        </div>
      </SectionCard>

      {/* ─── 6. Points Breakdown ────────────────────────────────────────── */}
      <SectionCard
        icon={Star}
        title="Where Points Come From"
        subtitle={`${bonusPct}% of all group points came from bonus categories — see where the squad earns its edge.`}
        accent="bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-200"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-[180px] h-[180px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.breakdown}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {metrics.breakdown.map(entry => (
                    <Cell key={entry.name} fill={BREAKDOWN_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as { name: string; value: number };
                    const pct = ((d.value / metrics.groupTotalPoints) * 100).toFixed(1);
                    return (
                      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                        <p className="font-semibold text-[var(--app-text)]">{d.name}</p>
                        <p className="text-[var(--app-text-secondary)]">{d.value.toLocaleString()} pts ({pct}%)</p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {metrics.breakdown.map(entry => {
              const pct = ((entry.value / metrics.groupTotalPoints) * 100).toFixed(1);
              const color = BREAKDOWN_COLORS[entry.name] ?? '#94a3b8';
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs text-[var(--app-text-secondary)] flex-1">{entry.name}</span>
                  <span className="text-xs font-semibold text-[var(--app-text)]">{entry.value.toLocaleString()}</span>
                  <span className="text-[10px] text-[var(--app-text-tertiary)] w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
        {metrics.breakdown.find(b => b.name === 'Underdog')?.value === 0 && (
          <p className="text-xs text-amber-400 mt-3 text-center bg-amber-500/10 rounded-lg py-2">
            💡 Zero underdog points! Back a few dark horses — it&apos;s only 1 extra point but it pays off.
          </p>
        )}
      </SectionCard>

      {/* ─── 7. Cumulative Group Points ─────────────────────────────────── */}
      {groupPointsOverTime.length > 0 && (
        <SectionCard
          icon={TrendingUp}
          title="Group Points Over Time"
          subtitle="Total points accumulated by the whole squad — one line, one team, one climb."
          accent="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-200"
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={groupPointsOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey="matchId"
                  stroke={chartTheme.axis}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Match #', position: 'bottom', fill: chartTheme.label, fontSize: 11, offset: 0 }}
                />
                <YAxis
                  stroke={chartTheme.axis}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)}
                  width={40}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as { matchId: number; matchDate: string; total: number };
                    return (
                      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                        <p className="font-semibold text-[var(--app-text)]">Match #{d.matchId}</p>
                        <p className="text-emerald-400">{d.total.toLocaleString()} total group pts</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10b981' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* ─── 8. Group Rolling Form ──────────────────────────────────────── */}
      {groupFormOverTime.length > 0 && (
        <SectionCard
          icon={Target}
          title="Group Form (Rolling Last 5)"
          subtitle="Average prediction accuracy across all players over the last 5 matches — is the squad sharpening up or losing the plot?"
          accent="bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-200"
        >
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={groupFormOverTime} margin={{ top: 8, right: 8, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey="matchId"
                  stroke={chartTheme.axis}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Match #', position: 'bottom', fill: chartTheme.label, fontSize: 11, offset: 0 }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke={chartTheme.axis}
                  tick={{ fontSize: 10 }}
                  unit="%"
                  width={40}
                />
                <ReferenceLine y={50} stroke={chartTheme.axis} strokeDasharray="5 5" label={{ value: '50%', fill: chartTheme.label, fontSize: 10 }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload as { matchId: number; avg: number };
                    return (
                      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                        <p className="font-semibold text-[var(--app-text)]">Match #{d.matchId}</p>
                        <p className={d.avg >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                          Group form: {d.avg}%
                        </p>
                        <p className="text-[var(--app-text-tertiary)]">avg accuracy (last 5 matches)</p>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

    </div>
  );
}
