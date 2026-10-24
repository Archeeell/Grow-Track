/**
 * Settings preferences storage.
 * Key: 'growtrack-prefs' (matches Make source).
 * Shape: { theme, notifications, time, behavior }
 */
export const PREFS_KEY = 'growtrack-prefs';

export type Theme = 'dark' | 'light' | 'system';
export type TimeFormat = '24' | '12';
export type GrowBehavior = 'seed' | 'manual';

export type Prefs = {
  theme: Theme;
  notifications: boolean;
  time: TimeFormat;
  behavior: GrowBehavior;
};

export const DEFAULT_PREFS: Prefs = {
  theme: 'dark',
  notifications: true,
  time: '24',
  behavior: 'seed',
};

function getAsyncStorage(): any {
  try {
    const mod = require('@react-native-async-storage/async-storage');
    return mod.default || mod;
  } catch {
    return null;
  }
}

export async function loadPrefs(): Promise<Prefs> {
  try {
    const storage = getAsyncStorage();
    if (!storage || typeof storage.getItem !== 'function') return DEFAULT_PREFS;
    const raw = await storage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      theme: ['dark', 'light', 'system'].includes(parsed.theme) ? parsed.theme : DEFAULT_PREFS.theme,
      notifications: typeof parsed.notifications === 'boolean' ? parsed.notifications : DEFAULT_PREFS.notifications,
      time: ['24', '12'].includes(parsed.time) ? parsed.time : DEFAULT_PREFS.time,
      behavior: ['seed', 'manual'].includes(parsed.behavior) ? parsed.behavior : DEFAULT_PREFS.behavior,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  try {
    const storage = getAsyncStorage();
    if (storage && typeof storage.setItem === 'function') {
      await storage.setItem(PREFS_KEY, JSON.stringify(prefs));
    }
  } catch {
    // Ignore in tests or environments where AsyncStorage is unavailable
  }
}
