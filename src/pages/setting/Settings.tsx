import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Text} from 'react-native-paper';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {useRouter} from 'expo-router';
import {useSelector} from 'react-redux';
import {selectExpense, toggleDarkMode} from '../../store/expenseActions';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {createTimedAlert} from '../../store/alertActions';
import {useAuth} from '../../hooks/useAuth';
import ProfileAvatar from '../../components/ProfileAvatar';
import DashboardTile from '../../components/DashboardTile';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AUTH_REQUIRED} from '../../utility/constants';
import {useAppTheme} from '../../theme/useAppTheme';
import Card from '../../components/ui/Card';

const Settings: React.FC = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const {appConfig} = useSelector(selectExpense);
  const {userProfile, signOut, isLoading} = useAuth();
  const [isAppInfoModalOpen, setIsAppInfoModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (!result.success && result.error) {
        createTimedAlert({type: 'error', message: result.error});
      } else {
        router.replace(AUTH_REQUIRED ? '/login' : '/(tabs)/home');
      }
    } catch (error) {
      createTimedAlert({type: 'error', message: 'Failed to sign out.'});
    }
  };

  const handleToggleTheme = async () => {
    try {
      const success = await ExpenseAPI.updateDarkMode(!appConfig.darkMode);
      if (success) toggleDarkMode();
    } catch (error) {
      console.error('Error updating dark mode:', error);
    }
  };

  const dashboardTiles = [
    {id: 'tags', title: 'Tags', subtitle: 'Manage your expense tags', icon: 'tag', color: '#ce93d8', route: '/setting-tags'},
    {id: 'theme', title: `${appConfig.darkMode ? 'Light' : 'Dark'} Theme`, subtitle: `Switch to ${appConfig.darkMode ? 'light' : 'dark'} mode`, icon: 'theme-light-dark', color: '#9c27b0', route: '/toggle-theme'},
    {id: 'reload', title: 'Reload Data', subtitle: 'Reload your expense data', icon: 'refresh', color: '#ffa726', route: '/reload-expense'},
    {id: 'investment', title: 'Investment', subtitle: 'Project your investment growth', icon: 'finance', color: '#66bb6a', route: '/investment-calculator'},
    {id: 'manage-tag-maps', title: 'Manage Vendor Tags', subtitle: 'Configure vendor tag mappings', icon: 'map-marker', color: '#64b5f6', route: '/setting-tag-maps'},
    {id: 'auto-tag', title: 'Auto-tag Expenses', subtitle: 'Automatically tag past expenses', icon: 'auto-fix', color: '#4db6ac', route: '/auto-tag-expenses'},
    {id: 'sign-out', title: 'Sign Out', subtitle: 'Log out of your account', icon: 'logout', color: '#f44336', route: '/signout'},
  ];

  const handleTileClick = (route: string) => {
    if (route === '/signout') { void handleSignOut(); return; }
    if (route === '/toggle-theme') { void handleToggleTheme(); return; }
    router.push(route as any);
  };

  if (isLoading) return null;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]} edges={['top']}>
      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        <Card style={styles.profileCard}>
          <ProfileAvatar photoUrl={userProfile.photoUrl} name={userProfile.name} size={64} />
          <View style={styles.profileInfo}>
            <Text variant="titleLarge" style={{color: theme.colors.onSurface, fontWeight: '700'}}>{userProfile.name}</Text>
            <Text variant="bodyMedium" style={{color: theme.colors.custom.textSecondary}}>{userProfile.email}</Text>
          </View>
        </Card>

        <Card noPadding style={styles.tilesContainer}>
          {dashboardTiles.map((tile, index) => (
            <DashboardTile
              key={tile.id}
              id={tile.id}
              title={tile.title}
              subtitle={tile.subtitle}
              icon={tile.icon}
              color={tile.color}
              onClick={() => handleTileClick(tile.route)}
              isLast={index === dashboardTiles.length - 1}
            />
          ))}
        </Card>

        <Text variant="bodySmall" onPress={() => setIsAppInfoModalOpen(true)}
          style={[styles.version, {color: theme.colors.custom.textSecondary}]}>
          penny.ai v1.1.0
        </Text>
      </ScrollView>

      <BottomSheetModal
        visible={isAppInfoModalOpen}
        onDismiss={() => setIsAppInfoModalOpen(false)}
        title="penny.ai"
        hideFooter
        scrollable={false}
      >
        <Text variant="bodyMedium">Version: 1.1.0</Text>
        <Text variant="bodyMedium" style={{marginTop: 8}}>Author: rushikc</Text>
        <Text variant="bodyMedium" style={{marginTop: 8}}>Contact: rushikc.dev@gmail.com</Text>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  profileCard: {margin: 12, flexDirection: 'row', alignItems: 'center'},
  profileInfo: {marginLeft: 16, flex: 1},
  tilesContainer: {marginHorizontal: 12, marginTop: 4, overflow: 'hidden'},
  version: {textAlign: 'center', marginTop: 20},
});

export default Settings;
