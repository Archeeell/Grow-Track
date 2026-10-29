import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { FarmCard } from "../components/FarmCard";
import { GridFarmCard } from "../components/GridFarmCard";
import { TabBar } from "../components/TabBar";
import {
  CheckCheckIcon,
  CheckIcon,
  ChevronDownIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  Repeat2Icon,
  SearchIcon,
  StarIcon,
} from "../components/dashboard/DashboardIcons";
import { SproutIcon } from "../components/auth/AuthIcons";
import {
  Clock3Icon,
  SettingsGearIcon,
  ShieldCheckIcon,
  XIcon,
} from "../components/settings/SettingsIcons";
import { useNow } from "../hooks/useNow";
import { useStore } from "../store";
import { fonts, radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeContext";
import { makeStyles } from "../theme/makeStyles";
import { withAlpha } from "../theme/withAlpha";
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

export const SORT_OPTIONS = [
  "Recommended",
  "Ready first",
  "Farthest harvest",
  "Alphabetical A → Z",
  "Alphabetical Z → A",
  "Recently added",
  "Recently updated",
  "Favorite first",
] as const;

export type FarmSort = (typeof SORT_OPTIONS)[number];

export type FarmView = "list" | "grid";

const FILTER_OPTIONS: { id: FilterStatus; label: string }[] = [
  { id: "all", label: "All farms" },
  { id: "ready", label: "Ready" },
  { id: "growing", label: "Growing" },
  { id: "harvested", label: "Harvested" },
  { id: "pinned", label: "Pinned" },
];

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
  | { type: "header"; title: string; count: number }
  | { type: "farm"; farm: Farm; status: HarvestStatus };

const useStyles = makeStyles(({ colors }) => ({
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
    color: colors.primary,
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

  // ── Guest Usage ──────────────────────────────────────────────────────────
  guestUsage: {
    marginTop: 2,
    marginBottom: 12,
    marginHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  guestUsageText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.mutedForeground,
    includeFontPadding: false,
  },
  guestUsageCount: {
    fontVariant: ["tabular-nums"],
  },

  // ── Toolbar ──────────────────────────────────────────────────────────────
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    gap: spacing.sm,
    zIndex: 30,
  },
  filterRow: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
    alignItems: "center",
  },
  dropdownAnchor: {
    position: "relative",
    zIndex: 35,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  filterBtnActive: {
    backgroundColor: colors.secondary,
  },
  filterBtnText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  filterBtnTextActive: {
    color: colors.foreground,
  },
  pinnedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  pinnedBtnActive: {
    backgroundColor: colors.secondary,
  },
  pinnedBtnText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
  },
  pinnedBtnTextActive: {
    color: colors.foreground,
  },
  sortToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    zIndex: 28,
  },
  sortAnchor: {
    position: "relative",
    zIndex: 34,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    paddingVertical: 4,
  },
  sortLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.mutedForeground,
  },
  sortValue: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.foreground,
    maxWidth: 160,
  },
  sortMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 224,
    maxHeight: 320,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.popover,
    padding: 6,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
  },
  dropdownBackdrop: {
    ...(StyleSheet.absoluteFill as object),
    zIndex: 25,
  },
  dropdownMenu: {
    position: "absolute",
    top: 48,
    left: 0,
    width: 224,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.popover,
    padding: 6,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 12,
  },
  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 10,
    fontFamily: fonts.bodySemiBold,
    letterSpacing: 1.2,
    color: colors.mutedForeground,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dropdownItemSelected: {
    backgroundColor: withAlpha(colors.primary, 0.10),
  },
  dropdownItemCheck: {
    width: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownItemText: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.foreground,
  },
  dropdownItemTextSelected: {
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  toolbarRight: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  viewToggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 2,
    gap: 2,
  },
  viewToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleBtnActive: {
    backgroundColor: colors.secondary,
  },
  gridRow: {
    gap: 12,
    justifyContent: "space-between",
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
    maxWidth: 260,
    lineHeight: 20,
    fontFamily: fonts.body,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  emptyBtnText: {
    color: colors.primaryForeground,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 4,
  },
  emptyHintText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontFamily: fonts.body,
    includeFontPadding: false,
  },
  
  // ── List Footer ──────────────────────────────────────────────────────────
  listFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 3,
    paddingBottom: 20,
    marginTop: 8,
  },
  listFooterText: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontFamily: fonts.body,
    includeFontPadding: false,
  },

  emptyFilter: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  emptyFilterTitle: {
    fontFamily: fonts.pixel,
    fontSize: 24,
    color: colors.foreground,
    textAlign: "center",
  },
  emptyFilterBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 256,
  },
  emptyFilterBtn: {
    marginTop: 12,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyFilterBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primary,
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
    backgroundColor: withAlpha(colors.mutedForeground, 0.40),
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
    borderColor: withAlpha(colors.accentBlue, 0.20),
    backgroundColor: withAlpha(colors.accentBlue, 0.05),
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
}));

