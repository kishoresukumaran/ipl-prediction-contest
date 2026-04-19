'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  BarChart3,
  Minus,
  HelpCircle,
} from 'lucide-react';
import { TEAMS } from '@/lib/constants';
import { PlayerPointsBreakdown, PreTournamentPrediction, PreTournamentActuals } from '@/lib/types';
import { CrystalBallSection } from '@/components/dashboard/CrystalBallSection';

interface PredictionHistoryItem {
  matchId: number;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  winner: string | null;
  predictedTeam: string | null;
  isCorrect: boolean | 'abandoned';
  predictionTime: string | null;
}

interface BonusHistoryItem {
  questionId: number;
  questionText: string;
  options: string[];
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  selectedOption: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
  points: number;
}

interface PlayerData extends PlayerPointsBreakdown {
  avatarColor: string;
  jokerMatchId: number | null;
  jokerUsed: boolean;
  teamAffinity: { team: string; count: number }[];
  hatedTeams: { team: string; count: number }[];
  profitableTeams: { team: string; points: number }[];
  predictionHistory: PredictionHistoryItem[];
  bonusHistory: BonusHistoryItem[];
  preTournamentPrediction: PreTournamentPrediction | null;
  preTournamentActuals: PreTournamentActuals | null;
}

function TeamBadge({ team }: { team: string }) {
  const teamConfig = TEAMS[team];
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-bold"
      style={{
        backgroundColor: teamConfig?.color || '#666',
        color: teamConfig?.textColor || '#fff',
      }}
    >
      {team}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-3 text-center">
      <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-[var(--app-text-secondary)]">{label}</div>
    </div>
  );
}

