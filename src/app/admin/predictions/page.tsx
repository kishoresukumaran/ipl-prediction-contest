'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TEAMS, PARTICIPANTS } from '@/lib/constants';
import { Match, Prediction, BonusQuestion } from '@/lib/types';
import { toIrishDatetimeLocal } from '@/lib/utils';
import { Gift } from 'lucide-react';

interface PredictionEntry {
  participant_id: string;
  predicted_team: string;
  prediction_time: string;
}

export default function AdminPredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [predictions, setPredictions] = useState<Record<string, PredictionEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Bonus question state
  const [bonusQuestion, setBonusQuestion] = useState<BonusQuestion | null>(null);
  const [bonusResponses, setBonusResponses] = useState<Record<string, string>>({});
  const [savingBonus, setSavingBonus] = useState(false);

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

  const loadPredictions = async (matchId: number) => {
    setSelectedMatchId(matchId);
    setSaveMessage('');

    try {
      const res = await fetch(`/api/predictions?match_id=${matchId}`);
      const data = await res.json();

      const predMap: Record<string, PredictionEntry> = {};
      PARTICIPANTS.forEach((p) => {
        predMap[p.id] = {
          participant_id: p.id,
          predicted_team: '',
          prediction_time: '',
        };
      });

      if (Array.isArray(data)) {
        data.forEach((pred: Prediction) => {
          predMap[pred.participant_id] = {
            participant_id: pred.participant_id,
            predicted_team: pred.predicted_team || '',
            prediction_time: pred.prediction_time
              ? toIrishDatetimeLocal(pred.prediction_time)
              : '',
          };
        });
      }

      setPredictions(predMap);

      // Load bonus question for this match
      const bonusRes = await fetch(`/api/bonus?match_id=${matchId}`);
      const bonusData = await bonusRes.json();
      if (bonusData.questions?.length > 0) {
        setBonusQuestion(bonusData.questions[0]);
        const respMap: Record<string, string> = {};
        (bonusData.responses || []).forEach((r: { participant_id: string; selected_option: string }) => {
          respMap[r.participant_id] = r.selected_option;
        });
        setBonusResponses(respMap);
      } else {
        setBonusQuestion(null);
        setBonusResponses({});
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
    }
  };

  const handleSaveBonusResponses = async () => {
    if (!bonusQuestion) return;
    setSavingBonus(true);
    try {
      const responses = Object.entries(bonusResponses)
        .filter(([, opt]) => opt)
        .map(([pid, opt]) => ({ participant_id: pid, selected_option: opt }));

      await fetch('/api/bonus', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bonus_question_id: bonusQuestion.id, responses }),
      });
      setSaveMessage('Bonus responses saved!');
    } catch {
      setSaveMessage('Failed to save bonus responses');
    } finally {
      setSavingBonus(false);
    }
  };

  const handleTeamSelect = (participantId: string, team: string) => {
    setPredictions((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        predicted_team: prev[participantId]?.predicted_team === team ? '' : team,
      },
    }));
  };

  const handleTimeChange = (participantId: string, time: string) => {
    setPredictions((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        prediction_time: time,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedMatchId) return;
    setSaving(true);
    setSaveMessage('');

    // Convert local datetime-local values to ISO UTC strings before sending
    const predArray = Object.values(predictions)
      .filter((p) => p.predicted_team)
      .map((p) => ({
        ...p,
        prediction_time: p.prediction_time
          ? new Date(p.prediction_time).toISOString()
          : null,
      }));

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: selectedMatchId,
          predictions: predArray,
        }),
      });

      if (res.ok) {
        setSaveMessage(`Saved ${predArray.length} predictions successfully!`);
      } else {
        const data = await res.json();
        setSaveMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const homeTeam = selectedMatch ? TEAMS[selectedMatch.home_team] : null;
  const awayTeam = selectedMatch ? TEAMS[selectedMatch.away_team] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--app-text-secondary)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--app-text)]">Enter Predictions</h1>
        <p className="text-[var(--app-text-secondary)] mt-1">Select a match and enter predictions for all participants</p>
        <p className="text-xs text-amber-400/70 mt-1">Times are in your local timezone (as shown in WhatsApp)</p>
      </div>

      {/* Match Selector */}
      <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
        <CardContent className="pt-6">
          <Label className="text-[var(--app-text-secondary)] mb-2 block">Select Match</Label>
          <select
            value={selectedMatchId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              if (val) loadPredictions(parseInt(val, 10));
            }}
            className="w-full h-12 px-3 rounded-md bg-[var(--admin-input-bg)] border border-[var(--admin-border)] text-[var(--app-text)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">-- Select a match --</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                #{m.id} - {m.home_team} vs {m.away_team} ({m.match_date})
                {m.is_completed ? ' [Completed]' : ''}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Predictions Grid */}
      {selectedMatch && (
        <>
          <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[var(--app-text)] flex items-center gap-3">
                <span style={{ color: homeTeam?.color }} className="font-bold">
                  {selectedMatch.home_team}
                </span>
                <span className="text-[var(--app-text-tertiary)]">vs</span>
                <span style={{ color: awayTeam?.color }} className="font-bold">
                  {selectedMatch.away_team}
                </span>
                <Badge variant="outline" className="border-[var(--admin-border)] text-[var(--app-text-secondary)] ml-auto">
                  {selectedMatch.match_date}
                </Badge>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="space-y-2">
            {PARTICIPANTS.map((participant) => {
              const pred = predictions[participant.id];
              const selectedTeam = pred?.predicted_team;

              return (
                <Card
                  key={participant.id}
                  className="bg-[var(--admin-surface)]/50 border-[var(--admin-border)]"
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Participant Name */}
                      <div className="flex items-center gap-2 sm:w-32 shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: participant.avatar_color }}
                        >
                          {participant.name.charAt(0)}
                        </div>
                        <span className="text-[var(--app-text)] text-sm font-medium truncate">
                          {participant.name}
                        </span>
                      </div>

                      {/* Team Buttons */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant={selectedTeam === selectedMatch.home_team ? 'default' : 'outline'}
                          onClick={() => handleTeamSelect(participant.id, selectedMatch.home_team)}
                          className="h-10 px-4 font-semibold min-w-[70px]"
                          style={
                            selectedTeam === selectedMatch.home_team
                              ? {
                                  backgroundColor: homeTeam?.color,
                                  color: homeTeam?.textColor,
                                  borderColor: homeTeam?.color,
                                }
                              : {
                                  borderColor: homeTeam?.color + '60',
                                  color: homeTeam?.color,
                                }
                          }
                        >
                          {selectedMatch.home_team}
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedTeam === selectedMatch.away_team ? 'default' : 'outline'}
                          onClick={() => handleTeamSelect(participant.id, selectedMatch.away_team)}
                          className="h-10 px-4 font-semibold min-w-[70px]"
                          style={
                            selectedTeam === selectedMatch.away_team
                              ? {
                                  backgroundColor: awayTeam?.color,
                                  color: awayTeam?.textColor,
                                  borderColor: awayTeam?.color,
                                }
                              : {
                                  borderColor: awayTeam?.color + '60',
                                  color: awayTeam?.color,
                                }
                          }
                        >
                          {selectedMatch.away_team}
                        </Button>
                      </div>

                      {/* Prediction Time */}
                      <div className="flex-1 min-w-0">
                        <Input
                          type="datetime-local"
                          value={pred?.prediction_time || ''}
                          onChange={(e) => handleTimeChange(participant.id, e.target.value)}
                          className="bg-[var(--admin-input-bg)] border-[var(--admin-border)] text-[var(--app-text)] h-10 text-sm [color-scheme:dark]"
                          title="Enter time as shown in your WhatsApp (your local timezone)"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator className="bg-[var(--admin-border)]" />

          {/* Bonus Question Responses */}
          {bonusQuestion && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">Bonus: {bonusQuestion.question}</h3>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">+{bonusQuestion.points} pt</Badge>
              </div>

              <div className="grid gap-2">
                {PARTICIPANTS.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 bg-[var(--admin-surface)]/40 rounded-lg px-3 py-2">
                    <span className="text-sm text-[var(--app-text-secondary)] w-24 truncate">{participant.name}</span>
                    <div className="flex gap-1 flex-wrap">
                      {(bonusQuestion.options || []).map((opt: string) => (
                        <Button
                          key={opt}
                          size="sm"
                          variant={bonusResponses[participant.id] === opt ? 'default' : 'outline'}
                          onClick={() => setBonusResponses(prev => ({ ...prev, [participant.id]: prev[participant.id] === opt ? '' : opt }))}
                          className={`h-8 text-xs ${bonusResponses[participant.id] === opt ? 'bg-amber-600 text-white' : 'border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]'}`}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveBonusResponses} disabled={savingBonus} className="bg-amber-600 hover:bg-amber-700 text-white w-full">
                {savingBonus ? 'Saving...' : 'Save Bonus Responses'}
              </Button>
            </div>
          )}

          <Separator className="bg-[var(--admin-border)]" />

          {/* Save All Button */}
          <div className="sticky bottom-4 z-10">
            <Card className="bg-[var(--admin-header-bg)] border-[var(--admin-border)] backdrop-blur">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  {saveMessage && (
                    <p
                      className={`text-sm ${
                        saveMessage.startsWith('Error') || saveMessage.startsWith('Failed')
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {saveMessage}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 font-semibold"
                >
                  {saving ? 'Saving...' : 'Save All Predictions'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
