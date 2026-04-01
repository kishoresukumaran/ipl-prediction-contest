'use client';

import { TEAMS } from '@/lib/constants';

interface WinRateData {
  participants: { id: string; name: string }[];
  teams: string[];
  data: Record<string, Record<string, { correct: number; total: number; rate: number }>>;
}

export function WinRateByTeamChart({ data }: { data: WinRateData }) {
  if (!data?.participants?.length) return <EmptyState />;

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="min-w-[600px] text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-1 text-[var(--app-text-secondary)] sticky left-0 z-10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm">Player</th>
            {data.teams.map(team => (
              <th key={team} className="text-center py-2 px-1">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                  style={{ backgroundColor: TEAMS[team]?.color, color: TEAMS[team]?.textColor }}
                >
                  {team}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.participants.map(p => (
            <tr key={p.id} className="border-t border-[var(--app-border)]">
              <td className="py-1.5 px-1 text-[var(--app-text-secondary)] sticky left-0 z-10 font-medium bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm">{p.name}</td>
              {data.teams.map(team => {
                const cell = data.data[p.id]?.[team];
                if (!cell || cell.total === 0) {
                  return <td key={team} className="text-center py-1.5 px-1 text-[var(--app-text-tertiary)]">-</td>;
                }
                return (
                  <td key={team} className="text-center py-1.5 px-1">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{
                        backgroundColor: getHeatColor(cell.rate),
                        color: cell.rate > 60 ? '#000' : '#fff'
                      }}
                    >
                      {cell.rate.toFixed(0)}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getHeatColor(rate: number): string {
  if (rate >= 80) return '#22c55e';
  if (rate >= 60) return '#84cc16';
  if (rate >= 40) return '#eab308';
  if (rate >= 20) return '#f97316';
  return '#ef4444';
}

function EmptyState() {
  return <div className="flex items-center justify-center h-[300px] text-[var(--app-text-secondary)] text-sm">No data yet</div>;
}
