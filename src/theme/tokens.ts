export const palette = {
  background: '#070B14',
  surface: '#111827',
  surfaceAlt: '#1F2937',
  card: '#0F172A',
  border: '#23314D',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#22C55E',
  successDim: 'rgba(34, 197, 94, 0.18)',
  danger: '#EF4444',
  dangerDim: 'rgba(239, 68, 68, 0.18)',
  warning: '#F59E0B',
  accent: '#38BDF8',
  accentStrong: '#A855F7',
} as const;

export const radii = { sm: 8, md: 16, lg: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 30,
  hero: 36,
  mega: 44,
} as const;
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;
