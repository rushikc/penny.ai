import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {getTagColor} from '../../utility/tagColors';
import {radius} from '../../theme/tokens';

interface TagProps {
  label: string;
  style?: ViewStyle;
  compact?: boolean;
}

/**
 * Pill-shaped expense tag with a subtle tint of its own deterministic color
 * and slightly bolder text.
 */
const Tag: React.FC<TagProps> = ({label, style, compact = false}) => {
  const {text, tint} = getTagColor(label);

  return (
    <View style={[styles.pill, compact && styles.compact, {backgroundColor: tint}, style]}>
      <Text style={[styles.text, {color: text}]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default Tag;
