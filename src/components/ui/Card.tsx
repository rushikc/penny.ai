import React from 'react';
import {StyleSheet, View, ViewProps, ViewStyle} from 'react-native';
import {useAppTheme} from '../../theme/useAppTheme';
import {radius, spacing} from '../../theme/tokens';

interface CardProps extends ViewProps {
  /** Use the slightly lighter elevated surface in dark mode. */
  elevated?: boolean;
  /** Remove default inner padding (useful for list-style cards). */
  noPadding?: boolean;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

/**
 * Base container for all layout blocks. Soft drop shadow in light mode,
 * a hairline border in dark mode (no shadow), 16px corner radius.
 */
const Card: React.FC<CardProps> = ({elevated = false, noPadding = false, style, children, ...rest}) => {
  const theme = useAppTheme();
  const isDark = theme.dark;

  return (
    <View
      {...rest}
      style={[
        styles.card,
        !noPadding && styles.padded,
        {
          backgroundColor: elevated ? theme.colors.custom.cardElevated : theme.colors.custom.card,
        },
        isDark
          ? {borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.custom.border}
          : theme.cardShadow,
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
  },
  padded: {
    padding: spacing.lg,
  },
});

export default Card;
