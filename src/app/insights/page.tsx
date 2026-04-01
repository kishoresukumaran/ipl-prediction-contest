'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, TrendingUp, Users, Zap, Target, Clock, Trophy, Flame } from 'lucide-react';
import { PlayerPointsBreakdown, Match, Prediction } from '@/lib/types';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';

// Lazy load all chart components
const PointsRaceChart = dynamic(() => import('@/components/charts/PointsRaceChart').then(m => ({ default: m.PointsRaceChart })), { ssr: false });
const TeamPopularityChart = dynamic(() => import('@/components/charts/TeamPopularityChart').then(m => ({ default: m.TeamPopularityChart })), { ssr: false });
const AccuracyChart = dynamic(() => import('@/components/charts/AccuracyChart').then(m => ({ default: m.AccuracyChart })), { ssr: false });
const StreakChart = dynamic(() => import('@/components/charts/StreakChart').then(m => ({ default: m.StreakChart })), { ssr: false });
const BonusBreakdownChart = dynamic(() => import('@/components/charts/BonusBreakdownChart').then(m => ({ default: m.BonusBreakdownChart })), { ssr: false });
const PredictionHeatmap = dynamic(() => import('@/components/charts/PredictionHeatmap').then(m => ({ default: m.PredictionHeatmap })), { ssr: false });
const HeadToHeadChart = dynamic(() => import('@/components/charts/HeadToHeadChart').then(m => ({ default: m.HeadToHeadChart })), { ssr: false });
const PredictionTimingChart = dynamic(() => import('@/components/charts/PredictionTimingChart').then(m => ({ default: m.PredictionTimingChart })), { ssr: false });
const DoubleHeaderChart = dynamic(() => import('@/components/charts/DoubleHeaderChart').then(m => ({ default: m.DoubleHeaderChart })), { ssr: false });
const CrowdWisdomChart = dynamic(() => import('@/components/charts/CrowdWisdomChart').then(m => ({ default: m.CrowdWisdomChart })), { ssr: false });
const ContrarianChart = dynamic(() => import('@/components/charts/ContrarianChart').then(m => ({ default: m.ContrarianChart })), { ssr: false });
const WeeklyPointsChart = dynamic(() => import('@/components/charts/WeeklyPointsChart').then(m => ({ default: m.WeeklyPointsChart })), { ssr: false });
const MatchDifficultyChart = dynamic(() => import('@/components/charts/MatchDifficultyChart').then(m => ({ default: m.MatchDifficultyChart })), { ssr: false });
const FormChart = dynamic(() => import('@/components/charts/FormChart').then(m => ({ default: m.FormChart })), { ssr: false });
const WinRateByTeamChart = dynamic(() => import('@/components/charts/WinRateByTeamChart').then(m => ({ default: m.WinRateByTeamChart })), { ssr: false });
const PointsGapChart = dynamic(() => import('@/components/charts/PointsGapChart').then(m => ({ default: m.PointsGapChart })), { ssr: false });
const BonusQuestionAccuracyChart = dynamic(() => import('@/components/charts/BonusQuestionAccuracyChart').then(m => ({ default: m.BonusQuestionAccuracyChart })), { ssr: false });

interface InsightsAPIData {
  leaderboard: PlayerPointsBreakdown[];
  matches: Match[];
  predictions: Prediction[];
  pointsRace: { matchId: number; matchDate: string; [key: string]: number | string }[];
  teamPopularity: { team: string; correct: number; wrong: number; total: number }[];
  accuracyByPlayer: { id: string; name: string; accuracy: number; correct: number; total: number }[];
  predictionTimings: { id: string; name: string; avgMinutesBefore: number }[];
  weeklyPoints: { week: string; [key: string]: number | string }[];
  crowdWisdom: { matchId: number; homeTeam: string; awayTeam: string; majorityTeam: string; majorityPct: number; crowdCorrect: boolean; runningAccuracy: number }[];
  contrarianData: { name: string; contrarianPct: number; contrarianAccuracy: number; color: string }[];
  matchDifficulty: { matchId: number; homeTeam: string; awayTeam: string; groupAccuracy: number; totalPredictions: number }[];
  formData: { matchId: number; [key: string]: number | string }[];
  winRateByTeam: { participants: { id: string; name: string }[]; teams: string[]; data: Record<string, Record<string, { correct: number; total: number; rate: number }>> };
  doubleHeaderData: { name: string; totalDoubleHeaders: number; bothCorrect: number; successRate: number; color: string }[];
  heatmapData: { participants: { id: string; name: string }[]; matches: { id: number; home_team: string; away_team: string }[]; predictions: Record<string, Record<number, { predicted: string; correct: boolean | null }>> };
  streakData: { name: string; longestStreak: number; currentStreak: number; color: string }[];
  bonusAccuracy: { name: string; correct: number; total: number; accuracy: number; points: number; color: string }[];
}

