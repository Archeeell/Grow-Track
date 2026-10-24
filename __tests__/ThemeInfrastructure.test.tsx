import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { Appearance } from 'react-native';

const fs = require('fs');
const path = require('path');
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

    test('Appearance.setColorScheme is synchronized with preference', async () => {
      const setColorSchemeSpy = jest.spyOn(Appearance, 'setColorScheme');

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
      expect(setColorSchemeSpy).toHaveBeenCalledWith('light');

      await act(async () => {
        await result.current.setPreference('system');
      });
      expect(setColorSchemeSpy).toHaveBeenCalledWith(null);

      setColorSchemeSpy.mockRestore();
    });
  });

  describe('Static colors & hex guard check', () => {
    function getAllSrcFiles(dir: string, fileList: string[] = []): string[] {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          getAllSrcFiles(filePath, fileList);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          fileList.push(filePath);
        }
      }
      return fileList;
    }

    test('No files in src/ import static colors (except src/theme.ts legacy re-export)', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const allFiles = getAllSrcFiles(srcDir);
      const violations: string[] = [];

      for (const file of allFiles) {
        const rel = path.relative(srcDir, file).replace(/\\/g, '/');
        if (rel === 'theme.ts') continue;

        const content = fs.readFileSync(file, 'utf8');
        // Check for import { colors } or similar static imports
        if (/import\s+{[^}]*\bcolors\b[^}]*}\s+from/.test(content)) {
          violations.push(rel);
        }
      }

      expect(violations).toEqual([]);
    });

    test('All hex and rgba literals in src/ match registered theme-independent constants', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const allFiles = getAllSrcFiles(srcDir);
      const violations: { file: string; line: number; match: string }[] = [];

      const allowedFiles = new Set(['theme/palettes.ts', 'theme.ts', 'theme/withAlpha.ts']);

      // Whitelisted theme-independent literals (brand colors, overlay backdrops, constant white/shadow)
      const allowedPatterns = [
        /#4285F4/i, // Google Blue
        /#34A853/i, // Google Green
        /#FBBC05/i, // Google Yellow
        /#EA4335/i, // Google Red
        /#F2C94C/i, // Active Star color
        /#3DDC84/i, // Android Notification light color
        /#ffffff/i, // White toggle knob / thumb
        /#000/i,    // Shadow color
        /#21110e/i, // Destructive text color
        /#0d1715/i, // Dark theme swatch preview
        /#edf2e8/i, // Light theme swatch preview
        /#555f5c/i, // System theme swatch preview
        /#e96a6a/i, // Password strength level 1
        /#e6c16a/i, // Password strength level 2
        /#4ca8ff/i, // Password strength level 3 / splash comment
        /#45d483/i, // Password strength level 4
        /rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.65\s*\)/, // Backdrop overlay
        /rgba\(\s*129\s*,\s*146\s*,\s*135\s*,\s*0\.[23]\s*\)/, // Theme swatch container borders
      ];

      for (const file of allFiles) {
        const rel = path.relative(srcDir, file).replace(/\\/g, '/');
        if (allowedFiles.has(rel)) continue;

        const lines = fs.readFileSync(file, 'utf8').split('\n');
        lines.forEach((lineText: string, idx: number) => {
          // match hex or rgba
          const matches = lineText.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
          if (matches) {
            for (const m of matches) {
              const isAllowed = allowedPatterns.some((pattern) => pattern.test(m));
              if (!isAllowed) {
                violations.push({ file: rel, line: idx + 1, match: m });
              }
            }
          }
        });
      }

      expect(violations).toEqual([]);
    });
  });
});
