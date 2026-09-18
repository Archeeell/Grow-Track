import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Screen, ScreenScroll } from '../components/Screen';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import type { Farm } from '../types';
import { ensureNotificationPermission } from '../notifications';
import { confirmAction } from '../utils/confirm';
import {
  addMinutes,
  formatDateTime,
  parseDateTimeLocal,
  parseNonNegInt,
  toDateTimeLocalValue,
} from '../utils/time';

type Props = {
  farmId?: string;
  onBack: () => void;
};

export function FarmFormScreen({ farmId, onBack }: Props) {
  const { farms, seeds, addFarm, updateFarm, deleteFarm } = useStore();
  const existing = farmId ? farms.find((f) => f.id === farmId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [seedId, setSeedId] = useState<string | null>(existing?.seedId ?? seeds[0]?.id ?? null);
  const [startedHoursAgo, setStartedHoursAgo] = useState('');
  const [startedMinutesAgo, setStartedMinutesAgo] = useState('');
  const [remainHours, setRemainHours] = useState('');
  const [remainMinutes, setRemainMinutes] = useState('');
  const [exactReady, setExactReady] = useState(
    existing?.manualOverride ? toDateTimeLocalValue(existing.readyAt) : ''
  );
  const [notify, setNotify] = useState(existing?.notificationsEnabled ?? false);
  const [error, setError] = useState<string | null>(null);

  const selectedSeed = useMemo(
    () => (seedId ? seeds.find((s) => s.id === seedId) : undefined),
    [seedId, seeds]
  );

  const previewReady = useMemo(() => {
    try {
      return computeReady({
        seedGrowMinutes: selectedSeed?.growTimeMinutes,
        startedHoursAgo,
        startedMinutesAgo,
        remainHours,
        remainMinutes,
        exactReady,
        existing,
      }).readyAt;
    } catch {
      return null;
    }
  }, [
    exactReady,
    existing,
    remainHours,
    remainMinutes,
    selectedSeed,
    startedHoursAgo,
    startedMinutesAgo,
  ]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give this farm a name so you can spot it later.');
      return;
    }
    try {
      const computed = computeReady({
        seedGrowMinutes: selectedSeed?.growTimeMinutes,
        startedHoursAgo,
        startedMinutesAgo,
        remainHours,
        remainMinutes,
        exactReady,
        existing,
      });
      if (!selectedSeed && !computed.manualOverride) {
        setError('Pick a seed, or enter a remaining time / exact ready time.');
        return;
      }
      let notificationsEnabled = notify;
      if (notificationsEnabled) {
        const ok = await ensureNotificationPermission();
        if (!ok) {
          notificationsEnabled = false;
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(
              'Farm was saved without alerts. Enable notifications in the browser to get harvest pings.'
            );
          } else {
            Alert.alert(
              'Notifications blocked',
              'Farm was saved without alerts. Enable notifications in system settings to get harvest pings.'
            );
          }
        }
      }
      const payload: Omit<Farm, 'id' | 'createdAt' | 'lastNotifiedReadyAt'> = {
        name: trimmed,
        seedId: selectedSeed?.id ?? null,
        seedName: selectedSeed?.name ?? 'Custom / manual',
        plantedAt: computed.plantedAt,
        readyAt: computed.readyAt,
        manualOverride: computed.manualOverride,
        notificationsEnabled,
      };
      if (existing) {
        await updateFarm(existing.id, {
          ...payload,
          lastNotifiedReadyAt:
            payload.readyAt !== existing.readyAt ? null : existing.lastNotifiedReadyAt,
        });
      } else {
        await addFarm(payload);
      }
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this farm.');
    }
  };

  const remove = () => {
    if (!existing) return;
    confirmAction(
      'Delete farm?',
      `Remove "${existing.name}" from the tracker.`,
      'Delete',
      () => {
        void deleteFarm(existing.id).then(onBack);
      },
      true
    );
  };

  return (
    <Screen title={existing ? 'Edit farm' : 'Add farm'} onBack={onBack}>
      <ScreenScroll>
        <Field
          label="Farm name"
          placeholder="World ABCXYZ — Lower Left"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Seed type</Text>
        <View style={styles.chips}>
          <Chip
            label="Custom / manual"
            selected={seedId === null}
            onPress={() => setSeedId(null)}
          />
          {seeds.map((seed) => (
            <Chip
              key={seed.id}
              label={seed.name}
              selected={seedId === seed.id}
              onPress={() => setSeedId(seed.id)}
            />
          ))}
        </View>
        {selectedSeed ? (
          <Text style={styles.hint}>
            Grow time {selectedSeed.growTimeMinutes}m
            {selectedSeed.reharvestIntervalMinutes
              ? ` · re-harvest ${selectedSeed.reharvestIntervalMinutes}m`
              : ' · one-time harvest (reset after picking)'}
          </Text>
        ) : (
          <Text style={styles.hint}>Enter remaining time or an exact ready date below.</Text>
        )}

        <Text style={styles.section}>Start time (optional)</Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field
              label="Hours ago"
              keyboardType="numeric"
              value={startedHoursAgo}
              onChangeText={setStartedHoursAgo}
              placeholder="0"
            />
          </View>
          <View style={styles.flex}>
            <Field
              label="Minutes ago"
              keyboardType="numeric"
              value={startedMinutesAgo}
              onChangeText={setStartedMinutesAgo}
              placeholder="0"
            />
          </View>
        </View>

        <Text style={styles.section}>Manual override (always wins if set)</Text>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Field
              label="Hours left"
              keyboardType="numeric"
              value={remainHours}
              onChangeText={setRemainHours}
              placeholder=""
            />
          </View>
          <View style={styles.flex}>
            <Field
              label="Minutes left"
              keyboardType="numeric"
              value={remainMinutes}
              onChangeText={setRemainMinutes}
              placeholder=""
            />
          </View>
        </View>
        <Field
          label="Exact ready date/time"
          placeholder="YYYY-MM-DD HH:mm"
          value={exactReady}
          onChangeText={setExactReady}
          hint="Example: 2026-09-18 21:30. This takes priority over remaining time and seed grow time."
          autoCapitalize="none"
        />

        <View style={styles.notifyRow}>
          <View style={styles.flex}>
            <Text style={styles.notifyTitle}>Harvest notification</Text>
            <Text style={styles.hint}>Off by default. Works in the background on iOS/Android.</Text>
          </View>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ false: colors.border, true: colors.accentDim }}
            thumbColor={notify ? colors.accent : colors.muted}
          />
        </View>

        {previewReady ? (
          <Text style={styles.preview}>Ready at {formatDateTime(previewReady)}</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label={existing ? 'Save changes' : 'Add farm'} onPress={() => void save()} />
        {existing ? <Button label="Delete farm" variant="danger" onPress={remove} /> : null}
      </ScreenScroll>
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function computeReady(input: {
  seedGrowMinutes?: number;
  startedHoursAgo: string;
  startedMinutesAgo: string;
  remainHours: string;
  remainMinutes: string;
  exactReady: string;
  existing?: Farm;
}): { plantedAt: string; readyAt: string; manualOverride: boolean } {
  const now = new Date();
  const hasStartOffset =
    input.startedHoursAgo.trim() !== '' || input.startedMinutesAgo.trim() !== '';
  const hoursAgo = parseNonNegInt(input.startedHoursAgo) ?? 0;
  const minsAgo = parseNonNegInt(input.startedMinutesAgo) ?? 0;
  const offsetMin = hoursAgo * 60 + minsAgo;

  const plantedAt = hasStartOffset
    ? new Date(now.getTime() - offsetMin * 60_000).toISOString()
    : input.existing?.plantedAt ?? now.toISOString();

  const exact = parseDateTimeLocal(input.exactReady);
  if (exact) {
    return { plantedAt, readyAt: exact.toISOString(), manualOverride: true };
  }

  const remainH = parseNonNegInt(input.remainHours);
  const remainM = parseNonNegInt(input.remainMinutes);
  if (remainH !== null || remainM !== null) {
    const total = (remainH ?? 0) * 60 + (remainM ?? 0);
    return {
      plantedAt,
      readyAt: addMinutes(now.toISOString(), total),
      manualOverride: true,
    };
  }

  if (input.seedGrowMinutes != null) {
    if (input.existing && !hasStartOffset) {
      return {
        plantedAt,
        readyAt: addMinutes(plantedAt, input.seedGrowMinutes),
        manualOverride: false,
      };
    }
    return {
      plantedAt,
      readyAt: addMinutes(plantedAt, input.seedGrowMinutes),
      manualOverride: false,
    };
  }

  if (input.existing) {
    return {
      plantedAt,
      readyAt: input.existing.readyAt,
      manualOverride: input.existing.manualOverride,
    };
  }

  throw new Error('Pick a seed or enter a manual time.');
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOn: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextOn: {
    color: colors.accent,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifyTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  preview: {
    color: colors.accent,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
  },
});