export function DashboardScreen({
  onAddFarm,
  onOpenSeeds,
  onEditFarm,
  onNavigate,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { authState } = useAuth();

  const statusColors: Record<HarvestStatus, string> = {
    ready: colors.primary,
    growing: colors.growing,
    harvested: colors.mutedForeground,
  };

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
  
  const account = authState.status === 'authenticated' ? authState.account : null;
  const isGuest = !account || account.mode === 'guest';

  const [modal, setModal] = useState<ActionModal | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortMode, setSortMode] = useState<FarmSort>("Recommended");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<FarmView>("list");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("growtrack-farm-view");
        if (mounted && saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed === "grid" || parsed === "list") setViewMode(parsed);
          } catch {
            if (saved === "grid" || saved === "list") setViewMode(saved);
          }
        }
      } catch (err) {
        console.warn("AsyncStorage farm-view error:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updateViewMode = (mode: FarmView) => {
    setViewMode(mode);
    AsyncStorage.setItem("growtrack-farm-view", JSON.stringify(mode)).catch(
      () => {},
    );
  };

  const filterLabel = useMemo(() => {
    switch (filterStatus) {
      case "ready":
        return "Ready";
      case "growing":
        return "Growing";
      case "harvested":
        return "Harvested";
      default:
        return "All farms";
    }
  }, [filterStatus]);

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
      const sa = getStatus(a.readyAt, now, a.harvestedAt);
      const sb = getStatus(b.readyAt, now, b.harvestedAt);
      const aReadyTime = new Date(a.readyAt).getTime();
      const bReadyTime = new Date(b.readyAt).getTime();
      const aFav = a.pinned ? 1 : 0;
      const bFav = b.pinned ? 1 : 0;

      switch (sortMode) {
        case "Ready first":
          if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
          return aReadyTime - bReadyTime;

        case "Farthest harvest": {
          const aHarvested = a.harvestedAt ? 1 : 0;
          const bHarvested = b.harvestedAt ? 1 : 0;
          if (aHarvested !== bHarvested) return aHarvested - bHarvested;
          return bReadyTime - aReadyTime;
        }

        case "Alphabetical A → Z":
          return (a.name || "").localeCompare(b.name || "");

        case "Alphabetical Z → A":
          return (b.name || "").localeCompare(a.name || "");

        case "Recently added": {
          const aCreated = new Date(a.createdAt || 0).getTime() || 0;
          const bCreated = new Date(b.createdAt || 0).getTime() || 0;
          return bCreated - aCreated;
        }

        case "Recently updated": {
          const aUpdated = new Date(a.plantedAt || a.createdAt || 0).getTime() || 0;
          const bUpdated = new Date(b.plantedAt || b.createdAt || 0).getTime() || 0;
          return bUpdated - aUpdated;
        }

        case "Favorite first":
          if (aFav !== bFav) return bFav - aFav;
          return ((rank[sa] ?? 2) - (rank[sb] ?? 2)) || (aReadyTime - bReadyTime) || 0;

        case "Recommended":
        default:
          if (aFav !== bFav) return bFav - aFav;
          if ((rank[sa] ?? 2) !== (rank[sb] ?? 2)) return (rank[sa] ?? 2) - (rank[sb] ?? 2);
          return (aReadyTime - bReadyTime) || 0;
      }
    });

    return list;
  }, [farms, now, filterStatus, searchQuery, sortMode]);

  // Build flat list with section headers
  const listData = useMemo((): ListItem[] => {
    if (sorted.length === 0) return [];

    if (sortMode !== "Recommended" && sortMode !== "Ready first") {
      const headerTitle =
        filterStatus === "all"
          ? "YOUR FARMS"
          : filterStatus === "pinned"
            ? "PINNED FARMS"
            : filterStatus.toUpperCase();

      const items: ListItem[] = [
        { type: "header", title: headerTitle, count: sorted.length },
      ];
      for (const farm of sorted) {
        const s = getStatus(farm.readyAt, now, farm.harvestedAt);
        items.push({ type: "farm", farm, status: s });
      }
      return items;
    }

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
  }, [sorted, now, sortMode, filterStatus]);

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
            style={[styles.sectionLabel, { color: statusColors[item.status] }]}
          >
            {SECTION_LABELS[item.status]}
          </Text>
          <Text style={styles.sectionCount}>· {item.count}</Text>
        </View>
      );
    }
    if (item.type === "header") {
      return (
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionLabel, { color: colors.mutedForeground }]}
          >
            {item.title}
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
      {/* ── Dropdown Backdrop ────────────────────────────────────────────── */}
      {(filterDropdownOpen || sortDropdownOpen) && (
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => {
            setFilterDropdownOpen(false);
            setSortDropdownOpen(false);
          }}
        />
      )}
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            <SproutIcon size={24} color={colors.primary} />
            <Text style={styles.logoText}>
              GrowTrack<Text style={styles.logoDot}>.</Text>
            </Text>
          </View>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => onNavigate({ name: "settings" })}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <SettingsGearIcon size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>A little care. A better harvest.</Text>
        <Text style={styles.greeting}>
          Good {getHour()}, {account?.name ?? 'Guest'}
        </Text>
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
            <SproutIcon size={14} color={colors.accentBlue} />
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
            <CheckCheckIcon size={14} color={colors.primary} />
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
            <Clock3Icon size={14} color={colors.growing} />
            <Text style={[styles.statCellLabel, { color: colors.growing }]}>
              Growing
            </Text>
          </View>
          <Text style={[styles.statNum, { color: colors.foreground }]}>
            {padStat(growingCount)}
          </Text>
        </Pressable>
      </View>

      {/* ── Guest Usage Info ──────────────────────────────────────────────── */}
      {isGuest && (
        <View style={styles.guestUsage}>
          <Text style={styles.guestUsageText}>
            Guest <Text style={styles.guestUsageText}>·</Text>{" "}
            <Text style={[styles.guestUsageText, styles.guestUsageCount]}>
              {totalFarms} / 5 farms
            </Text>
          </Text>
          <Text style={styles.guestUsageText}>Saved on this device</Text>
        </View>
      )}

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {/* Dropdown anchor */}
          <View style={styles.dropdownAnchor}>
            <Pressable
              style={[
                styles.filterBtn,
                filterStatus !== "pinned" && styles.filterBtnActive,
              ]}
              onPress={() => {
                setFilterDropdownOpen((prev) => !prev);
                setSortDropdownOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Filter farms: ${filterLabel}`}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  filterStatus !== "pinned" && styles.filterBtnTextActive,
                ]}
              >
                {filterLabel}
              </Text>
              <ChevronDownIcon
                size={12}
                color={
                  filterStatus !== "pinned"
                    ? colors.foreground
                    : colors.mutedForeground
                }
              />
            </Pressable>

            {/* Dropdown Menu */}
            {filterDropdownOpen && (
              <View style={styles.dropdownMenu}>
                <Text style={styles.dropdownHeader}>SHOW FARMS</Text>
                {FILTER_OPTIONS.map((option) => {
                  const isSelected = filterStatus === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setFilterStatus(option.id);
                        setFilterDropdownOpen(false);
                      }}
                      accessibilityRole="menuitem"
                    >
                      <View style={styles.dropdownItemCheck}>
                        {isSelected && (
                          <CheckIcon size={14} color={colors.primary} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Pinned Button */}
          <Pressable
            style={[
              styles.pinnedBtn,
              filterStatus === "pinned" && styles.pinnedBtnActive,
            ]}
            onPress={() =>
              setFilterStatus((p) => (p === "pinned" ? "all" : "pinned"))
            }
            accessibilityRole="button"
            accessibilityLabel="Filter pinned farms"
          >
            <StarIcon
              size={12}
              color={
                filterStatus === "pinned"
                  ? colors.foreground
                  : colors.mutedForeground
              }
              fill={filterStatus === "pinned" ? colors.foreground : "none"}
            />
            <Text
              style={[
                styles.pinnedBtnText,
                filterStatus === "pinned" && styles.pinnedBtnTextActive,
              ]}
            >
              Pinned
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
            <SearchIcon
              size={17}
              color={showSearch ? colors.primary : colors.mutedForeground}
            />
          </Pressable>

          {/* Farm view toggle */}
          <View
            style={styles.viewToggleGroup}
            accessibilityLabel="Farm view"
          >
            <Pressable
              style={[
                styles.viewToggleBtn,
                viewMode === "list" && styles.viewToggleBtnActive,
              ]}
              onPress={() => updateViewMode("list")}
              accessibilityRole="button"
              accessibilityLabel="List view"
              accessibilityState={{ selected: viewMode === "list" }}
            >
              <ListIcon
                size={17}
                color={
                  viewMode === "list" ? colors.primary : colors.mutedForeground
                }
              />
            </Pressable>
            <Pressable
              style={[
                styles.viewToggleBtn,
                viewMode === "grid" && styles.viewToggleBtnActive,
              ]}
              onPress={() => updateViewMode("grid")}
              accessibilityRole="button"
              accessibilityLabel="Grid view"
              accessibilityState={{ selected: viewMode === "grid" }}
            >
              <LayoutGridIcon
                size={17}
                color={
                  viewMode === "grid" ? colors.primary : colors.mutedForeground
                }
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* ── Sort Toolbar ─────────────────────────────────────────────────── */}
      <View style={styles.sortToolbar}>
        <View style={styles.sortAnchor}>
          <Pressable
            style={styles.sortBtn}
            onPress={() => {
              setSortDropdownOpen((prev) => !prev);
              setFilterDropdownOpen(false);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Sort farms: ${sortMode}`}
          >
            <Text style={styles.sortLabel}>Sort:</Text>
            <Text style={styles.sortValue} numberOfLines={1}>
              {sortMode}
            </Text>
            <ChevronDownIcon size={12} color={colors.mutedForeground} />
          </Pressable>

          {sortDropdownOpen && (
            <View style={styles.sortMenu}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.dropdownHeader}>SORT BY</Text>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = sortMode === option;
                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSortMode(option);
                        setSortDropdownOpen(false);
                      }}
                      accessibilityRole="menuitem"
                    >
                      <View style={styles.dropdownItemCheck}>
                        {isSelected && (
                          <CheckIcon size={14} color={colors.primary} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.iconBtn, styles.addBtn]}
          onPress={onAddFarm}
          accessibilityRole="button"
          accessibilityLabel="Add farm"
        >
          <PlusIcon size={14} color={colors.primaryForeground} />
          <Text style={styles.addBtnText}>Add farm</Text>
        </Pressable>
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

      {/* ── Farm List / Grid ────────────────────────────────────────────────── */}
      {viewMode === "grid" ? (
        <FlatList
          key="grid-view"
          data={sorted}
          keyExtractor={(item) => `grid-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            sorted.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {filterStatus === "all"
                    ? "YOUR FARMS"
                    : filterStatus === "pinned"
                      ? "PINNED FARMS"
                      : filterStatus.toUpperCase()}
                </Text>
                <Text style={styles.sectionCount}>· {sorted.length}</Text>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            farms.length === 0 ? (
              <View style={styles.empty}>
                <SproutIcon size={40} color={colors.primary} />
                <Text style={styles.emptyTitle}>No farms yet</Text>
                <Text style={styles.emptyBody}>
                  Add your first farm and start tracking its harvest time.
                </Text>
                <Pressable style={styles.emptyBtn} onPress={onAddFarm}>
                  <PlusIcon size={14} color={colors.primaryForeground} />
                  <Text style={styles.emptyBtnText}>Add your first farm</Text>
                </Pressable>
                <View style={styles.emptyHint}>
                  <ShieldCheckIcon size={12} color={colors.mutedForeground} />
                  <Text style={styles.emptyHintText}>
                    Your timers keep growing, even when you're away.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterTitle}>
                  {searchQuery.trim()
                    ? "No matching farms"
                    : `No ${filterStatus === "all" ? "" : filterStatus} farms`}
                </Text>
                <Text style={styles.emptyFilterBody}>
                  {searchQuery.trim()
                    ? `No farms matched "${searchQuery.trim()}"`
                    : "Try changing your filter to see more farms."}
                </Text>
                <Pressable
                  style={styles.emptyFilterBtn}
                  onPress={() => {
                    if (searchQuery.trim()) setSearchQuery("");
                    else setFilterStatus("all");
                  }}
                >
                  <Text style={styles.emptyFilterBtnText}>
                    {searchQuery.trim() ? "Clear search" : "Show all farms"}
                  </Text>
                </Pressable>
              </View>
            )
          }
          renderItem={({ item }) => {
            const s = getStatus(item.readyAt, now, item.harvestedAt);
            return (
              <GridFarmCard
                farm={item}
                status={s}
                now={now}
                onPress={() => onEditFarm(item.id)}
                onPin={() => togglePin(item)}
              />
            );
          }}
          ListFooterComponent={
            farms.length > 0 ? (
              <View style={styles.listFooter}>
                <ShieldCheckIcon size={12} color={colors.mutedForeground} />
                <Text style={styles.listFooterText}>
                  Your timers keep growing, even when you're away.
                </Text>
              </View>
            ) : undefined
          }
        />
      ) : (
        <FlatList
          key="list-view"
          data={listData}
          keyExtractor={(item) =>
            item.type === "section"
              ? `section-${item.status}`
              : item.type === "header"
                ? `header-${item.title}`
                : `farm-${item.farm.id}`
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            farms.length === 0 ? (
              <View style={styles.empty}>
                <SproutIcon size={40} color={colors.primary} />
                <Text style={styles.emptyTitle}>No farms yet</Text>
                <Text style={styles.emptyBody}>
                  Add your first farm and start tracking its harvest time.
                </Text>
                <Pressable style={styles.emptyBtn} onPress={onAddFarm}>
                  <PlusIcon size={14} color={colors.primaryForeground} />
                  <Text style={styles.emptyBtnText}>Add your first farm</Text>
                </Pressable>
                <View style={styles.emptyHint}>
                  <ShieldCheckIcon size={12} color={colors.mutedForeground} />
                  <Text style={styles.emptyHintText}>
                    Your timers keep growing, even when you're away.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyFilter}>
                <Text style={styles.emptyFilterTitle}>
                  {searchQuery.trim()
                    ? "No matching farms"
                    : `No ${filterStatus === "all" ? "" : filterStatus} farms`}
                </Text>
                <Text style={styles.emptyFilterBody}>
                  {searchQuery.trim()
                    ? `No farms matched "${searchQuery.trim()}"`
                    : "Try changing your filter to see more farms."}
                </Text>
                <Pressable
                  style={styles.emptyFilterBtn}
                  onPress={() => {
                    if (searchQuery.trim()) setSearchQuery("");
                    else setFilterStatus("all");
                  }}
                >
                  <Text style={styles.emptyFilterBtnText}>
                    {searchQuery.trim() ? "Clear search" : "Show all farms"}
                  </Text>
                </Pressable>
              </View>
            )
          }
          renderItem={renderItem}
          ListFooterComponent={
            farms.length > 0 ? (
              <View style={styles.listFooter}>
                <ShieldCheckIcon size={12} color={colors.mutedForeground} />
                <Text style={styles.listFooterText}>
                  Your timers keep growing, even when you're away.
                </Text>
              </View>
            ) : undefined
          }
        />
      )}

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
                    {modal.type === "swap" ? "Swap Farm" : "Replant Farm"}
                  </Text>
                  <Pressable onPress={closeModal} style={styles.closeBtn} accessibilityLabel="Close dialog">
                    <XIcon size={20} color={colors.mutedForeground} />
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
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Clock3Icon size={12} color={colors.accentBlue} />
                      <Text style={styles.previewLabel}>ESTIMATED HARVEST</Text>
                    </View>
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
