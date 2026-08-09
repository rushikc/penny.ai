import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {neutralTag, radius, spacing, typography} from '../../theme/tokens';
import {useAppTheme} from '../../theme/useAppTheme';

interface CategoryPickerProps {
  tags: string[];
  selected: string | string[];
  onSelect: (tag: string) => void;
}

/**
 * Tappable category chips with neutral styling. Selected chips use the brand
 * accent; unselected chips use a soft gray tint.
 */
const CategoryPicker: React.FC<CategoryPickerProps> = ({tags, selected, onSelect}) => {
  const theme = useAppTheme();
  const selectedTags = Array.isArray(selected) ? selected : selected ? [selected] : [];

  return (
    <View style={styles.grid}>
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);

        return (
          <Pressable
            key={tag}
            onPress={() => onSelect(tag)}
            style={({pressed}) => [
              styles.chip,
              {
                backgroundColor: isSelected ? theme.colors.primary : neutralTag.tint,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {color: isSelected ? theme.colors.onPrimary : neutralTag.text},
              ]}
              numberOfLines={1}
            >
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
    minHeight: 32,
    justifyContent: 'center',
  },
  chipText: {
    ...typography.tag,
  },
});

export default CategoryPicker;
