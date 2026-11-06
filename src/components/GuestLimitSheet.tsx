/**
 * GuestLimitSheet — bottom sheet shown when a Guest user tries to add a 6th farm.
 * Design: Figma Make guest-limit dialog (aria-label="guest-limit").
 * Pattern: Modal transparent + slide + statusBarTranslucent (same as other sheets).
 */
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SproutIcon } from './auth/AuthIcons';
import { CheckCheckIcon } from './dashboard/DashboardIcons';
import { XIcon } from './settings/SettingsIcons';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';

const GUEST_FARM_LIMIT = 5;

type Props = {
  visible: boolean;
  farmCount: number;
  onClose: () => void;
  /** Navigate to auth screen to create account */
  onCreateAccount: () => void;
  /** Navigate to auth screen to sign in */
  onSignIn: () => void;
};

function useSafeInsets() {
  try {
    return useSafeAreaInsets();
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

const useStyles = makeStyles(({ colors }) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    width: '100%',
    maxHeight: '85%',
    padding: spacing.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: withAlpha(colors.mutedForeground, 0.40),
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.foreground,
    fontFamily: fonts.pixel,
    fontSize: 27,
    flex: 1,
    marginRight: 8,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Info card: SproutIcon + count text + CheckCheckIcon
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: spacing.md,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoCountText: {
    color: colors.foreground,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  infoSubText: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  bodyText: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  bodyText2: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  bodyTextXs: {
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  btnPrimaryText: {
    color: colors.primaryForeground,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  btnSecondaryText: {
    color: colors.foreground,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  btnGhost: {
    borderRadius: radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  btnGhostText: {
    color: colors.mutedForeground,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
}));

export function GuestLimitSheet({
  visible,
  farmCount,
  onClose,
  onCreateAccount,
  onSignIn,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) + 8 }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Guest farm limit reached</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close dialog"
              accessibilityRole="button"
            >
              <XIcon size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            <SproutIcon size={22} color={colors.primary} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoCountText}>
                {farmCount} / {GUEST_FARM_LIMIT} farms
              </Text>
              <Text style={styles.infoSubText}>Your worlds are still growing.</Text>
            </View>
            <CheckCheckIcon size={20} color={colors.primary} />
          </View>

          {/* Body texts */}
          <Text style={styles.bodyText}>
            You've reached the {GUEST_FARM_LIMIT}-farm limit for Guest Mode.
          </Text>
          <Text style={styles.bodyText2}>
            Create an account to manage more farms and get ready for access across devices.
          </Text>
          <Text style={styles.bodyTextXs}>
            Your guest farms carry over when you create an account. Cloud sync is coming soon.
          </Text>

          {/* Buttons */}
          <Pressable
            style={styles.btnPrimary}
            onPress={onCreateAccount}
            accessibilityRole="button"
          >
            <Text style={styles.btnPrimaryText}>Create Account</Text>
          </Pressable>
          <Pressable
            style={styles.btnSecondary}
            onPress={onSignIn}
            accessibilityRole="button"
          >
            <Text style={styles.btnSecondaryText}>Sign In</Text>
          </Pressable>
          <Pressable
            style={styles.btnGhost}
            onPress={onClose}
            accessibilityRole="button"
          >
            <Text style={styles.btnGhostText}>Not now</Text>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
