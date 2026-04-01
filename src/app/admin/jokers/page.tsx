'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';
import { Match, Joker } from '@/lib/types';

export default function AdminJokersPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [jokers, setJokers] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [matchesRes, jokersRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/jokers'),
      ]);

      const matchesData = await matchesRes.json();
      const jokersData = await jokersRes.json();

      if (Array.isArray(matchesData)) setMatches(matchesData);

      const jokerMap: Record<string, number | null> = {};
      PARTICIPANTS.forEach((p) => {
        jokerMap[p.id] = null;
      });

      if (Array.isArray(jokersData)) {
        jokersData.forEach((j: Joker) => {
          jokerMap[j.participant_id] = j.match_id;
        });
      }

      setJokers(jokerMap);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJokerChange = async (participantId: string, matchId: number | null) => {
    setSaving(participantId);
    setSaveMessage('');

    setJokers((prev) => ({ ...prev, [participantId]: matchId }));

    try {
      const res = await fetch('/api/jokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participantId,
          match_id: matchId,
        }),
      });

      if (res.ok) {
        setSaveMessage(`Saved joker for ${participantId}`);
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        const data = await res.json();
        setSaveMessage(`Error: ${data.error}`);
        // Revert on error
        await fetchData();
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveMessage('Failed to save');
      await fetchData();
    } finally {
      setSaving(null);
    }
  };

  const getMatchLabel = (matchId: number): string => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return `Match #${matchId}`;
    return `#${match.id} ${match.home_team} vs ${match.away_team} (${match.match_date})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const usedCount = Object.values(jokers).filter((v) => v !== null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Joker Management</h1>
          <p className="text-slate-400 mt-1">Assign joker cards to participants</p>
        </div>
        <Badge variant="outline" className="border-yellow-500 text-yellow-400">
          {usedCount}/29 Used
        </Badge>
      </div>

      {saveMessage && (
        <div
          className={`text-sm px-4 py-2 rounded ${
            saveMessage.startsWith('Error') || saveMessage.startsWith('Failed')
              ? 'bg-red-500/10 text-red-400'
              : 'bg-green-500/10 text-green-400'
          }`}
        >
          {saveMessage}
        </div>
      )}

      <div className="space-y-2">
        {PARTICIPANTS.map((participant) => {
          const jokerMatchId = jokers[participant.id];
          const jokerMatch = jokerMatchId
            ? matches.find((m) => m.id === jokerMatchId)
            : null;

          return (
            <Card
              key={participant.id}
              className={`border-slate-700 ${
                jokerMatchId ? 'bg-yellow-900/10 border-yellow-800/30' : 'bg-slate-800/50'
              }`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Participant */}
                  <div className="flex items-center gap-2 sm:w-36 shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: participant.avatar_color }}
                    >
                      {participant.name.charAt(0)}
                    </div>
                    <span className="text-white text-sm font-medium">
                      {participant.name}
                    </span>
                    {saving === participant.id && (
                      <span className="text-xs text-slate-400">saving...</span>
                    )}
                  </div>

                  {/* Match Selector */}
                  <div className="flex-1">
                    <select
                      value={jokerMatchId ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleJokerChange(
                          participant.id,
                          val ? parseInt(val, 10) : null
                        );
                      }}
                      className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="">Not used</option>
                      {matches.map((m) => (
                        <option key={m.id} value={m.id}>
                          #{m.id} {m.home_team} vs {m.away_team} ({m.match_date})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Match Info */}
                  {jokerMatch && (
                    <div className="flex items-center gap-1 text-xs shrink-0">
                      <span
                        className="font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: TEAMS[jokerMatch.home_team]?.color + '30',
                          color: TEAMS[jokerMatch.home_team]?.color,
                        }}
                      >
                        {jokerMatch.home_team}
                      </span>
                      <span className="text-slate-500">vs</span>
                      <span
                        className="font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: TEAMS[jokerMatch.away_team]?.color + '30',
                          color: TEAMS[jokerMatch.away_team]?.color,
                        }}
                      >
                        {jokerMatch.away_team}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
