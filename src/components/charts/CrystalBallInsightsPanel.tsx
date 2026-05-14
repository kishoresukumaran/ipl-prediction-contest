'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Hourglass, Lock, Crown, Heart, Users, ChevronRight, ClipboardList } from 'lucide-react';
import {
  PARTICIPANTS,
  PRE_TOURNAMENT_QUESTIONS,
  TEAMS,
  type PreTournamentQuestion,
} from '@/lib/constants';
import { calculatePreTournamentPoints } from '@/lib/scoring';
import { CrystalBallSection } from '@/components/dashboard/CrystalBallSection';
import type { PreTournamentPrediction, PreTournamentActuals } from '@/lib/types';

interface Props {
  predictions?: PreTournamentPrediction[];
  actuals?: PreTournamentActuals | null;
}

interface EnrichedPrediction extends PreTournamentPrediction {
  participantId: string;
  participantName: string;
  avatarColor: string;
}

// =============================================================
// Data helpers
// =============================================================

function enrichPredictions(preds: PreTournamentPrediction[]): EnrichedPrediction[] {
  return preds.map((p) => {
    const participant = PARTICIPANTS.find(
      (part) => part.name.toLowerCase() === p.player.toLowerCase()
    );
    return {
      ...p,
      participantId: participant?.id || p.player.toLowerCase(),
      participantName: participant?.name || p.player,
      avatarColor: participant?.avatar_color || '#666',
    };
  });
}

function splitCsv(csv: string | null | undefined): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeValue(value: string | null | undefined): string {
  return (value ?? '').toString().trim();
}

// For team-kind questions we compare uppercase abbreviations.
// For cricketer / player questions we use case-insensitive trimmed match.
function valuesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const aa = normalizeValue(a).toLowerCase();
  const bb = normalizeValue(b).toLowerCase();
  return aa !== '' && aa === bb;
}

interface PickTally {
  value: string;
  count: number;
  predictors: EnrichedPrediction[];
}

function tallyPicks(
  predictions: EnrichedPrediction[],
  q: PreTournamentQuestion
): PickTally[] {
  const map = new Map<string, PickTally>();

  for (const p of predictions) {
    const raw = (p[q.field] as string | null | undefined) ?? '';
    const values = q.kind === 'teams4' ? splitCsv(raw) : raw.trim() ? [raw.trim()] : [];
    for (const v of values) {
      const key = v.toLowerCase();
      if (!map.has(key)) map.set(key, { value: v, count: 0, predictors: [] });
      const entry = map.get(key)!;
      entry.count += 1;
      entry.predictors.push(p);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value)
  );
}

// =============================================================
// Display primitives
// =============================================================

function PlayerAvatar({
  name,
  color,
  size = 24,
}: {
  name: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: Math.max(9, Math.floor(size * 0.42)),
      }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function TeamChip({ abbr, size = 'sm' }: { abbr: string; size?: 'sm' | 'md' | 'lg' }) {
  const upper = abbr.toUpperCase();
  const team = TEAMS[upper];
  const color = team?.color || '#666';
  const textColor = team?.textColor || '#fff';
  const cls =
    size === 'lg'
      ? 'px-3 py-1.5 text-sm'
      : size === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-2 py-0.5 text-[11px]';
  return (
    <span
      className={`inline-flex items-center font-bold rounded-md ${cls}`}
      style={{ backgroundColor: color, color: textColor }}
      title={team?.name || upper}
    >
      {upper}
    </span>
  );
}

function ValueDisplay({
  value,
  kind,
  size = 'sm',
}: {
  value: string;
  kind: PreTournamentQuestion['kind'];
  size?: 'sm' | 'md' | 'lg';
}) {
  if (!value) return <span className="text-[var(--app-text-tertiary)]">—</span>;
  if (kind === 'team' || kind === 'teams4') {
    return <TeamChip abbr={value} size={size} />;
  }
  if (kind === 'player') {
    const participant = PARTICIPANTS.find((p) => p.id.toLowerCase() === value.toLowerCase());
    return (
      <span className="inline-flex items-center gap-1.5">
        {participant && (
          <PlayerAvatar
            name={participant.name}
            color={participant.avatar_color}
            size={size === 'lg' ? 24 : 18}
          />
        )}
        <span className="font-semibold text-[var(--app-text)]">
          {participant?.name || value}
        </span>
      </span>
    );
  }
  // cricketer
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--app-text)]">
      <span className="text-amber-500 dark:text-amber-400 text-base leading-none">🏏</span>
      {value}
    </span>
  );
}

