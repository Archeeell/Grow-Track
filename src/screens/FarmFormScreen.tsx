import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { colors, radius, spacing } from '../theme';
import type { Farm } from '../types';
import { ensureNotificationPermission } from '../notifications';
import { confirmAction } from '../utils/confirm';
import { getSeedIcon } from '../data/seedIcons';
import {
  addMinutes,
  formatDateTime,
  minutesToDHM,
  parseNonNegInt,
} from '../utils/time';

type Props = {
  farmId?: string;
  onBack: () => void;
};

export function FarmFormScreen({ farmId, onBack }: Props) {
  const { farms, seeds, addFarm, updateFarm, deleteFarm } = useStore();
  const existing = farmId ? farms.find((f) => f.id === farmId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [seedId, setSeedId] = useState<string | null>(
    existing?.seedId ?? seeds[0]?.id ?? null
  );
  const [notify, setNotify] = useState(existing?.notificationsEnabled ?? false);
  const [error, setError] = useState<string | null>(null);
  const [seedSearch, setSeedSearch] = useState('');

  // Grow duration remaining — days / hours / minutes
  const [remainDays, setRemainDays] = useState('');
  const [remainHours, setRemainHours] = useState('');
  const [remainMinutes, setRemainMinutes] = useState('');
  const [durationTouched, setDurationTouched] = useState(false);

  const selectedSeed = useMemo(
    () => (seedId ? seeds.find((s) => s.id === seedId) : undefined),
    [seedId, seeds]
  );

  useEffect(() => {
    if (durationTouched) return;
    if (selectedSeed) {
      const dhm = minutesToDHM(selectedSeed.growTimeMinutes);
      setRemainDays(dhm.days > 0 ? String(dhm.days) : '');
      setRemainHours(dhm.hours > 0 ? String(dhm.hours) : '');
      setRemainMinutes(dhm.minutes > 0 ? String(dhm.minutes) : '');
    } else if (existing) {
      const remainMs = new Date(existing.readyAt).getTime() - Date.now();
      if (remainMs > 0) {
        const dhm = minutesToDHM(Math.round(remainMs / 60_000));
        setRemainDays(dhm.days > 0 ? String(dhm.days) : '');
        setRemainHours(dhm.hours > 0 ? String(dhm.hours) : '');
        setRemainMinutes(dhm.minutes > 0 ? String(dhm.minutes) : '');
      } else {
        setRemainDays('');
        setRemainHours('');
        setRemainMinutes('');
      }
    } else {
      setRemainDays('');
      setRemainHours('');
      setRemainMinutes('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeed]);

  const handleSeedSelect = (id: string | null) => setSeedId(id);

  const handleDayChange = (v: string) => {
    setRemainDays(v);
    setDurationTouched(true);
  };
  const handleHourChange = (v: string) => {
    setRemainHours(v);
    setDurationTouched(true);
  };
  const handleMinuteChange = (v: string) => {
    setRemainMinutes(v);
    setDurationTouched(true);
  };

  const totalRemainMinutes = useMemo(() => {
    const d = parseNonNegInt(remainDays || '0') ?? 0;
    const h = parseNonNegInt(remainHours || '0') ?? 0;
    const m = parseNonNegInt(remainMinutes || '0') ?? 0;
    return d * 24 * 60 + h * 60 + m;
  }, [remainDays, remainHours, remainMinutes]);

  const previewReady = useMemo(() => {
    if (totalRemainMinutes < 1) return null;
    return addMinutes(new Date().toISOString(), totalRemainMinutes);
  }, [totalRemainMinutes]);

  const save = async () => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) {
      setError('Give this farm a name so you can spot it later.');
      return;
    }
    if (totalRemainMinutes < 1) {
      setError('Enter a remaining grow duration of at least 1 minute.');
      return;
    }

    const now = new Date();
    const readyAt = addMinutes(now.toISOString(), totalRemainMinutes);
    const plantedAt = selectedSeed
      ? addMinutes(
          now.toISOString(),
          -selectedSeed.growTimeMinutes + totalRemainMinutes
        )
      : now.toISOString();

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

    const payload: Omit<Farm, 'id' | 'createdAt' | 'lastNotifiedReadyAt' | 'harvestedAt'> = {
      name: trimmed,
      seedId: selectedSeed?.id ?? null,
      seedName: selectedSeed?.name ?? 'Custom / manual',
      plantedAt,
      readyAt,
      manualOverride: durationTouched || (existing ? existing.manualOverride : false),
      notificationsEnabled,
    };

    if (existing) {
      await updateFarm(existing.id, {
        ...payload,
        harvestedAt: existing.harvestedAt,
        lastNotifiedReadyAt:
          payload.readyAt !== existing.readyAt
            ? null
            : existing.lastNotifiedReadyAt,
      });
    } else {
      await addFarm(payload);
    }
    onBack();
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

  const filteredSeeds = useMemo(() => {
    const q = seedSearch.toLowerCase().trim();
    if (!q) return seeds;
    return seeds.filter((s) => s.name.toLowerCase().includes(q));
  }, [seeds, seedSearch]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.closeBtn} accessibilityRole="button">
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>{existing ? 'Edit Farm' : 'Add Farm'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Farm name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>World / Farm name</Text>
          <TextInput
            style={styles.input}
            placeholder="WORLD NAME"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
            autoCapitalize="characters"
          />
        </View>

        {/* Seed selector */}
        <Text style={styles.sectionLabel}>Seed type</Text>
        <View style={styles.seedSearchWrap}>
          <TextInput
            style={styles.seedSearchInput}
            placeholder="Search seeds…"
            placeholderTextColor={colors.mutedForeground}
            value={seedSearch}
            onChangeText={setSeedSearch}
          />
        </View>
        <View style={styles.seedGrid}>
          <SeedChip
            emoji="—"
            label="Custom / manual"
            selected={seedId === null}
            onPress={() => handleSeedSelect(null)}
          />
          {filteredSeeds.map((seed) => (
            <SeedChip
              key={seed.id}
              emoji={getSeedIcon(seed.id)}
              label={seed.name}
              selected={seedId === seed.id}
              onPress={() => handleSeedSelect(seed.id)}
            />
          ))}
        </View>

        {selectedSeed ? (
          <Text style={styles.hint}>
            Default grow time: {selectedSeed.growTimeMinutes}m · Adjust below if needed.
          </Text>
        ) : (
          <Text style={styles.hint}>Enter how long is left until harvest.</Text>
        )}

        {/* Duration */}
        <Text style={styles.sectionLabel}>Time remaining until harvest</Text>
        <View style={styles.dhmRow}>
          {[
            { label: 'Days', value: remainDays, set: handleDayChange },
            { label: 'Hours', value: remainHours, set: handleHourChange },
            { label: 'Mins', value: remainMinutes, set: handleMinuteChange },
          ].map(({ label, value, set }) => (
            <View key={label} style={styles.dhmCell}>
              <TextInput
                style={styles.dhmInput}
                value={value}
                onChangeText={set}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                textAlign="center"
              />
              <Text style={styles.dhmLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.notifyRow}>
          <View style={styles.flex}>
            <Text style={styles.notifyTitle}>Harvest notification</Text>
            <Text style={styles.hint}>Off by default. Works in the background on iOS/Android.</Text>
          </View>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ false: colors.border, true: colors.accentDim }}
            thumbColor={notify ? colors.primary : colors.mutedForeground}
          />
        </View>

        {/* Preview card */}
        {previewReady ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>⏱ ESTIMATED HARVEST</Text>
            <Text style={styles.previewTime}>{formatDateTime(previewReady)}</Text>
            {selectedSeed && (
              <Text style={styles.previewSeed}>{selectedSeed.name}</Text>
            )}
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.saveBtn}
          onPress={() => void save()}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>
            {existing ? 'Save changes' : 'Add farm'}
          </Text>
        </Pressable>

        {existing ? (
          <Pressable style={styles.deleteBtn} onPress={remove} accessibilityRole="button">
            <Text style={styles.deleteBtnText}>Delete farm</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SeedChip({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.seedChip, selected && styles.seedChipOn]}
    >
      <Text style={styles.seedChipEmoji}>{emoji}</Text>
      <Text style={[styles.seedChipText, selected && styles.seedChipTextOn]} numberOfLines={2}>
        {label}
      </Text>
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.mutedForeground,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.foreground,
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 14,
  },
  seedSearchWrap: {
    marginBottom: 8,
  },
  seedSearchInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    height: 40,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  seedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seedChip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 56,
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seedChipOn: {
    backgroundColor: 'rgba(69,212,131,0.10)',
    borderColor: colors.primary,
  },
  seedChipEmoji: {
    fontSize: 20,
  },
  seedChipText: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  seedChipTextOn: {
    color: colors.primary,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
  },
  dhmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dhmCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dhmInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    height: 64,
    width: '100%',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  dhmLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  flex: {
    flex: 1,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifyTitle: {
    color: colors.foreground,
    fontWeight: '700',
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: 'rgba(76,168,255,0.05)',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 2,
  },
  previewLabel: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  previewTime: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '700',
  },
  previewSeed: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  error: {
    color: colors.destruct,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#0B1510',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: 'rgba(233,106,106,0.10)',
    borderWidth: 1,
    borderColor: colors.destruct,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: colors.destruct,
    fontWeight: '700',
    fontSize: 15,
  },
});
