import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[#c2520d]">
        <Compass className="h-5 w-5" />
      </span>
      <h1 className="mt-5 font-display text-[2rem] font-semibold leading-tight tracking-[-0.02em]">
        We could not find that page
      </h1>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
        The address may be mistyped, or the website may have been unpublished by its owner. If you are looking for a
        WEBORA website, check the link you were given.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary" >
          <Home className="h-4 w-4" /> Go to WEBORA
        </Link>
        <Link href="/dashboard" className="btn btn-outline">
          My dashboard
        </Link>
      </div>
    </main>
  );
}
