import { Animated, Image, Pressable, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { fonts, radius, spacing } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/withAlpha';
import type { Farm, HarvestStatus } from '../types';
import { formatCountdown, formatDateTime } from '../utils/time';
import { getSeedIcon, getSeedItemImage } from '../data/seedIcons';
import { StarIcon } from './dashboard/DashboardIcons';
import { BellIcon } from './settings/SettingsIcons';

const STAR_ACTIVE_COLOR = '#F2C94C';

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

const STATUS_LABELS: Record<HarvestStatus, string> = {
  growing: 'GROWING',
  ready: 'READY',
  harvested: 'HARVESTED',
};

const useStyles = makeStyles(({ colors }) => ({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,    // rounded-2xl
    padding: spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.70),  // border-border/70
    gap: spacing.sm,
  },
  cardReady: {
    borderColor: withAlpha(colors.primary, 0.35),
    backgroundColor: colors.readyBg,
  },
  cardHarvested: {
    opacity: 0.65,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 6,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.60),   // border-border/60
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  name: {
    color: colors.foreground,
    fontSize: 15,
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
  },
  pinIcon: {
    fontSize: 18,
    color: colors.mutedForeground,
  },
  pinActive: {
    color: STAR_ACTIVE_COLOR,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: fonts.bodyBold,
  },
  progressPct: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: fonts.bodySemiBold,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.secondary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.growing,
    borderRadius: 3,
  },
  progressFillReady: {
    backgroundColor: colors.primary,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countdown: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fonts.bodyBold,
    flex: 1,
  },
  countdownReady: {
    color: colors.primary,
    fontSize: 16,
  },
  bellIcon: {
    fontSize: 15,
  },
  harvestDate: {
    color: colors.mutedForeground,
    fontSize: 11,
    marginTop: 2,
    fontFamily: fonts.body,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  actionBtnFull: {
    flex: 1,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnGhost: {
    paddingVertical: 4,
    minHeight: 40,
    justifyContent: 'center',
  },
  actionBtnText: {
    color: colors.mutedForeground,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
  actionBtnPrimaryText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: fonts.bodyBold,
  },
  actionBtnGhostText: {
    color: colors.mutedForeground,
    fontWeight: '600',
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
  },
}));

export function FarmCard({
  farm,
  status,
  now,
  onPress,
  onReset,
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
  const progressPct = Math.round(progress * 100);
  const itemImage = getSeedItemImage(farm.seedId);
  const emoji = getSeedIcon(farm.seedId);

  const statusColors: Record<HarvestStatus, string> = {
    growing: colors.growing,
    ready: colors.primary,
    harvested: colors.mutedForeground,
  };
  const statusColor = statusColors[status];

  return (
    <View
      style={[
        styles.card,
        isReady && styles.cardReady,
        isHarvested && styles.cardHarvested,
      ]}
    >
      <Pressable accessibilityRole="button" onPress={onPress}>
        {/* Top row: icon + name + pin */}
        <View style={styles.topRow}>
          <View style={styles.iconBox}>
            {itemImage ? (
              <Image
                source={itemImage}
                style={styles.itemImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.iconEmoji}>{emoji}</Text>
            )}
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {farm.name}
            </Text>
            <Text style={styles.seedName} numberOfLines={1}>
              {farm.seedName}
            </Text>
          </View>
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

        {/* Status + progress % row */}
        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {STATUS_LABELS[status]}
            </Text>
          </View>
          <Text style={styles.progressPct}>
            {isHarvested ? '—' : `${progressPct}%`}
          </Text>
        </View>

        {/* Progress bar */}
        {!isHarvested && (
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                isReady && styles.progressFillReady,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}

        {/* Countdown + notifications */}
        <View style={styles.countdownRow}>
          <Text
            style={[styles.countdown, isReady && styles.countdownReady]}
          >
            {isHarvested
              ? 'Waiting to replant'
              : isReady
              ? 'Ready to harvest'
              : formatCountdown(farm.readyAt, now)}
          </Text>
          {farm.notificationsEnabled && (
            <BellIcon size={14} color={colors.accentBlue} />
          )}
        </View>

        {/* Harvest date */}
        <Text style={styles.harvestDate}>
          Harvest · {formatDateTime(farm.readyAt)}
        </Text>
      </Pressable>

      {/* Action buttons */}
      <View style={styles.actions}>
        {isReady ? (
          <>
            <Pressable style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={onSwap}>
              <Text style={styles.actionBtnText}>Swap</Text>
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={onHarvested}>
              <Text style={styles.actionBtnPrimaryText}>Mark Harvested</Text>
            </Pressable>
          </>
        ) : isHarvested ? (
          <Pressable style={[styles.actionBtn, styles.actionBtnFull, styles.actionBtnPrimary]} onPress={onReplanted}>
            <Text style={styles.actionBtnPrimaryText}>Replant</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.actionBtnGhost} onPress={onReset}>
            <Text style={styles.actionBtnGhostText}>Reset timer</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Keep old FarmRow export alias
export { FarmCard as FarmRow };
