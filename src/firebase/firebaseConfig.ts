import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApp, getApps, initializeApp} from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import {getFirestore} from 'firebase/firestore/lite';
import {firebaseConfig} from './firebase-public';

const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => firebaseAuth.Persistence;
  }
).getReactNativePersistence;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth() {
  if (Platform.OS === 'web') {
    return firebaseAuth.getAuth(app);
  }

  try {
    return firebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return firebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export {app};
