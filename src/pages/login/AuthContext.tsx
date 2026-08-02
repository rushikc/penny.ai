import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import {User} from 'firebase/auth';
import Constants, {ExecutionEnvironment} from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import {ResponseType} from 'expo-auth-session';
import {AuthService} from './AuthService';
import {ensureAdminSignedIn} from '../../firebase/adminAuth';

WebBrowser.maybeCompleteAuthSession();

/**
 * Project id for https://auth.expo.io/<id> (Expo Go / dev). Google Web OAuth rejects exp:// redirects.
 */
function resolveExpoAuthProxyProjectId(): string | undefined {
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

function resolveAppScheme(): string | undefined {
  const schemeRaw = Constants.expoConfig?.scheme;
  return Array.isArray(schemeRaw) ? schemeRaw[0] : schemeRaw;
}

/**
 * - Web: normal makeRedirectUri().
 * - Development build / standalone (not Expo Go): app scheme from app.json (e.g. pennyai://…); register this exact URI in Google Cloud Web client.
 * - Expo Go: if Metro returns exp://, use https://auth.expo.io/… proxy (Google rejects exp://).
 */
function makeGoogleOAuthRedirectUri(): string {
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

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const redirectUri = useMemo(() => makeGoogleOAuthRedirectUri(), []);

  useEffect(() => {
    console.log('Generated Redirect URI:', redirectUri);
  }, [redirectUri]);

  const [, , promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    redirectUri,
    responseType: ResponseType.IdToken, // Remove the Platform.OS check
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const bootstrapAuth = async () => {
      await ensureAdminSignedIn();
      unsubscribe = AuthService.onAuthStateChanged((user) => {
        setCurrentUser(user);
        setLoading(false);
        if (!user) {
          void ensureAdminSignedIn();
        }
      });
    };

    void bootstrapAuth();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // showInRecents helps some iOS / Expo Go flows complete the handoff from https://auth.expo.io back to the app.
    const result = await promptAsync({showInRecents: true});
    if (result.type !== 'success') {
      throw new Error(result.type === 'cancel' ? 'Sign in was cancelled' : `Google sign-in failed: ${result.type}`);
    }
    const idToken =
      typeof result.params.id_token === 'string' ? result.params.id_token : undefined;
    if (!idToken) {
      throw new Error('Google did not return an ID token');
    }
    return AuthService.signInWithGoogleCredential(idToken);
  }, [promptAsync]);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signOut: AuthService.signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
