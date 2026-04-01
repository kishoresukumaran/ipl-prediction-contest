'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { PARTICIPANTS } from '@/lib/constants';
import { Trivia, TriviaResponse } from '@/lib/types';

interface TriviaWithResponses extends Trivia {
  responses: TriviaResponse[];
}

export default function AdminTriviaPage() {
  const [triviaList, setTriviaList] = useState<TriviaWithResponses[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // New trivia form
  const [newDate, setNewDate] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [creating, setCreating] = useState(false);

  // Response editing
  const [responseEdits, setResponseEdits] = useState<
    Record<string, boolean>
  >({});
  const [savingResponses, setSavingResponses] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const fetchTrivia = useCallback(async () => {
    try {
      const res = await fetch('/api/trivia');
      const data = await res.json();
      if (Array.isArray(data)) setTriviaList(data);
    } catch (err) {
      console.error('Failed to fetch trivia:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrivia();
  }, [fetchTrivia]);

  const handleCreateTrivia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newQuestion) return;

    setCreating(true);
    try {
      const res = await fetch('/api/trivia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trivia_date: newDate,
          question: newQuestion,
          correct_answer: newAnswer || null,
        }),
      });

      if (res.ok) {
        setNewDate('');
        setNewQuestion('');
        setNewAnswer('');
        await fetchTrivia();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Create failed:', err);
      alert('Failed to create trivia');
    } finally {
      setCreating(false);
    }
  };

  const handleExpandTrivia = (trivia: TriviaWithResponses) => {
    if (expandedId === trivia.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(trivia.id);
    setSaveMessage('');

    // Initialize response edits
    const edits: Record<string, boolean> = {};
    PARTICIPANTS.forEach((p) => {
      const existing = trivia.responses?.find(
        (r) => r.participant_id === p.id
      );
      edits[p.id] = existing?.is_correct ?? false;
    });
    setResponseEdits(edits);
  };

  const handleToggleCorrect = (participantId: string) => {
    setResponseEdits((prev) => ({
      ...prev,
      [participantId]: !prev[participantId],
    }));
  };

  const handleSaveResponses = async (triviaId: number) => {
    setSavingResponses(true);
    setSaveMessage('');

    const responses = Object.entries(responseEdits).map(
      ([participant_id, is_correct]) => ({
        participant_id,
        is_correct,
      })
    );

    try {
      const res = await fetch('/api/trivia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trivia_id: triviaId, responses }),
      });

      if (res.ok) {
        setSaveMessage('Responses saved successfully!');
        await fetchTrivia();
      } else {
        const data = await res.json();
        setSaveMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveMessage('Failed to save responses');
    } finally {
      setSavingResponses(false);
    }
  };

  const handleSelectAll = () => {
    const edits: Record<string, boolean> = {};
    PARTICIPANTS.forEach((p) => {
      edits[p.id] = true;
    });
    setResponseEdits(edits);
  };

  const handleDeselectAll = () => {
    const edits: Record<string, boolean> = {};
    PARTICIPANTS.forEach((p) => {
      edits[p.id] = false;
    });
    setResponseEdits(edits);
  };

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
        <h1 className="text-2xl font-bold text-[var(--app-text)]">Trivia Management</h1>
        <p className="text-[var(--app-text-secondary)] mt-1">Create trivia questions and mark correct responses</p>
      </div>

      {/* Add New Trivia */}
      <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--app-text)] text-lg">Add New Trivia Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTrivia} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[var(--app-text-secondary)]">Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="bg-[var(--admin-input-bg)] border-[var(--admin-border)] text-[var(--app-text)] h-12 [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[var(--app-text-secondary)]">Correct Answer</Label>
                <Input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Optional"
                  className="bg-[var(--admin-input-bg)] border-[var(--admin-border)] text-[var(--app-text)] placeholder:text-[var(--app-text-secondary)] h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--app-text-secondary)]">Question</Label>
              <Input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
                placeholder="Enter the trivia question..."
                className="bg-[var(--admin-input-bg)] border-[var(--admin-border)] text-[var(--app-text)] placeholder:text-[var(--app-text-secondary)] h-12"
              />
            </div>
            <Button
              type="submit"
              disabled={creating}
              className="bg-orange-600 hover:bg-orange-700 text-white h-12"
            >
              {creating ? 'Creating...' : 'Add Trivia Question'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="bg-[var(--admin-border)]" />

      {/* Existing Trivia List */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--app-text)] mb-3">
          Existing Trivia ({triviaList.length})
        </h2>

        {triviaList.length === 0 && (
          <p className="text-[var(--app-text-secondary)] text-sm">No trivia questions yet.</p>
        )}

        <div className="space-y-3">
          {triviaList.map((trivia) => {
            const isExpanded = expandedId === trivia.id;
            const correctCount = trivia.responses?.filter(
              (r) => r.is_correct
            ).length ?? 0;

            return (
              <Card
                key={trivia.id}
                className="bg-[var(--admin-surface)]/50 border-[var(--admin-border)]"
              >
                <CardHeader
                  className="cursor-pointer pb-2"
                  onClick={() => handleExpandTrivia(trivia)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[var(--app-text)] font-medium">{trivia.question}</p>
                      <p className="text-[var(--app-text-secondary)] text-sm mt-1">
                        {trivia.trivia_date}
                        {trivia.correct_answer && (
                          <span className="ml-2 text-green-400">
                            Answer: {trivia.correct_answer}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-green-500 text-green-400"
                      >
                        {correctCount} correct
                      </Badge>
                      <span className="text-[var(--app-text-tertiary)]">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="bg-[var(--admin-border)] mb-4" />

                    <div className="flex gap-2 mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSelectAll}
                        className="border-green-600 text-green-400 hover:bg-green-600/10"
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeselectAll}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        Deselect All
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {PARTICIPANTS.map((participant) => {
                        const isCorrect =
                          responseEdits[participant.id] ?? false;

                        return (
                          <button
                            key={participant.id}
                            onClick={() =>
                              handleToggleCorrect(participant.id)
                            }
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                              isCorrect
                                ? 'border-green-500 bg-green-500/10'
                                : 'border-[var(--admin-border)] bg-[var(--admin-input-bg)]/30 hover:bg-[var(--admin-input-bg)]/50'
                            }`}
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                              style={{
                                backgroundColor:
                                  participant.avatar_color,
                              }}
                            >
                              {participant.name.charAt(0)}
                            </div>
                            <span
                              className={`text-sm truncate ${
                                isCorrect
                                  ? 'text-green-400'
                                  : 'text-[var(--app-text-secondary)]'
                              }`}
                            >
                              {participant.name}
                            </span>
                            <span className="ml-auto text-sm">
                              {isCorrect ? '✓' : ''}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {saveMessage && (
                      <p
                        className={`text-sm mt-3 ${
                          saveMessage.startsWith('Error') ||
                          saveMessage.startsWith('Failed')
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}
                      >
                        {saveMessage}
                      </p>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleSaveResponses(trivia.id)}
                        disabled={savingResponses}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {savingResponses
                          ? 'Saving...'
                          : 'Save Responses'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setExpandedId(null)}
                        className="border-[var(--admin-border)] text-[var(--app-text-secondary)] hover:bg-[var(--admin-input-bg)]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
