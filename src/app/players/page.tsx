'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, ArrowUpDown, Trophy, Loader2 } from 'lucide-react';
import { PlayerPointsBreakdown } from '@/lib/types';

interface PlayerData extends PlayerPointsBreakdown {
  avatarColor: string;
  jokerMatchId: number | null;
  jokerUsed: boolean;
  teamAffinity: { team: string; count: number }[];
  predictionHistory: unknown[];
}

type SortField = 'rank' | 'name' | 'totalPoints' | 'accuracy';
type SortDir = 'asc' | 'desc';

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    fetch('/api/players')
      .then((r) => r.json())
      .then(setPlayers)
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

  const filtered = players
    ? players
        .filter((p) => p.participantName.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
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
          }
          return sortDir === 'asc' ? cmp : -cmp;
        })
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-purple-400" />
        <h1 className="text-2xl font-extrabold text-[var(--app-text)]">Players</h1>
        <span className="text-xs text-[var(--app-text-secondary)] ml-auto">{players?.length || 0} participants</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--app-text-tertiary)]" />
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--app-surface)] border border-[var(--app-border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--app-text)] placeholder:text-[var(--app-text-tertiary)] focus:outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/30 transition-all"
        />
      </div>

      {/* Sort Buttons */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            { field: 'rank' as SortField, label: 'Rank' },
            { field: 'name' as SortField, label: 'Name' },
            { field: 'totalPoints' as SortField, label: 'Points' },
            { field: 'accuracy' as SortField, label: 'Accuracy' },
          ] as const
        ).map(({ field, label }) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              sortField === field
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30'
                : 'bg-[var(--app-surface)] text-[var(--app-text-secondary)] border border-[var(--app-border)] hover:bg-[var(--app-surface-alt)]'
            }`}
          >
            {label}
            {sortField === field && (
              <ArrowUpDown className="h-3 w-3" />
            )}
          </button>
        ))}
      </div>

      {/* Player Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((player) => (
          <Link key={player.participantId} href={`/players/${player.participantId}`}>
            <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4 hover:bg-[var(--app-surface-hover)] hover:border-[var(--app-border-strong)] transition-all group">
              <div className="flex items-center gap-3 mb-3">
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.participantName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[var(--app-text)] truncate">{player.participantName}</h3>
                  {/* Rank badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 ${
                      player.rank === 1
                        ? 'text-amber-400'
                        : player.rank === 2
                        ? 'text-[var(--app-text-secondary)]'
                        : player.rank === 3
                        ? 'text-amber-600'
                        : 'text-[var(--app-text-tertiary)]'
                    }`}
                  >
                    <Trophy className="h-3 w-3" />
                    Rank #{player.rank}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-[var(--app-surface)] rounded-lg py-1.5">
                  <div className="text-sm font-bold text-amber-400">{player.totalPoints}</div>
                  <div className="text-[10px] text-[var(--app-text-tertiary)]">Points</div>
                </div>
                <div className="text-center bg-[var(--app-surface)] rounded-lg py-1.5">
                  <div className="text-sm font-bold text-emerald-400">
                    {player.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-[10px] text-[var(--app-text-tertiary)]">Accuracy</div>
                </div>
                <div className="text-center bg-[var(--app-surface)] rounded-lg py-1.5">
                  <div className="text-sm font-bold text-purple-400">
                    {player.correctPredictions}/{player.totalPredictions - player.correctPredictions}
                  </div>
                  <div className="text-[10px] text-[var(--app-text-tertiary)]">W/L</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--app-text-secondary)]">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No players found</p>
        </div>
      )}
    </div>
  );
}
