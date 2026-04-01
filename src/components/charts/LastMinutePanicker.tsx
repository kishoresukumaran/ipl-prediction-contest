'use client';

import { useState, useMemo } from 'react';
import { TEAMS } from '@/lib/constants';
import { Match, Prediction } from '@/lib/types';

interface TimingData {
  id: string;
  name: string;
  avgMinutesBefore: number;
}

interface MatchTiming {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  predictedTeam: string;
  minutesBefore: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return 'at the buzzer';
  if (minutes < 60) return `${Math.round(minutes)}m before`;
  if (minutes < 1440) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h ${mins}m before` : `${hrs}h before`;
  }
  const days = Math.floor(minutes / 1440);
  const hrs = Math.round((minutes % 1440) / 60);
  return hrs > 0 ? `${days}d ${hrs}h before` : `${days}d before`;
}

function formatDurationShort(minutes: number): string {
  if (minutes < 1) return '0m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs}h${mins}m` : `${hrs}h`;
  }
  const days = Math.floor(minutes / 1440);
  const hrs = Math.round((minutes % 1440) / 60);
  return hrs > 0 ? `${days}d${hrs}h` : `${days}d`;
}

function getPanicEmoji(minutes: number): string {
  if (minutes < 5) return '🔥🔥🔥';
  if (minutes < 15) return '🔥🔥';
  if (minutes < 30) return '🔥';
  if (minutes < 60) return '😰';
  if (minutes < 120) return '😅';
  return '😌';
}

function getPanicLevel(minutes: number): string {
  if (minutes < 5) return 'EXTREME PANIC';
  if (minutes < 15) return 'Full Panic Mode';
  if (minutes < 30) return 'Sweating';
  if (minutes < 60) return 'Cutting it close';
  if (minutes < 120) return 'Kinda relaxed';
  return 'Zen master';
}

function getTimingColor(minutes: number): string {
  if (minutes < 30) return '#ef4444';
  if (minutes < 60) return '#f97316';
  if (minutes < 120) return '#eab308';
  if (minutes < 360) return '#22c55e';
  return '#06b6d4';
}

function TeamBadge({ team }: { team: string }) {
  const config = TEAMS[team];
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-bold leading-none"
      style={{ backgroundColor: config?.color || '#666', color: config?.textColor || '#fff' }}
    >
      {team}
    </span>
  );
}

function ExpandedTimings({ timings }: { timings: MatchTiming[] }) {
  const maxMinutes = Math.max(...timings.map(t => t.minutesBefore), 1);

  return (
    <div className="mt-2 mx-1 rounded-lg bg-[var(--app-bg)] border border-[var(--app-border)] overflow-hidden">
      <div className="max-h-[220px] overflow-y-auto overscroll-contain">
        <div className="divide-y divide-[var(--app-border)]">
          {timings.map((t) => (
            <div key={t.matchId} className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--app-surface)] transition-colors">
              <span className="text-[10px] text-[var(--app-text-tertiary)] font-mono w-6 shrink-0 text-right">
                #{t.matchId}
              </span>
              <div className="flex items-center gap-1 shrink-0 w-[90px]">
                <TeamBadge team={t.homeTeam} />
                <span className="text-[9px] text-[var(--app-text-tertiary)]">v</span>
                <TeamBadge team={t.awayTeam} />
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-[var(--app-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(3, (t.minutesBefore / maxMinutes) * 100)}%`,
                      backgroundColor: getTimingColor(t.minutesBefore),
                    }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono shrink-0 w-12 text-right" style={{ color: getTimingColor(t.minutesBefore) }}>
                {formatDurationShort(t.minutesBefore)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-3 py-1.5 border-t border-[var(--app-border)] bg-[var(--app-surface)]">
        <div className="flex items-center justify-between text-[10px] text-[var(--app-text-tertiary)]">
          <span>{timings.length} match{timings.length !== 1 ? 'es' : ''}</span>
          <span>
            Earliest: {formatDurationShort(Math.max(...timings.map(t => t.minutesBefore)))}
            {' · '}
            Latest: {formatDurationShort(Math.min(...timings.map(t => t.minutesBefore)))}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LastMinutePanicker({
  data,
  matches,
  predictions,
}: {
  data: TimingData[];
  matches?: Match[];
  predictions?: Prediction[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const playerTimings = useMemo(() => {
    if (!matches?.length || !predictions?.length) return {};
    const result: Record<string, MatchTiming[]> = {};

    for (const match of matches) {
      if (!match.is_completed) continue;
      const matchTime = new Date(`${match.match_date}T${match.start_time}:00+05:30`);

      for (const pred of predictions) {
        if (pred.match_id !== match.id || !pred.prediction_time) continue;
        const predTime = new Date(pred.prediction_time);
        const diff = (matchTime.getTime() - predTime.getTime()) / 60000;
        if (diff <= 0) continue;

        if (!result[pred.participant_id]) result[pred.participant_id] = [];
        result[pred.participant_id].push({
          matchId: match.id,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          predictedTeam: pred.predicted_team,
          minutesBefore: diff,
        });
      }
    }

    for (const id in result) {
      result[id].sort((a, b) => a.matchId - b.matchId);
    }
    return result;
  }, [matches, predictions]);

  if (!data?.length) return <div className="text-[var(--app-text-secondary)] text-sm text-center py-10">No timing data yet</div>;

  const panickers = [...data]
    .filter(d => d.avgMinutesBefore > 0)
    .sort((a, b) => a.avgMinutesBefore - b.avgMinutesBefore)
    .slice(0, 10);

  if (panickers.length === 0) return <div className="text-[var(--app-text-secondary)] text-sm text-center py-10">No timing data yet</div>;

  const maxTime = Math.max(...panickers.map(d => d.avgMinutesBefore));
  const hasDetail = Object.keys(playerTimings).length > 0;

  return (
    <div className="space-y-2">
      {panickers.map((p, i) => {
        const isExpanded = expandedId === p.id;
        const timings = playerTimings[p.id] || [];

        return (
          <div key={p.id}>
            <div
              className={`flex items-center gap-3 py-2.5 px-3 rounded-lg bg-[var(--app-surface)] transition-colors ${
                hasDetail ? 'cursor-pointer hover:bg-[var(--app-surface-alt)]' : ''
              } ${isExpanded ? 'bg-[var(--app-surface-alt)] ring-1 ring-[var(--app-border)]' : ''}`}
              onClick={() => hasDetail && setExpandedId(isExpanded ? null : p.id)}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-500 text-white' : i === 2 ? 'bg-yellow-500 text-black' : 'bg-[var(--app-surface-alt)] text-[var(--app-text-secondary)]'
              }`}>
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--app-text)] font-medium">{p.name}</span>
                  <span className="text-xs">{getPanicEmoji(p.avgMinutesBefore)}</span>
                  {hasDetail && (
                    <svg
                      className={`w-3 h-3 text-[var(--app-text-tertiary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--app-border)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(5, 100 - (p.avgMinutesBefore / maxTime) * 100)}%`,
                        backgroundColor: p.avgMinutesBefore < 30 ? '#ef4444' : p.avgMinutesBefore < 60 ? '#f97316' : '#eab308',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--app-text-tertiary)] shrink-0">{getPanicLevel(p.avgMinutesBefore)}</span>
                </div>
              </div>
              <span className="text-xs text-red-400 font-mono shrink-0">{formatDuration(p.avgMinutesBefore)}</span>
            </div>

            {isExpanded && timings.length > 0 && (
              <ExpandedTimings timings={timings} />
            )}
          </div>
        );
      })}
    </div>
  );
}
