import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {radius, spacing} from '../../theme/tokens';

export type GradientVariant = 'blue' | 'green' | 'purple';

const GRADIENTS: Record<GradientVariant, [string, string]> = {
  blue: ['#0A84FF', '#0FB9E6'],
  green: ['#34C759', '#12A594'],
  purple: ['#BF5AF2', '#8E5AF2'],
};

interface GradientCardProps {
  variant: GradientVariant;
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * Vibrant gradient container used for the Insights metric cards.
 */
const GradientCard: React.FC<GradientCardProps> = ({variant, style, children}) => {
  return (
    <LinearGradient
      colors={GRADIENTS[variant]}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
  },
});

export default GradientCard;
