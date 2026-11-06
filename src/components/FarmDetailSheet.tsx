/**
 * FarmDetailSheet — bottom sheet shown when user taps a farm card.
 * Matches Figma Make design: handle bar, header, farm icon+name, status,
 * progress bar, countdown, estimated harvest row, notification row,
 * Edit Farm + Reset action buttons.
 */
import { Animated, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/withAlpha';
import type { Farm, HarvestStatus } from '../types';
import { formatCountdown, formatDateTime } from '../utils/time';
import { getSeedIcon, getSeedItemImage } from '../data/seedIcons';
import {
  StarIcon,
  CheckCheckIcon,
  CheckIcon,
} from './dashboard/DashboardIcons';
import {
  BellIcon,
  Clock3Icon,
  XIcon,
} from './settings/SettingsIcons';

const GROWING_COLOR = '#e6c16a';
const STAR_ACTIVE_COLOR = '#F2C94C';

type Props = {
  visible: boolean;
  farm: Farm | null;
  status: HarvestStatus;
  now: number;
  onClose: () => void;
  onEdit: () => void;
  onReset: () => void;
  onPin: () => void;
  onHarvest?: () => void;
  onSwap?: () => void;
  onReplant?: () => void;
};

/** Compute grow progress 0..1 */
function growProgress(farm: Farm, now: number): number {
  const plantedMs = new Date(farm.plantedAt).getTime();
  const readyMs = new Date(farm.readyAt).getTime();
  const totalMs = readyMs - plantedMs;
  if (totalMs <= 0) return 1;
  const elapsed = now - plantedMs;
  return Math.min(1, Math.max(0, elapsed / totalMs));
}

const useStyles = makeStyles(({ colors }) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.popover,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  actionsWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Handle bar
  handle: {
    width: 36,
    height: 4,
    backgroundColor: withAlpha(colors.mutedForeground, 0.40),
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  // Header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sheetTitle: {
    color: colors.foreground,
    fontSize: 27,
    fontWeight: '600',
    fontFamily: fonts.pixel,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Farm identity row
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.60),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemImage: {
    width: 40,
    height: 40,
  },
  iconEmoji: {
    fontSize: 32,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  farmName: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: fonts.bodyBold,
  },
  seedName: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  pinBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: fonts.bodyBold,
  },
  statusPct: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },

  // Progress bar
  progressTrack: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // Countdown
  countdownRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  countdown: {
    fontSize: 23,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.foreground,
  },
  countdownSuffix: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    marginLeft: 8,
  },

  // Info divider section
  infoSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  infoValue: {
    color: colors.foreground,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
    fontWeight: '600',
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  notifyText: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontFamily: fonts.body,
  },

  // Action buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPrimaryText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  btnSecondaryText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  btnLink: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnLinkText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.bodySemiBold,
  },
}));