// =============================================================
// Section: Hero strip with top pick per question
// =============================================================

function HeroSection({
  predictions,
  tallies,
  actuals,
}: {
  predictions: EnrichedPrediction[];
  tallies: Record<string, PickTally[]>;
  actuals: PreTournamentActuals | null;
}) {
  const totalPlayers = predictions.length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-amber-500/5 p-6">
      <div className="absolute -right-8 -top-8 text-[200px] opacity-[0.04] dark:opacity-10 select-none animate-pulse">
        🔮
      </div>
      <div className="absolute -left-6 -bottom-10 text-[160px] opacity-[0.03] dark:opacity-[0.06] select-none">
        ✨
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
          <h2 className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-amber-600 dark:from-indigo-300 dark:via-fuchsia-300 dark:to-amber-300 bg-clip-text text-transparent">
            Pre-Tournament Predictions
          </h2>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> {totalPlayers} predictors
          </span>
        </div>
        <p className="text-sm text-[var(--app-text-secondary)] max-w-2xl">
          Six bold predictions, locked in before a ball was bowled. Below: the crowd&apos;s
          top pick per question. Drill into any question to see who&apos;s backing what.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRE_TOURNAMENT_QUESTIONS.map((q) => {
            const top = tallies[q.id]?.[0];
            const actualVal = actuals
              ? (actuals[q.field] as string | null | undefined)
              : null;
            const hasActual = !!normalizeValue(actualVal);
            return (
              <div
                key={q.id}
                className="relative flex flex-col gap-2 px-3 py-3 rounded-lg bg-[var(--app-surface)]/80 border border-[var(--app-border)] backdrop-blur-sm overflow-hidden"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{q.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--app-text)] truncate">
                      {q.nickname}
                    </div>
                    <div className="text-[10px] text-[var(--app-text-tertiary)] truncate">
                      {q.label}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                    {typeof q.points === 'number' ? `+${q.points}` : q.points}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[var(--app-text-tertiary)]">Crowd favorite</span>
                  {top ? (
                    <span className="flex items-center gap-1.5">
                      <ValueDisplay value={top.value} kind={q.kind} size="sm" />
                      <span className="text-[10px] text-[var(--app-text-secondary)] font-semibold">
                        ×{top.count}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--app-text-tertiary)] italic">—</span>
                  )}
                </div>

                {hasActual ? (
                  <div className="flex items-center justify-between gap-2 text-[11px] -mt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Actual
                    </span>
                    <ValueDisplay
                      value={normalizeValue(actualVal)}
                      kind={q.kind}
                      size="sm"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--app-text-tertiary)]">
          <Hourglass className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
          <span>
            Answers reveal in phases — caps, table-topper, then the champion. Points lock in as the season unfolds.
          </span>
        </div>
      </div>
    </div>
  );
}

// =============================================================
// Section: Question Deep Dive (Hive Mind vs Lone Wolves + Bracketology)
// =============================================================

