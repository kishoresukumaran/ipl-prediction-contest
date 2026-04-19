'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { PlayerPointsBreakdown } from '@/lib/types';

interface LeaderboardEntry extends PlayerPointsBreakdown {
  avatarColor: string;
  last5Results: string[];
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalMatches: number;
  completedMatches: number;
}

type SortField = 'rank' | 'name' | 'totalPoints' | 'accuracy' | 'currentStreak' | 'correctPredictions';
type SortDir = 'asc' | 'desc';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-sm font-extrabold text-black shadow-lg shadow-amber-400/30">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center text-sm font-extrabold text-black shadow-lg shadow-slate-300/30">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-sm font-extrabold text-white shadow-lg shadow-amber-700/30">
        3
      </span>
    );
  }
  return (
    <span className="w-8 h-8 rounded-full bg-[var(--app-surface-alt)] flex items-center justify-center text-sm font-bold text-[var(--app-text-secondary)]">
      {rank}
    </span>
  );
}

function Last5Dots({ results }: { results: string[] }) {
  return (
    <div className="flex gap-1">
      {results.map((r, i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            r === 'correct'
              ? 'bg-emerald-400'
              : r === 'wrong'
              ? 'bg-red-400'
              : r === 'abandoned'
              ? 'bg-slate-400'
              : 'bg-slate-600'
          }`}
          title={r}
        />
      ))}
    </div>
  );
}

function PodiumCard({ players, rank }: { players: LeaderboardEntry[]; rank: number }) {
  const heights: Record<number, string> = { 1: 'pb-8', 2: 'pb-4', 3: 'pb-2' };
  const gradients: Record<number, string> = {
    1: 'from-amber-400/20 to-yellow-500/10 border-amber-400/30',
    2: 'from-slate-300/15 to-slate-400/5 border-slate-300/20',
    3: 'from-amber-700/15 to-amber-800/5 border-amber-700/20',
  };
  const order: Record<number, string> = { 1: 'order-2', 2: 'order-1', 3: 'order-3' };
  const first = players[0];

  return (
    <div className={`flex-1 ${order[rank]}`}>
      <div
        className={`bg-gradient-to-b ${gradients[rank]} backdrop-blur-sm border rounded-xl p-3 text-center ${heights[rank]}`}
      >
        <div className="flex justify-center gap-1 mb-2">
          {players.map(player => (
            <Link key={player.participantId} href={`/players/${player.participantId}`}>
              <div className="relative inline-block hover:scale-110 transition-transform">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.participantName.charAt(0)}
                </div>
                {players.length === 1 && (
                  <div className="absolute -top-1 -right-1"><RankBadge rank={rank} /></div>
                )}
              </div>
            </Link>
          ))}
        </div>
        {players.length > 1 && <div className="mb-1"><RankBadge rank={rank} /></div>}
        <h3 className="text-sm font-bold text-[var(--app-text)] truncate">
          {players.map(p => p.participantName).join(', ')}
        </h3>
        <div className="text-lg font-extrabold text-amber-400 mt-1">{first.totalPoints}</div>
        <div className="text-[10px] text-[var(--app-text-secondary)]">{first.accuracy.toFixed(1)}% accuracy</div>
      </div>
    </div>
  );
}

function PointsBreakdownRow({ player }: { player: LeaderboardEntry }) {
  const segments = [
    { label: 'Base', value: player.basePoints, color: 'bg-blue-400' },
    { label: 'Power', value: player.powerMatchPoints, color: 'bg-yellow-400' },
    { label: 'Underdog', value: player.underdogBonus, color: 'bg-purple-400' },
    { label: 'Joker', value: player.jokerBonus, color: 'bg-red-400' },
    { label: 'Double', value: player.doubleHeaderBonus, color: 'bg-emerald-400' },
    { label: 'Streak', value: player.streakBonus, color: 'bg-orange-400' },
    { label: 'Abandoned', value: player.abandonedPoints, color: 'bg-slate-400' },
    { label: 'Trivia', value: player.triviaPoints, color: 'bg-pink-400' },
    { label: 'Pre-Tournament', value: player.preTournamentPoints, color: 'bg-indigo-400' },
  ].filter((s) => s.value > 0);

  return (
    <div className="px-4 py-3 bg-[var(--app-surface)] border-t border-[var(--app-border)]">
      <div className="text-xs text-[var(--app-text-secondary)] mb-2 font-medium">Points Breakdown</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${seg.color}`} />
            <span className="text-xs text-[var(--app-text-secondary)]">{seg.label}</span>
            <span className="text-xs font-bold text-[var(--app-text)] ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
      {/* Points bar */}
      {player.totalPoints > 0 && (
        <div className="mt-2 flex h-2 rounded-full overflow-hidden bg-[var(--app-surface)]">
          {segments.map((seg) => (
            <div
              key={seg.label}
              className={`${seg.color} opacity-80`}
              style={{ width: `${(seg.value / player.totalPoints) * 100}%` }}
              title={`${seg.label}: ${seg.value}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  };

  const leaderboard = data?.leaderboard || [];

  const sorted = [...leaderboard].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'rank':
        cmp = (a.rank || 0) - (b.rank || 0);
        break;
      case 'name':
        cmp = a.participantName.localeCompare(b.participantName);
        break;
      case 'totalPoints':
        cmp = a.totalPoints - b.totalPoints;
        break;
      case 'accuracy':
        cmp = a.accuracy - b.accuracy;
        break;
      case 'currentStreak':
        cmp = a.currentStreak - b.currentStreak;
        break;
      case 'correctPredictions':
        cmp = a.correctPredictions - b.correctPredictions;
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  // Group podium by rank (handles ties)
  const podiumRanks: { rank: number; players: LeaderboardEntry[] }[] = [];
  for (const player of leaderboard) {
    const r = player.rank || 0;
    if (r > 3) break;
    const existing = podiumRanks.find(p => p.rank === r);
    if (existing) existing.players.push(player);
    else podiumRanks.push({ rank: r, players: [player] });
  }
  const hasPodium = podiumRanks.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-amber-400" />
        <h1 className="text-2xl font-extrabold text-[var(--app-text)]">Leaderboard</h1>
        {data && (
          <span className="text-xs text-[var(--app-text-secondary)] ml-auto">
            {data.completedMatches}/{data.totalMatches} matches
          </span>
        )}
      </div>

      {/* Podium */}
      {hasPodium && (
        <div className="flex gap-3 items-end">
          {[1, 2, 3].map(rank => {
            const group = podiumRanks.find(p => p.rank === rank);
            if (!group) return <div key={rank} className="flex-1" />;
            return <PodiumCard key={rank} players={group.players} rank={rank} />;
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_60px_50px_50px_50px] sm:grid-cols-[40px_1fr_70px_60px_60px_60px_60px] items-center px-3 py-2 bg-[var(--app-surface)] border-b border-[var(--app-border)] text-[10px] sm:text-xs font-medium text-[var(--app-text-secondary)]">
          <button onClick={() => handleSort('rank')} className="text-left hover:text-[var(--app-text)] transition-colors">
            #
          </button>
          <button onClick={() => handleSort('name')} className="text-left hover:text-[var(--app-text)] transition-colors">
            Player
          </button>
          <button onClick={() => handleSort('totalPoints')} className="text-right hover:text-[var(--app-text)] transition-colors">
            Points
          </button>
          <button onClick={() => handleSort('correctPredictions')} className="text-right hover:text-[var(--app-text)] transition-colors hidden sm:block">
            W/L
          </button>
          <button onClick={() => handleSort('accuracy')} className="text-right hover:text-[var(--app-text)] transition-colors">
            Acc%
          </button>
          <button onClick={() => handleSort('currentStreak')} className="text-right hover:text-[var(--app-text)] transition-colors">
            Strk
          </button>
          <div className="text-right hidden sm:block">Last 5</div>
        </div>

        {/* Rows */}
        {sorted.map((player) => (
          <div key={player.participantId}>
            <button
              onClick={() =>
                setExpandedId(expandedId === player.participantId ? null : player.participantId)
              }
              className="w-full grid grid-cols-[40px_1fr_60px_50px_50px_50px] sm:grid-cols-[40px_1fr_70px_60px_60px_60px_60px] items-center px-3 py-2.5 hover:bg-[var(--app-surface)] transition-all border-b border-[var(--app-border)] text-left"
            >
              <div>
                <RankBadge rank={player.rank || 0} />
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.participantName.charAt(0)}
                </div>
                <span className="text-sm font-medium text-[var(--app-text)] truncate">
                  {player.participantName}
                </span>
                {expandedId === player.participantId ? (
                  <ChevronUp className="h-3 w-3 text-[var(--app-text-tertiary)] shrink-0" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-[var(--app-text-tertiary)] shrink-0" />
                )}
              </div>
              <div className="text-right text-sm font-bold text-amber-400">
                {player.totalPoints}
              </div>
              <div className="text-right text-xs text-[var(--app-text-secondary)] hidden sm:block">
                {player.correctPredictions}/{player.totalPredictions}
              </div>
              <div className="text-right text-xs text-emerald-400">
                {player.accuracy.toFixed(0)}%
              </div>
              <div className="text-right text-xs text-purple-400">{player.currentStreak}</div>
              <div className="text-right hidden sm:flex justify-end">
                <Last5Dots results={player.last5Results} />
              </div>
            </button>

            {/* Expanded breakdown */}
            {expandedId === player.participantId && <PointsBreakdownRow player={player} />}
          </div>
        ))}
      </div>
    </div>
  );
}