const TABS = [
  { id: 'leaderboard', label: 'Points & Rank', icon: Trophy },
  { id: 'accuracy', label: 'Accuracy', icon: Target },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'streaks', label: 'Streaks & Bonus', icon: Flame },
  { id: 'behavior', label: 'Behavior', icon: Zap },
  { id: 'h2h', label: 'Head to Head', icon: TrendingUp },
  { id: 'matches', label: 'Match Analysis', icon: BarChart3 },
  { id: 'timing', label: 'Timing', icon: Clock },
];

export default function InsightsPage() {
  const [data, setData] = useState<InsightsAPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');

  useEffect(() => {
    fetch('/api/insights')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!data) return <div className="p-4 text-center text-slate-400">Failed to load insights data</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
        Insights & Analytics
      </h1>
      <p className="text-sm text-slate-400 mb-4">Deep dive into prediction patterns and performance</p>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart sections */}
      <div className="space-y-6">
        {activeTab === 'leaderboard' && (
          <>
            <ChartCard title="Points Race" subtitle="Cumulative points over matches">
              <PointsRaceChart data={data.pointsRace} />
            </ChartCard>
            <ChartCard title="Points Gap Analysis" subtitle="How far behind the leader?">
              <PointsGapChart data={data.leaderboard} />
            </ChartCard>
            <ChartCard title="Points Source Breakdown" subtitle="Where do points come from?">
              <BonusBreakdownChart data={data.leaderboard} />
            </ChartCard>
            <ChartCard title="Weekly Points" subtitle="Points earned each week">
              <WeeklyPointsChart data={data.weeklyPoints} />
            </ChartCard>
          </>
        )}

        {activeTab === 'accuracy' && (
          <>
            <ChartCard title="Prediction Accuracy" subtitle="Overall accuracy per player">
              <AccuracyChart data={data.accuracyByPlayer} />
            </ChartCard>
            <ChartCard title="Form Chart" subtitle="Rolling accuracy (last 5 matches)">
              <FormChart data={data.formData} />
            </ChartCard>
            <ChartCard title="Prediction Heatmap" subtitle="Green = correct, Red = wrong, Gray = no prediction">
              <PredictionHeatmap data={data.heatmapData} />
            </ChartCard>
          </>
        )}

        {activeTab === 'teams' && (
          <>
            <ChartCard title="Team Popularity" subtitle="Which teams get predicted most?">
              <TeamPopularityChart data={data.teamPopularity} />
            </ChartCard>
            <ChartCard title="Win Rate by Team" subtitle="Accuracy when picking each team">
              <WinRateByTeamChart data={data.winRateByTeam} />
            </ChartCard>
          </>
        )}

        {activeTab === 'streaks' && (
          <>
            <ChartCard title="Winning Streaks" subtitle="Longest and current streaks">
              <StreakChart data={data.streakData} />
            </ChartCard>
            <ChartCard title="Double Header Success" subtitle="Both matches correct on same day">
              <DoubleHeaderChart data={data.doubleHeaderData} />
            </ChartCard>
            <ChartCard title="Bonus Question Accuracy" subtitle="Who gets the most bonus questions right?">
              <BonusQuestionAccuracyChart data={data.bonusAccuracy} />
            </ChartCard>
          </>
        )}

        {activeTab === 'behavior' && (
          <>
            <ChartCard title="Contrarian Picks" subtitle="Who goes against the crowd, and does it work?">
              <ContrarianChart data={data.contrarianData} />
            </ChartCard>
            <ChartCard title="Crowd Wisdom" subtitle="Does the majority always pick the winner?">
              <CrowdWisdomChart data={data.crowdWisdom} />
            </ChartCard>
          </>
        )}

        {activeTab === 'h2h' && (
          <ChartCard title="Head-to-Head Comparison" subtitle="Compare two players across all dimensions">
            <HeadToHeadChart leaderboard={data.leaderboard} />
          </ChartCard>
        )}

        {activeTab === 'matches' && (
          <ChartCard title="Hardest Matches to Predict" subtitle="Matches with lowest group accuracy">
            <MatchDifficultyChart data={data.matchDifficulty} />
          </ChartCard>
        )}

        {activeTab === 'timing' && (
          <ChartCard title="Early Bird Rankings" subtitle="Who predicts earliest before the match?">
            <PredictionTimingChart data={data.predictionTimings} />
          </ChartCard>
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
      <h3 className="text-base font-semibold text-white mb-0.5">{title}</h3>
      <p className="text-xs text-slate-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
      <div className="h-4 w-64 bg-white/5 rounded animate-pulse" />
      <div className="flex gap-2 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-white/5 rounded-full animate-pulse shrink-0" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="h-5 w-40 bg-white/5 rounded animate-pulse" />
          <div className="h-[300px] bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
