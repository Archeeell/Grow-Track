import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen, type AuthPage } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FarmFormScreen } from './src/screens/FarmFormScreen';
import { SeedManagerScreen } from './src/screens/SeedManagerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import { StoreProvider, useStore } from './src/store';
import { ThemeProvider, useTheme } from './src/theme';
import type { Route } from './src/types';

// Prevent the native splash from auto-hiding before fonts are ready.
ExpoSplashScreen.preventAutoHideAsync();

// Tab screens that animate in/out — farm-form is a Modal, excluded
type TabName = 'dashboard' | 'seeds' | 'settings';
const TAB_NAMES: TabName[] = ['dashboard', 'seeds', 'settings'];

const cssEaseOut = Easing.out(Easing.ease);

/** Fades + slides a screen in when active, fully unmounts it when done. */
function AnimatedScreen({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(active ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(active ? 0 : 8)).current;
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) {
      setMounted(true);
      opacity.setValue(0);
      translateY.setValue(8);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          easing: cssEaseOut,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          easing: cssEaseOut,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setMounted(false);
          translateY.setValue(8);
        }
      });
    }
  }, [active, opacity, translateY]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity, transform: [{ translateY }] }]}
      pointerEvents={active ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

function Root({ onNavigateToAuth }: { onNavigateToAuth: (page: AuthPage) => void }) {
  const { ready } = useStore();
  const { colors } = useTheme();
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  const navigate = (r: Route) => setRoute(r);

  // While store is loading, render blank — SplashScreen covers the screen.
  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const activeTab: TabName = TAB_NAMES.includes(route.name as TabName)
    ? (route.name as TabName)
    : 'dashboard';

  const farmFormRoute = route.name === 'farm-form' ? route : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AnimatedScreen active={activeTab === 'dashboard'}>
        <DashboardScreen
          onAddFarm={() => setRoute({ name: 'farm-form', mode: 'add' })}
          onOpenSeeds={() => setRoute({ name: 'seeds' })}
          onEditFarm={(farmId) => setRoute({ name: 'farm-form', farmId, mode: 'edit' })}
          onReplantFarm={(farmId) => setRoute({ name: 'farm-form', farmId, mode: 'replant' })}
          onSwapFarm={(farmId) => setRoute({ name: 'farm-form', farmId, mode: 'swap' })}
          onNavigate={navigate}
          onNavigateToAuth={onNavigateToAuth}
        />
      </AnimatedScreen>

      <AnimatedScreen active={activeTab === 'seeds'}>
        <SeedManagerScreen
          onBack={() => setRoute({ name: 'dashboard' })}
          onNavigate={navigate}
        />
      </AnimatedScreen>

      <AnimatedScreen active={activeTab === 'settings'}>
        <SettingsScreen onNavigate={navigate} />
      </AnimatedScreen>

      {/* FarmFormScreen is a Modal — always rendered, visible prop controls it */}
      <FarmFormScreen
        visible={farmFormRoute !== null}
        farmId={farmFormRoute?.farmId}
        mode={farmFormRoute?.mode}
        onBack={() => setRoute({ name: 'dashboard' })}
      />
    </View>
  );
}

// ─── AppGate: reads auth state, shows Login or Root ──────────────────────────
function AppGate() {
  const { authState, signOut } = useAuth();
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
        <Root
          onNavigateToAuth={(page) => {
            setAuthPage(page);
            signOut();
          }}
        />
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
