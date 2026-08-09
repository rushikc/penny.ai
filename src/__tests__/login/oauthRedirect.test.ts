jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      originalFullName: undefined,
      slug: 'penny-ai',
      owner: 'rushikc',
      scheme: 'pennyai',
    },
    executionEnvironment: 'bare',
  },
  ExecutionEnvironment: {
    StoreClient: 'storeClient',
    Bare: 'bare',
    Standalone: 'standalone',
  },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn((opts?: {scheme?: string}) =>
    opts?.scheme ? `${opts.scheme}://auth` : 'https://web.example/auth',
  ),
}));

import {Platform} from 'react-native';
import Constants, {ExecutionEnvironment} from 'expo-constants';
import * as AuthSession from 'expo-auth-session';
import {
  makeGoogleOAuthRedirectUri,
  resolveExpoAuthProxyProjectId,
} from '../../pages/login/oauthRedirect';

describe('resolveExpoAuthProxyProjectId', () => {
  const originalEnv = process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME;
    } else {
      process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME = originalEnv;
    }
    (Constants as any).expoConfig = {
      originalFullName: undefined,
      slug: 'penny-ai',
      owner: 'rushikc',
      scheme: 'pennyai',
    };
  });

  it('prefers EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME and normalizes @', () => {
    process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME = 'rushikc/penny-ai';
    expect(resolveExpoAuthProxyProjectId()).toBe('@rushikc/penny-ai');

    process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME = '@rushikc/penny-ai';
    expect(resolveExpoAuthProxyProjectId()).toBe('@rushikc/penny-ai');
  });

  it('falls back to owner/slug from expo config', () => {
    delete process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME;
    expect(resolveExpoAuthProxyProjectId()).toBe('@rushikc/penny-ai');
  });

  it('uses originalFullName when present', () => {
    delete process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME;
    (Constants as any).expoConfig.originalFullName = '@team/app';
    expect(resolveExpoAuthProxyProjectId()).toBe('@team/app');
  });
});

describe('makeGoogleOAuthRedirectUri', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', {configurable: true, value: originalOS});
    (Constants as any).executionEnvironment = ExecutionEnvironment.Bare;
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_EXPO_PROJECT_FULL_NAME;
    (Constants as any).expoConfig = {
      originalFullName: undefined,
      slug: 'penny-ai',
      owner: 'rushikc',
      scheme: 'pennyai',
    };
  });

  it('uses AuthSession.makeRedirectUri on web', () => {
    Object.defineProperty(Platform, 'OS', {configurable: true, value: 'web'});
    expect(makeGoogleOAuthRedirectUri()).toBe('https://web.example/auth');
  });

  it('uses app scheme outside Expo Go', () => {
    Object.defineProperty(Platform, 'OS', {configurable: true, value: 'ios'});
    (Constants as any).executionEnvironment = ExecutionEnvironment.Bare;
    expect(makeGoogleOAuthRedirectUri()).toBe('pennyai://auth');
  });

  it('uses Expo auth proxy when Expo Go returns exp://', () => {
    Object.defineProperty(Platform, 'OS', {configurable: true, value: 'ios'});
    (Constants as any).executionEnvironment = ExecutionEnvironment.StoreClient;
    (AuthSession.makeRedirectUri as jest.Mock).mockReturnValue('exp://127.0.0.1:8081');
    expect(makeGoogleOAuthRedirectUri()).toBe('https://auth.expo.io/@rushikc/penny-ai');
  });
});
