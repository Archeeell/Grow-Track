import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FarmCard } from '../components/FarmCard';
import { TabBar } from '../components/TabBar';
import { useNow } from '../hooks/useNow';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import type { Farm, HarvestStatus, Route, Seed } from '../types';
import { confirmAction } from '../utils/confirm';
import {
  addMinutes,
  getStatus,
  minutesToDHM,
  parseNonNegInt,
} from '../utils/time';

const rank: Record<HarvestStatus, number> = {
  ready: 0,
  harvested: 1,
  growing: 2,
};

type Props = {
  onAddFarm: () => void;
  onOpenSeeds: () => void;
  onEditFarm: (id: string) => void;
  onNavigate: (route: Route) => void;
};

// ─── Swap / Replant modal state ───────────────────────────────────────────────
type ActionModal =
  | { type: 'swap'; farm: Farm; seed: Seed | undefined }
  | { type: 'replant'; farm: Farm; seed: Seed | undefined };

type FilterStatus = 'all' | HarvestStatus;
type SortMode = 'recommended' | 'name' | 'time';

function getHour(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function StatusFilterBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterBtnActive]}
    >
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function DashboardScreen({
  onAddFarm,
  onOpenSeeds,
  onEditFarm,
  onNavigate,
}: Props) {
  const { farms, seeds, resetFarm, harvestFarm, swapFarm, replantFarm, updateFarm } =
    useStore();
  const now = useNow(1000);

  const [modal, setModal] = useState<ActionModal | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortMode] = useState<SortMode>('recommended');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fields inside the modal
  const [modalName, setModalName] = useState('');
  const [modalDays, setModalDays] = useState('');
  const [modalHours, setModalHours] = useState('');
  const [modalMinutes, setModalMinutes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    let list = [...farms];

    // Filter by status
    if (filterStatus !== 'all') {
      list = list.filter(
        (f) => getStatus(f.readyAt, now, f.harvestedAt) === filterStatus
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.seedName.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      // Pinned farms first
      if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      }
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortMode === 'time') {
        return new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime();
      }
      // recommended: status rank, then time
      const sa = getStatus(a.readyAt, now, a.harvestedAt);
      const sb = getStatus(b.readyAt, now, b.harvestedAt);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      return new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime();
    });

    return list;
  }, [farms, now, filterStatus, searchQuery, sortMode]);

  const totalFarms = farms.length;
  const readyCount = farms.filter(
    (f) => getStatus(f.readyAt, now, f.harvestedAt) === 'ready'
  ).length;
  const growingCount = farms.filter(
    (f) => getStatus(f.readyAt, now, f.harvestedAt) === 'growing'
  ).length;

  const confirmReset = (farm: Farm) => {
    confirmAction(
      'Reset timer?',
      `Start a new cycle for "${farm.name}" as if just planted.`,
      'Reset',
      () => void resetFarm(farm.id)
    );
  };

  const openSwap = (farm: Farm) => {
    const seed = farm.seedId
      ? seeds.find((s) => s.id === farm.seedId)
      : undefined;
    const defaultMinutes = seed?.growTimeMinutes ?? 0;
    const dhm = minutesToDHM(defaultMinutes);
    setModalName('');
    setModalDays(dhm.days > 0 ? String(dhm.days) : '');
    setModalHours(dhm.hours > 0 ? String(dhm.hours) : '');
    setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : '');
    setModalError(null);
    setModal({ type: 'swap', farm, seed });
  };

  const openReplant = (farm: Farm) => {
    const seed = farm.seedId
      ? seeds.find((s) => s.id === farm.seedId)
      : undefined;
    const defaultMinutes = seed?.growTimeMinutes ?? 0;
    const dhm = minutesToDHM(defaultMinutes);
    setModalName(farm.name);
    setModalDays(dhm.days > 0 ? String(dhm.days) : '');
    setModalHours(dhm.hours > 0 ? String(dhm.hours) : '');
    setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : '');
    setModalError(null);
    setModal({ type: 'replant', farm, seed });
  };

  const closeModal = () => setModal(null);

  const totalModalMinutes = useMemo(() => {
    const d = parseNonNegInt(modalDays || '0') ?? 0;
    const h = parseNonNegInt(modalHours || '0') ?? 0;
    const m = parseNonNegInt(modalMinutes || '0') ?? 0;
    return d * 24 * 60 + h * 60 + m;
  }, [modalDays, modalHours, modalMinutes]);

  const modalPreviewReady = useMemo(() => {
    if (totalModalMinutes < 1) return null;
    return addMinutes(new Date().toISOString(), totalModalMinutes);
  }, [totalModalMinutes]);

  const confirmModal = async () => {
    if (!modal) return;
    const trimmedName = modalName.trim();
    if (!trimmedName) {
      setModalError('Please enter a name for this farm.');
      return;
    }
    if (totalModalMinutes < 1) {
      setModalError('Enter a grow duration of at least 1 minute.');
      return;
    }
    closeModal();
    if (modal.type === 'swap') {
      await swapFarm(modal.farm.id, trimmedName, totalModalMinutes);
    } else {
      await replantFarm(modal.farm.id, trimmedName, totalModalMinutes);
    }
  };

  const confirmHarvest = (farm: Farm) => {
    confirmAction(
      'Mark as harvested?',
      `"${farm.name}" will be marked as harvested and waiting to be replanted.`,
      'Harvested',
      () => void harvestFarm(farm.id)
    );
  };

  const togglePin = (farm: Farm) => {
    void updateFarm(farm.id, { pinned: !farm.pinned });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🌱</Text>
            <Text style={styles.logoText}>
              GrowTrack<Text style={styles.logoDot}>.</Text>
            </Text>
          </View>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => onNavigate({ name: 'settings' })}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>A little care. A better harvest.</Text>
        <Text style={styles.greeting}>Good {getHour()}, Guest</Text>
        <Text style={styles.farmSummary}>
          {totalFarms === 0
            ? 'No farms yet'
            : `${totalFarms} farm${totalFarms !== 1 ? 's' : ''} · ${readyCount} ready to harvest`}
        </Text>
      </View>

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <Pressable
          style={styles.statCell}
          onPress={() =>
            setFilterStatus(filterStatus === 'all' ? 'all' : 'all')
          }
        >
          <Text style={styles.statIcon}>🌱</Text>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statNum}>{totalFarms}</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          style={styles.statCell}
          onPress={() =>
            setFilterStatus((p) => (p === 'ready' ? 'all' : 'ready'))
          }
        >
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statLabel}>Ready</Text>
          <Text style={[styles.statNum, { color: colors.primary }]}>
            {readyCount}
          </Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          style={styles.statCell}
          onPress={() =>
            setFilterStatus((p) => (p === 'growing' ? 'all' : 'growing'))
          }
        >
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statLabel}>Growing</Text>
          <Text style={[styles.statNum, { color: colors.growing }]}>
            {growingCount}
          </Text>
        </Pressable>
      </View>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          <StatusFilterBtn
            label="All"
            active={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
          />
          <StatusFilterBtn
            label="Growing"
            active={filterStatus === 'growing'}
            onPress={() => setFilterStatus('growing')}
          />
          <StatusFilterBtn
            label="Ready"
            active={filterStatus === 'ready'}
            onPress={() => setFilterStatus('ready')}
          />
        </View>
        <View style={styles.toolbarRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              setShowSearch((p) => !p);
              if (showSearch) setSearchQuery('');
            }}
            accessibilityRole="button"
            accessibilityLabel="Search"
          >
            <Text style={styles.iconBtnText}>🔍</Text>
          </Pressable>
          <Pressable
            style={[styles.iconBtn, styles.addBtn]}
            onPress={onAddFarm}
            accessibilityRole="button"
            accessibilityLabel="Add farm"
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Search bar ────────────────────────────────────────────────────── */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search farms…"
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* ── Farm List ─────────────────────────────────────────────────────── */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>No farms yet</Text>
            <Text style={styles.emptyBody}>
              Add your first farm and start tracking its harvest time.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={onAddFarm}>
              <Text style={styles.emptyBtnText}>+ Add your first farm</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <FarmCard
            farm={item}
            now={now}
            status={getStatus(item.readyAt, now, item.harvestedAt)}
            onPress={() => onEditFarm(item.id)}
            onReset={() => confirmReset(item)}
            onSwap={() => openSwap(item)}
            onHarvested={() => confirmHarvest(item)}
            onReplanted={() => openReplant(item)}
            onPin={() => togglePin(item)}
          />
        )}
      />

      {/* ── Bottom Tab Bar ───────────────────────────────────────────────── */}
      <TabBar active="dashboard" onNavigate={onNavigate} />

      {/* ── Swap / Replant Modal ─────────────────────────────────────────── */}
      <Modal
        visible={modal !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.sheet}>
            {/* Drag handle */}
            <View style={styles.handle} />
            {modal && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>
                    {modal.type === 'swap' ? '↔ Swap Farm' : '🌱 Replant Farm'}
                  </Text>
                  <Pressable onPress={closeModal} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {/* Seed type */}
                <View style={styles.seedPill}>
                  <Text style={styles.seedPillLabel}>Seed type</Text>
                  <Text style={styles.seedPillValue}>
                    {modal.seed?.name ?? 'Custom / manual'}
                  </Text>
                </View>

                {modal.type === 'swap' ? (
                  <Text style={styles.sheetHint}>
                    Enter the name of the new farm. The seed type stays the same.
                  </Text>
                ) : (
                  <Text style={styles.sheetHint}>
                    Confirm the farm name and adjust the grow time if needed.
                  </Text>
                )}

                {/* Farm name */}
                <Text style={styles.fieldLabel}>Farm name</Text>
                <TextInput
                  style={styles.input}
                  value={modalName}
                  onChangeText={(v) => {
                    setModalName(v);
                    setModalError(null);
                  }}
                  placeholder={
                    modal.type === 'swap'
                      ? 'World ABCXYZ — Lower Left'
                      : modal.farm.name
                  }
                  placeholderTextColor={colors.mutedForeground}
                />

                {/* Grow duration */}
                <Text style={styles.fieldLabel}>Grow duration</Text>
                <View style={styles.dhmRow}>
                  {[
                    { label: 'Days', value: modalDays, set: setModalDays },
                    { label: 'Hours', value: modalHours, set: setModalHours },
                    {
                      label: 'Minutes',
                      value: modalMinutes,
                      set: setModalMinutes,
                    },
                  ].map(({ label, value, set }) => (
                    <View key={label} style={styles.dhmCell}>
                      <Text style={styles.dhmLabel}>{label}</Text>
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={(v) => {
                          set(v);
                          setModalError(null);
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                  ))}
                </View>

                {modalPreviewReady ? (
                  <View style={styles.previewCard}>
                    <Text style={styles.previewLabel}>⏱ ESTIMATED HARVEST</Text>
                    <Text style={styles.previewTime}>
                      {new Date(modalPreviewReady).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {modal.seed && (
                      <Text style={styles.previewSeed}>{modal.seed.name}</Text>
                    )}
                  </View>
                ) : null}

                {modalError ? (
                  <Text style={styles.modalError}>{modalError}</Text>
                ) : null}

                <View style={styles.sheetActions}>
                  <Pressable
                    style={[styles.sheetBtn, styles.sheetBtnSecondary]}
                    onPress={closeModal}
                  >
                    <Text style={styles.sheetBtnSecondaryText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                    onPress={() => void confirmModal()}
                  >
                    <Text style={styles.sheetBtnPrimaryText}>
                      {modal.type === 'swap' ? 'Swap' : 'Replant'}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  headerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoEmoji: {
    fontSize: 22,
  },
  logoText: {
    color: colors.foreground,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoDot: {
    color: colors.primary,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 6,
  },
  greeting: {
    color: colors.foreground,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  farmSummary: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
  statIcon: {
    fontSize: 18,
  },
  statLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
  },
  statNum: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },

  // ── Toolbar ──────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(69,212,131,0.15)',
    borderColor: colors.primary,
  },
  filterBtnText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: colors.primary,
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontSize: 16,
  },
  addBtn: {
    width: 'auto',
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  addBtnText: {
    color: '#0B1510',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },

  // ── Farm List ────────────────────────────────────────────────────────────
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
  },

  // ── Empty ────────────────────────────────────────────────────────────────
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#0B1510',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Modal / Sheet ─────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetHint: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  seedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  seedPillLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  seedPillValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dhmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dhmCell: {
    flex: 1,
    gap: 4,
  },
  dhmLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: 'rgba(76,168,255,0.05)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  previewLabel: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  previewTime: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  previewSeed: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  modalError: {
    color: colors.destruct,
    fontSize: 13,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sheetBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBtnPrimary: {
    backgroundColor: colors.primary,
  },
  sheetBtnSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetBtnPrimaryText: {
    color: '#0B1510',
    fontWeight: '700',
    fontSize: 15,
  },
  sheetBtnSecondaryText: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 15,
  },
});
