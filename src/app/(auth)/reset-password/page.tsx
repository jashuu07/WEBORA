'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirm) {
      setError('Both passwords must match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/reset/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not reset your password.');
      toast({ title: 'Password updated', description: 'You are signed in.', tone: 'success' });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-[1.8rem] font-semibold tracking-[-0.02em]">Reset link missing</h1>
        <p className="mt-3 text-[0.92rem] text-[var(--text-muted)]">
          This page needs a reset token. Request a new link and open it from there.
        </p>
        <Link href="/forgot-password" className="btn btn-primary mt-6">
          Request a reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.02em]">Choose a new password</h1>
      <p className="mt-2 text-[0.92rem] text-[var(--text-muted)]">Reset links expire 30 minutes after they are created.</p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <TextInput
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          leading={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextInput
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          leading={<Lock className="h-4 w-4" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.86rem] font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" loading={loading} className="w-full" size="lg">
          Update password & sign in
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[#f2f0ec]" />}>
      <ResetForm />
    </Suspense>
  );
}
