/**
 * Auth storage for GrowTrack.
 * Source: Auth.tsx (Figma Make) — growtrack-account key in localStorage/sessionStorage.
 * RN: both mapped to AsyncStorage (no sessionStorage in RN; remember=false = memory only).
 * Key: 'growtrack-account'
 * Password security: compare against SHA-256 hash of previewPassword (never store plaintext).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// ─── Constants (from Auth.tsx source) ────────────────────────────────────────
export const SESSION_KEY = 'growtrack-account';
export const PROFILES_KEY = 'growtrack-preview-profiles';
// previewPassword from Make source: 'GrowTrack123!'
// We store/compare its SHA-256 hash. Salt is constant (preview mode, no real security needed).
const PASSWORD_SALT = 'growtrack-preview-salt-v1';

/** Account shape from Make: { mode: 'guest'|'member', name: string, email?: string } */
export type Account = {
  mode: 'guest' | 'member';
  name: string;
  email?: string;
};

/** Preview profile (registered user) */
export type Profile = {
  name: string;
  email: string;
};

// Demo profile from Make source
export const DEMO_PROFILE: Profile = {
  name: 'Archell',
  email: 'archell@growtrack.app',
};

// ─── Password hashing ─────────────────────────────────────────────────────────

/** Returns SHA-256 hex of (salt + password). */
export async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    PASSWORD_SALT + password
  );
}

/**
 * Hash of the preview password 'GrowTrack123!' — pre-computed and stored as constant.
 * Computed once and hardcoded so we can compare synchronously via stored hash.
 * All preview accounts use this single password (per Make source).
 */
let _previewPasswordHash: string | null = null;

export async function getPreviewPasswordHash(): Promise<string> {
  if (!_previewPasswordHash) {
    _previewPasswordHash = await hashPassword('GrowTrack123!');
  }
  return _previewPasswordHash;
}

// ─── Session ──────────────────────────────────────────────────────────────────

/** In-memory session for remember=false (session only). */
let _memorySession: Account | null = null;

export async function readAccount(): Promise<Account | null> {
  // Check memory first (session-only logins)
  if (_memorySession) return _memorySession;
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Account;
  } catch {
    return null;
  }
}

export async function startSession(account: Account, remember: boolean): Promise<void> {
  if (remember) {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account));
    _memorySession = null;
  } else {
    await AsyncStorage.removeItem(SESSION_KEY);
    _memorySession = account;
  }
}

export async function signOut(): Promise<void> {
  _memorySession = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function readProfiles(): Promise<Profile[]> {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    const extra: Profile[] = raw ? JSON.parse(raw) : [];
    return [DEMO_PROFILE, ...extra];
  } catch {
    return [DEMO_PROFILE];
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  const existing = await readProfiles();
  // Filter out demo profile (always injected) and any duplicate email
  const filtered = existing.filter(
    (p) => p.email !== DEMO_PROFILE.email && p.email !== profile.email
  );
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify([...filtered, profile]));
}

// ─── Farm storage key (mirrors Make's farmStorageKey) ────────────────────────
export function farmStorageKey(account: Account): string {
  if (account.mode === 'guest') return 'growtrack-guest-farms';
  if (account.email === DEMO_PROFILE.email) return 'growtrack-farms';
  return `growtrack-member-farms:${account.email}`;
}
