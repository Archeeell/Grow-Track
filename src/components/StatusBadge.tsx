import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import type { HarvestStatus } from '../types';

const labels: Record<HarvestStatus, string> = {
  growing: 'GROWING',
  ready: 'READY',
  harvested: 'HARVESTED',
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
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: fonts.bodyBold,
  },
});
