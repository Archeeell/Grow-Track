import { useMemo, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FarmCard } from "../components/FarmCard";
import { TabBar } from "../components/TabBar";
import { useNow } from "../hooks/useNow";
import { useStore } from "../store";
import { colors, fonts, radius, spacing } from "../theme";
import type { Farm, HarvestStatus, Route, Seed } from "../types";
import { confirmAction } from "../utils/confirm";
import {
  addMinutes,
  getStatus,
  minutesToDHM,
  parseNonNegInt,
} from "../utils/time";

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
  | { type: "swap"; farm: Farm; seed: Seed | undefined }
  | { type: "replant"; farm: Farm; seed: Seed | undefined };

type FilterStatus = "all" | HarvestStatus | "pinned";
type SortMode = "recommended" | "name" | "time";

function getHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function padStat(n: number): string {
  return n.toString().padStart(2, "0");
}

const SECTION_LABELS: Record<HarvestStatus, string> = {
  ready: "READY",
  growing: "GROWING",
  harvested: "HARVESTED",
};

type ListItem =
  | { type: "section"; status: HarvestStatus; count: number }
  | { type: "farm"; farm: Farm; status: HarvestStatus };

export function DashboardScreen({
  onAddFarm,
  onOpenSeeds,
  onEditFarm,
  onNavigate,
}: Props) {
  const {
    farms,
    seeds,
    resetFarm,
    harvestFarm,
    swapFarm,
    replantFarm,
    updateFarm,
  } = useStore();
  const now = useNow(1000);

  const [modal, setModal] = useState<ActionModal | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fields inside the modal
  const [modalName, setModalName] = useState("");
  const [modalDays, setModalDays] = useState("");
  const [modalHours, setModalHours] = useState("");
  const [modalMinutes, setModalMinutes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    let list = [...farms];

    // Filter by status / pinned
    if (filterStatus === "pinned") {
      list = list.filter((f) => f.pinned);
    } else if (filterStatus !== "all") {
      list = list.filter(
        (f) => getStatus(f.readyAt, now, f.harvestedAt) === filterStatus,
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.seedName.toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      // Pinned farms first
      if ((b.pinned ? 1 : 0) !== (a.pinned ? 1 : 0)) {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      }
      const sa = getStatus(a.readyAt, now, a.harvestedAt);
      const sb = getStatus(b.readyAt, now, b.harvestedAt);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      return new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime();
    });

    return list;
  }, [farms, now, filterStatus, searchQuery]);

  // Build flat list with section headers
  const listData = useMemo((): ListItem[] => {
    const groups: Partial<Record<HarvestStatus, Farm[]>> = {};
    for (const farm of sorted) {
      const s = getStatus(farm.readyAt, now, farm.harvestedAt);
      if (!groups[s]) groups[s] = [];
      groups[s]!.push(farm);
    }

    const order: HarvestStatus[] = ["ready", "growing", "harvested"];
    const items: ListItem[] = [];
    for (const status of order) {
      const groupFarms = groups[status];
      if (!groupFarms || groupFarms.length === 0) continue;
      items.push({ type: "section", status, count: groupFarms.length });
      for (const farm of groupFarms) {
        items.push({ type: "farm", farm, status });
      }
    }
    return items;
  }, [sorted, now]);

  const totalFarms = farms.length;
  const readyCount = farms.filter(
    (f) => getStatus(f.readyAt, now, f.harvestedAt) === "ready",
  ).length;
  const growingCount = farms.filter(
    (f) => getStatus(f.readyAt, now, f.harvestedAt) === "growing",
  ).length;

  const confirmReset = (farm: Farm) => {
    confirmAction(
      "Reset timer?",
      `Start a new cycle for "${farm.name}" as if just planted.`,
      "Reset",
      () => void resetFarm(farm.id),
    );
  };

  const openSwap = (farm: Farm) => {
    const seed = farm.seedId
      ? seeds.find((s) => s.id === farm.seedId)
      : undefined;
    const defaultMinutes = seed?.growTimeMinutes ?? 0;
    const dhm = minutesToDHM(defaultMinutes);
    setModalName("");
    setModalDays(dhm.days > 0 ? String(dhm.days) : "");
    setModalHours(dhm.hours > 0 ? String(dhm.hours) : "");
    setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
    setModalError(null);
    setModal({ type: "swap", farm, seed });
  };

  const openReplant = (farm: Farm) => {
    const seed = farm.seedId
      ? seeds.find((s) => s.id === farm.seedId)
      : undefined;
    const defaultMinutes = seed?.growTimeMinutes ?? 0;
    const dhm = minutesToDHM(defaultMinutes);
    setModalName(farm.name);
    setModalDays(dhm.days > 0 ? String(dhm.days) : "");
    setModalHours(dhm.hours > 0 ? String(dhm.hours) : "");
    setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
    setModalError(null);
    setModal({ type: "replant", farm, seed });
  };

  const closeModal = () => setModal(null);

  const totalModalMinutes = useMemo(() => {
    const d = parseNonNegInt(modalDays || "0") ?? 0;
    const h = parseNonNegInt(modalHours || "0") ?? 0;
    const m = parseNonNegInt(modalMinutes || "0") ?? 0;
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
      setModalError("Please enter a name for this farm.");
      return;
    }
    if (totalModalMinutes < 1) {
      setModalError("Enter a grow duration of at least 1 minute.");
      return;
    }
    closeModal();
    if (modal.type === "swap") {
      await swapFarm(modal.farm.id, trimmedName, totalModalMinutes);
    } else {
      await replantFarm(modal.farm.id, trimmedName, totalModalMinutes);
    }
  };

  const confirmHarvest = (farm: Farm) => {
    confirmAction(
      "Mark as harvested?",
      `"${farm.name}" will be marked as harvested and waiting to be replanted.`,
      "Harvested",
      () => void harvestFarm(farm.id),
    );
  };

  const togglePin = (farm: Farm) => {
    void updateFarm(farm.id, { pinned: !farm.pinned });
  };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "section") {
      return (
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionLabel, { color: STATUS_COLORS[item.status] }]}
          >
            {SECTION_LABELS[item.status]}
          </Text>
          <Text style={styles.sectionCount}>· {item.count}</Text>
        </View>
      );
    }
    return (
      <FarmCard
        farm={item.farm}
        now={now}
        status={item.status}
        onPress={() => onEditFarm(item.farm.id)}
        onReset={() => confirmReset(item.farm)}
        onSwap={() => openSwap(item.farm)}
        onHarvested={() => confirmHarvest(item.farm)}
        onReplanted={() => openReplant(item.farm)}
        onPin={() => togglePin(item.farm)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🌱</Text>
            <Text style={[styles.logoText, { color: "#45D483" }]}>
              GrowTrack<Text style={styles.logoDot}>.</Text>
            </Text>
          </View>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => onNavigate({ name: "settings" })}
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
            ? "No farms yet"
            : `${totalFarms} farm${totalFarms !== 1 ? "s" : ""} · `}
          {totalFarms > 0 && (
            <Text style={{ color: colors.primary }}>
              {readyCount} ready to harvest
            </Text>
          )}
        </Text>
      </View>

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <Pressable
          style={styles.statCell}
          onPress={() => setFilterStatus("all")}
        >
          <View style={styles.statLabelRow}>
            <Text style={[styles.statIcon, { color: colors.accentBlue }]}>
              🌱
            </Text>
            <Text style={[styles.statCellLabel, { color: colors.accentBlue }]}>
              Total farms
            </Text>
          </View>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {padStat(totalFarms)}
          </Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          style={styles.statCell}
          onPress={() =>
            setFilterStatus((p) => (p === "ready" ? "all" : "ready"))
          }
        >
          <View style={styles.statLabelRow}>
            <Text style={[styles.statIcon, { color: colors.primary }]}>✅</Text>
            <Text style={[styles.statCellLabel, { color: colors.primary }]}>
              Ready
            </Text>
          </View>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {padStat(readyCount)}
          </Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          style={styles.statCell}
          onPress={() =>
            setFilterStatus((p) => (p === "growing" ? "all" : "growing"))
          }
        >
          <View style={styles.statLabelRow}>
            <Text style={[styles.statIcon, { color: colors.growing }]}>⏱️</Text>
            <Text style={[styles.statCellLabel, { color: colors.growing }]}>
              Growing
            </Text>
          </View>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {padStat(growingCount)}
          </Text>
        </Pressable>
      </View>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          <Pressable
            style={[
              styles.filterBtn,
              filterStatus === "all" && styles.filterBtnActive,
            ]}
            onPress={() => setFilterStatus("all")}
          >
            <Text
              style={[
                styles.filterBtnText,
                filterStatus === "all" && styles.filterBtnTextActive,
              ]}
            >
              All farms
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterBtn,
              filterStatus === "pinned" && styles.filterBtnActive,
            ]}
            onPress={() =>
              setFilterStatus((p) => (p === "pinned" ? "all" : "pinned"))
            }
          >
            <Text
              style={[
                styles.filterBtnText,
                filterStatus === "pinned" && styles.filterBtnTextActive,
              ]}
            >
              ⭐ Pinned
            </Text>
          </Pressable>
        </View>
        <View style={styles.toolbarRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => {
              setShowSearch((p) => !p);
              if (showSearch) setSearchQuery("");
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
            <Text style={styles.addBtnText}>+ Add farm</Text>
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
        data={listData}
        keyExtractor={(item, idx) =>
          item.type === "section"
            ? `section-${item.status}`
            : `farm-${item.farm.id}`
        }
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
            <Text style={styles.emptyHint}>
              Your timers keep growing, even when you're away.
            </Text>
          </View>
        }
        renderItem={renderItem}
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
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.sheet}>
            {/* Drag handle */}
            <View style={styles.handle} />
            {modal && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>
                    {modal.type === "swap" ? "↔ Swap Farm" : "🌱 Replant Farm"}
                  </Text>
                  <Pressable onPress={closeModal} style={styles.closeBtn}>
                    <Text style={styles.closeBtnText}>✕</Text>
                  </Pressable>
                </View>

                {/* Seed type */}
                <View style={styles.seedPill}>
                  <Text style={styles.seedPillLabel}>Seed type</Text>
                  <Text style={styles.seedPillValue}>
                    {modal.seed?.name ?? "Custom / manual"}
                  </Text>
                </View>

                {modal.type === "swap" ? (
                  <Text style={styles.sheetHint}>
                    Enter the name of the new farm. The seed type stays the
                    same.
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
                    modal.type === "swap"
                      ? "World ABCXYZ — Lower Left"
                      : modal.farm.name
                  }
                  placeholderTextColor={colors.mutedForeground}
                />

                {/* Grow duration */}
                <Text style={styles.fieldLabel}>Grow duration</Text>
                <View style={styles.dhmRow}>
                  {[
                    { label: "Days", value: modalDays, set: setModalDays },
                    { label: "Hours", value: modalHours, set: setModalHours },
                    {
                      label: "Minutes",
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
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
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
                      {modal.type === "swap" ? "Swap" : "Replant"}
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

const STATUS_COLORS: Record<HarvestStatus, string> = {
  ready: colors.primary,
  growing: colors.growing,
  harvested: colors.mutedForeground,
};

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoEmoji: {
    fontSize: 21,
    color: colors.primary,
  },
  logoText: {
    color: colors.foreground,
    fontSize: 23,
    fontWeight: "600",
    fontFamily: fonts.pixel,
  },
  logoDot: {
    color: colors.accentBlue,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    fontSize: 18,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: fonts.body,
  },
  greeting: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "600",
    fontFamily: fonts.pixel,
    lineHeight: 34,
  },
  farmSummary: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 6,
    fontFamily: fonts.body,
  },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  statCell: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statCellLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: "stretch",
  },
  statNum: {
    fontSize: 31,
    fontFamily: fonts.pixel,
    lineHeight: 36,
    letterSpacing: 1,
  },

  // ── Toolbar ──────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  filterRow: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  filterBtnText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  filterBtnTextActive: {
    color: colors.primary,
  },
  toolbarRight: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: {
    fontSize: 17,
    color: colors.mutedForeground,
  },
  addBtn: {
    width: "auto",
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  addBtnText: {
    color: colors.primaryForeground,
    fontWeight: "600",
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  searchWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
  },

  // ── Section headers ────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
    opacity: 0.6,
  },

  // ── Farm List ────────────────────────────────────────────────────────────
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: 16,
    paddingTop: 8,
  },

  // ── Empty ────────────────────────────────────────────────────────────────
  empty: {
    paddingVertical: 60,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: fonts.bodyBold,
  },
  emptyBody: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
    fontFamily: fonts.body,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: colors.primaryForeground,
    fontWeight: "700",
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  emptyHint: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 4,
  },

  // ── Modal / Sheet ─────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.mutedForeground + "66",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: colors.foreground,
    fontSize: 27,
    fontWeight: "600",
    fontFamily: fonts.pixel,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: colors.mutedForeground,
    fontSize: 20,
    fontWeight: "700",
  },
  sheetHint: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  seedPill: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  seedPillValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    fontFamily: fonts.bodyBold,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.xs,
    fontFamily: fonts.bodySemiBold,
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 48,
    fontFamily: fonts.bodySemiBold,
  },
  dhmRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dhmCell: {
    flex: 1,
    gap: 4,
  },
  dhmLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.accentBlue + "33",
    backgroundColor: colors.accentBlue + "0D",
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  previewLabel: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    fontFamily: fonts.bodyBold,
  },
  previewTime: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  previewSeed: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  modalError: {
    color: colors.destruct,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sheetBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
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
    color: colors.primaryForeground,
    fontWeight: "700",
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
  sheetBtnSecondaryText: {
    color: colors.foreground,
    fontWeight: "700",
    fontSize: 15,
    fontFamily: fonts.bodyBold,
  },
});
