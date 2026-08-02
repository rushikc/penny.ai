import React, {useEffect} from 'react';
import {Platform, StyleSheet} from 'react-native';
import {Tabs} from 'expo-router';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAppTheme} from '../../src/theme/useAppTheme';
import {useAuth} from '../../src/pages/login/AuthContext';
import {useSelector} from 'react-redux';
import {selectExpense} from '../../src/store/expenseActions';
import {loadInitialAppData} from '../../src/pages/dataValidations';
import {Redirect} from 'expo-router';
import {ActivityIndicator, View} from 'react-native';
import {AUTH_REQUIRED} from '../../src/utility/constants';

export default function TabLayout() {
  const theme = useAppTheme();
  const {currentUser, loading} = useAuth();
  const {isAppLoading} = useSelector(selectExpense);

  useEffect(() => {
    const shouldLoad = isAppLoading && currentUser;
    if (shouldLoad) {
      loadInitialAppData();
    }
  }, [currentUser, isAppLoading]);

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background}}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (AUTH_REQUIRED && !currentUser) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.custom.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.custom.card,
          borderTopColor: theme.colors.custom.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: theme.dark ? 0 : 8,
          shadowColor: theme.colors.custom.shadow,
          shadowOpacity: theme.dark ? 0 : 0.05,
          shadowRadius: 10,
          shadowOffset: {width: 0, height: -2},
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Insights',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
