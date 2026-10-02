import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f6f7f8',
          100: '#eceef1',
          200: '#d7dbe1',
          300: '#b3bac4',
          400: '#8892a0',
          500: '#66707f',
          600: '#4c5563',
          700: '#3a414d',
          800: '#242932',
          900: '#14171c',
          950: '#0b0d10',
        },
        amber: {
          50: '#fff8ed',
          100: '#ffefd4',
          200: '#ffdaa8',
          300: '#ffbf70',
          400: '#ff9c37',
          500: '#ff7f11',
          600: '#f26407',
          700: '#c84a08',
          800: '#9f3a0f',
          900: '#803210',
          950: '#451606',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(16,18,22,.04), 0 8px 24px -12px rgba(16,18,22,.18)',
        card: '0 1px 1px rgba(16,18,22,.04), 0 12px 32px -18px rgba(16,18,22,.25)',
        lift: '0 2px 4px rgba(16,18,22,.05), 0 24px 48px -24px rgba(16,18,22,.35)',
        glass: 'inset 0 1px 0 rgba(255,255,255,.6), 0 12px 32px -20px rgba(16,18,22,.35)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .4s cubic-bezier(.22,.61,.36,1) both',
        'fade-in': 'fade-in .35s ease-out both',
        'scale-in': 'scale-in .25s cubic-bezier(.22,.61,.36,1) both',
        shimmer: 'shimmer 1.8s infinite',
        float: 'float 7s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.22,.61,.36,1)',
      },
    },
  },
  plugins: [],
};

export default config;
