import {User} from 'firebase/auth';
import {loadingUserProfile, mapAuthUserToProfile} from '../../hooks/userProfile';

describe('mapAuthUserToProfile', () => {
  it('maps signed-in user fields with fallbacks', () => {
    expect(
      mapAuthUserToProfile({
        displayName: 'Ada',
        email: 'ada@example.com',
        photoURL: 'https://img',
        uid: 'u1',
      } as User),
    ).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      photoUrl: 'https://img',
      uid: 'u1',
    });

    expect(
      mapAuthUserToProfile({
        displayName: null,
        email: null,
        photoURL: null,
        uid: 'u2',
      } as unknown as User),
    ).toEqual({
      name: 'User',
      email: 'No email',
      photoUrl: null,
      uid: 'u2',
    });
  });

  it('maps signed-out state', () => {
    expect(mapAuthUserToProfile(null)).toEqual({
      name: 'Not signed in',
      email: 'Please sign in',
      photoUrl: null,
      uid: null,
    });
  });

  it('exposes a loading profile constant', () => {
    expect(loadingUserProfile).toEqual({
      name: 'Loading...',
      email: 'Loading...',
      photoUrl: null,
      uid: null,
    });
  });
});
