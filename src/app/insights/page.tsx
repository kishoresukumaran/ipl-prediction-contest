'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BarChart3, TrendingUp, Users, Zap, Target, Trophy, Flame, Skull, Vote, Star, Globe2, Sparkles } from 'lucide-react';
import { PlayerPointsBreakdown, Match, Prediction } from '@/lib/types';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';

// Lazy load all chart components
const PointsRaceChart = dynamic(() => import('@/components/charts/PointsRaceChart').then(m => ({ default: m.PointsRaceChart })), { ssr: false });
const TeamPopularityChart = dynamic(() => import('@/components/charts/TeamPopularityChart').then(m => ({ default: m.TeamPopularityChart })), { ssr: false });
const AccuracyChart = dynamic(() => import('@/components/charts/AccuracyChart').then(m => ({ default: m.AccuracyChart })), { ssr: false });
const StreakChart = dynamic(() => import('@/components/charts/StreakChart').then(m => ({ default: m.StreakChart })), { ssr: false });
const StreakAchievements = dynamic(() => import('@/components/charts/StreakAchievements').then(m => ({ default: m.StreakAchievements })), { ssr: false });
const PredictionHeatmap = dynamic(() => import('@/components/charts/PredictionHeatmap').then(m => ({ default: m.PredictionHeatmap })), { ssr: false });
const HeadToHeadChart = dynamic(() => import('@/components/charts/HeadToHeadChart').then(m => ({ default: m.HeadToHeadChart })), { ssr: false });
const DoubleHeaderChart = dynamic(() => import('@/components/charts/DoubleHeaderChart').then(m => ({ default: m.DoubleHeaderChart })), { ssr: false });
const CrowdWisdomChart = dynamic(() => import('@/components/charts/CrowdWisdomChart').then(m => ({ default: m.CrowdWisdomChart })), { ssr: false });
const ContrarianChart = dynamic(() => import('@/components/charts/ContrarianChart').then(m => ({ default: m.ContrarianChart })), { ssr: false });
const WeeklyPointsChart = dynamic(() => import('@/components/charts/WeeklyPointsChart').then(m => ({ default: m.WeeklyPointsChart })), { ssr: false });
const MatchDifficultyChart = dynamic(() => import('@/components/charts/MatchDifficultyChart').then(m => ({ default: m.MatchDifficultyChart })), { ssr: false });
const FormChart = dynamic(() => import('@/components/charts/FormChart').then(m => ({ default: m.FormChart })), { ssr: false });
const WinRateByTeamChart = dynamic(() => import('@/components/charts/WinRateByTeamChart').then(m => ({ default: m.WinRateByTeamChart })), { ssr: false });
const PointsGapChart = dynamic(() => import('@/components/charts/PointsGapChart').then(m => ({ default: m.PointsGapChart })), { ssr: false });
const WallOfShame = dynamic(() => import('@/components/charts/WallOfShame').then(m => ({ default: m.WallOfShame })), { ssr: false });
const PointsMatrixChart = dynamic(() => import('@/components/charts/PointsMatrixChart').then(m => ({ default: m.PointsMatrixChart })), { ssr: false });
const CrowdTrapChart = dynamic(() => import('@/components/charts/CrowdTrapChart').then(m => ({ default: m.CrowdTrapChart })), { ssr: false });
const OnFireIceCold = dynamic(() => import('@/components/charts/OnFireIceCold').then(m => ({ default: m.OnFireIceCold })), { ssr: false });
const DoubleHeaderHeroesChart = dynamic(() => import('@/components/charts/DoubleHeaderHeroesChart').then(m => ({ default: m.DoubleHeaderHeroesChart })), { ssr: false });
const DoubleHeaderDayViewChart = dynamic(() => import('@/components/charts/DoubleHeaderDayViewChart').then(m => ({ default: m.DoubleHeaderDayViewChart })), { ssr: false });
const JokerFilesChart = dynamic(() => import('@/components/charts/JokerFilesChart').then(m => ({ default: m.JokerFilesChart })), { ssr: false });
const TriviaThrone = dynamic(() => import('@/components/charts/TriviaThrone').then(m => ({ default: m.TriviaThrone })), { ssr: false });
const TriviaInterrogationRoom = dynamic(() => import('@/components/charts/TriviaInterrogationRoom').then(m => ({ default: m.TriviaInterrogationRoom })), { ssr: false });
const GhostVotersChart = dynamic(() => import('@/components/charts/GhostVotersChart').then(m => ({ default: m.GhostVotersChart })), { ssr: false });
const TeamVoteTotalsChart = dynamic(() => import('@/components/charts/TeamVoteTotalsChart').then(m => ({ default: m.TeamVoteTotalsChart })), { ssr: false });
const VoteSplitChart = dynamic(() => import('@/components/charts/VoteSplitChart').then(m => ({ default: m.VoteSplitChart })), { ssr: false });
const ParticipationPulseChart = dynamic(() => import('@/components/charts/ParticipationPulseChart').then(m => ({ default: m.ParticipationPulseChart })), { ssr: false });
const HomeAwayBiasChart = dynamic(() => import('@/components/charts/HomeAwayBiasChart').then(m => ({ default: m.HomeAwayBiasChart })), { ssr: false });
const PowerRankingsChart = dynamic(() => import('@/components/charts/PowerRankingsChart').then(m => ({ default: m.PowerRankingsChart })), { ssr: false });
const GroupStatsPanel = dynamic(() => import('@/components/charts/GroupStatsPanel').then(m => ({ default: m.GroupStatsPanel })), { ssr: false });
const CrystalBallInsightsPanel = dynamic(() => import('@/components/charts/CrystalBallInsightsPanel').then(m => ({ default: m.CrystalBallInsightsPanel })), { ssr: false });

