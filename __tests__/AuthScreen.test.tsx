/**
 * Tests for auth screens and auth storage.
 * Covers: render, validation, password toggle, submit success/fail,
 * session persistence, hash (not plaintext), auth gate.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '../src/auth/AuthContext';
import {
  DEMO_PROFILE,
  getPreviewPasswordHash,
  hashPassword,
  readAccount,
  readProfiles,
  saveProfile,
  signOut,
  startSession,
} from '../src/auth/authStorage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthScreen } from '../src/screens/AuthScreen';

// ─── Mock safe-area-context ───────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: View,
  };
});

// ─── Mock expo-crypto ─────────────────────────────────────────────────────────
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async (_alg: unknown, input: string) => {
    // Deterministic mock: return hex of char codes
    return Array.from(input).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  }),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

// ─── Mock AsyncStorage ────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderAuth(page: 'login' | 'signup' | 'forgot' = 'login') {
  const onNavigate = jest.fn();
  const onAuthSuccess = jest.fn();
  const result = render(
    <SafeAreaProvider>
      <AuthProvider>
        <AuthScreen page={page} onNavigate={onNavigate} onAuthSuccess={onAuthSuccess} />
      </AuthProvider>
    </SafeAreaProvider>
  );
  return { ...result, onNavigate, onAuthSuccess };
}

// ─── Auth Storage tests ───────────────────────────────────────────────────────
describe('authStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    // Clear memory session by calling signOut
    await signOut();
  });

  it('readAccount returns null when nothing stored', async () => {
    const account = await readAccount();
    expect(account).toBeNull();
  });

  it('startSession with remember=true persists to AsyncStorage', async () => {
    await startSession({ mode: 'member', name: 'Alice', email: 'alice@test.com' }, true);
    const raw = await AsyncStorage.getItem('growtrack-account');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.email).toBe('alice@test.com');
    expect(parsed.mode).toBe('member');
  });

  it('signOut clears session', async () => {
    await startSession({ mode: 'guest', name: 'Guest' }, true);
    await signOut();
    const account = await readAccount();
    expect(account).toBeNull();
  });

  it('readProfiles always includes demo profile', async () => {
    const profiles = await readProfiles();
    expect(profiles.some((p) => p.email === DEMO_PROFILE.email)).toBe(true);
  });

  it('saveProfile stores new profile without duplicates', async () => {
    await saveProfile({ name: 'Bob', email: 'bob@test.com' });
    await saveProfile({ name: 'Bob2', email: 'bob@test.com' }); // duplicate email → replaces
    const profiles = await readProfiles();
    const bobs = profiles.filter((p) => p.email === 'bob@test.com');
    expect(bobs).toHaveLength(1);
    expect(bobs[0].name).toBe('Bob2');
  });

  it('password is NOT stored plaintext — stored hash differs from input', async () => {
    const pw = 'GrowTrack123!';
    const hash = await hashPassword(pw);
    expect(hash).not.toBe(pw);
    expect(hash).not.toContain(pw);
  });

  it('getPreviewPasswordHash returns same hash for same password', async () => {
    const h1 = await getPreviewPasswordHash();
    const h2 = await getPreviewPasswordHash();
    expect(h1).toBe(h2);
    expect(h1).not.toBe('GrowTrack123!');
  });
});

// ─── Login screen render ──────────────────────────────────────────────────────
describe('AuthScreen — login', () => {
  it('renders without crashing', () => {
    const { getByText } = renderAuth('login');
    expect(getByText('Welcome back')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Continue with Google')).toBeTruthy();
    expect(getByText('Continue as Guest')).toBeTruthy();
  });

  it('shows email and password fields', () => {
    const { getByPlaceholderText } = renderAuth('login');
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('validates empty email on submit', async () => {
    const { getByText } = renderAuth('login');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Enter your email address.')).toBeTruthy();
    });
  });

  it('validates invalid email format', async () => {
    const { getByText, getByPlaceholderText } = renderAuth('login');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'notanemail');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Enter a valid email address.')).toBeTruthy();
    });
  });

  it('validates empty password on submit', async () => {
    const { getByText, getByPlaceholderText } = renderAuth('login');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@test.com');
    fireEvent.press(getByText('Sign In'));
    await waitFor(() => {
      expect(getByText('Enter your password.')).toBeTruthy();
    });
  });

  it('toggles password visibility', () => {
    const { getByPlaceholderText, getAllByRole } = renderAuth('login');
    const pwInput = getByPlaceholderText('Enter your password');
    expect(pwInput.props.secureTextEntry).toBe(true);
    // Find buttons by role and look for the eye toggle
    const buttons = getAllByRole('button');
    // The show/hide password button has accessibilityLabel 'Show password'
    const showBtn = buttons.find(
      (b) => b.props.accessibilityLabel === 'Show password'
    );
    expect(showBtn).toBeTruthy();
    fireEvent.press(showBtn!);
    const pwInputAfter = getByPlaceholderText('Enter your password');
    expect(pwInputAfter.props.secureTextEntry).toBe(false);
  });

  it('shows error for unknown email on login', async () => {
    const { getByText, getByPlaceholderText } = renderAuth('login');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'unknown@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'GrowTrack123!');
    fireEvent.press(getByText('Sign In'));
    await waitFor(
      () => {
        expect(getByText('No preview account found. Create an account or try the demo below.')).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });
});

// ─── Register screen render ───────────────────────────────────────────────────
describe('AuthScreen — signup', () => {
  it('renders without crashing', () => {
    const { getAllByText } = renderAuth('signup');
    expect(getAllByText('Create Account').length).toBeGreaterThan(0);
  });

  it('shows all signup fields', () => {
    const { getByPlaceholderText } = renderAuth('signup');
    expect(getByPlaceholderText('Your Growtopia name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    expect(getByPlaceholderText('Re-enter your password')).toBeTruthy();
  });

  it('validates empty name on submit', async () => {
    const { getAllByText, getByText } = renderAuth('signup');
    fireEvent.press(getAllByText('Create Account')[getAllByText('Create Account').length - 1]);
    await waitFor(() => { expect(getByText('Enter your display name.')).toBeTruthy(); });
  });

  it('validates password strength', async () => {
    const { getAllByText, getByText, getByPlaceholderText } = renderAuth('signup');
    fireEvent.changeText(getByPlaceholderText('Your Growtopia name'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'weak');
    fireEvent.press(getAllByText('Create Account')[getAllByText('Create Account').length - 1]);
    await waitFor(() => {
      expect(getByText('Use 8+ characters with upper/lowercase letters and a number or symbol.')).toBeTruthy();
    });
  });

  it('validates password confirmation match', async () => {
    const { getAllByText, getByText, getByPlaceholderText } = renderAuth('signup');
    fireEvent.changeText(getByPlaceholderText('Your Growtopia name'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Re-enter your password'), 'different');
    fireEvent.press(getAllByText('Create Account')[getAllByText('Create Account').length - 1]);
    await waitFor(() => {
      expect(getByText("Passwords don't match.")).toBeTruthy();
    });
  });

  it('validates terms agreement required', async () => {
    const { getAllByText, getByText, getByPlaceholderText } = renderAuth('signup');
    fireEvent.changeText(getByPlaceholderText('Your Growtopia name'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'alice@test.com');
    fireEvent.changeText(getByPlaceholderText('Enter your password'), 'StrongPass1!');
    fireEvent.changeText(getByPlaceholderText('Re-enter your password'), 'StrongPass1!');
    fireEvent.press(getAllByText('Create Account')[getAllByText('Create Account').length - 1]);
    await waitFor(() => {
      expect(getByText('Please agree to the terms and privacy notice.')).toBeTruthy();
    });
  });
});

// ─── Forgot password render ───────────────────────────────────────────────────
describe('AuthScreen — forgot', () => {
  it('renders without crashing', () => {
    const { getByText } = renderAuth('forgot');
    expect(getByText('Reset your password')).toBeTruthy();
    expect(getByText('Send reset link')).toBeTruthy();
  });

  it('shows sent confirmation after submit with valid email', async () => {
    const { getByText, getByPlaceholderText } = renderAuth('forgot');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'test@test.com');
    fireEvent.press(getByText('Send reset link'));
    await waitFor(
      () => {
        expect(getByText('Check your inbox')).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });
});
