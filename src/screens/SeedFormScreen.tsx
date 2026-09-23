import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Screen, ScreenScroll } from '../components/Screen';
import { useStore } from '../store';
import { colors, spacing } from '../theme';
import { confirmAction } from '../utils/confirm';
import { minutesToDHM, parseNonNegInt } from '../utils/time';

type Props = {
  seedId?: string;
  onBack: () => void;
};

export function SeedFormScreen({ seedId, onBack }: Props) {
  const { seeds, addSeed, updateSeed, deleteSeed } = useStore();
  const existing = seedId ? seeds.find((s) => s.id === seedId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');

  // Decompose existing grow time into days / hours / minutes
  const initDHM = existing ? minutesToDHM(existing.growTimeMinutes) : null;
  const [growDays, setGrowDays] = useState(initDHM ? String(initDHM.days) : '');
  const [growHours, setGrowHours] = useState(initDHM ? String(initDHM.hours) : '');
  const [growMins, setGrowMins] = useState(initDHM ? String(initDHM.minutes) : '');


  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Seed name is required.');
      return;
    }

    const days = parseNonNegInt(growDays || '0') ?? 0;
    const hours = parseNonNegInt(growHours || '0') ?? 0;
    const mins = parseNonNegInt(growMins || '0') ?? 0;
    const growMinutes = days * 24 * 60 + hours * 60 + mins;

    if (growMinutes < 1) {
      setError('Grow time must be at least 1 minute total.');
      return;
    }

    const payload = {
      name: trimmed,
      growTimeMinutes: growMinutes,
      reharvestIntervalMinutes: null,
    };
    if (existing) {
      await updateSeed(existing.id, payload);
    } else {
      await addSeed(payload);
    }
    onBack();
  };

  const remove = () => {
    if (!existing) return;
    confirmAction(
      'Delete seed?',
      `Farms using ${existing.name} will keep their current timers.`,
      'Delete',
      () => {
        void deleteSeed(existing.id).then(onBack);
      },
      true
    );
  };

  return (
    <Screen title={existing ? 'Edit seed' : 'Add seed'} onBack={onBack}>
      <ScreenScroll>
        <Field label="Seed name" value={name} onChangeText={setName} placeholder="Cactus" />

        <Text style={styles.groupLabel}>Grow time (to first harvest)</Text>
        <View style={styles.dhmRow}>
          <View style={styles.dhmField}>
            <Field
              label="Days"
              value={growDays}
              onChangeText={setGrowDays}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.dhmField}>
            <Field
              label="Hours"
              value={growHours}
              onChangeText={setGrowHours}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.dhmField}>
            <Field
              label="Minutes"
              value={growMins}
              onChangeText={setGrowMins}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>


        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={existing ? 'Save seed' : 'Add seed'} onPress={() => void save()} />
        {existing ? <Button label="Delete seed" variant="danger" onPress={remove} /> : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: {
    color: colors.danger,
  },
  groupLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  dhmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dhmField: {
    flex: 1,
  },
});
