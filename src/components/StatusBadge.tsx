import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import type { HarvestStatus } from '../types';

const labels: Record<HarvestStatus, string> = {
  growing: 'Growing',
  ready: 'Ready to harvest',
  harvested: 'Harvested',
};

const dotColors: Record<HarvestStatus, string> = {
  growing: colors.growing,
  ready: colors.primary,
  harvested: colors.mutedForeground,
};

export function StatusBadge({ status }: { status: HarvestStatus }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColors[status] }]} />
      <Text style={[styles.text, { color: dotColors[status] }]}>
        {labels[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

