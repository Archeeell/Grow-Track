/**
 * TabBar -- pixel-faithful replica of Make bottom nav.
 * Source: FarmDashboard.tsx (Figma Make live bundle + DOM).
 * nav: max-w-[460px] flex justify-around border-t border-border
 *      bg-card/95 px-5 pb-[max(12,safe)] pt-2 backdrop-blur-md
 * Each tab: flex min-h-12 w-20 flex-col items-center justify-center gap-1
 *           text-[10px] font-medium
 * Icon size: 21. Active: text-primary, Inactive: text-muted-foreground.
 */
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeafIcon, SettingsGearIcon } from './settings/SettingsIcons';
import { SproutIcon } from './auth/AuthIcons';
import { colors, fonts } from '../theme';
import type { Route } from '../types';

type TabId = 'dashboard' | 'seeds' | 'settings';

const TABS: { id: TabId; label: string; routeName: Route['name'] }[] = [
  { id: 'dashboard', label: 'Farms', routeName: 'dashboard' },
  { id: 'seeds', label: 'Seeds', routeName: 'seeds' },
  { id: 'settings', label: 'Settings', routeName: 'settings' },
];

type Props = {
  active: Route['name'];
  onNavigate: (route: Route) => void;
};

function TabIcon({ id, color }: { id: TabId; color: string }) {
  if (id === 'dashboard') return <SproutIcon size={21} color={color} />;
  if (id === 'seeds') return <LeafIcon size={21} color={color} />;
  return <SettingsGearIcon size={21} color={color} />;
}

export function TabBar({ active, onNavigate }: Props) {
  const insets = useSafeAreaInsets();
  const pb = Math.max(12, insets.bottom);

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: pb },
        Platform.OS === 'web' ? ({ backdropFilter: 'blur(12px)' } as object) : {},
      ]}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.routeName;
        const color = isActive ? colors.primary : colors.mutedForeground;
        return (
          <Pressable
            key={tab.id}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onNavigate({ name: tab.routeName } as Route)}
          >
            <TabIcon id={tab.id} color={color} />
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              allowFontScaling={false}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(20,33,30,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    minHeight: 48,
    maxWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    color: colors.mutedForeground,
    includeFontPadding: false,
  },
  labelActive: {
    color: colors.primary,
  },
});
