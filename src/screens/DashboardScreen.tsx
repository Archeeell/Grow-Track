import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { FarmCard } from "../components/FarmCard";
import { GridFarmCard } from "../components/GridFarmCard";
import { FarmDetailSheet } from "../components/FarmDetailSheet";
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
import { getSeedIcon, getSeedSeedImage } from "../data/seedIcons";
import { GuestLimitSheet } from "../components/GuestLimitSheet";
import { confirmAction } from "../utils/confirm";
import { type AuthPage } from "./AuthScreen";
import {
  addMinutes,
  getStatus,
  minutesToDHM,
  parseNonNegInt,
} from "../utils/time";

const _easeOut = Easing.out(Easing.ease);

/** Dropdown dengan animasi opacity + translateY identik dengan Settings enter-anim. */
function AnimatedDropdown({
  open,
  style,
  children,
}: {
  open: boolean;
  style: object;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      opacity.setValue(0);
      translateY.setValue(-6);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, easing: _easeOut, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, easing: _easeOut, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 130, easing: _easeOut, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -6, duration: 130, easing: _easeOut, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, opacity, translateY]);

  if (!mounted) return null;

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const rank: Record<HarvestStatus, number> = {
  ready: 0,
  harvested: 1,
  growing: 2,
};

const GUEST_FARM_LIMIT = 5;

type Props = {
  onAddFarm: () => void;
  onOpenSeeds: () => void;
  onEditFarm: (id: string) => void;
  onReplantFarm?: (id: string) => void;
  onSwapFarm?: (id: string) => void;
  onNavigate: (route: Route) => void;
  /** Called when guest taps "Create Account" or "Sign In" in the limit sheet */
  onNavigateToAuth?: (page: AuthPage) => void;
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
  ready: "READY TO HARVEST",
  growing: "GROWING",
  harvested: "HARVESTED",
};

const SECTION_SUBTEXTS: Partial<Record<HarvestStatus, string>> = {
  ready: "Let's collect.",
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
    width: 44,
    height: 44,
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
    flexDirection: "row",
    gap: 6,
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
    marginBottom: 1,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: fonts.bodyBold,
    letterSpacing: 1.2,
  },
  sectionCount: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: fonts.bodySemiBold,
    opacity: 0.6,
  },
  sectionSubtext: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontFamily: fonts.body,
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
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    maxHeight: "90%",
    width: "100%",
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
  dhmCellCentered: {
    flex: 1,
    alignItems: "center" as const,
    gap: 8,
  },
  dhmInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    height: 56,
    width: "100%" as const,
    fontSize: 20,
    fontWeight: "700" as const,
    textAlign: "center" as const,
    fontFamily: fonts.bodyBold,
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

  // ── Swap modal extras ─────────────────────────────────────────────────────
  currentInfoCard: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    padding: 12,
  },
  currentInfoLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  currentInfoStatus: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "600" as const,
    fontFamily: fonts.bodySemiBold,
    marginTop: 4,
  },
  seedSearchContainer: {
    position: "relative" as const,
    marginBottom: 8,
  },
  seedSearchInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingLeft: 40,
    height: 44,
    fontFamily: fonts.body,
  },
  seedSearchIcon: {
    position: "absolute" as const,
    left: 12,
    top: 13,
    zIndex: 1,
  },
  seedGridScrollable: {
    maxHeight: 160,
  },
  seedChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 56,
    width: "47%" as const,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  seedChipOn: {
    backgroundColor: withAlpha(colors.primary, 0.10),
    borderColor: colors.primary,
  },
  seedChipIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  seedChipImg: {
    width: 24,
    height: 24,
  },
  seedChipEmoji: {
    fontSize: 20,
  },
  seedChipText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: "600" as const,
    flex: 1,
    fontFamily: fonts.bodySemiBold,
  },
  notifyRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  notifyTextBlock: {
    flex: 1,
  },
  notifyTitle: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600" as const,
    fontFamily: fonts.bodySemiBold,
  },
  notifySubtitle: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
    marginTop: 2,
  },
}));

