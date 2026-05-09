import React from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {Text, useTheme} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';

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
  const theme = useTheme();

  return (
    <>
      <Pressable
        onPress={onClick}
        style={({pressed}) => [styles.row, pressed && {opacity: 0.7}]}
      >
        <View style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text variant="bodyLarge" style={{color: theme.colors.onSurface}}>{title}</Text>
          <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>{subtitle}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
      </Pressable>
      {!isLast && <View style={[styles.divider, {backgroundColor: theme.colors.outlineVariant}]} />}
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
    height: 1,
    marginLeft: 74,
  },
});

export default DashboardTile;
