import {Platform} from 'react-native';
import {signInWithCustomToken, signOut} from 'firebase/auth';
import {AUTH_REQUIRED} from '../utility/constants';
import {auth} from './firebaseConfig';

const IOS_DEVICE_UID = 'penny-ios-device';

/**
 * Signs in with a one-time Firebase custom token (iOS only) so Firestore rules
 * can validate request.auth.token.penny_device_token.
 */
export async function ensureIosFirestoreAuth(): Promise<void> {
  if (Platform.OS !== 'ios' || AUTH_REQUIRED) {
    return;
  }

  const token = process.env.EXPO_PUBLIC_IOS_FIRESTORE_CUSTOM_TOKEN?.trim();
  if (!token) {
    console.warn(
      'iOS Firestore auth: EXPO_PUBLIC_IOS_FIRESTORE_CUSTOM_TOKEN is not set. Mint one with scripts/mint-ios-firestore-token.mjs',
    );
    return;
  }

  try {
    // Re-sign so a re-minted token (or updated claim secret) is not skipped by a persisted session.
    if (auth.currentUser?.uid === IOS_DEVICE_UID) {
      await signOut(auth);
    }

    const credential = await signInWithCustomToken(auth, token);
    const idTokenResult = await credential.user.getIdTokenResult(true);
    console.log(
      'iOS Firestore auth: signed in with device token.',
      idTokenResult.claims.penny_device_token
        ? `(claim: ${String(idTokenResult.claims.penny_device_token)})`
        : '(warning: penny_device_token claim missing)',
    );
  } catch (error) {
    console.error(
      'iOS Firestore auth failed. Custom tokens expire after ~1 hour — re-run: node scripts/mint-ios-firestore-token.mjs',
      error,
    );
  }
}
