import React, {useEffect} from 'react';
import {Tabs} from 'expo-router';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useTheme} from 'react-native-paper';
import {useAuth} from '../../src/pages/login/AuthContext';
import {useSelector} from 'react-redux';
import {selectExpense} from '../../src/store/expenseActions';
import {loadInitialAppData} from '../../src/pages/dataValidations';
import {Redirect} from 'expo-router';
import {ActivityIndicator, View} from 'react-native';

export default function TabLayout() {
  const theme = useTheme();
  const {currentUser, loading} = useAuth();
  const {isAppLoading} = useSelector(selectExpense);

  useEffect(() => {
    if (currentUser && isAppLoading) {
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

  if (!currentUser) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
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
