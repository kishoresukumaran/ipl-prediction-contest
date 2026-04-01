'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Stats {
  totalMatches: number;
  completedMatches: number;
  totalPredictions: number;
  totalJokers: number;
}

const adminLinks = [
  { href: '/admin/matches', label: 'Match Results', description: 'Set winners, power matches, underdogs', icon: '🏏' },
  { href: '/admin/predictions', label: 'Enter Predictions', description: 'Enter predictions for each match', icon: '📝' },
  { href: '/admin/jokers', label: 'Joker Management', description: 'Assign joker cards to participants', icon: '🃏' },
  { href: '/admin/trivia', label: 'Trivia', description: 'Manage trivia questions and answers', icon: '❓' },
  { href: '/admin/playoffs', label: 'Add Playoffs', description: 'Add qualifier and final matches', icon: '🏆' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMatches: 0,
    completedMatches: 0,
    totalPredictions: 0,
    totalJokers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [matchesRes, predictionsRes, jokersRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/predictions'),
          fetch('/api/jokers'),
        ]);

        const matches = await matchesRes.json();
        const predictions = await predictionsRes.json();
        const jokers = await jokersRes.json();

        setStats({
          totalMatches: Array.isArray(matches) ? matches.length : 0,
          completedMatches: Array.isArray(matches)
            ? matches.filter((m: { is_completed: boolean }) => m.is_completed).length
            : 0,
          totalPredictions: Array.isArray(predictions) ? predictions.length : 0,
          totalJokers: Array.isArray(jokers)
            ? jokers.filter((j: { match_id: number | null }) => j.match_id !== null).length
            : 0,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--app-text)]">Admin Dashboard</h1>
        <p className="text-[var(--app-text-secondary)] mt-1">Manage the IPL Prediction Contest</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-[var(--app-text)]">
              {loading ? '...' : stats.completedMatches}
            </p>
            <p className="text-sm text-[var(--app-text-secondary)] mt-1">Matches Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-[var(--app-text)]">
              {loading ? '...' : stats.totalMatches}
            </p>
            <p className="text-sm text-[var(--app-text-secondary)] mt-1">Total Matches</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-[var(--app-text)]">
              {loading ? '...' : stats.totalPredictions}
            </p>
            <p className="text-sm text-[var(--app-text-secondary)] mt-1">Predictions Entered</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-[var(--app-text)]">
              {loading ? '...' : stats.totalJokers}
            </p>
            <p className="text-sm text-[var(--app-text-secondary)] mt-1">Jokers Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)] hover:bg-[var(--admin-input-bg)]/60 hover:border-[var(--admin-border)] transition-all cursor-pointer h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[var(--app-text)] flex items-center gap-2">
                  <span className="text-2xl">{link.icon}</span>
                  {link.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--app-text-secondary)]">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Info */}
      <Card className="bg-[var(--admin-surface)] border-[var(--admin-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--app-text)] text-lg">Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-500 text-green-400">29</Badge>
            <span className="text-[var(--app-text-secondary)] text-sm">Participants registered</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-500 text-blue-400">10</Badge>
            <span className="text-[var(--app-text-secondary)] text-sm">IPL teams</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
