import { Animated, Image, Pressable, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { fonts, radius, spacing } from '../theme';
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
  Repeat2Icon,
  EllipsisIcon,
} from './dashboard/DashboardIcons';
import { BellIcon } from './settings/SettingsIcons';

const STAR_ACTIVE_COLOR = '#F2C94C';
const GROWING_COLOR = '#e6c16a';

type Props = {
  farm: Farm;
  status: HarvestStatus;
  now: number;
  onPress: () => void;
  onReset: () => void;
  onSwap: () => void;
  onHarvested: () => void;
  onReplanted: () => void;
  onPin?: () => void;
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.70),
  },
  cardReady: {
    borderColor: withAlpha(colors.primary, 0.30),
    backgroundColor: colors.readyBg,
  },

  // ── Top row ───────────────────────────────────────────────
  topRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
  topRowPressable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.60),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },
  itemImage: {
    width: 32,
    height: 32,
  },
  iconEmoji: {
    fontSize: 26,
  },
  nameBlock: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center' as const,
  },
  name: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700' as const,
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
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },

  // ── GROWING state ──────────────────────────────────────────
  growingStatusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 16,
  },
  growingBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  growingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GROWING_COLOR,
  },
  growingLabel: {
    color: GROWING_COLOR,
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    fontFamily: fonts.bodyBold,
  },
  growingPct: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: fonts.bodySemiBold,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    overflow: 'hidden' as const,
    marginTop: 8,
  },
  progressFill: {
    height: '100%' as const,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  countdownRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
  },
  countdownLeft: {
    flexDirection: 'row' as const,
    alignItems: 'baseline' as const,
    gap: 4,
    flex: 1,
  },
  countdown: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: fonts.bodySemiBold,
  },
  countdownSuffix: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  harvestDateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 4,
  },
  harvestDate: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontFamily: fonts.body,
  },
  ellipsisBtn: {
    width: 40,
    height: 32,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: -8,
  },

  // ── READY / HARVESTED state ────────────────────────────────
  terminalRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginTop: 12,
    gap: 12,
  },
  terminalLeft: {
    flex: 1,
  },
  terminalBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  terminalBadgeLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    fontFamily: fonts.bodyBold,
  },
  terminalSubtext: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  terminalActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  swapBtn: {
    width: 44,
    height: 44,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  actionBtn: {
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 12,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: colors.secondary,
  },
  actionBtnPrimaryText: {
    color: colors.primaryForeground,
    fontWeight: '700' as const,
    fontSize: 12,
    fontFamily: fonts.bodyBold,
  },
  actionBtnSecondaryText: {
    color: colors.foreground,
    fontWeight: '600' as const,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },
}));

export function FarmCard({
  farm,
  status,
  now,
  onPress,
  onSwap,
  onHarvested,
  onReplanted,
  onPin,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const progress = growProgress(farm, now);
  const progressAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const isReady = status === 'ready';
  const isHarvested = status === 'harvested';
  const isGrowing = status === 'growing';

  const progressPct = Math.max(0, Math.min(100, Math.round(
    Number.isFinite(progress) ? progress * 100 : 0
  )));

  const itemImage = getSeedItemImage(farm.seedId);
  const emoji = getSeedIcon(farm.seedId);

  return (
    <View style={[styles.card, isReady && styles.cardReady]}>
      {/* Top row: icon + name + pin */}
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={onPress} style={styles.topRowPressable}>
          <View style={styles.iconBox}>
            {itemImage ? (
              <Image source={itemImage} style={styles.itemImage} resizeMode="contain" />
            ) : (
              <Text style={styles.iconEmoji}>{emoji}</Text>
            )}
          </View>

          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>{farm.name}</Text>
            <Text style={styles.seedName} numberOfLines={1}>{farm.seedName}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={onPin}
          style={styles.pinBtn}
          accessibilityRole="button"
          accessibilityLabel={farm.pinned ? 'Unpin farm' : 'Pin farm'}
        >
          <StarIcon
            size={18}
            color={farm.pinned ? STAR_ACTIVE_COLOR : colors.mutedForeground}
            fill={farm.pinned ? STAR_ACTIVE_COLOR : 'none'}
          />
        </Pressable>
      </View>

      {/* ── GROWING state ───────────────────────────────────── */}
      {isGrowing && (
        <>
          {/* Status badge + % */}
          <View style={styles.growingStatusRow}>
            <View style={styles.growingBadge}>
              <View style={styles.growingDot} />
              <Text style={styles.growingLabel}>GROWING</Text>
            </View>
            <Text style={styles.growingPct}>{progressPct}%</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Countdown + bell */}
          <View style={styles.countdownRow}>
            <View style={styles.countdownLeft}>
              <Text style={styles.countdown}>{formatCountdown(farm.readyAt, now)}</Text>
              <Text style={styles.countdownSuffix}>left</Text>
            </View>
            {farm.notificationsEnabled && (
              <BellIcon size={14} color={colors.accentBlue} />
            )}
          </View>

          {/* Harvest date + ellipsis */}
          <View style={styles.harvestDateRow}>
            <Text style={styles.harvestDate}>
              Harvest · {formatDateTime(farm.readyAt)}
            </Text>
            <Pressable
              style={styles.ellipsisBtn}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel="More actions"
            >
              <EllipsisIcon size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </>
      )}

      {/* ── READY / HARVESTED state ─────────────────────────── */}
      {(isReady || isHarvested) && (
        <View style={styles.terminalRow}>
          {/* Left: badge + sub-text */}
          <View style={styles.terminalLeft}>
            <View style={styles.terminalBadge}>
              {isReady ? (
                <CheckCheckIcon size={14} color={colors.primary} />
              ) : (
                <CheckIcon size={14} color={colors.mutedForeground} />
              )}
              <Text
                style={[
                  styles.terminalBadgeLabel,
                  { color: isReady ? colors.primary : colors.mutedForeground },
                ]}
              >
                {isReady ? 'READY' : 'HARVESTED'}
              </Text>
            </View>
            <Text style={styles.terminalSubtext}>
              {isReady ? 'Your next harvest is waiting.' : 'Ready to plant again'}
            </Text>
          </View>

          {/* Right: action buttons */}
          <View style={styles.terminalActions}>
            {isReady && (
              <Pressable
                style={styles.swapBtn}
                onPress={onSwap}
                accessibilityRole="button"
                accessibilityLabel="Swap seed"
              >
                <Repeat2Icon size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
            <Pressable
              style={[
                styles.actionBtn,
                isReady ? styles.actionBtnPrimary : styles.actionBtnSecondary,
              ]}
              onPress={isReady ? onHarvested : onReplanted}
              accessibilityRole="button"
            >
              <Text style={isReady ? styles.actionBtnPrimaryText : styles.actionBtnSecondaryText}>
                {isReady ? 'Harvest' : 'Replant'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// Keep old FarmRow export alias
export { FarmCard as FarmRow };
