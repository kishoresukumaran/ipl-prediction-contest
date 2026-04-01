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
import { Match, BonusQuestion } from '@/lib/types';
import { Plus, X, Gift } from 'lucide-react';

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  const [editWinner, setEditWinner] = useState<string | null>(null);
  const [editPowerMatch, setEditPowerMatch] = useState(false);
  const [editUnderdog, setEditUnderdog] = useState<string | null>(null);
  const [editCompleted, setEditCompleted] = useState(false);

  // Bonus question state
  const [bonusQuestions, setBonusQuestions] = useState<Record<number, BonusQuestion | null>>({});
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [bonusQuestion, setBonusQuestion] = useState('');
  const [bonusOptions, setBonusOptions] = useState<string[]>(['', '']);
  const [bonusCorrectAnswer, setBonusCorrectAnswer] = useState('');
  const [bonusPoints, setBonusPointsVal] = useState(1);
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

  const loadBonusQuestion = async (matchId: number) => {
    try {
      const res = await fetch(`/api/bonus?match_id=${matchId}`);
      const data = await res.json();
      if (data.questions?.length > 0) {
        const q = data.questions[0];
        setBonusQuestions(prev => ({ ...prev, [matchId]: q }));
        setBonusQuestion(q.question);
        setBonusOptions(q.options || ['', '']);
        setBonusCorrectAnswer(q.correct_answer || '');
        setBonusPointsVal(q.points || 1);
        setShowBonusForm(true);
      } else {
        setBonusQuestions(prev => ({ ...prev, [matchId]: null }));
        setBonusQuestion('');
        setBonusOptions(['', '']);
        setBonusCorrectAnswer('');
        setBonusPointsVal(1);
        setShowBonusForm(false);
      }
    } catch {
      // ignore
    }
  };

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
    loadBonusQuestion(match.id);
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

  const handleSaveBonus = async (matchId: number) => {
    setSavingBonus(true);
    const filteredOptions = bonusOptions.filter(o => o.trim());
    try {
      const res = await fetch('/api/bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          question: bonusQuestion,
          options: filteredOptions,
          correct_answer: bonusCorrectAnswer || null,
          points: bonusPoints,
        }),
      });
      if (res.ok) {
        await loadBonusQuestion(matchId);
      }
    } catch {
      alert('Failed to save bonus question');
    } finally {
      setSavingBonus(false);
    }
  };

  const handleDeleteBonus = async (matchId: number) => {
    const bq = bonusQuestions[matchId];
    if (!bq) return;
    await fetch(`/api/bonus?id=${bq.id}`, { method: 'DELETE' });
    setBonusQuestions(prev => ({ ...prev, [matchId]: null }));
    setShowBonusForm(false);
    setBonusQuestion('');
    setBonusOptions(['', '']);
    setBonusCorrectAnswer('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-400">Loading matches...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Match Management</h1>
        <p className="text-slate-400 mt-1">Set winners, power matches, underdogs, and bonus questions</p>
      </div>

      <div className="space-y-3">
        {matches.map((match) => {
          const homeTeam = TEAMS[match.home_team];
          const awayTeam = TEAMS[match.away_team];
          const isExpanded = expandedId === match.id;
          const hasBonusQ = !!bonusQuestions[match.id];

          return (
            <Card
              key={match.id}
              className={`border-slate-700 transition-all ${
                match.is_completed ? 'bg-slate-800/40 border-green-900/50' : 'bg-slate-800/60'
              }`}
            >
              <CardHeader className="cursor-pointer pb-2" onClick={() => handleExpand(match)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 text-sm font-mono">#{match.id}</span>
                    <CardTitle className="text-base text-white">
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
                    <span className="text-slate-500 text-sm">{match.match_date} {match.start_time}</span>
                    <span className="text-slate-500">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 space-y-4">
                  <Separator className="bg-slate-700" />

                  {/* Winner Selection */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm font-medium">Winner</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={editWinner === match.home_team ? 'default' : 'outline'}
                        onClick={() => setEditWinner(match.home_team)}
                        className={editWinner === match.home_team ? 'text-white font-semibold' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                        style={editWinner === match.home_team ? { backgroundColor: homeTeam?.color, color: homeTeam?.textColor } : {}}
                      >
                        {match.home_team}
                      </Button>
                      <Button
                        variant={editWinner === match.away_team ? 'default' : 'outline'}
                        onClick={() => setEditWinner(match.away_team)}
                        className={editWinner === match.away_team ? 'text-white font-semibold' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
                        style={editWinner === match.away_team ? { backgroundColor: awayTeam?.color, color: awayTeam?.textColor } : {}}
                      >
                        {match.away_team}
                      </Button>
                      <Button variant="outline" onClick={() => setEditWinner(null)} className={editWinner === null ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}>
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* Power Match Toggle */}
                  <div className="flex items-center gap-3">
                    <Switch id={`power-${match.id}`} checked={editPowerMatch} onCheckedChange={setEditPowerMatch} />
                    <Label htmlFor={`power-${match.id}`} className="text-slate-300 cursor-pointer">Power Match (4 pts)</Label>
                  </div>

                  {/* Underdog Selection */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm font-medium">Underdog Team</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant={editUnderdog === match.home_team ? 'default' : 'outline'} onClick={() => setEditUnderdog(match.home_team)} className={editUnderdog === match.home_team ? 'bg-purple-600 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}>{match.home_team}</Button>
                      <Button size="sm" variant={editUnderdog === match.away_team ? 'default' : 'outline'} onClick={() => setEditUnderdog(match.away_team)} className={editUnderdog === match.away_team ? 'bg-purple-600 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}>{match.away_team}</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditUnderdog(null)} className={editUnderdog === null ? 'border-orange-500 text-orange-400 bg-orange-500/10' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}>None</Button>
                    </div>
                  </div>

                  {/* Completed Toggle */}
                  <div className="flex items-center gap-3">
                    <Switch id={`completed-${match.id}`} checked={editCompleted} onCheckedChange={setEditCompleted} />
                    <Label htmlFor={`completed-${match.id}`} className="text-slate-300 cursor-pointer">Mark as Completed</Label>
                  </div>

                  {/* Save Match Button */}
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(match.id)} disabled={saving === match.id} className="bg-green-600 hover:bg-green-700 text-white">
                      {saving === match.id ? 'Saving...' : 'Save Match'}
                    </Button>
                    <Button variant="outline" onClick={() => setExpandedId(null)} className="border-slate-600 text-slate-300 hover:bg-slate-700">Cancel</Button>
                  </div>

                  <Separator className="bg-slate-700" />

                  {/* Bonus Question Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-amber-400 text-sm font-medium flex items-center gap-2">
                        <Gift className="h-4 w-4" /> Bonus Question
                      </Label>
                      {!showBonusForm && !hasBonusQ && (
                        <Button size="sm" variant="outline" onClick={() => setShowBonusForm(true)} className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                          <Plus className="h-3 w-3 mr-1" /> Add Bonus
                        </Button>
                      )}
                      {hasBonusQ && !showBonusForm && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowBonusForm(true)} className="border-slate-600 text-slate-300 hover:bg-slate-700">Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteBonus(match.id)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">Remove</Button>
                        </div>
                      )}
                    </div>

                    {hasBonusQ && !showBonusForm && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                        <p className="text-amber-300 font-medium">{bonusQuestions[match.id]!.question}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(bonusQuestions[match.id]!.options || []).map((opt: string, i: number) => (
                            <span key={i} className={`px-2 py-1 rounded text-xs ${opt === bonusQuestions[match.id]!.correct_answer ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50' : 'bg-white/5 text-slate-300'}`}>
                              {opt} {opt === bonusQuestions[match.id]!.correct_answer && '✓'}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">+{bonusQuestions[match.id]!.points} point(s)</p>
                      </div>
                    )}

                    {showBonusForm && (
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                        <div>
                          <Label className="text-slate-300 text-xs">Question</Label>
                          <Input value={bonusQuestion} onChange={e => setBonusQuestion(e.target.value)} placeholder="e.g. Which team will hit more sixes?" className="bg-slate-700 border-slate-600 text-white mt-1" />
                        </div>

                        <div>
                          <Label className="text-slate-300 text-xs">Options</Label>
                          {bonusOptions.map((opt, i) => (
                            <div key={i} className="flex gap-2 mt-1">
                              <Input value={opt} onChange={e => { const newOpts = [...bonusOptions]; newOpts[i] = e.target.value; setBonusOptions(newOpts); }} placeholder={`Option ${i + 1}`} className="bg-slate-700 border-slate-600 text-white" />
                              {bonusOptions.length > 2 && (
                                <Button size="sm" variant="ghost" onClick={() => setBonusOptions(bonusOptions.filter((_, j) => j !== i))} className="text-red-400 hover:bg-red-500/10 px-2">
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button size="sm" variant="ghost" onClick={() => setBonusOptions([...bonusOptions, ''])} className="text-slate-400 hover:text-white mt-1">
                            <Plus className="h-3 w-3 mr-1" /> Add Option
                          </Button>
                        </div>

                        <div>
                          <Label className="text-slate-300 text-xs">Correct Answer</Label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {bonusOptions.filter(o => o.trim()).map((opt, i) => (
                              <Button key={i} size="sm" variant={bonusCorrectAnswer === opt ? 'default' : 'outline'}
                                onClick={() => setBonusCorrectAnswer(opt)}
                                className={bonusCorrectAnswer === opt ? 'bg-green-600 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}>
                                {opt}
                              </Button>
                            ))}
                            <Button size="sm" variant="outline" onClick={() => setBonusCorrectAnswer('')} className="border-slate-600 text-slate-400 hover:bg-slate-700">Clear</Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-slate-300 text-xs">Points for correct answer</Label>
                          <Input type="number" min={1} max={10} value={bonusPoints} onChange={e => setBonusPointsVal(Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white mt-1 w-24" />
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveBonus(match.id)} disabled={savingBonus || !bonusQuestion.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {savingBonus ? 'Saving...' : 'Save Bonus Question'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowBonusForm(false)} className="border-slate-600 text-slate-300">Cancel</Button>
                        </div>
                      </div>
                    )}
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
