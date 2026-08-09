import {useEffect, useState} from 'react';
import {onAuthStateChanged, User} from 'firebase/auth';
import {auth} from '../firebase/firebaseConfig';
import {FinanceStorage} from '../api/FinanceStorage';
import {loadingUserProfile, mapAuthUserToProfile, UserProfile} from './userProfile';

export type {UserProfile};

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadingUserProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
      setUserProfile(mapAuthUserToProfile(user));
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await FinanceStorage.clearStorageData();
      FinanceStorage.initDB();
      await auth.signOut();
      return {success: true};
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during sign out'
      };
    }
  };

  return {currentUser, userProfile, isLoading, signOut};
};
