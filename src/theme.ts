// Centralized theme for colors, spacing, radii, and shared styles
// Keep dependencies minimal (no external libraries)

export const colors = {
  background: '#0B1220', // deep navy
  surface: '#1E222D', // elevated card
  surfaceMuted: '#161B26',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  accent: '#F59E0B', // amber
  accentAlt: '#8B5CF6', // violet
  success: '#10B981',
  info: '#3B82F6',
  danger: '#EF4444',
  warning: '#F59E0B',
  grid: '#374151',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
};

export const typography = {
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '600' as const },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const cardBase = {
  backgroundColor: colors.surface,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
};

export type Theme = {
  colors: typeof colors;
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows;
};

export const theme: Theme = { colors, radius, spacing, typography, shadows };
