import {Platform} from 'react-native';
import Constants, {ExecutionEnvironment} from 'expo-constants';
import * as AuthSession from 'expo-auth-session';

/**
 * Project id for https://auth.expo.io/<id> (Expo Go / dev). Google Web OAuth rejects exp:// redirects.
 */
export function resolveExpoAuthProxyProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME?.trim();
  if (fromEnv) {
    const n = fromEnv.replace(/^\//, '');
    return n.startsWith('@') ? n : `@${n}`;
  }
  const cfg = Constants.expoConfig;
  if (cfg?.originalFullName) {
    return cfg.originalFullName;
  }
  const slug = Array.isArray(cfg?.slug) ? cfg?.slug[0] : cfg?.slug;
  const ownerRaw = cfg?.owner;
  const owner = Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw;
  if (slug && owner) {
    const o = owner.startsWith('@') ? owner : `@${owner}`;
    return `${o}/${slug}`;
  }
  if (slug) {
    return `@anonymous/${slug}`;
  }
  return undefined;
}

export function resolveAppScheme(): string | undefined {
  const schemeRaw = Constants.expoConfig?.scheme;
  return Array.isArray(schemeRaw) ? schemeRaw[0] : schemeRaw;
}

/**
 * - Web: normal makeRedirectUri().
 * - Development build / standalone (not Expo Go): app scheme from app.json (e.g. pennyai://…); register this exact URI in Google Cloud Web client.
 * - Expo Go: if Metro returns exp://, use https://auth.expo.io/… proxy (Google rejects exp://).
 */
export function makeGoogleOAuthRedirectUri(): string {
  if (Platform.OS === 'web') {
    return AuthSession.makeRedirectUri();
  }
  const scheme = resolveAppScheme();
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  if (!isExpoGo) {
    return AuthSession.makeRedirectUri({scheme});
  }

  const deepLink = AuthSession.makeRedirectUri({scheme});
  if (!deepLink.startsWith('exp://')) {
    return deepLink;
  }
  const projectId = resolveExpoAuthProxyProjectId();
  if (!projectId) {
    throw new Error(
      'Google sign-in: cannot build Expo auth proxy URL. Set EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME to @your-expo-username/penny-ai (and add https://auth.expo.io/@your-expo-username/penny-ai to Google Cloud OAuth redirect URIs).',
    );
  }
  return `https://auth.expo.io/${projectId}`;
}
