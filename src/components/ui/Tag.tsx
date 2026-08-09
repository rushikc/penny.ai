import React from 'react';
import {StyleSheet, Text, View, ViewStyle} from 'react-native';
import {getTagColor} from '../../utility/tagColors';
import {radius, typography} from '../../theme/tokens';

interface TagProps {
  label: string;
  style?: ViewStyle;
  compact?: boolean;
}

/**
 * Pill-shaped expense tag with neutral gray styling.
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
    ...typography.tag,
  },
});

export default Tag;