function useSafeInsets() {
  try {
    return useSafeAreaInsets();
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
}

export function FarmDetailSheet({
  visible,
  farm,
  status,
  now,
  onClose,
  onEdit,
  onReset,
  onPin,
  onHarvest,
  onSwap,
  onReplant,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeInsets();

  const progressAnim = useRef(new Animated.Value(0)).current;

  const progress = farm ? growProgress(farm, now) : 0;
  const progressPct = Math.max(0, Math.min(100, Math.round(
    Number.isFinite(progress) ? progress * 100 : 0
  )));

  useEffect(() => {
    if (visible && farm) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, progress, farm, progressAnim]);

  if (!farm) return null;

  const isGrowing = status === 'growing';
  const isReady = status === 'ready';
  const isHarvested = status === 'harvested';

  const itemImage = getSeedItemImage(farm.seedId);
  const emoji = getSeedIcon(farm.seedId);

  const statusColor = isReady
    ? colors.primary
    : isGrowing
      ? GROWING_COLOR
      : colors.mutedForeground;

  const statusIcon = isReady ? (
    <CheckCheckIcon size={14} color={statusColor} />
  ) : isGrowing ? (
    <Clock3Icon size={14} color={statusColor} />
  ) : (
    <CheckIcon size={14} color={statusColor} />
  );

  const statusLabel = isReady ? 'READY' : isGrowing ? 'GROWING' : 'HARVESTED';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Full-screen backdrop */}
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Sheet panel */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Farm details</Text>
            <Pressable
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
            >
              <XIcon size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Scrollable content */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* ── Identity: icon + name/seed + pin ── */}
              <View style={styles.identityRow}>
                <View style={styles.iconBox}>
                  {itemImage ? (
                    <Image source={itemImage} style={styles.itemImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.iconEmoji}>{emoji}</Text>
                  )}
                </View>

                <View style={styles.nameBlock}>
                  <Text style={styles.farmName} numberOfLines={1}>{farm.name}</Text>
                  <Text style={styles.seedName} numberOfLines={1}>{farm.seedName}</Text>
                </View>

                <Pressable
                  style={styles.pinBtn}
                  onPress={onPin}
                  accessibilityRole="button"
                  accessibilityLabel={farm.pinned ? 'Unpin farm' : 'Pin farm'}
                >
                  <StarIcon
                    size={18}
                    color={farm.pinned ? STAR_ACTIVE_COLOR : withAlpha(colors.mutedForeground, 0.70)}
                    fill={farm.pinned ? STAR_ACTIVE_COLOR : 'none'}
                  />
                </Pressable>
              </View>

              {/* ── Status badge + percentage ── */}
              <View style={styles.statusRow}>
                <View style={styles.statusBadge}>
                  {statusIcon}
                  <Text style={[styles.statusLabel, { color: statusColor }]}>
                    {statusLabel}
                  </Text>
                </View>
                <Text style={styles.statusPct}>{progressPct}%</Text>
              </View>

              {/* ── Progress bar ── */}
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    isGrowing
                      ? {
                          width: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                          backgroundColor: colors.primary,
                        }
                      : isReady
                        ? {
                            width: '100%',
                            backgroundColor: colors.primary,
                          }
                        : {
                            width: '100%',
                            backgroundColor: withAlpha(colors.mutedForeground, 0.40),
                          },
                  ]}
                />
              </View>

              {/* ── Countdown / Status text ── */}
              <View style={styles.countdownRow}>
                {isGrowing ? (
                  <>
                    <Text style={styles.countdown}>
                      {formatCountdown(farm.readyAt, now)}
                    </Text>
                    <Text style={styles.countdownSuffix}>remaining</Text>
                  </>
                ) : isReady ? (
                  <Text style={[styles.countdown, { color: colors.primary }]}>
                    Ready to harvest
                  </Text>
                ) : (
                  <Text style={styles.countdown}>
                    Ready to plant again
                  </Text>
                )}
              </View>

              {/* ── Info section: estimated harvest + notification ── */}
              <View style={styles.infoSection}>
                {!isHarvested && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estimated harvest</Text>
                    <Text style={styles.infoValue}>{formatDateTime(farm.readyAt)}</Text>
                  </View>
                )}

                {farm.notificationsEnabled && (
                  <View style={[styles.notifyRow, isHarvested && { marginTop: 0 }]}>
                    <BellIcon size={14} color={colors.accentBlue} />
                    <Text style={styles.notifyText}>Harvest notification enabled</Text>
                  </View>
                )}

                {isHarvested && !farm.notificationsEnabled && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <Text style={styles.infoValue}>Ready to plant again</Text>
                  </View>
                )}
              </View>

            </ScrollView>

            {/* ── Action buttons (outside ScrollView, pinned at bottom) ── */}
            <View style={[styles.actionsWrapper, { paddingBottom: Math.max(insets.bottom, 24) }]}>
              {isReady ? (
                <>
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={onHarvest ?? onEdit}
                      accessibilityRole="button"
                    >
                      <Text style={styles.btnPrimaryText}>Harvest</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.btn, styles.btnSecondary]}
                      onPress={onSwap ?? onEdit}
                      accessibilityRole="button"
                    >
                      <Text style={styles.btnSecondaryText}>Swap</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.btnLink}
                    onPress={onEdit}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnLinkText}>Edit Farm</Text>
                  </Pressable>
                </>
              ) : isGrowing ? (
                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={onEdit}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnPrimaryText}>Edit Farm</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.btn, styles.btnSecondary]}
                    onPress={onReset}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnSecondaryText}>Reset</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={[styles.btn, styles.btnPrimary]}
                      onPress={onReplant ?? onEdit}
                      accessibilityRole="button"
                    >
                      <Text style={styles.btnPrimaryText}>Replant</Text>
                    </Pressable>
                  </View>
                  <Pressable
                    style={styles.btnLink}
                    onPress={onEdit}
                    accessibilityRole="button"
                  >
                    <Text style={styles.btnLinkText}>Edit Farm</Text>
                  </Pressable>
                </>
              )}
            </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}
