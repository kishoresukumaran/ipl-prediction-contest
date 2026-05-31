'use client';

import Link from 'next/link';
import { Trophy, PartyPopper, Heart } from 'lucide-react';

interface WinnerEntry {
  participantId: string;
  participantName: string;
  totalPoints: number;
  rank?: number;
  avatarColor: string;
}

const MEDAL: Record<number, { ring: string; badge: string; label: string }> = {
  1: { ring: 'ring-amber-400/70', badge: 'bg-amber-400 text-black', label: '1st' },
  2: { ring: 'ring-slate-300/70', badge: 'bg-slate-300 text-black', label: '2nd' },
  3: { ring: 'ring-amber-700/70', badge: 'bg-amber-700 text-white', label: '3rd' },
};

export default function TournamentCompleteBanner({
  winners,
  participantCount,
}: {
  winners: WinnerEntry[];
  participantCount?: number;
}) {
  const top3 = winners.filter((w) => (w.rank || 0) >= 1 && (w.rank || 0) <= 3);
  if (top3.length === 0) return null;

  const audience =
    participantCount && participantCount > 0 ? `all ${participantCount} of you` : 'every one of you';

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-red-500/10 p-4 shadow-sm">
      <div className="flex items-center justify-center gap-2 text-center">
        <PartyPopper className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0" />
        <h2 className="text-base sm:text-lg font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
            IPL 2026 Prediction Contest Complete!
          </span>
        </h2>
        <PartyPopper className="h-5 w-5 text-amber-500 dark:text-amber-400 shrink-0 -scale-x-100" />
      </div>
      <p className="mt-1 text-center text-xs text-[var(--app-text-secondary)]">
        Congratulations to everyone who played. Final standings:
      </p>

      <div className="mt-3 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-300">
        <Trophy className="h-3.5 w-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">Top 3 Winners</span>
      </div>

      <div className="mt-2 space-y-2">
        {top3.map((w) => {
          const rank = w.rank || 0;
          const medal = MEDAL[rank] ?? MEDAL[3];
          return (
            <Link key={w.participantId} href={`/players/${w.participantId}`}>
              <div className="flex items-center gap-3 rounded-lg bg-[var(--app-surface)] px-3 py-2 transition-all hover:bg-[var(--app-surface-hover)]">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${medal.badge}`}
                >
                  {medal.label}
                </span>
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 ${medal.ring}`}
                  style={{ backgroundColor: w.avatarColor }}
                >
                  {w.participantName.charAt(0)}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--app-text)]">
                  {w.participantName}
                </span>
                <span className="shrink-0 text-right">
                  <span className="text-sm font-bold text-amber-500 dark:text-amber-400">
                    {w.totalPoints.toLocaleString()}
                  </span>
                  <span className="ml-1 text-xs text-[var(--app-text-tertiary)]">pts</span>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-3 border-t border-amber-400/20 pt-3">
        <div className="mb-1.5 flex items-center justify-center">
          <Heart className="h-3.5 w-3.5 text-red-400" />
        </div>
        <div className="space-y-2 text-center text-xs leading-relaxed text-[var(--app-text-secondary)] sm:text-sm">
          <p>
            Thank you to {audience} for making Season 2026 unforgettable. Win or lose, every
            prediction made this more fun &mdash; and in this league, everyone&apos;s a winner.
          </p>
          <p>
            But honestly, the scores were only half the story. It was the non-stop group chats, the
            bold calls, the friendly banter and the nail-biting debates that kept every one of us
            hooked till the final ball. That buzz is exactly why so many of us finished neck-and-neck.
            More than a contest, this season brought us closer as a group &mdash; and that&apos;s the
            real win. See you next season!
          </p>
        </div>
      </div>
    </div>
  );
}
