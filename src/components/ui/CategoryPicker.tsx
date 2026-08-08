import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {getTagColor} from '../../utility/tagColors';
import {radius, spacing, typography} from '../../theme/tokens';

interface CategoryPickerProps {
  tags: string[];
  selected: string | string[];
  onSelect: (tag: string) => void;
}

/**
 * Tappable category chips with deterministic tag colors. Selected chips use a
 * solid fill; unselected chips use a soft tint background.
 */
const CategoryPicker: React.FC<CategoryPickerProps> = ({tags, selected, onSelect}) => {
  const selectedTags = Array.isArray(selected) ? selected : selected ? [selected] : [];

  return (
    <View style={styles.grid}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        const {text, tint} = getTagColor(tag);

        return (
          <Pressable
            key={tag}
            onPress={() => onSelect(tag)}
            style={({pressed}) => [
              styles.chip,
              {
                backgroundColor: isSelected ? text : tint,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.chipText, {color: isSelected ? '#FFFFFF' : text}]} numberOfLines={1}>
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    ...typography.rowTitle,
    fontSize: 14,
  },
});

export default CategoryPicker;
