/**
 * AuthContext — provides current session to the whole app.
 * Loaded once at startup (after splash). Screens use useAuth() to read/mutate session.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  readAccount,
  signOut as storageSignOut,
  startSession,
  type Account,
} from './authStorage';

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; account: Account };

type AuthContextValue = {
  authState: AuthState;
  /** Call after successful login/register/guest. */
  setAccount: (account: Account, remember: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  // Load persisted session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const account = await readAccount();
      if (cancelled) return;
      if (account) {
        setAuthState({ status: 'authenticated', account });
      } else {
        setAuthState({ status: 'unauthenticated' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setAccount = useCallback(async (account: Account, remember: boolean) => {
    await startSession(account, remember);
    setAuthState({ status: 'authenticated', account });
  }, []);

  const signOut = useCallback(async () => {
    await storageSignOut();
    setAuthState({ status: 'unauthenticated' });
  }, []);

  return (
    <AuthContext.Provider value={{ authState, setAccount, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
