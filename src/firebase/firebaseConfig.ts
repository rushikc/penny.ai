import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApp, getApps, initializeApp} from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore/lite';
import {firebaseConfig} from './firebase-public';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export {app};
