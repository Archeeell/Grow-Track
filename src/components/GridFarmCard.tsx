import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, spacing } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import { withAlpha } from '../theme/withAlpha';
import type { Farm, HarvestStatus } from '../types';
import { formatCountdown } from '../utils/time';
import { getSeedIcon, getSeedItemImage } from '../data/seedIcons';
import {
  CheckCheckIcon,
  CheckIcon,
  StarIcon,
} from './dashboard/DashboardIcons';
import { Clock3Icon } from './settings/SettingsIcons';

const STAR_ACTIVE_COLOR = '#F2C94C';

type Props = {
  farm: Farm;
  status: HarvestStatus;
  now: number;
  onPress: () => void;
  onPin?: () => void;
};

function growProgress(farm: Farm, now: number): number {
  if (!farm?.plantedAt || !farm?.readyAt) return 0;
  const plantedMs = new Date(farm.plantedAt).getTime();
  const readyMs = new Date(farm.readyAt).getTime();
  if (isNaN(plantedMs) || isNaN(readyMs)) return 0;
  const totalMs = readyMs - plantedMs;
  if (totalMs <= 0) return 1;
  const elapsed = now - plantedMs;
  const ratio = elapsed / totalMs;
  if (isNaN(ratio)) return 0;
  return Math.min(1, Math.max(0, ratio));
}

const useStyles = makeStyles(({ colors }) => ({
  card: {
    flex: 1,
    maxWidth: '48.5%',
    minHeight: 220,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.sm + 4,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.70),
    justifyContent: 'space-between',
  },
  cardReady: {
    borderColor: withAlpha(colors.primary, 0.35),
    backgroundColor: colors.readyBg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withAlpha(colors.border, 0.60),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 28,
    height: 28,
  },
  iconEmoji: {
    fontSize: 22,
  },
  pinBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -4,
    marginTop: -4,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.bodyBold,
    color: colors.foreground,
  },
  seedName: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontFamily: fonts.bodyBold,
  },
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
  progressFillHarvested: {
    backgroundColor: withAlpha(colors.mutedForeground, 0.40),
  },
  percentText: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontFamily: fonts.body,
    marginTop: 3,
  },
  bottomArea: {
    marginTop: 'auto',
    paddingTop: 10,
  },
  countdown: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
    color: colors.foreground,
  },
  readyLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  harvestedLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.mutedForeground,
  },
}));

export function GridFarmCard({ farm, status, now, onPress, onPin }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const isReady = status === 'ready';
  const isGrowing = status === 'growing';
  const isHarvested = status === 'harvested';

  const progress = growProgress(farm, now);
  const progressPct = Math.max(0, Math.min(100, Math.round((Number.isFinite(progress) ? progress : 0) * 100)));

  const itemImage = getSeedItemImage(farm.seedId);
  const emoji = getSeedIcon(farm.seedId);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isReady && styles.cardReady,
        pressed && { opacity: 0.9 },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${farm.name || 'Farm'}, ${status}. Open farm details`}
    >
      <View>
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
          <Pressable
            onPress={onPin}
            style={styles.pinBtn}
            accessibilityRole="button"
            accessibilityLabel={farm.pinned ? 'Unpin farm' : 'Pin farm'}
          >
            <StarIcon
              size={17}
              color={farm.pinned ? STAR_ACTIVE_COLOR : colors.mutedForeground}
              fill={farm.pinned ? STAR_ACTIVE_COLOR : 'none'}
            />
          </Pressable>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {farm.name || 'Unnamed Farm'}
        </Text>
        <Text style={styles.seedName} numberOfLines={1}>
          {farm.seedName || 'Unknown seed'}
        </Text>

        <View style={styles.statusRow}>
          {isReady ? (
            <>
              <CheckCheckIcon size={13} color={colors.primary} />
              <Text style={[styles.statusText, { color: colors.primary }]}>READY</Text>
            </>
          ) : isGrowing ? (
            <>
              <Clock3Icon size={12} color={colors.growing} />
              <Text style={[styles.statusText, { color: colors.growing }]}>GROWING</Text>
            </>
          ) : (
            <>
              <CheckIcon size={13} color={colors.mutedForeground} />
              <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                HARVESTED
              </Text>
            </>
          )}
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              isHarvested && styles.progressFillHarvested,
              { width: `${isHarvested ? 100 : progressPct}%` },
            ]}
          />
        </View>
        <Text style={styles.percentText}>
          {isHarvested ? '—' : `${progressPct}%`}
        </Text>
      </View>

      <View style={styles.bottomArea}>
        {isGrowing ? (
          <Text style={styles.countdown} numberOfLines={1}>
            {formatCountdown(farm.readyAt, now)}
          </Text>
        ) : isReady ? (
          <Text style={styles.readyLabel}>READY TO HARVEST</Text>
        ) : (
          <Text style={styles.harvestedLabel}>Ready to plant</Text>
        )}
      </View>
    </Pressable>
  );
}
