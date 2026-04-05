'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TEAMS } from '@/lib/constants';
import { Match } from '@/lib/types';
import { Plus, X } from 'lucide-react';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const [editWinner, setEditWinner] = useState<string | null>(null);
  const [editPowerMatch, setEditPowerMatch] = useState(false);
  const [editUnderdog, setEditUnderdog] = useState<string | null>(null);
  const [editCompleted, setEditCompleted] = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (Array.isArray(data)) setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleExpand = (match: Match) => {
    if (expandedId === match.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(match.id);
    setEditWinner(match.winner);
    setEditPowerMatch(match.is_power_match);
    setEditUnderdog(match.underdog_team);
    setEditCompleted(match.is_completed);
  };

  const handleSave = async (matchId: number) => {
    setSaving(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winner: editWinner,
          is_power_match: editPowerMatch,
          underdog_team: editUnderdog,
          is_completed: editCompleted,
        }),
      });

      if (res.ok) {
        await fetchMatches();
        setExpandedId(null);
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--app-text-secondary)]">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text)]">Match Management</h1>
        <p className="text-[var(--app-text-secondary)] mt-1">Set winners, power matches, and underdogs</p>
      </div>

      <div className="space-y-3">
        {matches.map((match) => {
          const homeTeam = TEAMS[match.home_team];
          const awayTeam = TEAMS[match.away_team];
          const isExpanded = expandedId === match.id;

          return (
            <Card
              key={match.id}
              className={`border-[var(--admin-border)] transition-all ${
                match.is_completed ? 'bg-[var(--admin-surface)]/40 border-green-900/50' : 'bg-[var(--admin-surface)]'
              }`}
            >
              <CardHeader className="cursor-pointer pb-2" onClick={() => handleExpand(match)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--app-text-tertiary)] text-sm font-mono">#{match.id}</span>
                    <CardTitle className="text-base text-[var(--app-text)]">
                      <span style={{ color: homeTeam?.color }}>{match.home_team}</span>
                      {' vs '}
                      <span style={{ color: awayTeam?.color }}>{match.away_team}</span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.is_power_match && (
                      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">Power</Badge>
                    )}
                    {match.is_completed && (
                      <Badge className="bg-green-600/20 text-green-400 border-green-600/30">{match.winner}</Badge>
                    )}
                    <span className="text-[var(--app-text-tertiary)] text-sm">{match.match_date} {match.start_time}</span>
                    <span className="text-[var(--app-text-tertiary)]">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <Separator className="bg-[var(--admin-border)]" />

                  {/* Winner Selection */}
                  <div className="space-y-2">
                    <Label className="text-[var(--app-text-secondary)] text-sm font-medium">Winner</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={editWinner === match.home_team ? 'default' : 'outline'}
                        onClick={() => setEditWinner(match.home_team)}
                        className={editWinner === match.home_team ? 'text-white font-semibold' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}
                        style={editWinner === match.home_team ? { backgroundColor: homeTeam?.color, color: homeTeam?.textColor } : {}}
                      >
                        {match.home_team}
                      </Button>
                      <Button
                        variant={editWinner === match.away_team ? 'default' : 'outline'}
                        onClick={() => setEditWinner(match.away_team)}
                        className={editWinner === match.away_team ? 'text-white font-semibold' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}
                        style={editWinner === match.away_team ? { backgroundColor: awayTeam?.color, color: awayTeam?.textColor } : {}}
                      >
                        {match.away_team}
                      </Button>
                      <Button variant="outline" onClick={() => setEditWinner(null)} className={editWinner === null ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}>
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Power Match Toggle */}
                  <div className="flex items-center gap-3">
                    <Switch id={`power-${match.id}`} checked={editPowerMatch} onCheckedChange={setEditPowerMatch} />
                    <Label htmlFor={`power-${match.id}`} className="text-[var(--app-text-secondary)] cursor-pointer">Power Match (4 pts)</Label>
                  </div>

                  {/* Underdog Selection */}
                  <div className="space-y-2">
                    <Label className="text-[var(--app-text-secondary)] text-sm font-medium">Underdog Team</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant={editUnderdog === match.home_team ? 'default' : 'outline'} onClick={() => setEditUnderdog(match.home_team)} className={editUnderdog === match.home_team ? 'bg-purple-600 text-white' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}>{match.home_team}</Button>
                      <Button size="sm" variant={editUnderdog === match.away_team ? 'default' : 'outline'} onClick={() => setEditUnderdog(match.away_team)} className={editUnderdog === match.away_team ? 'bg-purple-600 text-white' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}>{match.away_team}</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditUnderdog(null)} className={editUnderdog === null ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}>None</Button>
                    </div>
                  </div>

                  {/* Completed Toggle */}
                  <div className="flex items-center gap-3">
                    <Switch id={`completed-${match.id}`} checked={editCompleted} onCheckedChange={setEditCompleted} />
                    <Label htmlFor={`completed-${match.id}`} className="text-[var(--app-text-secondary)] cursor-pointer">Mark as Completed</Label>
                  </div>

                  {/* Save Match Button */}
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(match.id)} disabled={saving === match.id} className="bg-green-600 hover:bg-green-700 text-white">
                      {saving === match.id ? 'Saving...' : 'Save Match'}
                    </Button>
                    <Button variant="outline" onClick={() => setExpandedId(null)} className="border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]">Cancel</Button>
                  </div>

                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
