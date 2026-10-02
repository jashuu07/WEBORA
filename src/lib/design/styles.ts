import type { DesignTokens, IndustryId, StyleId, StylePreset } from '@/types';

/**
 * Style presets power Step 2 of the generator and the editor's theme panel.
 * Tokens are consumed as CSS custom properties by the site renderer, so a
 * single preset re-skins every section without touching component code.
 */
export const STYLE_PRESETS: Record<StyleId, StylePreset> = {
  'warm-artisan': {
    id: 'warm-artisan',
    name: 'Warm Artisan',
    description: 'Cream paper, deep espresso ink and a honey-amber accent. Handmade, welcoming, premium.',
    swatches: ['#FFF8ED', '#2B1D12', '#E0741C', '#F3E4CE'],
    bestFor: ['bakery', 'restaurant', 'retail', 'salon'],
    tokens: {
      accent: '#E0741C',
      accentSoft: '#FBEBD8',
      ink: '#2B1D12',
      muted: '#7A6A5B',
      surface: '#FFFBF5',
      surfaceAlt: '#F7EEE2',
      border: '#E9DCC9',
      headingFont: 'display',
      bodyFont: 'sans',
      radius: 'soft',
      density: 'comfortable',
      mode: 'light',
    },
  },
  'noir-luxe': {
    id: 'noir-luxe',
    name: 'Noir Luxe',
    description: 'Charcoal canvas, warm champagne accent. Confident and expensive — great for dining and studios.',
    swatches: ['#0C0C0E', '#F5EFE6', '#D9A15B', '#1A1A1E'],
    bestFor: ['restaurant', 'salon', 'photography', 'gym'],
    tokens: {
      accent: '#D9A15B',
      accentSoft: '#2A2118',
      ink: '#121114',
      muted: '#A79E93',
      surface: '#0E0E11',
      surfaceAlt: '#17171B',
      border: '#26262C',
      headingFont: 'display',
      bodyFont: 'sans',
      radius: 'sharp',
      density: 'airy',
      mode: 'dark',
    },
  },
  'fresh-clean': {
    id: 'fresh-clean',
    name: 'Fresh Clean',
    description: 'Bright white space with a crisp amber-orange accent. Clear, trustworthy, fast to scan.',
    swatches: ['#FFFFFF', '#121417', '#F26A1B', '#F1F3F5'],
    bestFor: ['gym', 'consultant', 'general', 'retail'],
    tokens: {
      accent: '#F26A1B',
      accentSoft: '#FFF1E5',
      ink: '#121417',
      muted: '#697180',
      surface: '#FFFFFF',
      surfaceAlt: '#F6F7F9',
      border: '#E6E8EC',
      headingFont: 'sans',
      bodyFont: 'sans',
      radius: 'soft',
      density: 'comfortable',
      mode: 'light',
    },
  },
  'bold-energy': {
    id: 'bold-energy',
    name: 'Bold Energy',
    description: 'High-contrast black and electric amber. Built for gyms, fitness and anything performance-led.',
    swatches: ['#101114', '#FFFFFF', '#FF9F1C', '#1D1F24'],
    bestFor: ['gym', 'retail', 'general'],
    tokens: {
      accent: '#FF9F1C',
      accentSoft: '#241B0C',
      ink: '#0D0E11',
      muted: '#9AA1AC',
      surface: '#101114',
      surfaceAlt: '#191B20',
      border: '#272A31',
      headingFont: 'display',
      bodyFont: 'sans',
      radius: 'sharp',
      density: 'compact',
      mode: 'dark',
    },
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-grade layout with generous whitespace and a quiet terracotta accent.',
    swatches: ['#FCFAF7', '#1B1A18', '#B4552D', '#EDE7DF'],
    bestFor: ['portfolio', 'photography', 'consultant', 'realestate'],
    tokens: {
      accent: '#B4552D',
      accentSoft: '#F3E7E0',
      ink: '#1B1A18',
      muted: '#6F6A63',
      surface: '#FCFAF7',
      surfaceAlt: '#F2EDE6',
      border: '#E3DCD2',
      headingFont: 'display',
      bodyFont: 'sans',
      radius: 'sharp',
      density: 'airy',
      mode: 'light',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Pro',
    description: 'Deep slate surfaces with a cool amber highlight. Trusted, corporate, modern.',
    swatches: ['#0B1220', '#E8EEF6', '#FFB84D', '#131C2E'],
    bestFor: ['consultant', 'realestate', 'portfolio', 'general'],
    tokens: {
      accent: '#FFB84D',
      accentSoft: '#1B2536',
      ink: '#0B1220',
      muted: '#96A2B4',
      surface: '#0D1524',
      surfaceAlt: '#131C2E',
      border: '#212C40',
      headingFont: 'sans',
      bodyFont: 'sans',
      radius: 'soft',
      density: 'comfortable',
      mode: 'dark',
    },
  },
};

export const STYLE_LIST = Object.values(STYLE_PRESETS);

export function getStyle(id: StyleId | string | undefined): StylePreset {
  return STYLE_PRESETS[(id as StyleId) ?? 'fresh-clean'] ?? STYLE_PRESETS['fresh-clean'];
}

/** Industry → recommended preset (used by the template recommender). */
export const INDUSTRY_STYLE: Record<IndustryId, StyleId> = {
  bakery: 'warm-artisan',
  restaurant: 'noir-luxe',
  salon: 'noir-luxe',
  gym: 'bold-energy',
  consultant: 'midnight',
  portfolio: 'editorial',
  realestate: 'midnight',
  photography: 'editorial',
  retail: 'warm-artisan',
  general: 'fresh-clean',
};

/** Tokens → inline CSS variables applied to a rendered website. */
export function tokensToCssVars(tokens: DesignTokens): React.CSSProperties {
  const radii: Record<DesignTokens['radius'], string> = {
    sharp: '4px',
    soft: '14px',
    round: '22px',
  };
  const scale: Record<DesignTokens['density'], number> = {
    compact: 0.8,
    comfortable: 1,
    airy: 1.18,
  };
  const headingStack =
    tokens.headingFont === 'display'
      ? 'var(--font-display), Georgia, "Times New Roman", serif'
      : tokens.headingFont === 'mono'
        ? 'ui-monospace, SFMono-Regular, Menlo, monospace'
        : 'var(--font-sans), system-ui, sans-serif';

  const isDark = tokens.mode === 'dark';
  return {
    ['--w-accent' as string]: tokens.accent,
    ['--w-accent-soft' as string]: tokens.accentSoft,
    ['--w-ink' as string]: tokens.ink,
    ['--w-text' as string]: isDark ? '#EDEDF0' : '#1B1D22',
    ['--w-muted' as string]: tokens.muted,
    ['--w-surface' as string]: tokens.surface,
    ['--w-surface-alt' as string]: tokens.surfaceAlt,
    ['--w-border' as string]: tokens.border,
    ['--w-radius' as string]: radii[tokens.radius],
    ['--w-rhythm' as string]: String(scale[tokens.density]),
    ['--w-heading-font' as string]: headingStack,
    ['--w-body-font' as string]:
      tokens.bodyFont === 'display' ? headingStack : 'var(--font-sans), system-ui, sans-serif',
    color: isDark ? '#EDEDF0' : '#1B1D22',
    background: tokens.surface,
  } as React.CSSProperties;
}
