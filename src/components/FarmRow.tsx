import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import type { Farm, HarvestStatus } from '../types';
import { formatCountdown, formatDateTime } from '../utils/time';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

type Props = {
  farm: Farm;
  status: HarvestStatus;
  now: number;
  onPress: () => void;
  onReset: () => void;
};

export function FarmRow({ farm, status, now, onPress, onReset }: Props) {
  return (
    <View
      style={[
        styles.row,
        status === 'ready' && styles.ready,
        status === 'overdue' && styles.overdue,
      ]}
    >
      <Pressable accessibilityRole="button" onPress={onPress}>
        <View style={styles.top}>
          <View style={styles.titles}>
            <Text style={styles.name} numberOfLines={1}>
              {farm.name}
            </Text>
            <Text style={styles.seed} numberOfLines={1}>
              {farm.seedName}
              {farm.notificationsEnabled ? '  ·  notify' : ''}
            </Text>
          </View>
          <StatusBadge status={status} />
        </View>
        <Text style={[styles.countdown, status === 'ready' && styles.countdownReady]}>
          {formatCountdown(farm.readyAt, now)}
        </Text>
        <Text style={styles.meta}>Ready {formatDateTime(farm.readyAt)}</Text>
      </Pressable>
      <View style={styles.bottom}>
        <Button label="Reset" variant="secondary" onPress={onReset} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  ready: {
    backgroundColor: colors.readyBg,
    borderColor: colors.accentDim,
  },
  overdue: {
    backgroundColor: colors.overdueBg,
    borderColor: '#6B3328',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titles: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  seed: {
    color: colors.muted,
    marginTop: 2,
    fontSize: 13,
  },
  bottom: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  countdown: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  countdownReady: {
    color: colors.accent,
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
