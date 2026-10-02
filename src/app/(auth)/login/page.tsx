'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AtSign, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const next = params.get('next') ?? '/dashboard';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not sign you in.');
      toast({ title: `Welcome back, ${json.data.user.name.split(' ')[0]}`, tone: 'success' });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.02em]">Welcome back</h1>
      <p className="mt-2 text-[0.92rem] text-[var(--text-muted)]">
        Sign in to manage your websites, editor drafts and analytics.
      </p>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <TextInput
          label="Email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourbusiness.com"
          leading={<AtSign className="h-4 w-4" />}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <div>
          <TextInput
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            leading={<Lock className="h-4 w-4" />}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-[0.82rem] font-medium text-[var(--accent)] hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.86rem] font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-7 text-center text-[0.9rem] text-[var(--text-muted)]">
        New to WEBORA?{' '}
        <Link href="/signup" className="font-semibold text-[var(--accent)] hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-[#f2f0ec]" />}>
      <LoginForm />
    </Suspense>
  );
}
