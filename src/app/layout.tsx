import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK'],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: 'WEBORA — AI Business Website Studio',
    template: '%s · WEBORA',
  },
  description:
    'Describe your business. WEBORA creates a professional website you can customize, publish and grow.',
  keywords: [
    'website builder',
    'AI website generator',
    'small business website',
    'local business website',
    'website editor',
  ],
  openGraph: {
    title: 'WEBORA — Your business online. Built with AI.',
    description:
      'Describe your business and WEBORA generates a complete website with pages, copy, SEO and a visual editor.',
    type: 'website',
    url: appUrl,
    siteName: 'WEBORA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WEBORA — AI Business Website Studio',
    description: 'Your business online. Built with AI.',
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#fbfaf8',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--surface)] antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
