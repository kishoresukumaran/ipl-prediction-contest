'use client';

import { Sparkles, Lock, Trophy } from 'lucide-react';
import { TEAMS, PARTICIPANTS, PRE_TOURNAMENT_QUESTIONS } from '@/lib/constants';
import {
  PreTournamentPrediction,
  PreTournamentActuals,
  PreTournamentBreakdown,
} from '@/lib/types';

function TeamChip({
  team,
  state = 'neutral',
}: {
  team: string | null;
  state?: 'neutral' | 'correct' | 'wrong';
}) {
  if (!team) {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--app-surface-alt)] text-[var(--app-text-tertiary)]">
        —
      </span>
    );
  }
  const conf = TEAMS[team];
  const ring =
    state === 'correct'
      ? 'ring-2 ring-emerald-400 shadow-emerald-400/30 shadow-md'
      : state === 'wrong'
      ? 'ring-2 ring-red-400/60 opacity-70'
      : '';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${ring}`}
      style={{
        backgroundColor: conf?.color || '#666',
        color: conf?.textColor || '#fff',
      }}
    >
      {team}
      {state === 'correct' && <span className="ml-1">✓</span>}
    </span>
  );
}

function PlayerChip({
  participantId,
  state = 'neutral',
}: {
  participantId: string | null;
  state?: 'neutral' | 'correct' | 'wrong';
}) {
  if (!participantId) {
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[var(--app-surface-alt)] text-[var(--app-text-tertiary)]">
        —
      </span>
    );
  }
  const p = PARTICIPANTS.find((pp) => pp.id === participantId);
  const ring =
    state === 'correct'
      ? 'ring-2 ring-emerald-400 shadow-emerald-400/30 shadow-md'
      : state === 'wrong'
      ? 'ring-2 ring-red-400/60 opacity-70'
      : '';
  return (
    <span className={`inline-flex items-center gap-1 ${ring} rounded-full pr-2`}>
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: p?.avatar_color || '#666' }}
      >
        {(p?.name || participantId).charAt(0).toUpperCase()}
      </span>
      <span className="text-[11px] font-semibold text-[var(--app-text)]">
        {p?.name || participantId}
      </span>
      {state === 'correct' && <span className="text-emerald-400 text-[10px]">✓</span>}
    </span>
  );
}

function teamsCsvSet(csv: string | null | undefined): Set<string> {
  if (!csv) return new Set();
  return new Set(
    csv
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
  );
}

interface Props {
  participantName: string;
  prediction: PreTournamentPrediction | null;
  actuals: PreTournamentActuals | null;
  breakdown: PreTournamentBreakdown;
}

/**
 * Locked teaser shown when the admin hasn't revealed any predictions yet.
 */
function LockedTeaser({ context = 'predictions' }: { context?: 'predictions' | 'actuals' }) {
  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-transparent p-4 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 text-[120px] opacity-10 select-none animate-pulse">
        🔮
      </div>
      <div className="flex items-center gap-2 mb-2 relative">
        <Lock className="h-4 w-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-[var(--app-text)]">Revealing soon</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold uppercase tracking-wider">
          Locked
        </span>
      </div>
      <p className="text-xs text-[var(--app-text-secondary)] mb-3 relative">
        {context === 'predictions'
          ? "Bold predictions made before a ball was bowled. The admin's keeping them under wraps for now."
          : 'Player picks are in. Just waiting on the season to crown the champions.'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
        {PRE_TOURNAMENT_QUESTIONS.map((q) => (
          <div
            key={q.id}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--app-surface)] border border-[var(--app-border)] backdrop-blur-sm"
          >
            <span className="text-base">{q.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                {q.nickname}
              </div>
              <div className="text-[10px] text-[var(--app-text-tertiary)] truncate">{q.label}</div>
            </div>
            <span className="text-[10px] font-bold text-amber-400 shrink-0">+{q.points} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CrystalBallSection({ participantName, prediction, actuals, breakdown }: Props) {
  // Show locked teaser if this player has no predictions synced yet.
  const noPrediction = !prediction;
  const noActuals =
    !actuals ||
    (!actuals.champion &&
      !actuals.orange_cap &&
      !actuals.purple_cap &&
      !actuals.playoff_teams &&
      !actuals.table_topper &&
      !actuals.contest_winner);

  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm border border-[var(--app-border)] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-[var(--app-text-secondary)] mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <span>🔮 Crystal Ball Predictions</span>
        {breakdown.total > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
            <Trophy className="h-3 w-3" />
            {breakdown.total} pts
          </span>
        )}
      </h2>
      <p className="text-[10px] text-[var(--app-text-tertiary)] mb-3">
        What {participantName} said before a ball was bowled.
      </p>

      {noPrediction ? (
        <LockedTeaser context="predictions" />
      ) : (
        <div className="space-y-2">
          {PRE_TOURNAMENT_QUESTIONS.map((q) => {
            const playerPick = (prediction as unknown as Record<string, string | null>)[q.field];
            const actualVal = actuals
              ? (actuals as unknown as Record<string, string | null>)[q.field]
              : null;

            // Compute earned points for this question
            let earned = 0;
            if (q.id === 'champion') earned = breakdown.champion;
            else if (q.id === 'orange_cap') earned = breakdown.orangeCap;
            else if (q.id === 'purple_cap') earned = breakdown.purpleCap;
            else if (q.id === 'playoff_teams') earned = breakdown.playoffTeams;
            else if (q.id === 'table_topper') earned = breakdown.tableTopper;
            else if (q.id === 'contest_winner') earned = breakdown.contestWinner;

            const renderTeams4 = () => {
              const picks = (playerPick || '').split(',').map((t) => t.trim()).filter(Boolean);
              const actualSet = teamsCsvSet(actualVal);
              return (
                <div className="flex flex-wrap gap-1 justify-end">
                  {picks.length === 0 ? (
                    <TeamChip team={null} />
                  ) : (
                    picks.map((t) => {
                      const state = !actualVal
                        ? 'neutral'
                        : actualSet.has(t.toUpperCase())
                        ? 'correct'
                        : 'wrong';
                      return <TeamChip key={t} team={t.toUpperCase()} state={state} />;
                    })
                  )}
                </div>
              );
            };

            const renderTeam = () => {
              const state = !actualVal
                ? 'neutral'
                : (playerPick || '').toUpperCase() === actualVal.toUpperCase()
                ? 'correct'
                : 'wrong';
              return <TeamChip team={playerPick} state={state} />;
            };

            const renderPlayer = () => {
              const state = !actualVal
                ? 'neutral'
                : (playerPick || '').toLowerCase() === actualVal.toLowerCase()
                ? 'correct'
                : 'wrong';
              return <PlayerChip participantId={playerPick} state={state} />;
            };

            return (
              <div
                key={q.id}
                className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1.4fr)_auto] items-center gap-2 px-2.5 py-2 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface-alt)]/40 hover:bg-[var(--app-surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base">{q.emoji}</span>
                  <div className="min-w-0 hidden sm:block">
                    <div className="text-[11px] font-semibold text-[var(--app-text)] truncate">
                      {q.nickname}
                    </div>
                    <div className="text-[9px] text-[var(--app-text-tertiary)] truncate">
                      {q.label}
                    </div>
                  </div>
                  <div className="sm:hidden text-[11px] font-semibold text-[var(--app-text)] truncate">
                    {q.nickname}
                  </div>
                </div>

                {/* Player pick */}
                <div className="flex items-center justify-end sm:justify-start gap-1 col-span-2 sm:col-span-1">
                  {q.kind === 'teams4' ? renderTeams4() : q.kind === 'player' ? renderPlayer() : renderTeam()}
                </div>

                {/* Actual */}
                <div className="hidden sm:flex items-center justify-end gap-1">
                  {actualVal ? (
                    q.kind === 'teams4' ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {(actualVal || '')
                          .split(',')
                          .map((t) => t.trim().toUpperCase())
                          .filter(Boolean)
                          .map((t) => (
                            <TeamChip key={t} team={t} />
                          ))}
                      </div>
                    ) : q.kind === 'player' ? (
                      <PlayerChip participantId={actualVal} />
                    ) : (
                      <TeamChip team={actualVal} />
                    )
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--app-surface-alt)] text-[var(--app-text-tertiary)] font-semibold">
                      TBA
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0 min-w-[40px]">
                  {earned > 0 ? (
                    <span className="text-xs font-bold text-amber-400">+{earned}</span>
                  ) : (
                    <span className="text-[10px] text-[var(--app-text-tertiary)]">
                      {actualVal ? '0' : '—'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {noActuals && (
            <div className="mt-3 text-[10px] text-[var(--app-text-tertiary)] text-center italic">
              Actual results haven&apos;t been revealed yet — points will appear once the season decides.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { LockedTeaser as CrystalBallLockedTeaser };
