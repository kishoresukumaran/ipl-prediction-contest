'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Loader2, Sparkles, Trophy } from 'lucide-react';
import { TEAMS, PARTICIPANTS, PRE_TOURNAMENT_QUESTIONS } from '@/lib/constants';
import {
  PreTournamentActuals,
  PreTournamentBreakdown,
} from '@/lib/types';
import { CrystalBallLockedTeaser } from './CrystalBallSection';

interface EnrichedPrediction {
  id?: number;
  player: string;
  participantId: string;
  participantName: string;
  avatarColor: string;
  champion: string | null;
  orange_cap: string | null;
  purple_cap: string | null;
  playoff_teams: string | null;
  table_topper: string | null;
  contest_winner: string | null;
  breakdown: PreTournamentBreakdown;
}

interface ApiResponse {
  actuals: PreTournamentActuals | null;
  predictions: EnrichedPrediction[];
  hasData: boolean;
}

function TeamBadge({
  team,
  state = 'neutral',
}: {
  team: string | null;
  state?: 'neutral' | 'correct' | 'wrong';
}) {
  if (!team) return <span className="text-xs text-[var(--app-text-tertiary)]">—</span>;
  const conf = TEAMS[team];
  const ring =
    state === 'correct'
      ? 'ring-2 ring-emerald-400 shadow-emerald-400/30 shadow-md'
      : state === 'wrong'
      ? 'ring-2 ring-red-400/50 opacity-70'
      : '';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${ring}`}
      style={{ backgroundColor: conf?.color || '#666', color: conf?.textColor || '#fff' }}
    >
      {team}
      {state === 'correct' && <span className="ml-1">✓</span>}
    </span>
  );
}

function PlayerPill({ participantId }: { participantId: string | null }) {
  if (!participantId) return <span className="text-xs text-[var(--app-text-tertiary)]">—</span>;
  const p = PARTICIPANTS.find((pp) => pp.id === participantId);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--app-surface-alt)] pr-2 pl-1 py-0.5">
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
        style={{ backgroundColor: p?.avatar_color || '#666' }}
      >
        {(p?.name || participantId).charAt(0)}
      </span>
      <span className="text-[11px] font-semibold text-[var(--app-text)]">
        {p?.name || participantId}
      </span>
    </span>
  );
}

function actualValForQuestion(
  actuals: PreTournamentActuals | null,
  field: string
): string | null {
  if (!actuals) return null;
  return (actuals as unknown as Record<string, string | null>)[field] ?? null;
}

function pickValForQuestion(pred: EnrichedPrediction, field: string): string | null {
  return (pred as unknown as Record<string, string | null>)[field] ?? null;
}

function pointsForQuestion(b: PreTournamentBreakdown, qid: string): number {
  switch (qid) {
    case 'champion':
      return b.champion;
    case 'orange_cap':
      return b.orangeCap;
    case 'purple_cap':
      return b.purpleCap;
    case 'playoff_teams':
      return b.playoffTeams;
    case 'table_topper':
      return b.tableTopper;
    case 'contest_winner':
      return b.contestWinner;
    default:
      return 0;
  }
}

function teamsCsv(csv: string | null): string[] {
  if (!csv) return [];
  return csv.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean);
}

export function CrystalBallMatchesPanel() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/pre-tournament')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data || !data.hasData) {
    return (
      <div className="space-y-4">
        <PanelHeader />
        <CrystalBallLockedTeaser context="predictions" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PanelHeader playersCount={data.predictions.length} />

      <div className="space-y-2.5">
        {PRE_TOURNAMENT_QUESTIONS.map((q) => {
          const isOpen = expanded === q.id;
          const actualVal = actualValForQuestion(data.actuals, q.field);

          return (
            <div
              key={q.id}
              className="rounded-xl border border-[var(--app-border-strong)] bg-[var(--app-surface)] overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : q.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--app-surface-hover)] transition-colors text-left"
              >
                <span className="text-2xl shrink-0">{q.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--app-text)]">{q.nickname}</span>
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                      {typeof q.points === 'number' ? `${q.points} pts` : `${q.points} pts`}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--app-text-tertiary)] mt-0.5 truncate">
                    {q.label}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-wider">
                    Actual
                  </span>
                  {actualVal ? (
                    q.kind === 'teams4' ? (
                      <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                        {teamsCsv(actualVal).map((t) => (
                          <TeamBadge key={t} team={t} />
                        ))}
                      </div>
                    ) : q.kind === 'player' ? (
                      <PlayerPill participantId={actualVal} />
                    ) : (
                      <TeamBadge team={actualVal} />
                    )
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--app-surface-alt)] text-[var(--app-text-tertiary)] font-bold">
                      TBA
                    </span>
                  )}
                </div>

                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-[var(--app-text-secondary)]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[var(--app-text-secondary)]" />
                )}
              </button>

              {isOpen && (
                <QuestionDetail q={q} actualVal={actualVal} predictions={data.predictions} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelHeader({ playersCount }: { playersCount?: number }) {
  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/5 to-transparent p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-300" />
        <h2 className="text-base font-extrabold bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
          🔮 Crystal Ball Predictions
        </h2>
        {playersCount !== undefined && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase tracking-wider">
            {playersCount} oracles
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--app-text-secondary)] mt-1">
        Bold calls from before the season. The group&apos;s collective fortune-telling, on the
        record forever.
      </p>
    </div>
  );
}

function QuestionDetail({
  q,
  actualVal,
  predictions,
}: {
  q: (typeof PRE_TOURNAMENT_QUESTIONS)[number];
  actualVal: string | null;
  predictions: EnrichedPrediction[];
}) {
  // Sort: players who scored points first, then alphabetically
  const sorted = [...predictions].sort((a, b) => {
    const ap = pointsForQuestion(a.breakdown, q.id);
    const bp = pointsForQuestion(b.breakdown, q.id);
    if (bp !== ap) return bp - ap;
    return a.participantName.localeCompare(b.participantName);
  });

  const actualSet = q.kind === 'teams4' ? new Set(teamsCsv(actualVal)) : null;

  // Aggregate "popularity" for fun stats
  const popularity: Record<string, number> = {};
  for (const p of predictions) {
    const v = pickValForQuestion(p, q.field);
    if (!v) continue;
    if (q.kind === 'teams4') {
      teamsCsv(v).forEach((t) => {
        popularity[t] = (popularity[t] || 0) + 1;
      });
    } else {
      const k = v.toString().trim();
      popularity[k] = (popularity[k] || 0) + 1;
    }
  }
  const popularityEntries = Object.entries(popularity).sort((a, b) => b[1] - a[1]);

  return (
    <div className="border-t border-[var(--app-border)] bg-[var(--app-surface-alt)]/40">
      {/* Popularity strip */}
      {popularityEntries.length > 0 && (
        <div className="px-4 py-2.5 border-b border-[var(--app-border)] flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-wider font-bold">
            Hive mind
          </span>
          {popularityEntries.slice(0, 6).map(([val, count]) => {
            const isCorrect =
              q.kind === 'teams4'
                ? actualSet?.has(val.toUpperCase())
                : actualVal && val.toLowerCase() === actualVal.toLowerCase();
            return (
              <div key={val} className="flex items-center gap-1">
                {q.kind === 'player' ? (
                  <PlayerPill participantId={val} />
                ) : (
                  <TeamBadge team={val} state={isCorrect ? 'correct' : 'neutral'} />
                )}
                <span className="text-[10px] text-[var(--app-text-secondary)] font-bold">
                  ×{count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Players grid */}
      <div className="divide-y divide-[var(--app-border)]">
        {sorted.map((p) => {
          const pick = pickValForQuestion(p, q.field);
          const earned = pointsForQuestion(p.breakdown, q.id);

          let pickEl: React.ReactNode;
          if (q.kind === 'teams4') {
            const picks = teamsCsv(pick);
            pickEl = (
              <div className="flex flex-wrap gap-1 justify-end">
                {picks.length === 0 ? (
                  <TeamBadge team={null} />
                ) : (
                  picks.map((t) => {
                    const state = !actualVal
                      ? 'neutral'
                      : actualSet?.has(t)
                      ? 'correct'
                      : 'wrong';
                    return <TeamBadge key={t} team={t} state={state} />;
                  })
                )}
              </div>
            );
          } else if (q.kind === 'player') {
            pickEl = <PlayerPill participantId={pick} />;
          } else {
            const state = !actualVal
              ? 'neutral'
              : (pick || '').toUpperCase() === actualVal.toUpperCase()
              ? 'correct'
              : 'wrong';
            pickEl = <TeamBadge team={pick} state={state} />;
          }

          return (
            <Link
              key={p.participantId}
              href={`/players/${p.participantId}`}
              className="flex items-center gap-3 px-4 py-2 hover:bg-[var(--app-surface-hover)] transition-colors"
            >
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ backgroundColor: p.avatarColor }}
              >
                {p.participantName.charAt(0)}
              </span>
              <span className="text-xs font-medium text-[var(--app-text)] flex-1 truncate">
                {p.participantName}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {pickEl}
                <span className="text-xs font-bold w-8 text-right shrink-0">
                  {earned > 0 ? (
                    <span className="text-amber-400 inline-flex items-center gap-0.5">
                      <Trophy className="h-3 w-3" />+{earned}
                    </span>
                  ) : actualVal ? (
                    <span className="text-[var(--app-text-tertiary)]">0</span>
                  ) : (
                    <span className="text-[var(--app-text-tertiary)]">—</span>
                  )}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
