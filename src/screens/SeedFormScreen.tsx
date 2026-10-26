import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';
import { confirmAction } from '../utils/confirm';
import { minutesToDHM, parseNonNegInt } from '../utils/time';
import { XIcon } from '../components/settings/SettingsIcons';

type Props = {
  seedId?: string;
  onBack: () => void;
};

const useStyles = makeStyles(({ colors }) => ({
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
    fontSize: 27,
    fontWeight: '600',
    fontFamily: fonts.pixel,
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
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
  sectionLabel: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: 14,
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
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: fonts.bodyBold,
  },
  deleteBtn: {
    backgroundColor: withAlpha(colors.destruct, 0.10),
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
}));

export function SeedFormScreen({ seedId, onBack }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
          <XIcon size={20} color={colors.mutedForeground} />
        </Pressable>
        <Text style={styles.title}>{existing ? 'Edit Seed' : 'Add Seed'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Seed name */}
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Seed name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Cactus"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        {/* Grow time */}
        <Text style={styles.sectionLabel}>Grow time (to first harvest)</Text>
        <View style={styles.dhmRow}>
          {[
            { label: 'Days', value: growDays, set: setGrowDays },
            { label: 'Hours', value: growHours, set: setGrowHours },
            { label: 'Mins', value: growMins, set: setGrowMins },
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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.saveBtn}
          onPress={() => void save()}
          accessibilityRole="button"
        >
          <Text style={styles.saveBtnText}>
            {existing ? 'Save seed' : 'Add seed'}
          </Text>
        </Pressable>

        {existing ? (
          <Pressable style={styles.deleteBtn} onPress={remove} accessibilityRole="button">
            <Text style={styles.deleteBtnText}>Delete seed</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
