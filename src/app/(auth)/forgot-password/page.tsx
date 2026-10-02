'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AtSign, ArrowRight } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { CopyButton } from '@/components/ui/primitives';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [result, setResult] = useState<{ message: string; resetPath?: string } | null>(null);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setState('loading');
    setError('');
    try {
      const res = await fetch('/api/auth/reset/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not start the reset.');
      setResult(json.data);
      setState('done');
    } catch (err) {
      setError((err as Error).message);
      setState('idle');
    }
  }

  return (
    <div>
      <h1 className="font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.02em]">Reset your password</h1>
      <p className="mt-2 text-[0.92rem] text-[var(--text-muted)]">
        Enter the email you signed up with and we will create a reset link.
      </p>

      {state !== 'done' ? (
        <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
          <TextInput
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@yourbusiness.com"
            leading={<AtSign className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.86rem] font-medium text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={state === 'loading'} className="w-full" size="lg">
            Create reset link
          </Button>
        </form>
      ) : (
        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-white p-5">
          <p className="text-[0.9rem] leading-relaxed text-[var(--text)]">{result?.message}</p>

          {result?.resetPath ? (
            <div className="mt-4 rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-3.5">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Your reset link
              </p>
              <p className="mt-1.5 break-all text-[0.82rem] text-[var(--text)]">{result.resetPath}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ButtonLink href={result.resetPath} size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Open reset page
                </ButtonLink>
                <CopyButton value={result.resetPath} label="Copy link" />
              </div>
            </div>
          ) : null}

          <p className="mt-4 text-[0.82rem] leading-relaxed text-[var(--text-muted)]">
            To send this by email instead, configure <code className="rounded bg-[#f4f2ee] px-1.5 py-0.5">EMAIL_PROVIDER</code>{' '}
            and a mailer in the reset route — documented in <code className="rounded bg-[#f4f2ee] px-1.5 py-0.5">docs/AUTH.md</code>.
          </p>
        </div>
      )}

      <p className="mt-7 text-center text-[0.9rem] text-[var(--text-muted)]">
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
