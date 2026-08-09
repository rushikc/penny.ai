import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {User} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {ResponseType} from 'expo-auth-session';
import {AuthService} from './AuthService';
import {ensureAdminSignedIn} from '../../firebase/adminAuth';
import {makeGoogleOAuthRedirectUri} from './oauthRedirect';

export {
  makeGoogleOAuthRedirectUri,
  resolveAppScheme,
  resolveExpoAuthProxyProjectId,
} from './oauthRedirect';

WebBrowser.maybeCompleteAuthSession();

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
