import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { FarmRow } from '../components/FarmRow';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import { useNow } from '../hooks/useNow';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import type { Farm, HarvestStatus } from '../types';
import { confirmAction } from '../utils/confirm';
import { getStatus } from '../utils/time';

const rank: Record<HarvestStatus, number> = {
  ready: 0,
  overdue: 1,
  growing: 2,
};

type Props = {
  onAddFarm: () => void;
  onOpenSeeds: () => void;
  onEditFarm: (id: string) => void;
};

export function DashboardScreen({ onAddFarm, onOpenSeeds, onEditFarm }: Props) {
  const { farms, resetFarm } = useStore();
  const now = useNow(1000);

  const sorted = useMemo(() => {
    return [...farms].sort((a, b) => {
      const sa = getStatus(a.readyAt, now);
      const sb = getStatus(b.readyAt, now);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      return new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime();
    });
  }, [farms, now]);

  const readyCount = sorted.filter((f) => getStatus(f.readyAt, now) !== 'growing').length;

  const confirmReset = (farm: Farm) => {
    confirmAction(
      'Reset timer?',
      `Start a new cycle for "${farm.name}" as if just planted.`,
      'Reset',
      () => void resetFarm(farm.id)
    );
  };

  return (
    <Screen title="Farms" rightLabel="Seeds" onRight={onOpenSeeds}>
      <View style={styles.body}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Grow times are estimates and can change in-game. Verify in Growtopia, then edit the seed table if needed.
          </Text>
        </View>
        <View style={styles.toolbar}>
          <Text style={styles.summary}>
            {farms.length === 0
              ? 'No farms yet'
              : `${readyCount} ready · ${farms.length} total`}
          </Text>
          <Button label="Add farm" onPress={onAddFarm} />
        </View>
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Track harvest windows in one place</Text>
              <Text style={styles.emptyBody}>
                Add each world or farm plot, pick a seed (or a manual timer), and check this list instead of logging into every world.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <FarmRow
              farm={item}
              now={now}
              status={getStatus(item.readyAt, now)}
              onPress={() => onEditFarm(item.id)}
              onReset={() => confirmReset(item)}
            />
          )}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  banner: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.warningText,
    fontSize: 13,
    lineHeight: 18,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summary: {
    color: colors.muted,
    fontWeight: '600',
    flex: 1,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: 32,
  },
  empty: {
    paddingVertical: 48,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.muted,
    lineHeight: 20,
  },
});
