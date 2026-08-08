import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAppTheme} from '../theme/useAppTheme';
import {typography} from '../theme/tokens';

export interface DashboardTileProps {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  onClick: () => void;
  isLast?: boolean;
}

const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  subtitle,
  icon,
  color,
  onClick,
  isLast = false,
}) => {
  const theme = useAppTheme();
  const iconColor = color ?? theme.colors.primary;
  const iconBg = iconColor + '18';

  return (
    <>
      <Pressable
        onPress={onClick}
        style={({pressed}) => [styles.row, pressed && {backgroundColor: theme.colors.surfaceVariant}]}
      >
        <View style={[styles.iconContainer, {backgroundColor: iconBg}]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="bodyLarge" style={[styles.title, {color: theme.colors.onSurface}]}>{title}</Text>
          <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary}}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.custom.textSecondary} />
      </Pressable>
      {!isLast && <View style={[styles.divider, {backgroundColor: theme.colors.custom.border}]} />}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.rowTitle,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
});

export default DashboardTile;
