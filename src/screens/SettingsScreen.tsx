import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { colors, fonts, radius, spacing } from '../theme';
import type { Route } from '../types';

type Props = {
  onNavigate: (route: Route) => void;
};

function SectionHeader({ label }: { label: string }) {
  return (
    <Text style={styles.sectionHeader}>{label}</Text>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Text style={styles.rowArrow}>›</Text> : null}
    </Pressable>
  );
}

export function SettingsScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Make GrowTrack work for you.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <SectionHeader label="FARM TRACKING" />
        <View style={styles.section}>
          <SettingsRow
            icon="🌱"
            label="My farms"
            onPress={() => onNavigate({ name: 'dashboard' })}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="🍃"
            label="Seed library"
            onPress={() => onNavigate({ name: 'seeds' })}
          />
        </View>

        <SectionHeader label="ABOUT" />
        <View style={styles.section}>
          <View style={styles.appRow}>
            <Text style={styles.appEmoji}>🌱</Text>
            <View>
              <Text style={styles.appName}>
                GrowTrack<Text style={styles.appDot}>.</Text>
              </Text>
              <Text style={styles.appVersion}>Growtopia farm timer</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowIcon}>🔖</Text>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        <SectionHeader label="DATA" />
        <View style={styles.section}>
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ℹ️ Grow times use Growtopia's rarity formula and may be outdated.
              Edit the seed table if a time doesn't match in-game.
            </Text>
          </View>
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
    paddingBottom: 4,
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '600',
    fontFamily: fonts.pixel,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  scroll: {
    paddingBottom: 24,
  },
  sectionHeader: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.2,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: 8,
  },
  section: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  rowIcon: {
    fontSize: 18,
    color: colors.mutedForeground,
  },
  rowLabel: {
    color: colors.foreground,
    fontSize: 14,
    flex: 1,
    fontFamily: fonts.body,
  },
  rowValue: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  rowArrow: {
    color: colors.mutedForeground,
    fontSize: 20,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border + '99',
    marginLeft: spacing.lg + 18 + 12,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  appEmoji: {
    fontSize: 36,
  },
  appName: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '600',
    fontFamily: fonts.pixel,
  },
  appDot: {
    color: colors.primary,
  },
  appVersion: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  notice: {
    margin: spacing.lg,
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
    fontFamily: fonts.body,
  },
});
