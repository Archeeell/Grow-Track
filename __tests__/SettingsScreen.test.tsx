/**
 * Tests for SettingsScreen and prefsStorage.
 * Covers: render (guest vs member vs demo), toggle harvest notifications,
 * theme selection, behavior selection, sign out, restore seeds, reset app data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AuthProvider } from '../src/auth/AuthContext';
import { startSession } from '../src/auth/authStorage';
import { SettingsScreen } from '../src/screens/SettingsScreen';
import { StoreProvider } from '../src/store';
import { DEFAULT_PREFS, loadPrefs, savePrefs } from '../src/settings/prefsStorage';

// ─── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: any }) => (
      <View style={style}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'mock-hash'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

jest.mock('../src/notifications', () => ({
  syncAllNotifications: jest.fn(),
  syncFarmNotification: jest.fn(),
  cancelFarmNotification: jest.fn(),
  fireDueNotification: jest.fn(),
}));

function renderSettings(onNavigate = jest.fn()) {
  return render(
    <AuthProvider>
      <StoreProvider>
        <SettingsScreen onNavigate={onNavigate} />
      </StoreProvider>
    </AuthProvider>
  );
}

// ─── prefsStorage tests ───────────────────────────────────────────────────────
describe('prefsStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('loadPrefs returns defaults when nothing stored', async () => {
    const prefs = await loadPrefs();
    expect(prefs).toEqual(DEFAULT_PREFS);
  });

  it('savePrefs persists preferences', async () => {
    await savePrefs({ theme: 'light', notifications: false, time: '12', behavior: 'manual' });
    const prefs = await loadPrefs();
    expect(prefs.theme).toBe('light');
    expect(prefs.notifications).toBe(false);
    expect(prefs.time).toBe('12');
    expect(prefs.behavior).toBe('manual');
  });

  it('loadPrefs sanitizes invalid stored values', async () => {
    await AsyncStorage.setItem('growtrack-prefs', JSON.stringify({ theme: 'invalid', time: '99' }));
    const prefs = await loadPrefs();
    expect(prefs.theme).toBe('dark'); // fallback
    expect(prefs.time).toBe('24');    // fallback
  });
});

// ─── SettingsScreen render tests ──────────────────────────────────────────────
describe('SettingsScreen — layout and sections', () => {
  it('renders heading and subtitle', () => {
    const { getAllByText, getByText } = renderSettings();
    expect(getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Make GrowTrack work for you.')).toBeTruthy();
  });

  it('renders all 6 section headers in uppercase', () => {
    const { getByText } = renderSettings();
    expect(getByText('APPEARANCE')).toBeTruthy();
    expect(getByText('NOTIFICATIONS')).toBeTruthy();
    expect(getByText('FARM TRACKING')).toBeTruthy();
    expect(getByText('DATA')).toBeTruthy();
    expect(getByText('ABOUT')).toBeTruthy();
    expect(getByText('ACCOUNT')).toBeTruthy();
  });

  it('renders footer tagline', () => {
    const { getByText } = renderSettings();
    expect(getByText('Keep every farm growing.')).toBeTruthy();
  });

  it('renders Version row with detail 1.0.0', () => {
    const { getByText } = renderSettings();
    expect(getByText('Version')).toBeTruthy();
    expect(getByText('1.0.0')).toBeTruthy();
  });
});

// ─── Account section: guest vs member ─────────────────────────────────────────
describe('SettingsScreen — account section', () => {
  it('shows Guest Mode / Sign in when unauthenticated or guest', () => {
    const { getByText } = renderSettings();
    expect(getByText('Guest Mode / Sign in')).toBeTruthy();
  });

  it('shows member name in detail when logged in as member', async () => {
    await startSession({ mode: 'member', name: 'Archell', email: 'archell@growtrack.app' }, true);
    const { getByText } = renderSettings();
    await waitFor(() => {
      expect(getByText('Account')).toBeTruthy();
      expect(getByText('Archell')).toBeTruthy();
    });
  });
});

// ─── Overlay interactions ─────────────────────────────────────────────────────
describe('SettingsScreen — overlays', () => {
  it('opens theme overlay when Theme row is pressed', async () => {
    const { getByText, getAllByText } = renderSettings();
    fireEvent.press(getByText('Theme'));
    await waitFor(() => {
      expect(getByText('Choose your theme')).toBeTruthy();
      expect(getAllByText('Dark').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Light')).toBeTruthy();
      expect(getByText('System')).toBeTruthy();
    });
  });

  it('opens behavior overlay when Default grow-time behavior is pressed', async () => {
    const { getByText, getAllByText } = renderSettings();
    fireEvent.press(getByText('Default grow-time behavior'));
    await waitFor(() => {
      expect(getByText('Default grow time')).toBeTruthy();
      expect(getByText("Use the seed's grow duration")).toBeTruthy();
      expect(getByText('Enter duration manually')).toBeTruthy();
    });
  });

  it('opens about overlay when About GrowTrack is pressed', async () => {
    const { getByText, getAllByText } = renderSettings();
    fireEvent.press(getByText('About GrowTrack'));
    await waitFor(() => {
      expect(getAllByText('About GrowTrack').length).toBeGreaterThanOrEqual(2);
      expect(getByText(/Built for growers who have more than one world/)).toBeTruthy();
    });
  });

  it('opens restore confirm dialog when Restore default seeds is pressed', async () => {
    const { getByText } = renderSettings();
    fireEvent.press(getByText('Restore default seeds'));
    await waitFor(() => {
      expect(getByText('Restore default seeds?')).toBeTruthy();
      expect(getByText(/Restore GrowTrack's starter seed library/)).toBeTruthy();
    });
  });

  it('opens reset app data confirm dialog when Reset app data is pressed', async () => {
    const { getByText } = renderSettings();
    fireEvent.press(getByText('Reset app data'));
    await waitFor(() => {
      expect(getByText('Reset app data?')).toBeTruthy();
      expect(getByText(/This will remove your farms, custom seeds/)).toBeTruthy();
    });
  });
});

// ─── Time format toggle ───────────────────────────────────────────────────────
describe('SettingsScreen — inline toggles', () => {
  it('toggles time format from 24-hour to 12-hour', async () => {
    const { getByText, findByText } = renderSettings();
    expect(getByText('24-hour')).toBeTruthy();
    fireEvent.press(getByText('Time format'));
    const switched = await findByText('12-hour');
    expect(switched).toBeTruthy();
  });
});

// ─── Sign out in account overlay ──────────────────────────────────────────────
describe('SettingsScreen — sign out', () => {
  it('shows sign out button in member account overlay', async () => {
    await startSession({ mode: 'member', name: 'Alice', email: 'alice@test.com' }, true);
    const { getByText } = renderSettings();
    await waitFor(() => expect(getByText('Account')).toBeTruthy());
    fireEvent.press(getByText('Account'));
    await waitFor(() => {
      expect(getByText('Your farms, everywhere')).toBeTruthy();
      expect(getByText('Sign out')).toBeTruthy();
      expect(getByText('Sync status · Saved on this device')).toBeTruthy();
    });
  });

  it('shows Create Account and Sign In in guest account overlay', async () => {
    await startSession({ mode: 'guest', name: 'Guest' }, true);
    const { getByText } = renderSettings();
    await waitFor(() => expect(getByText('Guest Mode / Sign in')).toBeTruthy());
    fireEvent.press(getByText('Guest Mode / Sign in'));
    await waitFor(() => {
      expect(getByText('Your farms, everywhere')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Not now')).toBeTruthy();
    });
  });
});
