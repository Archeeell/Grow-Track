import { Text, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';
import type { HarvestStatus } from '../types';

const labels: Record<HarvestStatus, string> = {
  growing: 'Growing',
  ready: 'Ready',
  harvested: 'Harvested',
};

export function StatusBadge({ status }: { status: HarvestStatus }) {
  return (
    <Text
      style={[
        styles.badge,
        status === 'ready' && styles.ready,
        status === 'growing' && styles.growing,
        status === 'harvested' && styles.harvested,
      ]}
    >
      {labels[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ready: {
    backgroundColor: colors.accentDim,
    color: colors.accent,
  },
  growing: {
    backgroundColor: '#3A3418',
    color: colors.growing,
  },
  harvested: {
    backgroundColor: '#2A2818',
    color: '#C9B96A',
  },
});

