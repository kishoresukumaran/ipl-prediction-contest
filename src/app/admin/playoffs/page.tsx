'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TEAMS } from '@/lib/constants';
import { Match } from '@/lib/types';

const PLAYOFF_TYPES = [
  { value: 'qualifier1', label: 'Qualifier 1' },
  { value: 'eliminator', label: 'Eliminator' },
  { value: 'qualifier2', label: 'Qualifier 2' },
  { value: 'final', label: 'Final' },
];

const teamOptions = Object.keys(TEAMS);

export default function AdminPlayoffsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [matchType, setMatchType] = useState('qualifier1');
  const [matchDate, setMatchDate] = useState('');
  const [startTime, setStartTime] = useState('19:30');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [venue, setVenue] = useState('');

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      if (Array.isArray(data)) {
        setMatches(
          data.filter(
            (m: Match) => m.match_type !== 'league'
          )
        );
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchDate || !homeTeam || !awayTeam || !matchType) {
      alert('Please fill in all required fields');
      return;
    }

    if (homeTeam === awayTeam) {
      alert('Home and away teams must be different');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_date: matchDate,
          start_time: startTime,
          day_of_week: new Date(matchDate).toLocaleDateString('en-US', {
            weekday: 'long',
          }),
          home_team: homeTeam,
          away_team: awayTeam,
          venue: venue || 'TBD',
          match_type: matchType,
        }),
      });

      if (res.ok) {
        setMatchDate('');
        setStartTime('19:30');
        setHomeTeam('');
        setAwayTeam('');
        setVenue('');
        await fetchMatches();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Create failed:', err);
      alert('Failed to create playoff match');
    } finally {
      setCreating(false);
    }
  };

  const getPlayoffTypeLabel = (type: string) => {
    return PLAYOFF_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getPlayoffBadgeColor = (type: string) => {
    switch (type) {
      case 'qualifier1':
        return 'border-blue-500 text-blue-400';
      case 'eliminator':
        return 'border-red-500 text-red-400';
      case 'qualifier2':
        return 'border-purple-500 text-purple-400';
      case 'final':
        return 'border-yellow-500 text-yellow-400';
      default:
        return 'border-slate-500 text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Playoff Matches</h1>
        <p className="text-slate-400 mt-1">Add qualifier, eliminator, and final matches</p>
      </div>

      {/* Add New Playoff Match */}
      <Card className="bg-slate-800/60 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Add Playoff Match</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Match Type */}
            <div className="space-y-2">
              <Label className="text-slate-300">Match Type</Label>
              <select
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
                className="w-full h-12 px-3 rounded-md bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {PLAYOFF_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Date</Label>
                <Input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white h-12 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white h-12 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Home Team</Label>
                <select
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  required
                  className="w-full h-12 px-3 rounded-md bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select team</option>
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>
                      {team} - {TEAMS[team].name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Away Team</Label>
                <select
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  required
                  className="w-full h-12 px-3 rounded-md bg-slate-700 border border-slate-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select team</option>
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>
                      {team} - {TEAMS[team].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-2">
              <Label className="text-slate-300">Venue</Label>
              <Input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Narendra Modi Stadium, Ahmedabad"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={creating}
              className="bg-orange-600 hover:bg-orange-700 text-white h-12 w-full sm:w-auto"
            >
              {creating ? 'Creating...' : 'Add Playoff Match'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="bg-slate-700" />

      {/* Existing Playoff Matches */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Existing Playoff Matches ({matches.length})
        </h2>

        {matches.length === 0 && (
          <p className="text-slate-400 text-sm">No playoff matches added yet.</p>
        )}

        <div className="space-y-3">
          {matches.map((match) => {
            const homeTeamConfig = TEAMS[match.home_team];
            const awayTeamConfig = TEAMS[match.away_team];

            return (
              <Card
                key={match.id}
                className={`border-slate-700 ${
                  match.is_completed
                    ? 'bg-slate-800/40 border-green-900/50'
                    : 'bg-slate-800/50'
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={getPlayoffBadgeColor(match.match_type)}
                      >
                        {getPlayoffTypeLabel(match.match_type)}
                      </Badge>
                      <div>
                        <p className="text-white font-medium">
                          <span style={{ color: homeTeamConfig?.color }}>
                            {match.home_team}
                          </span>
                          {' vs '}
                          <span style={{ color: awayTeamConfig?.color }}>
                            {match.away_team}
                          </span>
                        </p>
                        <p className="text-slate-400 text-sm">
                          {match.match_date} at {match.start_time}
                          {match.venue && match.venue !== 'TBD' && (
                            <span> - {match.venue}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {match.is_completed && match.winner && (
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                          Winner: {match.winner}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="border-slate-600 text-slate-400"
                      >
                        #{match.id}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
