'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AtSign, Building2, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';

const RULES = [
  { test: (v: string) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v: string) => /[a-zA-Z]/.test(v), label: 'Contains a letter' },
  { test: (v: string) => /[0-9]/.test(v), label: 'Contains a number' },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const plan = params.get('plan');
  const template = params.get('template');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'Could not create your account.');
      toast({
        title: 'Account created',
        description: 'Next: describe your business and WEBORA will build the site.',
        tone: 'success',
      });
      const wizardParams = new URLSearchParams();
      if (template) wizardParams.set('template', template);
      const query = wizardParams.toString();
      router.push(`/create${query ? `?${query}` : ''}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.02em]">
        Create your WEBORA account
      </h1>
      <p className="mt-2 text-[0.92rem] text-[var(--text-muted)]">
        Free to start. You will describe your business in the next step and get a complete website draft.
      </p>

      {plan ? (
        <p className="mt-5 rounded-xl border border-[#ffdcc0] bg-[var(--accent-soft)] px-3.5 py-2.5 text-[0.85rem] text-[#8a3b09]">
          You selected the <strong className="font-semibold capitalize">{plan}</strong> plan. Your account starts on Free —
          switch plans any time from Settings.
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
        <TextInput
          label="Your name"
          required
          autoComplete="name"
          placeholder="Priya Sharma"
          leading={<User className="h-4 w-4" />}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <TextInput
          label="Business name"
          hint="optional"
          placeholder="The Bakery House"
          leading={<Building2 className="h-4 w-4" />}
          value={form.company}
          onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        />
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
            autoComplete="new-password"
            placeholder="Create a password"
            leading={<Lock className="h-4 w-4" />}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
          <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
            {RULES.map((rule) => {
              const passed = rule.test(form.password);
              return (
                <li
                  key={rule.label}
                  className={`text-[0.76rem] font-medium ${passed ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}
                >
                  {passed ? '✓' : '•'} {rule.label}
                </li>
              );
            })}
          </ul>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.86rem] font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Create account & continue
        </Button>
      </form>

      <p className="mt-7 text-center text-[0.9rem] text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-[#f2f0ec]" />}>
      <SignupForm />
    </Suspense>
  );
}
