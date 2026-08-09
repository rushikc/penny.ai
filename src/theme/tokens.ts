/**
 * Central design tokens for the penny.ai fintech UI.
 * These raw values feed into the react-native-paper themes in `theme.ts`.
 * Keeping them isolated makes the palette easy to audit and tweak.
 */

export const brand = {
  blue: '#0A84FF',
  blueDark: '#0A84FF',
};

export const accent = {
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9F0A',
};

export const lightPalette = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  surfaceVariant: '#E9E9EE',
  border: '#E5E5EA',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  chartGrid: 'rgba(60,60,67,0.12)',
  shadow: '#000000',
};

export const darkPalette = {
  background: '#121212',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',
  surfaceVariant: '#2C2C2E',
  border: '#38383A',
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  chartGrid: 'rgba(235,235,245,0.14)',
  shadow: '#000000',
};

/**
 * Soft drop shadow used by light-mode cards. Dark mode relies on borders
 * instead, so components should opt out of this when `dark` is true.
 */
export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: {width: 0, height: 4},
  elevation: 2,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  card: 16,
  pill: 999,
} as const;

export const typography = {
  /** Hero metric on Insights cards. */
  amountHero: {fontSize: 24, fontWeight: '700' as const, letterSpacing: 0.2},
  /** Amounts in sheets and modals. */
  amount: {fontSize: 18, fontWeight: '700' as const, letterSpacing: 0.2},
  /** Row amounts and group totals. */
  amountRow: {fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.1},
  /** Screen-level headers (Home, Budget, Insights). */
  screenTitle: {fontSize: 20, fontWeight: '700' as const, letterSpacing: 0.2},
  /** Card/section headers and bottom-sheet titles. */
  cardTitle: {fontSize: 16, fontWeight: '600' as const, letterSpacing: 0.1},
  /** Vendor names, tile titles, list row labels. */
  rowTitle: {fontSize: 15, fontWeight: '600' as const},
  body: {fontSize: 14, fontWeight: '400' as const},
  caption: {fontSize: 12, fontWeight: '400' as const},
  /** All-caps section/eyebrow labels. */
  label: {fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const},
  /** Tag/chip pill text. */
  tag: {fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2},
  /** Bottom tab bar labels. */
  tabLabel: {fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.2},
} as const;

/** Neutral tag pill colors — used for all expense tags. */
export const neutralTag = {
  text: lightPalette.textSecondary,
  tint: 'rgba(142,142,147,0.14)',
} as const;

/** Muted tones for charts only — not for tags, chips, or UI accents. */
export const dataPalette = [
  '#5B7FA6',
  '#6B8E8E',
  '#7B7FA6',
  '#A68B5B',
  '#8E8E93',
  '#6B7FA6',
] as const;

/** Shared layout tokens for all bottom-sheet popups across the app. */
export const popup = {
  maxWidth: 480,
  radius: radius.card + 4,
  /** Gap between popup edges and the screen edge. */
  screenInsetHorizontal: spacing.md,
  screenInsetBottom: spacing.sm,
  handleWidth: 36,
  handleHeight: 5,
  paddingHorizontal: spacing.xl,
  headerPaddingBottom: spacing.md,
  footerPaddingHorizontal: spacing.lg,
  gap: spacing.sm,
  primaryMinWidth: 96,
  closeIconSize: 22,
  defaultMaxHeightRatio: 0.9,
} as const;

export type AppPalette = typeof lightPalette;
