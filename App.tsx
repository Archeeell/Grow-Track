import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen, type AuthPage } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FarmFormScreen } from './src/screens/FarmFormScreen';
import { SeedFormScreen } from './src/screens/SeedFormScreen';
import { SeedManagerScreen } from './src/screens/SeedManagerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import type { Route } from './src/types';

// Prevent the native splash from auto-hiding before fonts are ready.
ExpoSplashScreen.preventAutoHideAsync();

function Root() {
  const { ready } = useStore();
  const { colors } = useTheme();
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  const navigate = (r: Route) => setRoute(r);

  // While store is loading, render blank — SplashScreen covers the screen.
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (route.name === 'farm-form') {
    return (
      <FarmFormScreen
        farmId={route.farmId}
        onBack={() => setRoute({ name: 'dashboard' })}
      />
    );
  }

  if (route.name === 'seed-form') {
    return (
      <SeedFormScreen
        seedId={route.seedId}
        onBack={() => setRoute({ name: 'seeds' })}
      />
    );
  }

  if (route.name === 'seeds') {
    return (
      <SeedManagerScreen
        onBack={() => setRoute({ name: 'dashboard' })}
        onAdd={() => setRoute({ name: 'seed-form' })}
        onEdit={(seedId) => setRoute({ name: 'seed-form', seedId })}
        onNavigate={navigate}
      />
    );
  }

  if (route.name === 'settings') {
    return <SettingsScreen onNavigate={navigate} />;
  }

  return (
    <DashboardScreen
      onAddFarm={() => setRoute({ name: 'farm-form' })}
      onOpenSeeds={() => setRoute({ name: 'seeds' })}
      onEditFarm={(farmId) => setRoute({ name: 'farm-form', farmId })}
      onNavigate={navigate}
    />
  );
}

// ─── AppGate: reads auth state, shows Login or Root ──────────────────────────
function AppGate() {
  const { authState } = useAuth();
  const { scheme, colors } = useTheme();
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const statusBarStyle = scheme === 'dark' ? 'light' : 'dark';

  // While checking persisted session — show blank bg, no flash of Login
  if (authState.status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (authState.status === 'unauthenticated') {
    return (
      <SafeAreaProvider>
        <StatusBar style={statusBarStyle} />
        <AuthScreen
          page={authPage}
          onNavigate={setAuthPage}
          onAuthSuccess={() => {
            // AuthContext updates authState via setAccount → re-render shows Root
          }}
        />
      </SafeAreaProvider>
    );
  }

  // Authenticated — show app
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style={statusBarStyle} />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function AppRoot() {
  const { scheme, colors, isReady } = useTheme();
  const statusBarStyle = scheme === 'dark' ? 'light' : 'dark';

  const [fontsLoaded, fontError] = useFonts({
    'PixelifySans-Regular': require('./assets/fonts/PixelifySans-Regular.ttf'),
    'PixelifySans-Bold': require('./assets/fonts/PixelifySans-Bold.ttf'),
    'PixelifySans-SemiBold': require('./assets/fonts/PixelifySans-SemiBold.ttf'),
    'PixelifySans-Medium': require('./assets/fonts/PixelifySans-Medium.ttf'),
    'DMSans-Regular': require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Bold': require('./assets/fonts/DMSans-Bold.ttf'),
    'DMSans-SemiBold': require('./assets/fonts/DMSans-SemiBold.ttf'),
  });

  // showSplash: true until splash 1100ms timer fires AND fonts loaded
  const [showSplash, setShowSplash] = useState(true);
  const animDoneRef = useRef(false);
  const isFontsReady = Boolean(fontsLoaded || fontError);

  // Hide native splash once fonts are ready
  useEffect(() => {
    if (isFontsReady) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [isFontsReady]);

  // Called by SplashScreen when its 1100ms timer fires
  const handleSplashFinish = useCallback(() => {
    animDoneRef.current = true;
    if (isFontsReady) {
      setShowSplash(false);
    }
  }, [isFontsReady]);

  // If fonts finish after animation timer, dismiss then
  useEffect(() => {
    if (isFontsReady && animDoneRef.current) {
      setShowSplash(false);
    }
  }, [isFontsReady]);

  // Safety fallback: never allow splash to hang more than 2.5 seconds
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      setShowSplash(false);
      ExpoSplashScreen.hideAsync().catch(() => {});
    }, 2500);
    return () => clearTimeout(fallbackTimer);
  }, []);

  // Fonts not yet loaded or prefs not ready — show splash
  if (!isReady || (!isFontsReady && showSplash)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SplashScreen onFinish={handleSplashFinish} />
      </View>
    );
  }

  // Fonts loaded, splash animation still running its 1100ms
  if (showSplash) {
    return (
      <SafeAreaProvider>
        <StatusBar style={statusBarStyle} />
        <SplashScreen onFinish={handleSplashFinish} />
      </SafeAreaProvider>
    );
  }

  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  );
}
