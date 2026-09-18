import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, ScreenScroll } from '../components/Screen';
import { Button } from '../components/Button';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import { formatGrowTime } from '../utils/time';

type Props = {
  onBack: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
};

export function SeedManagerScreen({ onBack, onAdd, onEdit }: Props) {
  const { seeds, restoreStarterSeeds } = useStore();

  return (
    <Screen title="Seed table" onBack={onBack} rightLabel="Add" onRight={onAdd}>
      <ScreenScroll>
        <Text style={styles.banner}>
          Starter times use Growtopia’s rarity formula and may be outdated. Edit anything that doesn’t match in-game.
        </Text>
        {seeds.map((seed) => (
          <Pressable
            key={seed.id}
            accessibilityRole="button"
            onPress={() => onEdit(seed.id)}
            style={styles.row}
          >
            <View style={styles.flex}>
              <Text style={styles.name}>{seed.name}</Text>
              <Text style={styles.meta}>
                Grow {formatGrowTime(seed.growTimeMinutes)}
                {seed.reharvestIntervalMinutes != null
                  ? ` · Re-harvest ${formatGrowTime(seed.reharvestIntervalMinutes)}`
                  : ' · One-time'}
              </Text>
            </View>
            <Text style={styles.edit}>Edit</Text>
          </Pressable>
        ))}
        <Button
          label="Restore missing starter seeds"
          variant="secondary"
          onPress={() => {
            void restoreStarterSeeds();
            // no-op besides restore; the list updates in place
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    color: colors.warningText,
    backgroundColor: colors.warningBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    lineHeight: 18,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13,
  },
  edit: {
    color: colors.accent,
    fontWeight: '700',
  },
});
