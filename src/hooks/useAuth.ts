import {useEffect, useState} from 'react';
import {onAuthStateChanged, User} from 'firebase/auth';
import {auth} from '../firebase/firebaseConfig';
import {FinanceStorage} from '../api/FinanceStorage';

export interface UserProfile {
  name: string;
  email: string;
  photoUrl: string | null;
  uid: string | null;
}

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Loading...',
    email: 'Loading...',
    photoUrl: null,
    uid: null
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);

      if (user) {
        setUserProfile({
          name: user.displayName || 'User',
          email: user.email || 'No email',
          photoUrl: user.photoURL,
          uid: user.uid
        });
      } else {
        setUserProfile({
          name: 'Not signed in',
          email: 'Please sign in',
          photoUrl: null,
          uid: null
        });
      }
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