function useSafeInsets() {
  try {
    return useSafeAreaInsets();
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

export function DashboardScreen({
  onAddFarm,
  onOpenSeeds,
  onEditFarm,
  onReplantFarm,
  onSwapFarm,
  onNavigate,
  onNavigateToAuth,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { authState } = useAuth();
  const insets = useSafeInsets();

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
  const [detailFarmId, setDetailFarmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortMode, setSortMode] = useState<FarmSort>("Recommended");
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<FarmView>("list");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGuestLimit, setShowGuestLimit] = useState(false);

  // Pinned button animation
  const pinnedAnim = useRef(new Animated.Value(0)).current;
  const pinnedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(pinnedAnim, {
      toValue: filterStatus === "pinned" ? 1 : 0,
      duration: 180,
      easing: _easeOut,
      useNativeDriver: false,
    }).start();
  }, [filterStatus, pinnedAnim]);

  const onPinnedPressIn = () => {
    Animated.spring(pinnedScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };
  const onPinnedPressOut = () => {
    Animated.spring(pinnedScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

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

  /** Intercept Add Farm: show limit sheet if guest already has max farms */
  const handleAddFarm = () => {
    if (isGuest && farms.length >= GUEST_FARM_LIMIT) {
      setShowGuestLimit(true);
      return;
    }
    onAddFarm();
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
  const [modalSeedId, setModalSeedId] = useState<string | null>(null);
  const [modalNotify, setModalNotify] = useState(false);
  const [modalSeedSearch, setModalSeedSearch] = useState("");

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
    if (onSwapFarm) {
      onSwapFarm(farm.id);
      return;
    }
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
    setModalSeedId(farm.seedId);
    setModalNotify(farm.notificationsEnabled);
    setModalSeedSearch("");
    setModal({ type: "swap", farm, seed });
  };

  const openReplant = (farm: Farm) => {
    if (onReplantFarm) {
      onReplantFarm(farm.id);
      return;
    }
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
    setModalSeedId(farm.seedId);
    setModalNotify(farm.notificationsEnabled);
    setModalSeedSearch("");
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
      await swapFarm(modal.farm.id, trimmedName, totalModalMinutes, modalSeedId ?? undefined, modalNotify);
    } else {
      await replantFarm(modal.farm.id, trimmedName, totalModalMinutes, modalSeedId ?? undefined, modalNotify);
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
      const subtext = SECTION_SUBTEXTS[item.status];
      const sectionIcon =
        item.status === "ready" ? (
          <CheckCheckIcon size={14} color={statusColors[item.status]} />
        ) : item.status === "growing" ? (
          <SproutIcon size={14} color={statusColors[item.status]} />
        ) : (
          <CheckIcon size={14} color={statusColors[item.status]} />
        );
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              {sectionIcon}
              <Text
                style={[styles.sectionLabel, { color: statusColors[item.status] }]}
              >
                {SECTION_LABELS[item.status]}
              </Text>
              <Text style={[styles.sectionCount, { color: statusColors[item.status] }]}>· {item.count}</Text>
            </View>
            {subtext && (
              <Text style={styles.sectionSubtext}>{subtext}</Text>
            )}
          </View>
        </View>
      );
    }
    if (item.type === "header") {
      return (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderRow}>
            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              {item.title}
            </Text>
            <Text style={styles.sectionCount}>· {item.count}</Text>
          </View>
        </View>
      );
    }
    return (
      <FarmCard
        farm={item.farm}
        now={now}
        status={item.status}
        onDetail={() => setDetailFarmId(item.farm.id)}
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
          <Text style={[styles.guestUsageText, totalFarms >= GUEST_FARM_LIMIT && { color: colors.growing }]}>
            {totalFarms >= GUEST_FARM_LIMIT ? 'Guest limit reached' : 'Saved on this device'}
          </Text>
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
            <AnimatedDropdown open={filterDropdownOpen} style={styles.dropdownMenu}>
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
            </AnimatedDropdown>
          </View>

          {/* Pinned Button */}
          <Animated.View
            style={{
              borderRadius: 8,
              transform: [{ scale: pinnedScale }],
              backgroundColor: pinnedAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['transparent', colors.secondary],
              }),
            }}
          >
            <Pressable
              style={styles.pinnedBtn}
              onPress={() =>
                setFilterStatus((p) => (p === "pinned" ? "all" : "pinned"))
              }
              onPressIn={onPinnedPressIn}
              onPressOut={onPinnedPressOut}
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
          </Animated.View>
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

          <AnimatedDropdown open={sortDropdownOpen} style={styles.sortMenu}>
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
          </AnimatedDropdown>
        </View>

        <Pressable
          style={[styles.iconBtn, styles.addBtn]}
          onPress={handleAddFarm}
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
                <Pressable style={styles.emptyBtn} onPress={handleAddFarm}>
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
                onDetail={() => setDetailFarmId(item.id)}
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
                <Pressable style={styles.emptyBtn} onPress={handleAddFarm}>
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

      {/* ── Farm Detail Sheet ────────────────────────────────────────────── */}
      {(() => {
        const detailFarm = detailFarmId ? farms.find((f) => f.id === detailFarmId) ?? null : null;
        const detailStatus = detailFarm ? getStatus(detailFarm.readyAt, now, detailFarm.harvestedAt) : 'growing';
        return (
          <FarmDetailSheet
            visible={detailFarmId !== null}
            farm={detailFarm}
            status={detailStatus}
            now={now}
            onClose={() => setDetailFarmId(null)}
            onEdit={() => {
              setDetailFarmId(null);
              if (detailFarmId) onEditFarm(detailFarmId);
            }}
            onReset={() => {
              if (detailFarm) {
                setDetailFarmId(null);
                confirmReset(detailFarm);
              }
            }}
            onHarvest={() => {
              if (detailFarm) {
                setDetailFarmId(null);
                void harvestFarm(detailFarm.id);
              }
            }}
            onSwap={() => {
              if (detailFarm) {
                setDetailFarmId(null);
                openSwap(detailFarm);
              }
            }}
            onReplant={() => {
              if (detailFarm) {
                setDetailFarmId(null);
                openReplant(detailFarm);
              }
            }}
            onPin={() => {
              if (detailFarm) togglePin(detailFarm);
            }}
          />
        );
      })()}

      {/* ── Swap / Replant Modal ─────────────────────────────────────────── */}
      <Modal
        visible={modal !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 8 }]}
            onPress={(e) => e.stopPropagation()}
          >
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

                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {modal.type === "swap" ? (
                      /* Current seed info card (swap only) */
                      <View style={[styles.currentInfoCard, { marginBottom: spacing.sm }]}>
                        <Text style={styles.currentInfoLabel}>
                          Current · {modal.farm.seedName || "Unknown"}
                        </Text>
                        <Text style={styles.currentInfoStatus}>
                          Ready to harvest
                        </Text>
                      </View>
                    ) : null}

                    {/* World name */}
                      <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>World name</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: spacing.sm }]}
                        value={modalName}
                        onChangeText={(v) => {
                          setModalName(v.toUpperCase());
                          setModalError(null);
                        }}
                        placeholder="e.g. ARCHELLGT"
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="characters"
                      />

                      {/* Seed selector */}
                      <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Seed</Text>
                      <View style={styles.seedSearchContainer}>
                        <View style={styles.seedSearchIcon}>
                          <SearchIcon size={15} color={colors.mutedForeground} />
                        </View>
                        <TextInput
                          style={styles.seedSearchInput}
                          value={modalSeedSearch}
                          onChangeText={setModalSeedSearch}
                          placeholder="Find a seed"
                          placeholderTextColor={colors.mutedForeground}
                        />
                      </View>
                      <ScrollView
                        style={[styles.seedGridScrollable, { marginBottom: spacing.sm }]}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                      >
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          {seeds
                            .filter((s) =>
                              !modalSeedSearch.trim() ||
                              s.name.toLowerCase().includes(modalSeedSearch.toLowerCase())
                            )
                            .map((s) => {
                              const isSelected = modalSeedId === s.id;
                              const img = getSeedSeedImage(s.id);
                              const emoji = getSeedIcon(s.id);
                              return (
                                <Pressable
                                  key={s.id}
                                  accessibilityRole="button"
                                  style={[
                                    styles.seedChip,
                                    isSelected && styles.seedChipOn,
                                  ]}
                                  onPress={() => {
                                    setModalSeedId(s.id);
                                    const seed = seeds.find((x) => x.id === s.id);
                                    if (seed) {
                                      const dhm = minutesToDHM(seed.growTimeMinutes);
                                      setModalDays(dhm.days > 0 ? String(dhm.days) : "");
                                      setModalHours(dhm.hours > 0 ? String(dhm.hours) : "");
                                      setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
                                    }
                                  }}
                                >
                                  <View style={styles.seedChipIconWrap}>
                                    {img ? (
                                      <Image source={img} style={styles.seedChipImg} resizeMode="contain" />
                                    ) : (
                                      <Text style={styles.seedChipEmoji}>{emoji}</Text>
                                    )}
                                  </View>
                                  <Text style={styles.seedChipText} numberOfLines={2}>{s.name}</Text>
                                  {isSelected && (
                                    <CheckIcon size={13} color={colors.primary} />
                                  )}
                                </Pressable>
                              );
                            })}
                        </View>
                      </ScrollView>

                      {/* Grow duration */}
                      <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Grow duration</Text>
                      <View style={[styles.dhmRow, { marginBottom: spacing.sm }]}>
                        {[
                          { label: "Days", value: modalDays, set: setModalDays },
                          { label: "Hours", value: modalHours, set: setModalHours },
                          { label: "Minutes", value: modalMinutes, set: setModalMinutes },
                        ].map(({ label, value, set }) => (
                          <View key={label} style={styles.dhmCellCentered}>
                            <TextInput
                              style={styles.dhmInput}
                              value={value}
                              onChangeText={(v) => {
                                set(v);
                                setModalError(null);
                              }}
                              keyboardType="numeric"
                              placeholder="0"
                              placeholderTextColor={colors.mutedForeground}
                              textAlign="center"
                            />
                            <Text style={styles.dhmLabel}>{label}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Harvest notification toggle */}
                      <View style={[styles.notifyRow, { marginBottom: spacing.sm }]}>
                        <View style={styles.notifyTextBlock}>
                          <Text style={styles.notifyTitle}>Harvest notification</Text>
                          <Text style={styles.notifySubtitle}>
                            Get notified when this farm is ready.
                          </Text>
                        </View>
                        <Switch
                          value={modalNotify}
                          onValueChange={setModalNotify}
                          trackColor={{ false: colors.border, true: colors.primary }}
                          thumbColor="#ffffff"
                        />
                      </View>

                      {/* Estimated harvest preview */}
                      {modalPreviewReady ? (
                        <View style={[styles.previewCard, { marginBottom: spacing.sm }]}>
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
                          {modalSeedId && (
                            <Text style={styles.previewSeed}>
                              {seeds.find((s) => s.id === modalSeedId)?.name ?? modal.farm.seedName}
                            </Text>
                          )}
                        </View>
                      ) : null}

                      {modalError ? (
                        <Text style={[styles.modalError, { marginBottom: 4 }]}>{modalError}</Text>
                      ) : null}

                      {/* Full-width action button */}
                      <Pressable
                        style={[styles.sheetBtn, styles.sheetBtnPrimary, { width: "100%" }]}
                        onPress={() => void confirmModal()}
                      >
                        <Text style={styles.sheetBtnPrimaryText}>
                          {modal.type === "swap" ? "Swap" : "Replant"}
                        </Text>
                      </Pressable>
                    </ScrollView>
                </>
              )}
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Guest Farm Limit Sheet ───────────────────────────────────────── */}
      <GuestLimitSheet
        visible={showGuestLimit}
        farmCount={farms.length}
        onClose={() => setShowGuestLimit(false)}
        onCreateAccount={() => {
          setShowGuestLimit(false);
          onNavigateToAuth?.('signup');
        }}
        onSignIn={() => {
          setShowGuestLimit(false);
          onNavigateToAuth?.('login');
        }}
      />
    </SafeAreaView>
  );
}