interface InsightsAPIData {
  leaderboard: PlayerPointsBreakdown[];
  matches: Match[];
  predictions: Prediction[];
  pointsRace: { matchId: number; matchDate: string; [key: string]: number | string }[];
  teamPopularity: { team: string; correct: number; wrong: number; total: number }[];
  accuracyByPlayer: { id: string; name: string; accuracy: number; correct: number; total: number }[];
  weeklyPoints: { week: string; [key: string]: number | string }[];
  crowdWisdom: { matchId: number; homeTeam: string; awayTeam: string; majorityTeam: string; majorityPct: number; crowdCorrect: boolean; runningAccuracy: number }[];
  contrarianData: { name: string; contrarianPct: number; contrarianAccuracy: number; color: string }[];
  matchDifficulty: { matchId: number; homeTeam: string; awayTeam: string; groupAccuracy: number; totalPredictions: number }[];
  formData: { matchId: number; [key: string]: number | string }[];
  winRateByTeam: { participants: { id: string; name: string }[]; teams: string[]; data: Record<string, Record<string, { correct: number; total: number; rate: number }>> };
  doubleHeaderData: { name: string; totalDoubleHeaders: number; bothCorrect: number; successRate: number; color: string }[];
  doubleHeaderHeroes: { name: string; color: string; totalDays: number; sweptDays: number; totalBonusPoints: number; successRate: number; instances: { date: string; matches: { matchId: number; homeTeam: string; awayTeam: string; predicted: string; winner: string; correct: boolean }[]; swept: boolean }[] }[];
  heatmapData: { participants: { id: string; name: string }[]; matches: { id: number; home_team: string; away_team: string; is_abandoned?: boolean }[]; predictions: Record<string, Record<number, { predicted: string; correct: boolean | null | 'abandoned' }>> };
  streakData: { name: string; longestStreak: number; currentStreak: number; color: string }[];
  streakAchievements: {
    playerId: string;
    name: string;
    color: string;
    streakCount: number;
    longestStreak: number;
    currentStreak: number;
    streaks: {
      id: string;
      startMatchId: number;
      endMatchId: number;
      length: number;
      matches: {
        matchId: number;
        homeTeam: string;
        awayTeam: string;
        predicted: string;
        winner: string;
        isAbandoned: boolean;
        correct: boolean;
      }[];
    }[];
  }[];
  wallOfShame: {
    wastedJokers: { name: string; matchId: number; homeTeam: string; awayTeam: string; picked: string; winner: string; color: string }[];
    jinxers: { name: string; pickedFavorite: number; favoriteWon: number; favoriteLost: number; jinxRate: number; color: string; jinxMatches: { matchId: number; homeTeam: string; awayTeam: string; favorite: string; winner: string | null; jinxed: boolean; voteShare: number; totalVotes: number }[] }[];
    losingStreaks: { name: string; currentLosingStreak: number; longestLosingStreak: number; color: string }[];
  };
  copycats: { copier: string; copierName: string; copierColor: string; target: string; targetName: string; targetColor: string; count: number; matches: number; instances: { matchId: number; homeTeam: string; awayTeam: string; team: string; targetTime: string; copierTime: string; gapMinutes: number }[] }[];
  pointsMatrix: {
    matches: { id: number; home_team: string; away_team: string; match_type: string; is_power_match: boolean; is_abandoned?: boolean }[];
    matrix: Record<string, Record<number, { total: number; base: number; powerMatch: number; underdog: number; joker: number; streak: number; doubleHeader: number; abandoned: number }>>;
    triviaByPlayer: Record<string, number>;
    preTournamentByPlayer?: Record<string, number>;
  };
  preTournamentByPlayer: Record<string, number>;
  preTournamentPredictions: import('@/lib/types').PreTournamentPrediction[];
  preTournamentActuals: import('@/lib/types').PreTournamentActuals | null;
  ghostVoters: { name: string; color: string; missedCount: number; noVoteCount: number; lateCount: number; participationRate: number; totalMatches: number; missedMatches: { matchId: number; homeTeam: string; awayTeam: string; matchDate: string; reason: 'no_vote' | 'late' }[] }[];
  teamVoteTotals: { team: string; teamName: string; color: string; textColor: string; total: number; correct: number; wrong: number; pending: number; winRate: number }[];
  voteSplits: { matchId: number; homeTeam: string; awayTeam: string; homePicks: number; awayPicks: number; totalVotes: number; consensusPct: number; majorityTeam: string; majorityCorrect: boolean; winner: string | null }[];
  participationRate: { matchId: number; matchLabel: string; homeTeam: string; awayTeam: string; matchDate: string; voterCount: number; totalParticipants: number; rate: number; runningAvg: number }[];
  homeAwayBias: { players: { name: string; color: string; homePicks: number; awayPicks: number; total: number; homeBias: number }[]; groupAvg: number };
  triviaStats: {
    byPlayer: {
      name: string;
      color: string;
      total: number;
      correct: number;
      attempted: number;
      accuracy: number;
      allCorrect: boolean;
      rounds: { triviaId: number; prediction: string; correctAnswer: string; correct: boolean; points: number }[];
    }[];
    byQuestion: {
      triviaId: number;
      correctAnswer: string;
      totalAttempted: number;
      correctCount: number;
      stumpedEveryone: boolean;
      easyRound: boolean;
      results: { name: string; color: string; prediction: string; correct: boolean; points: number }[];
    }[];
  };
}

