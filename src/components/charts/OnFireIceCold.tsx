'use client';

interface StreakData {
  name: string;
  longestStreak: number;
  currentStreak: number;
  color: string;
}

const STREAK_THRESHOLD = 3;

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-3.526 2.339-6.074 4.5-8.5.69-.775 1.5-1.6 1.5-1.6s.81.825 1.5 1.6C14.661 9.926 17 12.474 17 16c0 3.866-3.134 7-5 7zm0-2c1.657 0 3-1.343 3-3 0-1.8-1.2-3.2-2.2-4.4-.3-.35-.6-.7-.8-.95-.2.25-.5.6-.8.95C10.2 14.8 9 16.2 9 18c0 1.657 1.343 3 3 3z"/>
    </svg>
  );
}

function SnowflakeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11 1h2v5.17l3.24-3.24 1.41 1.41L13 9V11h2l4.66-4.66 1.41 1.41L17.83 11H23v2h-5.17l3.24 3.24-1.41 1.41L15 13h-2v2l4.66 4.66-1.41 1.41L13 17.83V23h-2v-5.17l-3.24 3.24-1.41-1.41L11 15v-2H9l-4.66 4.66-1.41-1.41L6.17 13H1v-2h5.17L2.93 7.76l1.41-1.41L9 11h2V9L6.34 4.34l1.41-1.41L11 6.17V1z"/>
    </svg>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
    </svg>
  );
}

function getStreakLabel(streak: number): string {
  if (streak >= 7) return 'UNSTOPPABLE';
  if (streak >= 5) return 'BLAZING';
  if (streak >= STREAK_THRESHOLD) return 'BONUS ZONE';
  if (streak >= 2) return 'Building...';
  return '';
}

function getFireIntensity(streak: number, maxStreak: number): number {
  if (maxStreak <= 0) return 0;
  return Math.min(1, streak / maxStreak);
}

export function OnFireIceCold({ data }: { data: StreakData[] }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">
        No streak data yet
      </div>
    );
  }

  const onFire = [...data]
    .filter(p => p.currentStreak >= 2)
    .sort((a, b) => b.currentStreak - a.currentStreak);

  const iceCold = [...data]
    .filter(p => p.currentStreak < 2)
    .sort((a, b) => b.currentStreak - a.currentStreak);

  const maxStreak = Math.max(...onFire.map(p => p.currentStreak), 1);

  return (
    <div className="space-y-6">
      {/* On Fire Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FlameIcon className="h-5 w-5 text-orange-400" />
          <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">On Fire</h4>
          <span className="text-xs text-[var(--app-text-tertiary)]">({onFire.length} player{onFire.length !== 1 ? 's' : ''})</span>
        </div>

        {onFire.length === 0 ? (
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg px-4 py-6 text-center">
            <p className="text-[var(--app-text-secondary)] text-sm">Nobody&apos;s on a streak right now. The fire has gone out.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {onFire.map((player, i) => {
              const intensity = getFireIntensity(player.currentStreak, maxStreak);
              const inBonusZone = player.currentStreak >= STREAK_THRESHOLD;
              return (
                <div
                  key={player.name}
                  className="relative overflow-hidden rounded-lg border transition-all"
                  style={{
                    borderColor: inBonusZone
                      ? `rgba(251, 191, 36, ${0.3 + intensity * 0.3})`
                      : 'rgba(251, 146, 60, 0.2)',
                    background: inBonusZone
                      ? `linear-gradient(90deg, rgba(251, 191, 36, ${0.08 + intensity * 0.07}) 0%, rgba(251, 146, 60, ${0.03 + intensity * 0.04}) 100%)`
                      : 'rgba(251, 146, 60, 0.05)',
                  }}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {/* Rank */}
                    <span className="text-xs font-bold text-[var(--app-text-tertiary)] w-5 text-right shrink-0">
                      {i + 1}
                    </span>

                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.charAt(0)}
                    </div>

                    {/* Name + label */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--app-text)] truncate">{player.name}</p>
                      {getStreakLabel(player.currentStreak) && (
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                          inBonusZone ? 'text-amber-400' : 'text-orange-400/60'
                        }`}>
                          {getStreakLabel(player.currentStreak)}
                        </p>
                      )}
                    </div>

                    {/* Streak count */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: Math.min(player.currentStreak, 5) }).map((_, j) => (
                          <FlameIcon
                            key={j}
                            className={`h-3.5 w-3.5 ${
                              inBonusZone ? 'text-amber-400' : 'text-orange-400/50'
                            }`}
                          />
                        ))}
                        {player.currentStreak > 5 && (
                          <span className="text-[10px] text-amber-400 font-bold">+{player.currentStreak - 5}</span>
                        )}
                      </div>
                      <span className={`text-lg font-black tabular-nums ${
                        inBonusZone ? 'text-amber-400' : 'text-orange-300'
                      }`}>
                        {player.currentStreak}
                      </span>
                    </div>

                    {/* Bonus badge */}
                    {inBonusZone && (
                      <div className="shrink-0 bg-amber-400/15 border border-amber-400/30 rounded-full px-2 py-0.5">
                        <span className="text-[10px] font-bold text-amber-400">+BONUS</span>
                      </div>
                    )}
                  </div>

                  {/* Heat bar */}
                  <div className="h-0.5 w-full bg-black/10">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{
                        width: `${intensity * 100}%`,
                        background: inBonusZone
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #fb923c, #f97316)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-orange-500/20 via-[var(--app-border)] to-blue-500/20" />
        <span className="text-[10px] text-[var(--app-text-tertiary)] uppercase tracking-widest">vs</span>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/20 via-[var(--app-border)] to-orange-500/20" />
      </div>

      {/* Ice Cold Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <SnowflakeIcon className="h-5 w-5 text-blue-400" />
          <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Ice Cold</h4>
          <span className="text-xs text-[var(--app-text-tertiary)]">({iceCold.length} player{iceCold.length !== 1 ? 's' : ''})</span>
        </div>

        {iceCold.length === 0 ? (
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-4 py-6 text-center">
            <p className="text-[var(--app-text-secondary)] text-sm">Everyone&apos;s on fire! No cold streaks here.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {iceCold.map((player) => (
              <div
                key={player.name}
                className="flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/5 pl-1 pr-3 py-1 transition-colors hover:bg-blue-500/10"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 opacity-70"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0)}
                </div>
                <span className="text-xs text-[var(--app-text-secondary)] font-medium">{player.name}</span>
                {player.currentStreak === 1 ? (
                  <SparkIcon className="h-3 w-3 text-yellow-500/50" />
                ) : (
                  <SnowflakeIcon className="h-3 w-3 text-blue-400/40" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-[var(--app-border)]">
        <div className="flex items-center gap-1.5">
          <FlameIcon className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] text-[var(--app-text-tertiary)]">Streak of {STREAK_THRESHOLD}+ = bonus points</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SparkIcon className="h-3 w-3 text-yellow-500/50" />
          <span className="text-[10px] text-[var(--app-text-tertiary)]">Got last one right</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SnowflakeIcon className="h-3 w-3 text-blue-400/40" />
          <span className="text-[10px] text-[var(--app-text-tertiary)]">Streak broken</span>
        </div>
      </div>
    </div>
  );
}
