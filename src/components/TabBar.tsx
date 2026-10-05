import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';
import type { Route } from '../types';

type Tab = {
  name: Route['name'];
  label: string;
  icon: string;
};

const TABS: Tab[] = [
  { name: 'dashboard', label: 'Farms', icon: '🌱' },
  { name: 'seeds', label: 'Seeds', icon: '🍃' },
  { name: 'settings', label: 'Settings', icon: '⚙️' },
];

type Props = {
  active: Route['name'];
  onNavigate: (route: Route) => void;
};

export function TabBar({ active, onNavigate }: Props) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = active === tab.name;
        return (
          <Pressable
            key={tab.name}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
            onPress={() => onNavigate({ name: tab.name } as Route)}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
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
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 56,
    paddingBottom: spacing.xs,
    paddingTop: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  icon: {
    fontSize: 20,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  labelActive: {
    color: colors.primary,
  },
});