const TABS = [
  { id: 'leaderboard', label: 'Points & Rank', icon: Trophy },
  { id: 'accuracy', label: 'Accuracy', icon: Target },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'streaks', label: 'Streaks', icon: Flame },
  { id: 'bonus', label: 'Bonus', icon: Star },
  { id: 'pretournament', label: 'Pre-Tournament', icon: Sparkles },
  { id: 'behavior', label: 'Behavior', icon: Zap },
  { id: 'h2h', label: 'Head to Head', icon: TrendingUp },
  { id: 'matches', label: 'Match Analysis', icon: BarChart3 },
  { id: 'votes', label: 'Votes', icon: Vote },
  { id: 'group', label: 'Group Stats', icon: Globe2 },
  { id: 'shame', label: 'Wall of Shame', icon: Skull },
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
  if (!data) return <div className="p-4 text-center text-[var(--app-text-secondary)]">Failed to load insights data</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
        Insights & Analytics
      </h1>
      <p className="text-sm text-[var(--app-text-secondary)] mb-4">Deep dive into prediction patterns and performance</p>

      {/* Tab navigation */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[var(--app-surface)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-alt)]'
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
            <ChartCard title="Power Rankings" subtitle="Who's dominating the prediction battle? Every correct call counts.">
              <PowerRankingsChart data={data.leaderboard} />
            </ChartCard>
            <ChartCard title="Points Race" subtitle="Cumulative points over matches">
              <PointsRaceChart data={data.pointsRace} matches={data.matches} />
            </ChartCard>
            <ChartCard title="Points Matrix" subtitle="Every point earned, match by match. The spreadsheet your inner nerd has been waiting for.">
              <PointsMatrixChart data={data.pointsMatrix} leaderboard={data.leaderboard} />
            </ChartCard>
            <ChartCard title="Points Gap Analysis" subtitle="How far behind the leader?">
              <PointsGapChart data={data.leaderboard} />
            </ChartCard>
            <ChartCard title="Weekly Points" subtitle="Points earned each week (weeks run Sunday to Saturday)">
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
            <ChartCard title="On Fire / Ice Cold 🔥❄️" subtitle="Current streak status across all players">
              <OnFireIceCold data={data.streakData} />
            </ChartCard>
            <ChartCard title="Streak Hall of Fame" subtitle="Streaks attained, best streak length, and full match-by-match breakdown — click a player to expand.">
              <StreakAchievements data={data.streakAchievements} />
            </ChartCard>
            <ChartCard title="Winning Streaks" subtitle="Longest and current streaks">
              <StreakChart data={data.streakData} />
            </ChartCard>
          </>
        )}

        {activeTab === 'bonus' && (
          <>
            <ChartCard title="The Joker Files 🃏" subtitle="Ten points on the line. Who played their wild card right — and who burned it?">
              <JokerFilesChart
                leaderboard={data.leaderboard}
                predictions={data.predictions}
                matches={data.matches}
                pointsMatrix={data.pointsMatrix}
                wastedJokers={data.wallOfShame.wastedJokers}
                ghostVoters={data.ghostVoters}
              />
            </ChartCard>
            <ChartCard title="Double Down Diary 📅" subtitle="Every double header day has a story. Pick a date, see who came prepared and who got caught out.">
              <DoubleHeaderDayViewChart data={data.doubleHeaderHeroes} />
            </ChartCard>
            <ChartCard title="The Clean Sweep Club 🧹" subtitle="Two matches, one day, all correct — that's the double header sweep. Click a player to see exactly which days they nailed it and which ones got away.">
              <DoubleHeaderHeroesChart data={data.doubleHeaderHeroes} />
            </ChartCard>
            <ChartCard title="Double Header Success" subtitle="Both matches correct on same day">
              <DoubleHeaderChart data={data.doubleHeaderData} />
            </ChartCard>
            <ChartCard title="The Trivia Throne 👑" subtitle="Who rules the knowledge game? Total trivia points earned across all rounds — click a player to see their question-by-question record.">
              <TriviaThrone data={data.triviaStats.byPlayer} />
            </ChartCard>
            <ChartCard title="The Interrogation Room 🔍" subtitle="Pick a question, crack the room open. See the correct answer, who got it right, and what the rest got hilariously wrong.">
              <TriviaInterrogationRoom data={data.triviaStats.byQuestion} />
            </ChartCard>
          </>
        )}

        {activeTab === 'votes' && (
          <>
            <ChartCard title="The Ghost Voters 👻" subtitle="Who forgot to show up? Players ranked by missed votes — no prediction at all or voted after the match started.">
              <GhostVotersChart data={data.ghostVoters} />
            </ChartCard>
            <ChartCard title="Team Loyalty Leaderboard" subtitle="Total votes each team has received across all players and matches. The people's champions vs the underdogs nobody believes in.">
              <TeamVoteTotalsChart data={data.teamVoteTotals} />
            </ChartCard>
            <ChartCard title="The Herd Meter" subtitle="How lopsided was each match vote? When everyone picks the same team, are they right or walking into a trap together?">
              <VoteSplitChart data={data.voteSplits} />
            </ChartCard>
            <ChartCard title="Participation Pulse" subtitle="Are people still voting or have they quietly given up? Match-by-match participation rate over the season.">
              <ParticipationPulseChart data={data.participationRate} />
            </ChartCard>
            <ChartCard title="Home vs Away Bias" subtitle="Some people just can't resist backing the home team. Others are contrarian away-pickers. Here's the truth.">
              <HomeAwayBiasChart data={data.homeAwayBias} />
            </ChartCard>
          </>
        )}

        {activeTab === 'pretournament' && (
          <CrystalBallInsightsPanel hasData={(data.preTournamentPredictions?.length ?? 0) > 0} />
        )}

        {activeTab === 'behavior' && (
          <>
            <ChartCard title="Contrarian Picks" subtitle="Who goes against the crowd, and does it work? Either a lone genius ahead of their time, or just confidently wrong. The chart will tell.">
              <ContrarianChart data={data.contrarianData} />
            </ChartCard>
            <ChartCard title="Crowd Wisdom" subtitle="Does the majority always pick the winner? Spoiler: not always. Sometimes 29 people can be spectacularly wrong together.">
              <CrowdWisdomChart data={data.crowdWisdom} />
            </ChartCard>
          </>
        )}

        {activeTab === 'h2h' && (
          <ChartCard title="Head-to-Head Comparison" subtitle="Pick two rivals and settle the argument once and for all. Friendship may not survive this.">
            <HeadToHeadChart leaderboard={data.leaderboard} />
          </ChartCard>
        )}

        {activeTab === 'matches' && (
          <ChartCard title="Hardest Matches to Predict" subtitle="The matches that made everyone look clueless. Don't worry, even experts got these wrong... probably.">
            <MatchDifficultyChart data={data.matchDifficulty} />
          </ChartCard>
        )}

        {activeTab === 'group' && (
          <GroupStatsPanel
            leaderboard={data.leaderboard}
            crowdWisdom={data.crowdWisdom}
            voteSplits={data.voteSplits}
            participationRate={data.participationRate}
            ghostVoters={data.ghostVoters}
            matchDifficulty={data.matchDifficulty}
            streakData={data.streakData}
            pointsRace={data.pointsRace}
            formData={data.formData}
            completedMatches={data.matches.filter(m => m.is_completed && m.winner).length}
            totalMatches={data.matches.length}
          />
        )}

        {activeTab === 'shame' && (
          <WallOfShame data={data.wallOfShame} />
        )}
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-0.5">{title}</h3>
      <p className="text-xs text-[var(--app-text-secondary)] mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="h-8 w-48 bg-[var(--app-surface)] rounded animate-pulse" />
      <div className="h-4 w-64 bg-[var(--app-surface)] rounded animate-pulse" />
      <div className="flex gap-2 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-[var(--app-surface)] rounded-full animate-pulse shrink-0" />
        ))}
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-[var(--app-surface)] rounded-xl p-4 space-y-3">
          <div className="h-5 w-40 bg-[var(--app-surface)] rounded animate-pulse" />
          <div className="h-[300px] bg-[var(--app-surface)] rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
