import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabBar } from '../components/TabBar';
import { useStore } from '../store';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';
import { getSeedIcon, getSeedItemImage } from '../data/seedIcons';
import { formatGrowTime } from '../utils/time';
import type { Route } from '../types';

type Props = {
  onBack: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onNavigate: (route: Route) => void;
};

type FilterTab = 'all' | 'reharvest' | 'onetime';

const useStyles = makeStyles(({ colors }) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: colors.primaryForeground,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    height: 44,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    fontFamily: fonts.body,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 8,
    marginBottom: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
  },
  filterTabText: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
    gap: spacing.sm,
  },
  seedCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  seedIconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.60),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  seedItemImg: {
    width: 32,
    height: 32,
  },
  seedEmoji: {
    fontSize: 24,
  },
  seedInfo: {
    flex: 1,
    gap: 2,
  },
  seedName: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  seedMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  reharvest: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: fonts.bodySemiBold,
  },
  seedRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    backgroundColor: withAlpha(colors.accentBlue, 0.12),
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.bodyBold,
  },
  badgeOnetime: {
    backgroundColor: withAlpha(colors.mutedForeground, 0.12),
  },
  badgeOnetimeText: {
    color: colors.mutedForeground,
  },
  editLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 15,
    fontFamily: fonts.body,
  },
  footerNote: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
    fontFamily: fonts.body,
    marginTop: 4,
  },
  restoreBtn: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtnText: {
    color: colors.mutedForeground,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
}));

export function SeedManagerScreen({ onBack, onAdd, onEdit, onNavigate }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { seeds, restoreStarterSeeds } = useStore();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...seeds];
    if (filter === 'reharvest') {
      list = list.filter((s) => s.reharvestIntervalMinutes != null);
    } else if (filter === 'onetime') {
      list = list.filter((s) => s.reharvestIntervalMinutes == null);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [seeds, filter, search]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Seeds</Text>
          <Text style={styles.subtitle}>Your GrowTrack seed library</Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Add seed"
        >
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search seeds…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsRow}>
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'reharvest', label: 'Re-harvest' },
            { id: 'onetime', label: 'One-time' },
          ] as { id: FilterTab; label: string }[]
        ).map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.filterTab, filter === tab.id && styles.filterTabActive]}
            onPress={() => setFilter(tab.id)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab.id && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Seed list */}
      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map((seed) => {
          const img = getSeedItemImage(seed.id);
          const emoji = getSeedIcon(seed.id);
          return (
            <Pressable
              key={seed.id}
              accessibilityRole="button"
              onPress={() => onEdit(seed.id)}
              style={styles.seedCard}
            >
              <View style={styles.seedIconBox}>
                {img ? (
                  <Image source={img} style={styles.seedItemImg} resizeMode="contain" />
                ) : (
                  <Text style={styles.seedEmoji}>{emoji}</Text>
                )}
              </View>
              <View style={styles.seedInfo}>
                <Text style={styles.seedName}>{seed.name}</Text>
                <Text style={styles.seedMeta}>
                  {formatGrowTime(seed.growTimeMinutes)}
                </Text>
                {seed.reharvestIntervalMinutes != null ? (
                  <Text style={styles.reharvest}>↻ Re-harvest</Text>
                ) : null}
              </View>
              <View style={styles.seedRight}>
                {seed.reharvestIntervalMinutes != null ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Re-harvest</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeOnetime]}>
                    <Text style={[styles.badgeText, styles.badgeOnetimeText]}>
                      One-time
                    </Text>
                  </View>
                )}
                <Text style={styles.editLabel}>Edit</Text>
              </View>
            </Pressable>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No seeds found</Text>
          </View>
        )}

        <Text style={styles.footerNote}>
          Starter seed times may change in-game.
        </Text>

        <Pressable
          style={styles.restoreBtn}
          onPress={() => void restoreStarterSeeds()}
          accessibilityRole="button"
        >
          <Text style={styles.restoreBtnText}>↺ Restore defaults</Text>
        </Pressable>
      </ScrollView>

      <TabBar active="seeds" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}
