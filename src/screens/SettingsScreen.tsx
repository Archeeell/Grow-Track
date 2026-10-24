/**
 * SettingsScreen -- pixel-faithful replica of Figma Make settings tab.
 * Source: FarmDashboard.tsx (Figma Make live bundle + DOM /settings).
 * Spec: docs/settings-figma-spec.md
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import { SproutIcon } from '../components/auth/AuthIcons';
import {
  BellIcon,
  CheckIcon,
  ChevronRightIcon,
  CircleHelpIcon,
  Clock3Icon,
  InfoIcon,
  LogInIcon,
  MoonIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SunIcon,
  Trash2Icon,
  XIcon,
} from '../components/settings/SettingsIcons';
import { TabBar } from '../components/TabBar';
import { type Prefs } from '../settings/prefsStorage';
import { useStore } from '../store';
import { fonts } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/withAlpha';
import type { Route } from '../types';

type OverlayId =
  | 'theme' | 'behavior' | 'account' | 'about' | 'onboarding'
  | 'restore' | 'reset-data' | '';

const CONFIRM_OVERLAYS = ['restore', 'reset-data'];
const cssEaseOut = Easing.out(Easing.ease);
const cssEaseIn = Easing.in(Easing.ease);
const sheetEasing = Easing.bezier(0.2, 0.8, 0.2, 1);

type Props = { onNavigate: (route: Route) => void };

const useStyles = makeStyles(({ colors }) => ({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  h1: { fontFamily: fonts.pixel, fontSize: 30, color: colors.foreground, includeFontPadding: false },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },

  section: { marginTop: 28 },
  sectionLabel: {
    marginBottom: 8, fontSize: 10, fontFamily: fonts.bodyBold,
    letterSpacing: 1.2, color: colors.mutedForeground, includeFontPadding: false,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: 12,
    borderBottomWidth: 1, borderBottomColor: withAlpha(colors.border, 0.60),
  },
  rowPressed: { opacity: 0.7 },
  rowIcon: {},
  rowTitle: { flex: 1, fontSize: 14, fontFamily: fonts.body, color: colors.foreground, includeFontPadding: false },
  rowDanger: { color: colors.destruct },
  rowDetail: { fontSize: 12, fontFamily: fonts.body, color: colors.mutedForeground, includeFontPadding: false },

  notifRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 64, gap: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  notifLabel: { flex: 1, fontSize: 14, fontFamily: fonts.body, color: colors.foreground, includeFontPadding: false },

  toggleWrapper: { minHeight: 44, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, paddingHorizontal: 4, alignItems: 'flex-start', justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.primary },
  toggleOff: { backgroundColor: colors.secondary },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#ffffff' },

  tagline: {
    marginTop: 32, textAlign: 'center', fontFamily: fonts.pixel,
    fontSize: 18, color: colors.primary, includeFontPadding: false,
  },

  toast: {
    position: 'absolute', left: 20, right: 20, alignSelf: 'center', maxWidth: 420,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, zIndex: 50,
  },
  toastText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.foreground, includeFontPadding: false },

  backdrop: { ...StyleSheet.absoluteFill as object, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 40 },

  sheetContainer: {
    ...StyleSheet.absoluteFill as object, justifyContent: 'flex-end', alignItems: 'center', zIndex: 41,
  },
  sheet: {
    width: '100%', maxWidth: 460, maxHeight: '92%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
    paddingHorizontal: 20, paddingTop: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 24,
  },
  dragHandle: { alignSelf: 'center', marginBottom: 20, height: 4, width: 36, borderRadius: 2, backgroundColor: withAlpha(colors.mutedForeground, 0.40) },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontFamily: fonts.pixel, fontSize: 27, color: colors.foreground, flex: 1, includeFontPadding: false },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  dialogContainer: {
    ...StyleSheet.absoluteFill as object, justifyContent: 'flex-end', alignItems: 'center',
    zIndex: 41, paddingBottom: '30%' as unknown as number, paddingHorizontal: 20,
  },
  dialog: {
    width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.bg, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 24,
  },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  dialogBody: { fontSize: 14, lineHeight: 24, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  dialogActions: { flexDirection: 'row', gap: 12, marginTop: 24 },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 10, paddingHorizontal: 16 },
  btnFlex: { flex: 1 },
  btnPressedStyle: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.primaryForeground, includeFontPadding: false },
  btnSecondary: { backgroundColor: colors.secondary },
  btnSecondaryText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.foreground, includeFontPadding: false },
  btnDestructive: { backgroundColor: colors.destruct },
  btnDestructiveText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: '#21110e', includeFontPadding: false },
  btnNeutral: { backgroundColor: colors.muted },
  btnNeutralText: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.foreground, includeFontPadding: false },

  bodyText: { fontSize: 14, lineHeight: 24, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },

  themeGrid: { flexDirection: 'row', gap: 12 },
  themeCard: { flex: 1, borderRadius: 12, borderWidth: 2, padding: 12 },
  themeCardActive: { borderColor: colors.primary },
  themeCardInactive: { borderColor: colors.border },
  themePreview: { marginBottom: 12, height: 96, borderRadius: 8, padding: 8 },
  themeBar: { height: 8, width: 28, borderRadius: 4, backgroundColor: colors.primary, marginBottom: 8 },
  themeRow: { height: 24, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(129,146,135,0.3)', backgroundColor: 'rgba(129,146,135,0.2)' },
  themeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeLabel: { fontSize: 12, fontFamily: fonts.body, color: colors.foreground, textTransform: 'capitalize', includeFontPadding: false },

  accountCard: { borderRadius: 12, backgroundColor: colors.card, padding: 16 },
  accountName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.foreground, includeFontPadding: false },
  accountEmail: { fontSize: 12, color: colors.mutedForeground, fontFamily: fonts.body, marginTop: 4, includeFontPadding: false },
  accountSync: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  accountSyncText: { fontSize: 12, color: colors.mutedForeground, fontFamily: fonts.body, includeFontPadding: false },
  accountNotice: { fontSize: 12, lineHeight: 20, color: colors.mutedForeground, fontFamily: fonts.body, marginTop: 16, includeFontPadding: false },
}));

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({
  icon,
  title,
  detail,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="button"
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowTitle, danger && styles.rowDanger]}>{title}</Text>
      {detail !== undefined && <Text style={styles.rowDetail}>{detail}</Text>}
      <ChevronRightIcon size={15} color={colors.mutedForeground} />
    </Pressable>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: () => void;
  label: string;
}) {
  const styles = useStyles();
  const tx = useRef(new Animated.Value(value ? 20 : 0)).current;
  useEffect(() => {
    Animated.timing(tx, {
      toValue: value ? 20 : 0,
      duration: 160,
      easing: cssEaseOut,
      useNativeDriver: true,
    }).start();
  }, [value]);
  return (
    <Pressable
      onPress={onChange}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={styles.toggleWrapper}
    >
      <View style={[styles.toggleTrack, value ? styles.toggleOn : styles.toggleOff]}>
        <Animated.View style={[styles.toggleKnob, { transform: [{ translateX: tx }] }]} />
      </View>
    </Pressable>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────
export function SettingsScreen({ onNavigate }: Props) {
  const styles = useStyles();
  const { authState, signOut } = useAuth();
  const { farms, restoreStarterSeeds } = useStore();
  const insets = useSafeAreaInsets();
  const themeCtx = useTheme();
  const { colors, resetPrefs } = themeCtx;
  const [prefs, setPrefs] = useState<Prefs>(themeCtx.prefs);

  useEffect(() => {
    setPrefs(themeCtx.prefs);
  }, [themeCtx.prefs]);

  const updatePrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      if (patch.theme) {
        themeCtx.setPreference(patch.theme).catch(() => {});
      }
      themeCtx.updatePrefs(next).catch(() => {});
      return next;
    });
  }, [themeCtx]);

  const account = authState.status === 'authenticated' ? authState.account : null;
  const guest = !account || account.mode === 'guest';

  const [overlay, setOverlay] = useState<OverlayId>('');
  const [overlayClosing, setOverlayClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enter page animation
  const enterOp = useRef(new Animated.Value(0)).current;
  const enterTy = useRef(new Animated.Value(8)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(enterOp, { toValue: 1, duration: 200, easing: cssEaseOut, useNativeDriver: true }),
      Animated.timing(enterTy, { toValue: 0, duration: 200, easing: cssEaseOut, useNativeDriver: true }),
    ]).start();
  }, []);

  // Sheet + backdrop animations
  const sheetTy = useRef(new Animated.Value(800)).current;
  const backdropOp = useRef(new Animated.Value(0)).current;

  const openOverlay = useCallback((id: OverlayId) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOverlay(id);
    setOverlayClosing(false);
    backdropOp.setValue(0);
    sheetTy.setValue(600);
    if (!CONFIRM_OVERLAYS.includes(id as string)) {
      Animated.parallel([
        Animated.timing(backdropOp, { toValue: 1, duration: 250, easing: cssEaseOut, useNativeDriver: true }),
        Animated.timing(sheetTy, { toValue: 0, duration: 250, easing: sheetEasing, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(backdropOp, { toValue: 1, duration: 200, easing: cssEaseOut, useNativeDriver: true }).start();
    }
  }, []);

  const closeOverlay = useCallback(() => {
    if (closeTimer.current) return;
    setOverlayClosing(true);
    Animated.parallel([
      Animated.timing(backdropOp, { toValue: 0, duration: 160, easing: cssEaseIn, useNativeDriver: true }),
      Animated.timing(sheetTy, { toValue: 600, duration: 160, easing: cssEaseIn, useNativeDriver: true }),
    ]).start();
    closeTimer.current = setTimeout(() => {
      setOverlay(''); setOverlayClosing(false); closeTimer.current = null;
    }, 160);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }, []);

  const handleRestoreSeeds = useCallback(async () => {
    await restoreStarterSeeds();
    closeOverlay();
    showToast('Starter seeds restored');
  }, [restoreStarterSeeds, closeOverlay, showToast]);

  const handleResetData = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const farmKeys = keys.filter(
        (k) => k === 'growtopia-farm-tracker' ||
               (k.startsWith('growtrack-') && (k.includes('farms') || k.includes('seeds') || k === 'growtrack-prefs'))
      );
      if (farmKeys.length > 0) await AsyncStorage.multiRemove(farmKeys);
    } catch { /* ignore */ }
    await resetPrefs();
    closeOverlay();
    showToast('Done. Your data has been updated.');
  }, [closeOverlay, showToast, resetPrefs]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    // Auth gate will redirect to Login automatically via authState change
  }, [signOut]);

  const isConfirm = CONFIRM_OVERLAYS.includes(overlay as string);
  const pb = Math.max(24, insets.bottom);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 112 + pb }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: enterOp, transform: [{ translateY: enterTy }] }}>
            {/* Heading */}
            <Text style={styles.h1} allowFontScaling={false}>Settings</Text>
            <Text style={styles.subtitle}>Make GrowTrack work for you.</Text>

            {/* APPEARANCE */}
            <Section label="APPEARANCE">
              <Row
                icon={<MoonIcon size={18} color={colors.mutedForeground} />}
                title="Theme"
                detail={prefs.theme.charAt(0).toUpperCase() + prefs.theme.slice(1)}
                onPress={() => openOverlay('theme')}
              />
            </Section>

            {/* NOTIFICATIONS */}
            <Section label="NOTIFICATIONS">
              <View style={styles.notifRow}>
                <BellIcon size={18} color={colors.mutedForeground} />
                <Text style={styles.notifLabel}>Harvest notifications</Text>
                <Toggle
                  value={prefs.notifications}
                  onChange={() => updatePrefs({ notifications: !prefs.notifications })}
                  label="Enable harvest notifications"
                />
              </View>
            </Section>

            {/* FARM TRACKING */}
            <Section label="FARM TRACKING">
              <Row
                icon={<Clock3Icon size={18} color={colors.mutedForeground} />}
                title="Default grow-time behavior"
                detail={prefs.behavior === 'seed' ? 'Use seed time' : 'Manual'}
                onPress={() => openOverlay('behavior')}
              />
              <Row
                icon={<SunIcon size={18} color={colors.mutedForeground} />}
                title="Time format"
                detail={`${prefs.time}-hour`}
                onPress={() => updatePrefs({ time: prefs.time === '24' ? '12' : '24' })}
              />
            </Section>

            {/* DATA */}
            <Section label="DATA">
              <Row
                icon={<RotateCcwIcon size={18} color={colors.mutedForeground} />}
                title="Restore default seeds"
                onPress={() => openOverlay('restore')}
              />
              <Row
                icon={<Trash2Icon size={18} color={colors.mutedForeground} />}
                title="Reset app data"
                onPress={() => openOverlay('reset-data')}
                danger
              />
            </Section>

            {/* ABOUT */}
            <Section label="ABOUT">
              <Row
                icon={<CircleHelpIcon size={18} color={colors.mutedForeground} />}
                title="About GrowTrack"
                onPress={() => openOverlay('about')}
              />
              <Row
                icon={<InfoIcon size={18} color={colors.mutedForeground} />}
                title="Version"
                detail="1.0.0"
                onPress={() => showToast("You're up to date")}
              />
              <Row
                icon={<SproutIcon size={18} color={colors.mutedForeground} />}
                title="Getting started"
                onPress={() => openOverlay('onboarding')}
              />
            </Section>

            {/* ACCOUNT */}
            <Section label="ACCOUNT">
              <Row
                icon={<LogInIcon size={18} color={colors.mutedForeground} />}
                title={guest ? 'Guest Mode / Sign in' : 'Account'}
                detail={guest ? `${farms.length} / 5 farms` : (account?.name ?? '')}
                onPress={() => openOverlay('account')}
              />
            </Section>

            {/* Footer */}
            <Text style={styles.tagline} allowFontScaling={false}>Keep every farm growing.</Text>
          </Animated.View>
        </ScrollView>

        <TabBar active="settings" onNavigate={onNavigate} />
      </View>

      {/* Toast */}
      {toast !== '' && (
        <View style={[styles.toast, { bottom: Math.max(80, insets.bottom + 68) }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}

      {/* Overlay */}
      {overlay !== '' && (
        <Modal transparent visible animationType="none" onRequestClose={closeOverlay} statusBarTranslucent>
          <Animated.View style={[styles.backdrop, { opacity: backdropOp }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeOverlay} />
          </Animated.View>

          {isConfirm ? (
            <View style={styles.dialogContainer} pointerEvents="box-none">
              <ConfirmDialog
                overlay={overlay}
                onClose={closeOverlay}
                onRestore={handleRestoreSeeds}
                onResetData={handleResetData}
              />
            </View>
          ) : (
            <View style={styles.sheetContainer} pointerEvents="box-none">
              <Animated.ScrollView
                style={[styles.sheet, { transform: [{ translateY: sheetTy }] }]}
                contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom) }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.dragHandle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle} allowFontScaling={false}>
                    {({
                      theme: 'Choose your theme',
                      account: 'Your farms, everywhere',
                      about: 'About GrowTrack',
                      behavior: 'Default grow time',
                      onboarding: 'GrowTrack',
                    } as Record<string, string>)[overlay] ?? ''}
                  </Text>
                  <Pressable onPress={closeOverlay} style={styles.closeBtn} accessibilityLabel="Close dialog">
                    <XIcon size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {overlay === 'theme' && <ThemeOverlay prefs={prefs} onUpdate={updatePrefs} />}
                {overlay === 'behavior' && (
                  <BehaviorOverlay
                    prefs={prefs}
                    onUpdate={(p) => { updatePrefs(p); closeOverlay(); }}
                  />
                )}
                {overlay === 'account' && (
                  <AccountOverlay
                    guest={guest}
                    account={account}
                    onSignOut={handleSignOut}
                    onNavigate={onNavigate}
                    onClose={closeOverlay}
                  />
                )}
                {overlay === 'about' && <AboutOverlay />}
                {overlay === 'onboarding' && (
                  <Text style={styles.bodyText}>Getting started guide coming soon.</Text>
                )}
              </Animated.ScrollView>
            </View>
          )}
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  overlay,
  onClose,
  onRestore,
  onResetData,
}: {
  overlay: OverlayId;
  onClose: () => void;
  onRestore: () => void;
  onResetData: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const isRestore = overlay === 'restore';
  const title = isRestore ? 'Restore default seeds?' : 'Reset app data?';
  const body = isRestore
    ? "Restore GrowTrack's starter seed library. Your custom seeds and farm timers will stay unchanged."
    : 'This will remove your farms, custom seeds, and app preferences. This cannot be undone.';
  const confirmLabel = isRestore ? 'Restore' : 'Reset data';

  return (
    <View style={styles.dialog}>
      <View style={styles.dialogHeader}>
        <Text style={styles.sheetTitle} allowFontScaling={false}>{title}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close dialog">
          <XIcon size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={styles.dialogBody}>{body}</Text>
      <View style={styles.dialogActions}>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.btn, styles.btnSecondary, styles.btnFlex, pressed && styles.btnPressedStyle]}
        >
          <Text style={styles.btnSecondaryText}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={isRestore ? onRestore : onResetData}
          style={({ pressed }) => [
            styles.btn, styles.btnFlex,
            isRestore ? styles.btnPrimary : styles.btnDestructive,
            pressed && styles.btnPressedStyle,
          ]}
        >
          <Text style={isRestore ? styles.btnPrimaryText : styles.btnDestructiveText}>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── ThemeOverlay ─────────────────────────────────────────────────────────────
function ThemeOverlay({ prefs, onUpdate }: { prefs: Prefs; onUpdate: (p: Partial<Prefs>) => void }) {
  const styles = useStyles();
  const { colors, setPreference } = useTheme();
  const themes: Array<{ id: 'dark' | 'light' | 'system'; label: string; bg: string }> = [
    { id: 'dark', label: 'Dark', bg: '#0d1715' },
    { id: 'light', label: 'Light', bg: '#edf2e8' },
    { id: 'system', label: 'System', bg: '#555f5c' },
  ];
  return (
    <View style={styles.themeGrid}>
      {themes.map(({ id, label, bg }) => {
        const active = prefs.theme === id;
        return (
          <Pressable
            key={id}
            onPress={() => {
              setPreference(id);
              onUpdate({ theme: id });
            }}
            style={[styles.themeCard, active ? styles.themeCardActive : styles.themeCardInactive]}
          >
            <View style={[styles.themePreview, { backgroundColor: bg }]}>
              <View style={styles.themeBar} />
              <View style={styles.themeRow} />
              <View style={[styles.themeRow, { marginTop: 8 }]} />
            </View>
            <View style={styles.themeFooter}>
              <Text style={styles.themeLabel}>{label}</Text>
              {active && <CheckIcon size={14} color={colors.primary} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── BehaviorOverlay ──────────────────────────────────────────────────────────
function BehaviorOverlay({
  prefs,
  onUpdate,
}: {
  prefs: Prefs;
  onUpdate: (p: Partial<Prefs>) => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const opts: Array<{ id: 'seed' | 'manual'; title: string; detail: string }> = [
    { id: 'seed', title: 'Use seed time', detail: "Farm timers follow the seed's grow time." },
    { id: 'manual', title: 'Manual only', detail: 'Set a custom time for each farm.' },
  ];
  return (
    <View>
      {opts.map(({ id, title, detail }) => (
        <Pressable
          key={id}
          onPress={() => onUpdate({ behavior: id })}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            {prefs.behavior === id
              ? <CheckIcon size={18} color={colors.primary} />
              : <View style={{ width: 18, height: 18 }} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{title}</Text>
            <Text style={styles.rowDetail}>{detail}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

// ─── AccountOverlay ───────────────────────────────────────────────────────────
function AccountOverlay({
  guest,
  account,
  onSignOut,
  onNavigate,
  onClose,
}: {
  guest: boolean;
  account: { name: string; email?: string; mode: string } | null;
  onSignOut: () => void;
  onNavigate: (r: Route) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (guest) {
    return (
      <View>
        <Text style={styles.bodyText}>
          You're growing as a Guest. Track up to 5 farms, with timers and preferences saved on this device.
        </Text>
        <Text style={[styles.bodyText, { marginTop: 12 }]}>
          Create an account to manage more farms. Cross-device synchronization is coming in a future update.
        </Text>
        <Pressable
          onPress={() => { onClose(); onNavigate({ name: 'dashboard' }); }}
          style={({ pressed }) => [styles.btn, styles.btnPrimary, { marginTop: 24, width: '100%' }, pressed && styles.btnPressedStyle]}
        >
          <Text style={styles.btnPrimaryText}>Create Account</Text>
        </Pressable>
        <Pressable
          onPress={() => { onClose(); onNavigate({ name: 'dashboard' }); }}
          style={({ pressed }) => [styles.btn, styles.btnSecondary, { marginTop: 12, width: '100%' }, pressed && styles.btnPressedStyle]}
        >
          <Text style={styles.btnSecondaryText}>Sign In</Text>
        </Pressable>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.btn, styles.btnNeutral, { marginTop: 8, width: '100%' }, pressed && styles.btnPressedStyle]}
        >
          <Text style={styles.btnNeutralText}>Not now</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View>
      <View style={styles.accountCard}>
        <Text style={styles.accountName}>{account?.name ?? ''}</Text>
        <Text style={styles.accountEmail} numberOfLines={2}>{account?.email ?? ''}</Text>
        <View style={styles.accountSync}>
          <ShieldCheckIcon size={14} color={colors.accentBlue} />
          <Text style={styles.accountSyncText}>Sync status · Saved on this device</Text>
        </View>
      </View>
      <Text style={styles.accountNotice}>
        This is a preview account. Cloud synchronization is not connected yet. Your farm timers remain on this device.
      </Text>
      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [styles.btn, styles.btnSecondary, { marginTop: 20, width: '100%' }, pressed && styles.btnPressedStyle]}
      >
        <Text style={styles.btnSecondaryText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

// ─── AboutOverlay ─────────────────────────────────────────────────────────────
function AboutOverlay() {
  const styles = useStyles();
  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.bodyText}>
        Built for growers who have more than one world to look after. Track, harvest, and replant — without the world-hopping.
      </Text>
      <Text style={styles.bodyText}>
        GrowTrack is an independent companion, not affiliated with Ubisoft or Growtopia. Item imagery belongs to its respective owners.
      </Text>
      <Text style={[styles.bodyText, { fontSize: 12 }]}>
        Version 1.0.0 · Timers and preferences saved on this device. Browser harvest alerts require notification permission; notifications while the app is closed need future background support.
      </Text>
    </View>
  );
}
