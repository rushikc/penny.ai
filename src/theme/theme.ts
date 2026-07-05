import {MD3DarkTheme, MD3LightTheme, configureFonts, MD3Theme} from 'react-native-paper';
import {
  accent,
  brand,
  cardShadow,
  darkPalette,
  lightPalette,
  radius,
} from './tokens';

/**
 * Custom tokens layered onto the standard react-native-paper color object.
 * Screens read these via `useAppTheme().colors.custom.*`.
 */
export interface CustomColors {
  success: string;
  danger: string;
  warning: string;
  card: string;
  cardElevated: string;
  border: string;
  shadow: string;
  chartGrid: string;
  textSecondary: string;
}

export interface AppTheme extends MD3Theme {
  colors: MD3Theme['colors'] & {custom: CustomColors};
  cardShadow: typeof cardShadow;
}

// System font (SF Pro on iOS) with weight tuning for a crisp fintech feel.
const fontConfig = {
  fontFamily: 'System',
};

const baseFonts = configureFonts({config: fontConfig});

export const lightTheme: AppTheme = {
  ...MD3LightTheme,
  roundness: radius.md,
  fonts: baseFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.blue,
    onPrimary: '#FFFFFF',
    background: lightPalette.background,
    surface: lightPalette.card,
    surfaceVariant: lightPalette.surfaceVariant,
    onSurface: lightPalette.textPrimary,
    onSurfaceVariant: lightPalette.textSecondary,
    outline: lightPalette.textSecondary,
    outlineVariant: lightPalette.border,
    error: accent.danger,
    custom: {
      success: accent.success,
      danger: accent.danger,
      warning: accent.warning,
      card: lightPalette.card,
      cardElevated: lightPalette.cardElevated,
      border: lightPalette.border,
      shadow: lightPalette.shadow,
      chartGrid: lightPalette.chartGrid,
      textSecondary: lightPalette.textSecondary,
    },
  },
  cardShadow,
};

export const darkTheme: AppTheme = {
  ...MD3DarkTheme,
  roundness: radius.md,
  fonts: baseFonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brand.blue,
    onPrimary: '#FFFFFF',
    background: darkPalette.background,
    surface: darkPalette.card,
    surfaceVariant: darkPalette.surfaceVariant,
    onSurface: darkPalette.textPrimary,
    onSurfaceVariant: darkPalette.textSecondary,
    outline: darkPalette.textSecondary,
    outlineVariant: darkPalette.border,
    error: accent.danger,
    custom: {
      success: accent.success,
      danger: accent.danger,
      warning: accent.warning,
      card: darkPalette.card,
      cardElevated: darkPalette.cardElevated,
      border: darkPalette.border,
      shadow: darkPalette.shadow,
      chartGrid: darkPalette.chartGrid,
      textSecondary: darkPalette.textSecondary,
    },
  },
  cardShadow,
};
