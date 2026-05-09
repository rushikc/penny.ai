/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {onAuthStateChanged, signOut, User, signInWithCredential, GoogleAuthProvider} from 'firebase/auth';
import {auth} from '../../firebase/firebaseConfig';
import {FinanceStorage} from '../../api/FinanceStorage';

export const AuthService = {
  signInWithGoogleCredential: async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google credential', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await FinanceStorage.clearStorageData();
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
      throw error;
    }
  },

  getCurrentUser: () => {
    return auth.currentUser;
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
