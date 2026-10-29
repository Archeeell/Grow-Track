import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
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
import { PlusIcon } from '../components/dashboard/DashboardIcons';
import { InfoIcon } from '../components/settings/SettingsIcons';
import { SeedFormSheet } from './SeedFormSheet';
import type { Route } from '../types';

type Props = {
  onBack: () => void;
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
  editBtn: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    color: colors.mutedForeground,
    fontSize: 14,
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

export function SeedManagerScreen({ onBack, onNavigate }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { seeds, restoreStarterSeeds } = useStore();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingSeedId, setEditingSeedId] = useState<string | undefined>();

  const openAddSheet = () => {
    setEditingSeedId(undefined);
    setSheetVisible(true);
  };

  const openEditSheet = (seedId: string) => {
    setEditingSeedId(seedId);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setEditingSeedId(undefined);
  };

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
          onPress={openAddSheet}
          accessibilityRole="button"
          accessibilityLabel="Add seed"
        >
          <PlusIcon size={20} color={colors.primaryForeground} />
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
            <View
              key={seed.id}
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
              <Pressable
                style={styles.editBtn}
                onPress={() => openEditSheet(seed.id)}
                accessibilityRole="button"
                accessibilityLabel="Edit seed"
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No seeds found</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
          <InfoIcon size={16} color={colors.accentBlue} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: fonts.body }}>
              Starter seed times may change in-game.
            </Text>
            <Pressable
              onPress={() => void restoreStarterSeeds()}
              accessibilityRole="button"
              style={{ marginTop: 4, alignSelf: 'flex-start' }}
            >
              <Text style={{ fontSize: 12, color: colors.accentBlue, fontFamily: fonts.bodySemiBold }}>
                Restore defaults
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <TabBar active="seeds" onNavigate={onNavigate} />

      <SeedFormSheet
        visible={sheetVisible}
        seedId={editingSeedId}
        onClose={closeSheet}
      />
    </SafeAreaView>
  );
}
