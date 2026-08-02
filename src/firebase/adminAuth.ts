import {signInWithEmailAndPassword} from 'firebase/auth';
import {auth} from './firebaseConfig';

/**
 * Signs in with the single admin account from .env so Firestore rules can
 * validate request.auth.uid against the hardcoded master UID in firestore.rules.
 */
export async function ensureAdminSignedIn(): Promise<void> {
  if (auth.currentUser) {
    return;
  }

  const email = process.env.EXPO_PUBLIC_ADMIN_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    console.warn(
      'Admin auth: set EXPO_PUBLIC_ADMIN_EMAIL and EXPO_PUBLIC_ADMIN_PASSWORD in .env',
    );
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Admin auth: signed in with email/password.');
  } catch (error) {
    console.error(
      'Admin auth failed. Check EXPO_PUBLIC_ADMIN_EMAIL / EXPO_PUBLIC_ADMIN_PASSWORD in .env',
      error,
    );
  }
}