export default function PlayerProfilePage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = use(params);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then((players: PlayerData[]) => {
        setAllPlayers(players);
        const found = players.find((p: PlayerData) => p.participantId === playerId);
        setPlayer(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto text-center">
        <p className="text-[var(--app-text-secondary)]">Player not found</p>
        <Link href="/players" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">
          Back to players
        </Link>
      </div>
    );
  }

  const pointsSegments = [
    { label: 'Base', value: player.basePoints, color: 'bg-blue-400', textColor: 'text-blue-400' },
    { label: 'Power', value: player.powerMatchPoints, color: 'bg-yellow-400', textColor: 'text-yellow-400' },
    { label: 'Underdog', value: player.underdogBonus, color: 'bg-purple-400', textColor: 'text-purple-400' },
    { label: 'Joker', value: player.jokerBonus, color: 'bg-red-400', textColor: 'text-red-400' },
    { label: 'Double Header', value: player.doubleHeaderBonus, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
    { label: 'Streak', value: player.streakBonus, color: 'bg-orange-400', textColor: 'text-orange-400' },
    { label: 'Trivia', value: player.triviaPoints, color: 'bg-pink-400', textColor: 'text-pink-400' },
    { label: 'Pre-Tournament', value: player.preTournamentPoints, color: 'bg-indigo-400', textColor: 'text-indigo-400' },
  ];

  const topTeams = player.teamAffinity.slice(0, 5);

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href="/players"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Players
      </Link>

      {/* Player Header */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-5 text-center">
        <div className="relative inline-block mb-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mx-auto ring-2 ring-[var(--app-border-strong)]"
            style={{ backgroundColor: player.avatarColor }}
          >
            {player.participantName.charAt(0)}
          </div>
          {player.rank && player.rank <= 3 && (
            <div className="absolute -top-1 -right-1">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold shadow-lg ${
                  player.rank === 1
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-black'
                    : player.rank === 2
                    ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-black'
                    : 'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                }`}
              >
                {player.rank}
              </span>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--app-text)]">{player.participantName}</h1>
        <p className="text-sm text-[var(--app-text-secondary)] mt-1">
          Rank #{player.rank} of {allPlayers.length}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <StatCard label="Total Points" value={player.totalPoints} color="text-amber-400" icon={Trophy} />
        <StatCard
          label="Correct/Total"
          value={`${player.correctPredictions}/${player.totalPredictions}`}
          color="text-emerald-400"
          icon={Target}
        />
        <StatCard label="Accuracy" value={`${player.accuracy.toFixed(0)}%`} color="text-blue-400" icon={BarChart3} />
        <StatCard label="Best Streak" value={player.longestStreak} color="text-orange-400" icon={Flame} />
        <StatCard label="Current Streak" value={player.currentStreak} color="text-purple-400" icon={TrendingUp} />
      </div>

      {/* Points Breakdown */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          Points Breakdown
        </h2>

        {/* Points Bar */}
        {player.totalPoints > 0 && (
          <div className="flex h-4 rounded-full overflow-hidden bg-[var(--app-surface)] mb-3">
            {pointsSegments
              .filter((s) => s.value > 0)
              .map((seg) => (
                <div
                  key={seg.label}
                  className={`${seg.color} opacity-80 hover:opacity-100 transition-opacity relative group`}
                  style={{ width: `${(seg.value / player.totalPoints) * 100}%` }}
                  title={`${seg.label}: ${seg.value}`}
                />
              ))}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {pointsSegments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2 py-1">
              <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
              <span className="text-xs text-[var(--app-text-secondary)] flex-1">{seg.label}</span>
              <span className={`text-xs font-bold ${seg.textColor}`}>{seg.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Joker Status */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4">
        <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
          <Zap className="h-4 w-4 text-red-400" />
          Joker Card
        </h2>
        {player.jokerUsed ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-medium">Used on Match #{player.jokerMatchId}</span>
            {player.jokerBonus > 0 && (
              <span className="text-xs text-amber-400 font-bold">+{player.jokerBonus} pts</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-[var(--app-text-tertiary)]">Not yet played</span>
        )}
      </div>

      {/* Crystal Ball (Pre-Tournament Predictions) */}
      <CrystalBallSection
        participantName={player.participantName}
        prediction={player.preTournamentPrediction}
        actuals={player.preTournamentActuals}
        breakdown={player.preTournamentBreakdown}
      />

      {/* Team Affinity */}
      {topTeams.length > 0 && (
        <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] mb-1 flex items-center gap-2">
            <span className="text-base">😍</span> The Fanboy
          </h2>
          <p className="text-[10px] text-[var(--app-text-tertiary)] mb-3">Teams {player.participantName} picks the most</p>
          <div className="space-y-2">
            {topTeams.map((ta) => {
              const maxCount = topTeams[0]?.count || 1;
              return (
                <div key={ta.team} className="flex items-center gap-3">
                  <TeamBadge team={ta.team} />
                  <div className="flex-1">
                    <div className="flex h-2 rounded-full overflow-hidden bg-[var(--app-surface)]">
                      <div
                        className="rounded-full transition-all"
                        style={{
                          width: `${(ta.count / maxCount) * 100}%`,
                          backgroundColor: TEAMS[ta.team]?.color || '#666',
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[var(--app-text-secondary)] w-8 text-right">{ta.count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* The Hater - most bet against */}
      {player.hatedTeams?.length > 0 && (
        <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] mb-1 flex items-center gap-2">
            <span className="text-base">😤</span> The Hater
          </h2>
          <p className="text-[10px] text-[var(--app-text-tertiary)] mb-3">Teams {player.participantName} bets against the most</p>
          <div className="space-y-2">
            {player.hatedTeams.slice(0, 5).map((ht) => {
              const maxCount = player.hatedTeams[0]?.count || 1;
              return (
                <div key={ht.team} className="flex items-center gap-3">
                  <TeamBadge team={ht.team} />
                  <div className="flex-1">
                    <div className="flex h-2 rounded-full overflow-hidden bg-[var(--app-surface)]">
                      <div className="rounded-full bg-red-500/70 transition-all" style={{ width: `${(ht.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-red-400 w-8 text-right">{ht.count}x</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Most Profitable Team */}
      {player.profitableTeams?.length > 0 && (
        <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4">
          <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] mb-1 flex items-center gap-2">
            <span className="text-base">💰</span> Most Profitable Team
          </h2>
          <p className="text-[10px] text-[var(--app-text-tertiary)] mb-3">Which team earned {player.participantName} the most points</p>
          <div className="space-y-2">
            {player.profitableTeams.slice(0, 5).map((pt, i) => (
              <div key={pt.team} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-amber-400 text-black' : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]'
                }`}>{i + 1}</span>
                <TeamBadge team={pt.team} />
                <span className="text-sm text-[var(--app-text)] flex-1">{TEAMS[pt.team]?.name}</span>
                <span className="text-sm font-bold text-amber-400">+{pt.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction History */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--app-border)]">
          <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            Prediction History ({player.predictionHistory.length})
          </h2>
        </div>
        <div className="max-h-[400px] overflow-y-auto divide-y divide-[var(--app-border)]">
          {player.predictionHistory.length === 0 ? (
            <div className="px-4 py-6 text-center text-[var(--app-text-tertiary)] text-sm">No completed matches yet</div>
          ) : (
            [...player.predictionHistory].reverse().map((ph) => (
              <Link key={ph.matchId} href={`/matches/${ph.matchId}`}>
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--app-surface)] transition-all">
                  <div className="shrink-0">
                    {ph.predictedTeam ? (
                      ph.isCorrect === 'abandoned' ? (
                        <span className="text-sm text-slate-400 font-medium">~</span>
                      ) : ph.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )
                    ) : (
                      <Minus className="h-5 w-5 text-[var(--app-text-tertiary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--app-text-tertiary)]">#{ph.matchId}</span>
                      <TeamBadge team={ph.homeTeam} />
                      <span className="text-[var(--app-text-tertiary)] text-xs">vs</span>
                      <TeamBadge team={ph.awayTeam} />
                    </div>
                    <div className="text-[10px] text-[var(--app-text-tertiary)] mt-0.5">
                      {new Date(ph.matchDate + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {ph.predictedTeam ? (
                      <span className="text-xs text-[var(--app-text-secondary)]">
                        Picked: <TeamBadge team={ph.predictedTeam} />
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--app-text-tertiary)] italic">No pick</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Bonus Question History */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--app-border)]">
          <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            Bonus Question History ({player.bonusHistory?.length ?? 0})
          </h2>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-[var(--app-border)]">
          {!player.bonusHistory?.length ? (
            <div className="px-4 py-6 text-center text-[var(--app-text-tertiary)] text-sm">No bonus questions yet</div>
          ) : (
            [...player.bonusHistory].reverse().map((bh) => {
              const answered = bh.selectedOption !== null;
              const resolved = bh.correctAnswer !== null;
              return (
                <Link key={bh.questionId} href={`/matches/${bh.matchId}`}>
                  <div className="px-4 py-3 hover:bg-[var(--app-surface-hover)] transition-all">
                    {/* Match + result icon row */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="shrink-0">
                        {!answered ? (
                          <Minus className="h-4 w-4 text-[var(--app-text-tertiary)]" />
                        ) : !resolved ? (
                          <Minus className="h-4 w-4 text-[var(--app-text-tertiary)]" />
                        ) : bh.isCorrect ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--app-text-tertiary)]">#{bh.matchId}</span>
                      {bh.homeTeam && <TeamBadge team={bh.homeTeam} />}
                      {bh.homeTeam && bh.awayTeam && (
                        <span className="text-[var(--app-text-tertiary)] text-[10px]">vs</span>
                      )}
                      {bh.awayTeam && <TeamBadge team={bh.awayTeam} />}
                      {bh.isCorrect && bh.points > 0 && (
                        <span className="ml-auto text-xs font-bold text-amber-400">+{bh.points} pts</span>
                      )}
                    </div>

                    {/* Question text */}
                    <p className="text-xs font-medium text-[var(--app-text)] leading-snug mb-2">
                      {bh.questionText}
                    </p>

                    {/* Options grid */}
                    {bh.options.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {bh.options.map((opt) => {
                          const isPlayerPick = opt === bh.selectedOption;
                          const isCorrectOpt = resolved && opt === bh.correctAnswer;
                          const isWrongPick = isPlayerPick && resolved && !bh.isCorrect;

                          let cls = 'text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ';
                          if (isCorrectOpt && isPlayerPick) {
                            // player picked correctly
                            cls += 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
                          } else if (isCorrectOpt) {
                            // correct answer but player didn't pick it
                            cls += 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
                          } else if (isWrongPick) {
                            // player picked this but it's wrong
                            cls += 'bg-red-500/15 border-red-400 text-red-300';
                          } else if (isPlayerPick && !resolved) {
                            // picked but result pending
                            cls += 'bg-indigo-500/15 border-indigo-400/60 text-indigo-300';
                          } else {
                            // neutral unchosen option
                            cls += 'bg-transparent border-[var(--app-border)] text-[var(--app-text-tertiary)]';
                          }

                          return (
                            <span key={opt} className={cls}>
                              {isPlayerPick && '→ '}
                              {opt}
                              {isCorrectOpt && !isPlayerPick && ' ✓'}
                            </span>
                          );
                        })}
                        {!answered && (
                          <span className="text-[10px] italic text-[var(--app-text-tertiary)] px-1">No answer</span>
                        )}
                        {answered && !resolved && (
                          <span className="text-[10px] italic text-[var(--app-text-tertiary)] px-1">Result pending</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
