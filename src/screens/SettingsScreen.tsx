import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { colors, radius, spacing } from '../theme';
import type { Route } from '../types';

type Props = {
  onNavigate: (route: Route) => void;
};

export function SettingsScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>GrowTrack preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* App info card */}
        <View style={styles.card}>
          <View style={styles.appRow}>
            <Text style={styles.appEmoji}>🌱</Text>
            <View>
              <Text style={styles.appName}>
                GrowTrack<Text style={styles.appDot}>.</Text>
              </Text>
              <Text style={styles.appVersion}>Growtopia farm timer</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          <Text style={styles.cardBody}>
            GrowTrack helps you track Growtopia farm harvest windows. Add farms,
            pick seed types, and get notified when it's harvest time.
          </Text>
        </View>

        {/* Seed library link */}
        <Pressable
          style={styles.menuItem}
          onPress={() => onNavigate({ name: 'seeds' })}
          accessibilityRole="button"
        >
          <Text style={styles.menuItemIcon}>🍃</Text>
          <Text style={styles.menuItemLabel}>Seed library</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={() => onNavigate({ name: 'dashboard' })}
          accessibilityRole="button"
        >
          <Text style={styles.menuItemIcon}>🌱</Text>
          <Text style={styles.menuItemLabel}>My farms</Text>
          <Text style={styles.menuItemArrow}>→</Text>
        </Pressable>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            ℹ️ Grow times use Growtopia's rarity formula and may be outdated.
            Edit the seed table if a time doesn't match in-game.
          </Text>
        </View>
      </ScrollView>

      <TabBar active="settings" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  appEmoji: {
    fontSize: 36,
  },
  appName: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  appDot: {
    color: colors.primary,
  },
  appVersion: {
    color: colors.mutedForeground,
    fontSize: 13,
  },
  cardTitle: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 15,
  },
  cardBody: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 19,
  },
  menuItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemIcon: {
    fontSize: 20,
  },
  menuItemLabel: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  menuItemArrow: {
    color: colors.mutedForeground,
    fontSize: 16,
  },
  notice: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  noticeText: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
  },
});
