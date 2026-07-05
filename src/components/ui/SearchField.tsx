import React from 'react';
import {StyleSheet, View, TextInput, ViewStyle} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAppTheme} from '../../theme/useAppTheme';
import {radius, spacing} from '../../theme/tokens';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

/**
 * Native iOS-style search bar: gray rounded background, leading magnifier
 * icon, and a clear button when there is text.
 */
const SearchField: React.FC<SearchFieldProps> = ({value, onChangeText, placeholder = 'Search', style}) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.surfaceVariant}, style]}>
      <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.custom.textSecondary} />
      <TextInput
        style={[styles.input, {color: theme.colors.onSurface}]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.custom.textSecondary}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <MaterialCommunityIcons
          name="close-circle"
          size={18}
          color={theme.colors.custom.textSecondary}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 40,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});

export default SearchField;
