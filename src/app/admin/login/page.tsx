'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('isAdmin', 'true');
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-[var(--admin-bg-from)] via-[var(--admin-bg-via)] to-[var(--admin-bg-to)]">
      <Card className="w-full max-w-md bg-[var(--admin-surface)] border-[var(--admin-border)]">
        <CardHeader className="text-center space-y-2">
          <Badge variant="outline" className="w-fit mx-auto border-orange-500 text-orange-400">
            Admin Access
          </Badge>
          <CardTitle className="text-2xl text-[var(--app-text)]">IPL Prediction Contest</CardTitle>
          <p className="text-[var(--app-text-secondary)] text-sm">Enter admin password to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--app-text-secondary)]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-[var(--admin-input-bg)] border-[var(--admin-border)] text-[var(--app-text)] placeholder:text-[var(--app-text-secondary)] h-12"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
            >
              {loading ? 'Checking...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
