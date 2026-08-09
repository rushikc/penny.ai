import {AUTH_REQUIRED} from '../../utility/constants';

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: {
    credential: jest.fn((token: string) => ({token})),
  },
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../../firebase/firebaseConfig', () => ({
  auth: {currentUser: {uid: 'user-1'}},
}));

jest.mock('../../api/FinanceStorage', () => ({
  FinanceStorage: {
    clearStorageData: jest.fn(() => Promise.resolve()),
  },
}));

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {FinanceStorage} from '../../api/FinanceStorage';
import {AuthService} from '../../pages/login/AuthService';

const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.Mock;
const mockSignInWithCredential = signInWithCredential as jest.Mock;
const mockSignOut = signOut as jest.Mock;
const mockCredential = GoogleAuthProvider.credential as jest.Mock;
const mockOnAuthStateChanged = onAuthStateChanged as jest.Mock;
const mockClearStorageData = FinanceStorage.clearStorageData as jest.Mock;

describe('AUTH_REQUIRED constant', () => {
  it('is false so login remains optional for admin auto-sign-in', () => {
    expect(AUTH_REQUIRED).toBe(false);
  });
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('signs in with email/password', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({user: {uid: 'u1'}});
    const user = await AuthService.signInWithEmailPassword('a@b.com', 'secret');
    expect(user).toEqual({uid: 'u1'});
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });

  it('throws when email/password sign-in fails', async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue(new Error('bad creds'));
    await expect(AuthService.signInWithEmailPassword('a@b.com', 'x')).rejects.toThrow('bad creds');
  });

  it('signs in with Google credential', async () => {
    mockSignInWithCredential.mockResolvedValue({user: {uid: 'g1'}});
    const user = await AuthService.signInWithGoogleCredential('id-token');
    expect(mockCredential).toHaveBeenCalledWith('id-token');
    expect(user).toEqual({uid: 'g1'});
  });

  it('throws when Google credential sign-in fails', async () => {
    mockSignInWithCredential.mockRejectedValue(new Error('google fail'));
    await expect(AuthService.signInWithGoogleCredential('bad')).rejects.toThrow('google fail');
  });

  it('clears local storage then signs out', async () => {
    mockSignOut.mockResolvedValue(undefined);
    await AuthService.signOut();
    expect(mockClearStorageData).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('rethrows sign-out errors after logging', async () => {
    mockSignOut.mockRejectedValue(new Error('network'));
    await expect(AuthService.signOut()).rejects.toThrow('network');
  });

  it('returns current user and wires auth state listener', () => {
    expect(AuthService.getCurrentUser()).toEqual({uid: 'user-1'});
    const cb = jest.fn();
    AuthService.onAuthStateChanged(cb);
    expect(mockOnAuthStateChanged).toHaveBeenCalled();
  });
});
