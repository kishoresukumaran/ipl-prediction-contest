'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Zap,
  Trophy,
  MapPin,
  ChevronRight,
  Loader2,
  Award,
  Layers,
} from 'lucide-react';
import { TEAMS } from '@/lib/constants';
import { matchTimeToIrish } from '@/lib/utils';
import { Match } from '@/lib/types';

type FilterTab = 'all' | 'upcoming' | 'completed' | 'double';

function TeamBadge({ team }: { team: string }) {
  const teamConfig = TEAMS[team];
  return (
    <span
      className="px-2 py-1 rounded text-xs font-bold"
      style={{
        backgroundColor: teamConfig?.color || '#666',
        color: teamConfig?.textColor || '#fff',
      }}
    >
      {team}
    </span>
  );
}

function MatchCard({ match, isDoubleHeader }: { match: Match; isDoubleHeader: boolean }) {
  return (
    <Link href={`/matches/${match.id}`} className="block">
      <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border-strong)] rounded-xl p-4 hover:bg-[var(--app-surface-hover)] hover:border-[var(--app-border-strong)] transition-all group shadow-sm">
        {/* Top row: Match number + badges + date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--app-text-tertiary)] font-mono">#{match.id}</span>
            {match.is_power_match && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-amber-600 dark:text-yellow-400 text-[10px] font-bold">
                <Zap className="h-2.5 w-2.5" />
                POWER
              </span>
            )}
            {match.underdog_team && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                <Award className="h-2.5 w-2.5" />
                UNDERDOG: {match.underdog_team}
              </span>
            )}
            {isDoubleHeader && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-[10px] font-bold">
                <Layers className="h-2.5 w-2.5" />
                DH
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--app-text-tertiary)] group-hover:text-[var(--app-text-secondary)] transition-colors" />
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <TeamBadge team={match.home_team} />
            <span className="text-[var(--app-text-tertiary)] text-sm font-medium">vs</span>
            <TeamBadge team={match.away_team} />
          </div>
          {match.is_completed && match.winner === 'ABANDONED' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-400/20 text-slate-600 dark:text-slate-400 text-xs font-bold">
              Abandoned
            </span>
          )}
          {match.is_completed && match.winner && match.winner !== 'ABANDONED' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <Trophy className="h-3 w-3" />
              {match.winner}
            </span>
          )}
        </div>

        {/* Bottom row: date, time, venue */}
        <div className="flex items-center gap-4 text-xs text-[var(--app-text-secondary)]">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(match.match_date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span>{matchTimeToIrish(match.match_date, match.start_time)}</span>
          <span className="inline-flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{match.venue}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/matches')
      .then((r) => r.json())
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Identify double header dates
  const matchCountByDate: Record<string, number> = {};
  matches?.forEach((m) => {
    matchCountByDate[m.match_date] = (matchCountByDate[m.match_date] || 0) + 1;
  });
  const doubleHeaderDates = new Set(
    Object.entries(matchCountByDate)
      .filter(([, count]) => count >= 2)
      .map(([date]) => date)
  );

  const filtered = matches
    ? matches.filter((m) => {
        let tabMatch = true;
        switch (activeTab) {
          case 'upcoming':
            tabMatch = !m.is_completed;
            break;
          case 'completed':
            tabMatch = m.is_completed;
            break;
          case 'double':
            tabMatch = doubleHeaderDates.has(m.match_date);
            break;
        }
        const teamMatch = !selectedTeam || m.home_team === selectedTeam || m.away_team === selectedTeam;
        return tabMatch && teamMatch;
      })
    : [];

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: matches?.length || 0 },
    { id: 'upcoming', label: 'Upcoming', count: matches?.filter((m) => !m.is_completed).length || 0 },
    { id: 'completed', label: 'Completed', count: matches?.filter((m) => m.is_completed).length || 0 },
    {
      id: 'double',
      label: 'Double Headers',
      count: matches?.filter((m) => doubleHeaderDates.has(m.match_date)).length || 0,
    },
  ];

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
        <Calendar className="h-7 w-7 text-indigo-500" />
        <h1 className="text-2xl font-extrabold text-[var(--app-text)]">Match Center</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/40 font-semibold'
                : 'bg-[var(--app-surface)] text-[var(--app-text-secondary)] border border-[var(--app-border)] hover:bg-[var(--app-surface-alt)]'
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-indigo-500/25 text-indigo-600 dark:text-indigo-300' : 'bg-[var(--app-surface-alt)] text-[var(--app-text-tertiary)]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Team Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {Object.keys(TEAMS).map((abbr) => {
          const team = TEAMS[abbr];
          const isActive = selectedTeam === abbr;
          return (
            <button
              key={abbr}
              onClick={() => setSelectedTeam(isActive ? null : abbr)}
              className="shrink-0 transition-all"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: team.color,
                color: team.textColor,
                outline: isActive ? `2px solid white` : '2px solid transparent',
                outlineOffset: '2px',
                opacity: selectedTeam && !isActive ? 0.45 : 1,
              }}
            >
              {abbr}
            </button>
          );
        })}
        {selectedTeam && (
          <button
            onClick={() => setSelectedTeam(null)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--app-surface)] border border-[var(--app-border)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-alt)] transition-all whitespace-nowrap"
          >
            × Clear
          </button>
        )}
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--app-text-secondary)]">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No matches found{selectedTeam ? ` for ${selectedTeam}` : ''}</p>
          </div>
        ) : (
          filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              isDoubleHeader={doubleHeaderDates.has(match.match_date)}
            />
          ))
        )}
      </div>
    </div>
  );
}
