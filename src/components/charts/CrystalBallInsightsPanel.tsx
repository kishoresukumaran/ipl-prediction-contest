'use client';

import { Lock, Sparkles, Hourglass } from 'lucide-react';
import { PRE_TOURNAMENT_QUESTIONS } from '@/lib/constants';

const PLANNED_WIDGETS = [
  {
    emoji: '🔮',
    title: 'Oracle Leaderboard',
    desc: 'Pre-tournament points leaderboard. Who actually saw the future coming?',
  },
  {
    emoji: '🎯',
    title: 'Bracketology',
    desc: 'Heatmap of which teams every player picked for the top-4 — with actuals overlaid.',
  },
  {
    emoji: '🐑',
    title: 'Hive Mind vs 🦉 Lone Wolves',
    desc: 'Per question: most popular pick vs the brave (or foolish) outliers.',
  },
  {
    emoji: '😎',
    title: 'Self-Believers Club',
    desc: 'Wall of every player who picked themselves to win the contest.',
  },
  {
    emoji: '🤝',
    title: 'Kingmakers',
    desc: 'Who picked whom to win the contest. Friendship-graph energy.',
  },
  {
    emoji: '✨',
    title: 'Perfect Seers',
    desc: 'Players closing in on (or achieving) all 6 correct.',
  },
  {
    emoji: '🏅',
    title: 'Achievement Wall',
    desc: 'Pre-Tournament badges earned: Perfect Seer, Bracket Buster, Lone Genius, Kingmaker.',
  },
];

interface Props {
  hasData?: boolean;
}

export function CrystalBallInsightsPanel({ hasData = false }: Props) {
  return (
    <div className="space-y-6">
      {/* Hero teaser card */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/15 via-fuchsia-500/10 to-amber-500/5 p-6">
        <div className="absolute -right-8 -top-8 text-[200px] opacity-[0.04] dark:opacity-10 select-none animate-pulse">
          🔮
        </div>
        <div className="absolute -left-6 -bottom-10 text-[160px] opacity-[0.03] dark:opacity-[0.06] select-none">
          ✨
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
            <h2 className="text-lg font-extrabold bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-amber-600 dark:from-indigo-300 dark:via-fuchsia-300 dark:to-amber-300 bg-clip-text text-transparent">
              Pre-Tournament Predictions
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 dark:bg-indigo-500/25 border border-indigo-700 dark:border-transparent text-white dark:text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
              <Lock className="h-3 w-3" /> Coming Soon
            </span>
          </div>
          <p className="text-sm text-[var(--app-text-secondary)] max-w-2xl">
            Everyone&apos;s bold predictions, locked in before a ball was bowled. The reveal is near
            — when the admin opens the vault, this tab fills with fortune-telling firepower.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PRE_TOURNAMENT_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[var(--app-surface)]/80 border border-[var(--app-border)] backdrop-blur-sm overflow-hidden"
              >
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
                  {typeof q.points === 'number' ? `+${q.points}` : q.points} pts
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-[var(--app-text-tertiary)]">
            <Hourglass className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-300" />
            <span>
              {hasData
                ? 'Predictions synced. Widgets coming online soon.'
                : 'Predictions revealing in phases once the season heats up.'}
            </span>
          </div>
        </div>
      </div>

      {/* Planned widgets preview */}
      <div className="bg-[var(--app-surface)] backdrop-blur-sm rounded-xl border border-[var(--app-border)] p-4">
        <h3 className="text-base font-semibold text-[var(--app-text)] mb-0.5 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
          Planned Widgets
        </h3>
        <p className="text-xs text-[var(--app-text-secondary)] mb-4">
          A sneak peek at the gamified breakdowns landing in this tab once predictions go live.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PLANNED_WIDGETS.map((w) => (
            <div
              key={w.title}
              className="group relative rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-alt)]/40 px-3 py-3 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors cursor-default"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0 mt-0.5">{w.emoji}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--app-text)] flex items-center gap-1.5">
                    {w.title}
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 font-semibold">
                      Soon
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--app-text-secondary)] mt-0.5">
                    {w.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
