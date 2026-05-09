import React from 'react';
import {Stack} from 'expo-router';
import {Provider} from 'react-redux';
import {store} from '../src/store/store';
import {AuthProvider} from '../src/pages/login/AuthContext';
import {PaperProvider, MD3DarkTheme, MD3LightTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {selectExpense} from '../src/store/expenseActions';
import {StatusBar} from 'expo-status-bar';
import AlertComponent from '../src/components/AlertComponent';

function InnerLayout() {
  const {appConfig} = useSelector(selectExpense);
  const theme = appConfig.darkMode ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <StatusBar style={appConfig.darkMode ? 'light' : 'dark'} />
        <Stack screenOptions={{headerShown: false}}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="setting-tags" options={{headerShown: true, title: 'Manage Tags', animation: 'slide_from_right'}} />
          <Stack.Screen name="setting-tag-maps" options={{headerShown: true, title: 'Vendor Tags', animation: 'slide_from_right'}} />
          <Stack.Screen name="reload-expense" options={{headerShown: true, title: 'Reload Data', animation: 'slide_from_right'}} />
          <Stack.Screen name="auto-tag-expenses" options={{headerShown: true, title: 'Auto-tag', animation: 'slide_from_right'}} />
          <Stack.Screen name="config" options={{headerShown: true, title: 'Configuration', animation: 'slide_from_right'}} />
        </Stack>
        <AlertComponent />
      </AuthProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <InnerLayout />
    </Provider>
  );
}
