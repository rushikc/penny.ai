import {User} from 'firebase/auth';

export interface UserProfile {
  name: string;
  email: string;
  photoUrl: string | null;
  uid: string | null;
}

export const mapAuthUserToProfile = (user: User | null): UserProfile => {
  if (user) {
    return {
      name: user.displayName || 'User',
      email: user.email || 'No email',
      photoUrl: user.photoURL,
      uid: user.uid,
    };
  }

  return {
    name: 'Not signed in',
    email: 'Please sign in',
    photoUrl: null,
    uid: null,
  };
};

export const loadingUserProfile: UserProfile = {
  name: 'Loading...',
  email: 'Loading...',
  photoUrl: null,
  uid: null,
};
