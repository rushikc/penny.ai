import React, {useState} from 'react';
import {Image, View, StyleSheet} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useTheme} from 'react-native-paper';

interface ProfileAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({photoUrl, name, size = 60}) => {
  const [imageError, setImageError] = useState(false);
  const theme = useTheme();

  if (!photoUrl || imageError) {
    return (
      <View style={[styles.fallback, {width: size, height: size, borderRadius: size / 2, backgroundColor: theme.colors.primary}]}>
        <MaterialCommunityIcons name="account" size={size * 0.6} color="white" />
      </View>
    );
  }

  return (
    <Image
      source={{uri: photoUrl}}
      style={[styles.avatar, {width: size, height: size, borderRadius: size / 2}]}
      onError={() => setImageError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#ccc',
  },
});

export default ProfileAvatar;
