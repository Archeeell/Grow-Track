import { Text, View } from 'react-native';
import { fonts } from '../theme';
import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/ThemeContext';
import type { HarvestStatus } from '../types';

const labels: Record<HarvestStatus, string> = {
  growing: 'GROWING',
  ready: 'READY',
  harvested: 'HARVESTED',
};

const useStyles = makeStyles(() => ({
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
}));

export function StatusBadge({ status }: { status: HarvestStatus }) {
  const styles = useStyles();
  const { colors } = useTheme();

  const dotColors: Record<HarvestStatus, string> = {
    growing: colors.growing,
    ready: colors.primary,
    harvested: colors.mutedForeground,
  };

  const statusColor = dotColors[status];

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text style={[styles.text, { color: statusColor }]}>
        {labels[status]}
      </Text>
    </View>
  );
}
