import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import {
  darkPalette,
  lightPalette,
  withAlpha,
  useTheme,
  ThemeProvider,
} from '../src/theme/index';
import { PREFS_KEY } from '../src/settings/prefsStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('Theme Infrastructure', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Palettes fidelity & integrity', () => {
    test('darkPalette and lightPalette have identical keys', () => {
      const darkKeys = Object.keys(darkPalette).sort();
      const lightKeys = Object.keys(lightPalette).sort();
      expect(darkKeys).toEqual(lightKeys);
      expect(darkKeys.length).toBe(24);
    });

    test('darkPalette matches exact Figma Make :root tokens', () => {
      expect(darkPalette.bg).toBe('#0d1715');
      expect(darkPalette.foreground).toBe('#edf4ef');
      expect(darkPalette.primary).toBe('#45d483');
      expect(darkPalette.primaryForeground).toBe('#0d1715');
      expect(darkPalette.secondary).toBe('#243631');
      expect(darkPalette.accentBlue).toBe('#4ca8ff');
      expect(darkPalette.card).toBe('#14211e');
      expect(darkPalette.border).toBe('#2a3c35');
      expect(darkPalette.muted).toBe('#1c2b27');
      expect(darkPalette.mutedForeground).toBe('#91a69d');
      expect(darkPalette.surface).toBe('#1c2b27');
      expect(darkPalette.popover).toBe('#1c2b27');
      expect(darkPalette.growing).toBe('#e6c16a');
      expect(darkPalette.destruct).toBe('#e96a6a');
      expect(darkPalette.readyBg).toBe('#0f2c1c');
    });

    test('lightPalette matches exact Figma Make .light tokens', () => {
      expect(lightPalette.bg).toBe('#f3f5ef');
      expect(lightPalette.foreground).toBe('#182b22');
      expect(lightPalette.primary).toBe('#168647');
      expect(lightPalette.primaryForeground).toBe('#ffffff');
      expect(lightPalette.secondary).toBe('#e1e9dc');
      expect(lightPalette.accentBlue).toBe('#4ca8ff');
      expect(lightPalette.card).toBe('#ffffff');
      expect(lightPalette.border).toBe('#d6dfd0');
      expect(lightPalette.muted).toBe('#e8eee4');
      expect(lightPalette.mutedForeground).toBe('#586e60');
      expect(lightPalette.surface).toBe('#e8eee4');
      expect(lightPalette.popover).toBe('#e9eee5');
      expect(lightPalette.growing).toBe('#e6c16a');
      expect(lightPalette.destruct).toBe('#e96a6a');
      expect(lightPalette.readyBg).toBe('#eaf6e9');
    });
  });

  describe('withAlpha helper', () => {
    test('computes RGBA from 6-digit hex', () => {
      expect(withAlpha('#45d483', 0.15)).toBe('rgba(69, 212, 131, 0.15)');
      expect(withAlpha('#0d1715', 0.65)).toBe('rgba(13, 23, 21, 0.65)');
    });

    test('computes RGBA from 3-digit hex', () => {
      expect(withAlpha('#fff', 0.95)).toBe('rgba(255, 255, 255, 0.95)');
    });

    test('computes RGBA from 8-digit hex', () => {
      expect(withAlpha('#45d48380', 0.35)).toBe('rgba(69, 212, 131, 0.35)');
    });

    test('computes RGBA from rgb / rgba strings', () => {
      expect(withAlpha('rgb(69, 212, 131)', 0.6)).toBe('rgba(69, 212, 131, 0.6)');
      expect(withAlpha('rgba(42, 60, 53, 0.7)', 0.6)).toBe('rgba(42, 60, 53, 0.6)');
    });

    test('clamps alpha to [0, 1] or treats > 1 as percentage', () => {
      expect(withAlpha('#fff', 15)).toBe('rgba(255, 255, 255, 0.15)');
      expect(withAlpha('#fff', -0.5)).toBe('rgba(255, 255, 255, 0)');
    });
  });

  describe('useTheme hook behavior', () => {
    test('falls back to darkPalette without provider (never throws)', () => {
      const { result } = renderHook(() => useTheme());
      expect(result.current.scheme).toBe('dark');
      expect(result.current.preference).toBe('dark');
      expect(result.current.colors).toEqual(darkPalette);
    });

    test('ThemeProvider loads saved preference from storage', async () => {
      await AsyncStorage.setItem(
        PREFS_KEY,
        JSON.stringify({ theme: 'light', notifications: true, time: '24', behavior: 'seed' }),
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {
        // Wait for AsyncStorage load
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(result.current.preference).toBe('light');
      expect(result.current.scheme).toBe('light');
      expect(result.current.colors).toEqual(lightPalette);
    });

    test('switching preference to light changes scheme and persists', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      expect(result.current.scheme).toBe('dark');

      await act(async () => {
        await result.current.setPreference('light');
      });

      expect(result.current.preference).toBe('light');
      expect(result.current.scheme).toBe('light');
      expect(result.current.colors).toEqual(lightPalette);

      const saved = await AsyncStorage.getItem(PREFS_KEY);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!).theme).toBe('light');
    });

    test('resetPrefs resets theme to dark matching Make', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ThemeProvider>{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });

      await act(async () => {
        await result.current.setPreference('light');
      });
      expect(result.current.scheme).toBe('light');

      await act(async () => {
        await result.current.resetPrefs();
      });

      expect(result.current.preference).toBe('dark');
      expect(result.current.scheme).toBe('dark');
      expect(result.current.colors).toEqual(darkPalette);
    });
  });
});
