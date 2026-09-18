import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Screen, ScreenScroll } from '../components/Screen';
import { useStore } from '../store';
import { colors } from '../theme';
import { confirmAction } from '../utils/confirm';
import { parseNonNegInt } from '../utils/time';

type Props = {
  seedId?: string;
  onBack: () => void;
};

export function SeedFormScreen({ seedId, onBack }: Props) {
  const { seeds, addSeed, updateSeed, deleteSeed } = useStore();
  const existing = seedId ? seeds.find((s) => s.id === seedId) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [grow, setGrow] = useState(
    existing ? String(existing.growTimeMinutes) : ''
  );
  const [reharvest, setReharvest] = useState(
    existing?.reharvestIntervalMinutes != null
      ? String(existing.reharvestIntervalMinutes)
      : ''
  );
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim();
    const growMinutes = parseNonNegInt(grow);
    if (!trimmed) {
      setError('Seed name is required.');
      return;
    }
    if (growMinutes === null || growMinutes < 1) {
      setError('Grow time must be at least 1 minute.');
      return;
    }
    const reharvestMinutes = parseNonNegInt(reharvest);
    const payload = {
      name: trimmed,
      growTimeMinutes: growMinutes,
      reharvestIntervalMinutes: reharvestMinutes && reharvestMinutes > 0 ? reharvestMinutes : null,
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
        <Field
          label="Grow time (minutes to first harvest)"
          value={grow}
          onChangeText={setGrow}
          keyboardType="numeric"
          placeholder="90"
        />
        <Field
          label="Re-harvest interval (minutes, optional)"
          value={reharvest}
          onChangeText={setReharvest}
          keyboardType="numeric"
          placeholder="Leave empty for one-time / replant"
          hint="Most Growtopia trees are harvested once, then replanted. Leave this empty unless the plant regrows on its own."
        />
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
});
