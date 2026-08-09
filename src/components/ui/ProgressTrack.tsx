import React from 'react';
import {StyleSheet, View, ViewStyle} from 'react-native';
import {useAppTheme} from '../../theme/useAppTheme';
import {radius} from '../../theme/tokens';
import {clampProgressPercent, getProgressTone} from '../../pages/budget/budgetProgressStyle';

interface ProgressTrackProps {
  /** 0-100 percentage of the budget spent. */
  percentage: number;
  style?: ViewStyle;
  height?: number;
}

/**
 * Native-feeling horizontal budget bar. Fills with the brand color, turns
 * amber as it nears the limit, and red once exceeded.
 */
const ProgressTrack: React.FC<ProgressTrackProps> = ({percentage, style, height = 8}) => {
  const theme = useAppTheme();

  const clamped = clampProgressPercent(percentage);
  const tone = getProgressTone(percentage);
  const fillColor =
    tone === 'danger'
      ? theme.colors.custom.danger
      : tone === 'warning'
        ? theme.colors.custom.warning
        : theme.colors.primary;

  return (
    <View style={[styles.track, {height, backgroundColor: theme.colors.surfaceVariant}, style]}>
      <View style={[styles.fill, {width: `${clamped}%`, backgroundColor: fillColor}]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});

export default ProgressTrack;
