import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { FarmFormScreen } from './src/screens/FarmFormScreen';
import { SeedFormScreen } from './src/screens/SeedFormScreen';
import { SeedManagerScreen } from './src/screens/SeedManagerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';
import type { Route } from './src/types';

function Root() {
  const { ready } = useStore();
  const [route, setRoute] = useState<Route>({ name: 'dashboard' });

  const navigate = (r: Route) => setRoute(r);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
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

export default function App() {
  const [fontsLoaded] = useFonts({
    'PixelifySans-Regular': require('./assets/fonts/PixelifySans-Regular.ttf'),
    'PixelifySans-Bold': require('./assets/fonts/PixelifySans-Bold.ttf'),
    'PixelifySans-SemiBold': require('./assets/fonts/PixelifySans-SemiBold.ttf'),
    'PixelifySans-Medium': require('./assets/fonts/PixelifySans-Medium.ttf'),
    'DMSans-Regular': require('./assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Bold': require('./assets/fonts/DMSans-Bold.ttf'),
    'DMSans-SemiBold': require('./assets/fonts/DMSans-SemiBold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
