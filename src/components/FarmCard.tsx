import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, radius, spacing } from '../theme';
import type { Farm, HarvestStatus } from '../types';
import { formatCountdown, formatDateTime, getStatus } from '../utils/time';
import { getSeedIcon } from '../data/seedIcons';
import { StatusBadge } from './StatusBadge';

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
  const progress = growProgress(farm, now);
  const progressAnim = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const isReady = status === 'ready';
  const isHarvested = status === 'harvested';
  const progressPct = Math.round(progress * 100);
  const icon = getSeedIcon(farm.seedId);

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
            <Text style={styles.iconEmoji}>{icon}</Text>
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
            <Text style={[styles.pinIcon, farm.pinned && styles.pinActive]}>
              {farm.pinned ? '⭐' : '☆'}
            </Text>
          </Pressable>
        </View>

        {/* Status + progress % row */}
        <View style={styles.statusRow}>
          <StatusBadge status={status} />
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
              ? '✓ Ready to harvest'
              : formatCountdown(farm.readyAt, now)}
          </Text>
          {farm.notificationsEnabled && (
            <Text style={styles.bellIcon}>🔔</Text>
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

// Keep old FarmRow export so existing import in DashboardScreen still resolves
// (we'll update DashboardScreen separately)
export { FarmCard as FarmRow };

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  cardReady: {
    borderColor: 'rgba(69,212,131,0.5)',
    backgroundColor: 'rgba(69,212,131,0.04)',
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
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  seedName: {
    color: colors.mutedForeground,
    fontSize: 13,
    marginTop: 2,
  },
  pinBtn: {
    padding: 4,
  },
  pinIcon: {
    fontSize: 18,
    color: colors.mutedForeground,
  },
  pinActive: {
    color: '#f5c842',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressPct: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
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
    fontVariant: ['tabular-nums'],
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
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 36,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnGhost: {
    paddingVertical: 4,
  },
  actionBtnText: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 13,
  },
  actionBtnPrimaryText: {
    color: '#0B1510',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnGhostText: {
    color: colors.mutedForeground,
    fontWeight: '600',
    fontSize: 13,
  },
});
