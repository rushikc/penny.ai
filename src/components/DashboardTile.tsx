import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAppTheme} from '../theme/useAppTheme';

export interface DashboardTileProps {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onClick: () => void;
  isLast?: boolean;
}

const DashboardTile: React.FC<DashboardTileProps> = ({title, subtitle, icon, color, onClick, isLast = false}) => {
  const theme = useAppTheme();

  return (
    <>
      <Pressable
        onPress={onClick}
        style={({pressed}) => [styles.row, pressed && {backgroundColor: theme.colors.surfaceVariant}]}
      >
        <View style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="bodyLarge" style={{color: theme.colors.onSurface, fontWeight: '600'}}>{title}</Text>
          <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary}}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.custom.textSecondary} />
      </Pressable>
      {!isLast && <View style={[styles.divider, {backgroundColor: theme.colors.custom.border}]} />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
});

export default DashboardTile;
