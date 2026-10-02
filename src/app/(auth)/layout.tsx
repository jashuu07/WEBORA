import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getDemoSites } from '@/lib/demo-sites';
import { SiteRenderer } from '@/components/site/SiteRenderer';

/**
 * Auth layout — form on the left, a real generated website on the right so
 * people can see what they are signing up for.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [site] = await getDemoSites(['bakery']);
  const page = site?.pages.find((p) => p.slug === 'home') ?? site?.pages[0];

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-14">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--surface-ink)] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[1.02rem] font-semibold tracking-[-0.02em]">WEBORA</span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <p className="text-center text-[0.78rem] text-[var(--text-muted)]">
          By continuing you agree to the{' '}
          <Link href="/legal/terms" className="underline hover:text-[var(--text)]">
            terms
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline hover:text-[var(--text)]">
            privacy policy
          </Link>
          .
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-[var(--surface-ink)] lg:block">
        <div className="bg-dots absolute inset-0 opacity-[0.14]" />
        <div
          className="pointer-events-none absolute -right-24 top-10 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(242,106,27,.5), transparent 68%)' }}
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div>
            <p className="eyebrow text-white/50">Live example</p>
            <h2 className="mt-3 max-w-sm font-display text-[1.7rem] font-semibold leading-tight text-white">
              “I own a bakery in Hyderabad. We sell cakes, pastries and coffee.”
            </h2>
            <p className="mt-3 text-[0.9rem] text-white/60">
              That sentence produced this website — including the menu, gallery, reviews and SEO.
            </p>
          </div>

          {site && page ? (
            <div className="relative mt-8">
              <div className="scene">
                <div
                  className="tilt-frame browser-frame"
                  style={{ transform: 'rotateY(-9deg) rotateX(3deg)' }}
                >
                  <div className="browser-chrome">
                    <span className="browser-dot" />
                    <span className="browser-dot" />
                    <span className="browser-dot" />
                    <span className="ml-2 truncate rounded-md bg-white/80 px-2 py-0.5 text-[0.62rem] font-medium text-[#8b8f99]">
                      {site.slug}.webora.app
                    </span>
                  </div>
                  <div className="relative overflow-hidden bg-white" style={{ height: 460 }}>
                    <div
                      aria-hidden
                      className="pointer-events-none origin-top-left"
                      style={{ width: 1180, transform: 'scale(0.52)', height: 1200 }}
                    >
                      <SiteRenderer website={site} page={page} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[0.8rem] text-white/50">
            <span>Free plan available</span>
            <span>No card required</span>
            <span>Publish in one click</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
