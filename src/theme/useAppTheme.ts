import {useTheme} from 'react-native-paper';
import type {AppTheme} from './theme';

/**
 * Typed accessor for the app theme so screens get autocomplete for the
 * `colors.custom.*` tokens and `cardShadow`. Existing `useTheme()` callers
 * continue to work unchanged.
 */
export const useAppTheme = () => useTheme<AppTheme>();

export type {AppTheme};