function QuestionDeepDive({
  predictions,
  tallies,
  actuals,
}: {
  predictions: EnrichedPrediction[];
  tallies: Record<string, PickTally[]>;
  actuals: PreTournamentActuals | null;
}) {
  const [selectedId, setSelectedId] = useState<string>(PRE_TOURNAMENT_QUESTIONS[0].id);
  const q = PRE_TOURNAMENT_QUESTIONS.find((x) => x.id === selectedId)!;
  const questionTallies = tallies[q.id] || [];
  const actualValRaw = actuals ? (actuals[q.field] as string | null | undefined) : null;
  const actualVal = normalizeValue(actualValRaw);
  const actualSet =
    q.kind === 'teams4' ? new Set(splitCsv(actualVal).map((v) => v.toLowerCase())) : null;

  const totalPredictors = predictions.length;
  const loneWolves = questionTallies.filter((t) => t.count === 1);
  const totalUniqueValues = questionTallies.length;

  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-0.5 flex items-center gap-2">
        <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        Hive Mind vs Lone Wolves
      </h3>
      <p className="text-xs text-[var(--app-text-secondary)] mb-4">
        Per question: who&apos;s riding the consensus, and who&apos;s out on a limb.
      </p>

      {/* Pill selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {PRE_TOURNAMENT_QUESTIONS.map((qq) => {
          const isSelected = qq.id === selectedId;
          return (
            <button
              key={qq.id}
              onClick={() => setSelectedId(qq.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-[var(--app-surface-alt)] border-[var(--app-border)] text-[var(--app-text-secondary)] hover:border-indigo-500/40 hover:text-indigo-400'
              }`}
            >
              <span>{qq.emoji}</span>
              <span>{qq.nickname}</span>
            </button>
          );
        })}
      </div>

      {/* Question header */}
      <div className="mt-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20 px-4 py-3">
        <div className="flex items-start gap-3 flex-wrap">
          <span className="text-3xl">{q.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-indigo-400/70 font-semibold uppercase tracking-widest mb-0.5">
              {q.nickname}
            </p>
            <p className="text-sm font-bold text-[var(--app-text)]">{q.label}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap text-[11px] text-[var(--app-text-tertiary)]">
              <span>
                <strong className="text-[var(--app-text-secondary)]">{totalPredictors}</strong>{' '}
                predictors
              </span>
              <span>·</span>
              <span>
                <strong className="text-[var(--app-text-secondary)]">{totalUniqueValues}</strong>{' '}
                unique picks
              </span>
              <span>·</span>
              <span>
                <strong className="text-[var(--app-text-secondary)]">{loneWolves.length}</strong>{' '}
                lone wolves
              </span>
              <span>·</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">
                {typeof q.points === 'number' ? `+${q.points} pts` : `${q.points} pts`}
              </span>
            </div>
          </div>
          {actualVal && (
            <div className="ml-auto inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <span className="text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                Actual
              </span>
              {q.kind === 'teams4' ? (
                <div className="flex gap-1 flex-wrap">
                  {splitCsv(actualVal).map((t) => (
                    <TeamChip key={t} abbr={t} size="sm" />
                  ))}
                </div>
              ) : (
                <ValueDisplay value={actualVal} kind={q.kind} size="md" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body: bracketology for teams4, otherwise grouped picks */}
      {q.kind === 'teams4' ? (
        <BracketologyGrid
          predictions={predictions}
          tallies={questionTallies}
          actualSet={actualSet}
          question={q}
        />
      ) : (
        <GroupedPicks
          tallies={questionTallies}
          question={q}
          actualVal={actualVal}
          totalPredictors={totalPredictors}
        />
      )}
    </div>
  );
}

function GroupedPicks({
  tallies,
  question,
  actualVal,
  totalPredictors,
}: {
  tallies: PickTally[];
  question: PreTournamentQuestion;
  actualVal: string;
  totalPredictors: number;
}) {
  if (!tallies.length) {
    return (
      <div className="mt-4 text-center py-8 text-sm text-[var(--app-text-secondary)]">
        No picks recorded yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {tallies.map((tally) => {
        const isCorrect = actualVal && valuesMatch(tally.value, actualVal);
        const pct = totalPredictors > 0 ? (tally.count / totalPredictors) * 100 : 0;
        const isLoneWolf = tally.count === 1;

        return (
          <div
            key={tally.value}
            className={`relative rounded-lg border px-3 py-2.5 transition-colors ${
              isCorrect
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-[var(--app-surface-alt)]/40 border-[var(--app-border)]'
            }`}
          >
            {/* Background bar */}
            <div
              className={`absolute inset-y-0 left-0 rounded-lg ${
                isCorrect ? 'bg-emerald-500/10' : 'bg-indigo-500/5'
              }`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center gap-3 flex-wrap">
              <div className="shrink-0">
                <ValueDisplay value={tally.value} kind={question.kind} size="md" />
              </div>
              <span className="text-xs font-bold text-[var(--app-text)] shrink-0">
                ×{tally.count}
              </span>
              {isCorrect && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 shrink-0">
                  Correct
                </span>
              )}
              {isLoneWolf && !isCorrect && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 rounded-full px-2 py-0.5 shrink-0">
                  Lone Wolf
                </span>
              )}
              <span className="text-[10px] text-[var(--app-text-tertiary)] shrink-0 ml-auto">
                {Math.round(pct)}%
              </span>
            </div>
            <div className="relative mt-2 flex flex-wrap gap-1">
              {tally.predictors.map((p) => (
                <div
                  key={p.participantId}
                  className="inline-flex items-center gap-1 bg-[var(--app-surface)] border border-[var(--app-border)] rounded-full pl-0.5 pr-2 py-0.5"
                  title={p.participantName}
                >
                  <PlayerAvatar
                    name={p.participantName}
                    color={p.avatarColor}
                    size={16}
                  />
                  <span className="text-[10px] text-[var(--app-text-secondary)]">
                    {p.participantName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BracketologyGrid({
  predictions,
  tallies,
  actualSet,
  question,
}: {
  predictions: EnrichedPrediction[];
  tallies: PickTally[];
  actualSet: Set<string> | null;
  question: PreTournamentQuestion;
}) {
  // Sort players by name for stable column ordering
  const sortedPlayers = [...predictions].sort((a, b) =>
    a.participantName.localeCompare(b.participantName)
  );
  // Order rows by # of times picked (desc), then alphabetical
  const orderedTeams = tallies.map((t) => t.value.toUpperCase());

  if (!orderedTeams.length) {
    return (
      <div className="mt-4 text-center py-8 text-sm text-[var(--app-text-secondary)]">
        No picks recorded yet.
      </div>
    );
  }

  // Build quick-lookup: team -> set of participantIds that picked it
  const teamPickers = new Map<string, Set<string>>();
  for (const p of predictions) {
    for (const t of splitCsv(p.playoff_teams)) {
      const key = t.toUpperCase();
      if (!teamPickers.has(key)) teamPickers.set(key, new Set());
      teamPickers.get(key)!.add(p.participantId);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h4 className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">
          Bracketology · team × player
        </h4>
        <div className="flex items-center gap-2 text-[10px] text-[var(--app-text-tertiary)]">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-indigo-500/70 border border-indigo-500" />
            picked
          </span>
          {actualSet && actualSet.size > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded bg-emerald-500/70 border border-emerald-500" />
              actual + picked
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 pb-1">
        <div className="inline-block min-w-full">
          {/* Header row: player names (rotated short labels) */}
          <div className="flex items-end">
            <div className="w-16 shrink-0" />
            {sortedPlayers.map((p) => (
              <div
                key={p.participantId}
                className="w-7 shrink-0 flex flex-col items-center justify-end"
                title={p.participantName}
              >
                <PlayerAvatar
                  name={p.participantName}
                  color={p.avatarColor}
                  size={18}
                />
                <span className="text-[8px] text-[var(--app-text-tertiary)] mt-0.5 truncate w-7 text-center">
                  {p.participantName.slice(0, 3)}
                </span>
              </div>
            ))}
            <div className="w-12 shrink-0 text-center text-[9px] font-bold uppercase tracking-wider text-[var(--app-text-tertiary)] pl-2">
              Total
            </div>
          </div>

          {/* Team rows */}
          {orderedTeams.map((team) => {
            const pickers = teamPickers.get(team) || new Set();
            const isActual = actualSet?.has(team.toLowerCase()) ?? false;
            return (
              <div
                key={team}
                className={`flex items-center mt-1 rounded-md ${
                  isActual ? 'bg-emerald-500/5' : ''
                }`}
              >
                <div className="w-16 shrink-0 pl-1">
                  <TeamChip abbr={team} size="sm" />
                </div>
                {sortedPlayers.map((p) => {
                  const picked = pickers.has(p.participantId);
                  const bg = !picked
                    ? 'bg-[var(--app-surface-alt)]/40 border-[var(--app-border)]'
                    : isActual
                    ? 'bg-emerald-500/70 border-emerald-500'
                    : 'bg-indigo-500/70 border-indigo-500';
                  return (
                    <div
                      key={p.participantId}
                      className={`w-7 h-7 shrink-0 mx-px rounded border ${bg}`}
                      title={`${p.participantName} ${picked ? 'picked' : 'did not pick'} ${team}`}
                    />
                  );
                })}
                <div className="w-12 shrink-0 text-center text-xs font-bold text-[var(--app-text-secondary)] pl-2">
                  {pickers.size}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-[var(--app-text-tertiary)] mt-2 italic">
        Each player picks 4 teams. {question.points} pts available, scaled by hits (1→3, 2→6, 3→9, 4→15).
      </p>
    </div>
  );
}

// =============================================================
// Section: Locker Room (per-player prediction cards)
// =============================================================

function LockerRoom({
  predictions,
  actuals,
}: {
  predictions: EnrichedPrediction[];
  actuals: PreTournamentActuals | null;
}) {
  // Sort players alphabetically for stable navigation
  const sortedPredictions = useMemo(
    () =>
      [...predictions].sort((a, b) =>
        a.participantName.localeCompare(b.participantName)
      ),
    [predictions]
  );

  const [selectedId, setSelectedId] = useState<string>(
    () => sortedPredictions[0]?.participantId ?? ''
  );

  const selected = sortedPredictions.find((p) => p.participantId === selectedId);
  const selectedBreakdown = useMemo(
    () =>
      selected
        ? calculatePreTournamentPoints(selected.participantId, selected, actuals)
        : null,
    [selected, actuals]
  );

  if (!sortedPredictions.length) return null;

  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-0.5 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        The Locker Room
      </h3>
      <p className="text-xs text-[var(--app-text-secondary)] mb-4">
        Browse each player&apos;s full prediction sheet. Pick a name to peek inside their crystal ball.
      </p>

      {/* Player avatar pill row */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-1 px-1">
        {sortedPredictions.map((p) => {
          const isSelected = p.participantId === selectedId;
          return (
            <button
              key={p.participantId}
              onClick={() => setSelectedId(p.participantId)}
              className={`shrink-0 inline-flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full border transition-all ${
                isSelected
                  ? 'bg-indigo-500/15 border-indigo-500 shadow-sm shadow-indigo-500/20'
                  : 'bg-[var(--app-surface-alt)] border-[var(--app-border)] hover:border-indigo-500/40'
              }`}
              title={p.participantName}
            >
              <PlayerAvatar
                name={p.participantName}
                color={p.avatarColor}
                size={20}
              />
              <span
                className={`text-[11px] font-semibold ${
                  isSelected
                    ? 'text-[var(--app-text)]'
                    : 'text-[var(--app-text-secondary)]'
                }`}
              >
                {p.participantName}
              </span>
            </button>
          );
        })}
      </div>

      {selected && selectedBreakdown && (
        <CrystalBallSection
          participantName={selected.participantName}
          prediction={selected}
          actuals={actuals}
          breakdown={selectedBreakdown}
        />
      )}
    </div>
  );
}

// =============================================================
// Section: Self-Believers + Kingmakers
// =============================================================

function SelfBelieversAndKingmakers({
  predictions,
}: {
  predictions: EnrichedPrediction[];
}) {
  const { selfBelievers, kingmakers } = useMemo(() => {
    const selfBelievers: EnrichedPrediction[] = [];
    // Map target participantId -> backers
    const kingMap = new Map<
      string,
      { target: { id: string; name: string; color: string }; backers: EnrichedPrediction[] }
    >();

    for (const p of predictions) {
      const targetId = (p.contest_winner || '').trim().toLowerCase();
      if (!targetId) continue;

      if (targetId === p.participantId.toLowerCase()) {
        selfBelievers.push(p);
      }

      const targetParticipant = PARTICIPANTS.find((pp) => pp.id.toLowerCase() === targetId);
      const key = targetId;
      if (!kingMap.has(key)) {
        kingMap.set(key, {
          target: {
            id: targetId,
            name: targetParticipant?.name || targetId,
            color: targetParticipant?.avatar_color || '#666',
          },
          backers: [],
        });
      }
      kingMap.get(key)!.backers.push(p);
    }

    const kingmakers = Array.from(kingMap.values()).sort(
      (a, b) => b.backers.length - a.backers.length || a.target.name.localeCompare(b.target.name)
    );

    return { selfBelievers, kingmakers };
  }, [predictions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Self-Believers */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
        <h3 className="text-base font-semibold text-[var(--app-text)] mb-0.5 flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          Self-Believers Club
        </h3>
        <p className="text-xs text-[var(--app-text-secondary)] mb-4">
          Players who picked themselves to win the whole contest.
        </p>

        {selfBelievers.length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--app-text-secondary)]">
            Nobody believed in themselves. 🥲
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {selfBelievers.map((p) => (
              <div
                key={p.participantId}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-rose-500/8 border border-rose-500/25"
              >
                <PlayerAvatar name={p.participantName} color={p.avatarColor} size={28} />
                <span className="text-xs font-bold text-[var(--app-text)] truncate">
                  {p.participantName}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 text-[10px] text-[var(--app-text-tertiary)] italic">
          {selfBelievers.length} of {predictions.length} are betting on number one.
        </div>
      </div>

      {/* Kingmakers */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
        <h3 className="text-base font-semibold text-[var(--app-text)] mb-0.5 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          Kingmakers
        </h3>
        <p className="text-xs text-[var(--app-text-secondary)] mb-4">
          Who picked whom to win — the friendship graph.
        </p>

        {kingmakers.length === 0 ? (
          <div className="text-center py-6 text-sm text-[var(--app-text-secondary)]">
            No contest-winner picks yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {kingmakers.map((row) => (
              <div
                key={row.target.id}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--app-surface-alt)]/40 border border-[var(--app-border)] hover:border-amber-500/30 transition-colors"
              >
                <PlayerAvatar
                  name={row.target.name}
                  color={row.target.color}
                  size={28}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-[var(--app-text)] truncate">
                    {row.target.name}
                  </div>
                  <div className="text-[10px] text-[var(--app-text-tertiary)]">
                    backed by {row.backers.length}
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--app-text-tertiary)] shrink-0" />
                <div className="flex -space-x-1.5 shrink-0">
                  {row.backers.slice(0, 6).map((b) => (
                    <div
                      key={b.participantId}
                      className="ring-2 ring-[var(--app-surface)] rounded-full"
                    >
                      <PlayerAvatar
                        name={b.participantName}
                        color={b.avatarColor}
                        size={20}
                      />
                    </div>
                  ))}
                  {row.backers.length > 6 && (
                    <div className="ring-2 ring-[var(--app-surface)] rounded-full w-5 h-5 bg-[var(--app-surface-alt)] border border-[var(--app-border)] flex items-center justify-center text-[8px] font-bold text-[var(--app-text-secondary)]">
                      +{row.backers.length - 6}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================
// Main panel
// =============================================================

export function CrystalBallInsightsPanel({
  predictions: rawPredictions = [],
  actuals = null,
}: Props) {
  const predictions = useMemo(() => enrichPredictions(rawPredictions), [rawPredictions]);

  const tallies = useMemo(() => {
    const result: Record<string, PickTally[]> = {};
    for (const q of PRE_TOURNAMENT_QUESTIONS) {
      result[q.id] = tallyPicks(predictions, q);
    }
    return result;
  }, [predictions]);

  if (!predictions.length) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-6">
      <HeroSection predictions={predictions} tallies={tallies} actuals={actuals} />
      <QuestionDeepDive
        predictions={predictions}
        tallies={tallies}
        actuals={actuals}
      />
      <LockerRoom predictions={predictions} actuals={actuals} />
      <SelfBelieversAndKingmakers predictions={predictions} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-8 text-center">
      <div className="text-5xl mb-3">🔮</div>
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-1">
        Crystal Ball is empty
      </h3>
      <p className="text-xs text-[var(--app-text-secondary)] max-w-md mx-auto">
        No pre-tournament predictions have been synced yet. Once the Google Sheet&apos;s{' '}
        <code className="text-[var(--app-text)] bg-[var(--app-surface-alt)] px-1.5 py-0.5 rounded">
          Pre_Tournament_Points
        </code>{' '}
        tab is filled and the sync runs, predictions will appear here.
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
        <Lock className="h-3 w-3" /> Awaiting Sync
      </div>
    </div>
  );
}
