import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {brand, radius, spacing} from '../../theme/tokens';

const GRADIENT: [string, string] = [brand.blue, '#0FB9E6'];

interface GradientCardProps {
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * Subtle brand gradient for hero metric cards (Insights only).
 */
const GradientCard: React.FC<GradientCardProps> = ({style, children}) => {
  return (
    <LinearGradient
      colors={GRADIENT}
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
