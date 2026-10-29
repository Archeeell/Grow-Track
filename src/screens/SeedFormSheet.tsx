import { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useStore } from '../store';
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';
import { confirmAction } from '../utils/confirm';
import { minutesToDHM, parseNonNegInt } from '../utils/time';
import { XIcon } from '../components/settings/SettingsIcons';

type Props = {
  visible: boolean;
  seedId?: string;
  onClose: () => void;
};

const useStyles = makeStyles(({ colors }) => ({
  overlay: {
    flex: 1,
    backgroundColor: withAlpha(colors.bg, 0.80),
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: withAlpha(colors.mutedForeground, 0.30),
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: 27,
    fontWeight: '600',
    fontFamily: fonts.pixel,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  fieldWrap: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.body,
  },
  sectionLabel: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 12,
    fontFamily: fonts.bodySemiBold,
  },
  harvestRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  harvestBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestBtnActive: {
    borderColor: colors.primary,
  },
  harvestBtnText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  harvestBtnTextActive: {
    color: colors.primary,
  },
  dhmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dhmCell: {
    flex: 1,
    alignItems: 'center',
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
    fontFamily: fonts.bodyBold,
  },
  dhmLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: fonts.bodySemiBold,
  },
  error: {
    color: colors.destruct,
    fontSize: 13,
    marginBottom: spacing.sm,
    fontFamily: fonts.body,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
    fontFamily: fonts.bodyBold,
  },
}));

export function SeedFormSheet({ visible, seedId, onClose }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { seeds, addSeed, updateSeed, deleteSeed } = useStore();
  const existing = seedId ? seeds.find((s) => s.id === seedId) : undefined;
  const [name, setName] = useState('');
  const [growDays, setGrowDays] = useState('');
  const [growHours, setGrowHours] = useState('');
  const [growMins, setGrowMins] = useState('');
  const [harvestBehavior, setHarvestBehavior] = useState<'reharvest' | 'onetime'>('onetime');
  const [error, setError] = useState<string | null>(null);

  // Reset form ketika modal dibuka atau seedId berubah
  useEffect(() => {
    if (visible) {
      if (existing) {
        // Edit mode - isi dengan data existing seed
        setName(existing.name);
        const dhm = minutesToDHM(existing.growTimeMinutes);
        setGrowDays(String(dhm.days));
        setGrowHours(String(dhm.hours));
        setGrowMins(String(dhm.minutes));
        setHarvestBehavior(existing.reharvestIntervalMinutes != null ? 'reharvest' : 'onetime');
      } else {
        // Add mode - reset ke kosong
        setName('');
        setGrowDays('');
        setGrowHours('');
        setGrowMins('');
        setHarvestBehavior('onetime');
      }
      setError(null);
    }
  }, [visible, seedId, existing]);

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
      reharvestIntervalMinutes: harvestBehavior === 'reharvest' ? growMinutes : null,
    };
    if (existing) {
      await updateSeed(existing.id, payload);
    } else {
      await addSeed(payload);
    }
    onClose();
  };

  const remove = () => {
    if (!existing) return;
    confirmAction(
      'Delete seed?',
      `Farms using ${existing.name} will keep their current timers.`,
      'Delete',
      () => {
        void deleteSeed(existing.id).then(onClose);
      },
      true
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>{existing ? 'Edit Seed' : 'Add Seed'}</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <XIcon size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Seed name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seed name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>

            <Text style={styles.sectionLabel}>Grow duration</Text>
            <View style={styles.dhmRow}>
              {[
                { label: 'Days', value: growDays, set: setGrowDays, max: 365 },
                { label: 'Hours', value: growHours, set: setGrowHours, max: 23 },
                { label: 'Minutes', value: growMins, set: setGrowMins, max: 59 },
              ].map(({ label, value, set, max }) => (
                <View key={label} style={styles.dhmCell}>
                  <TextInput
                    style={styles.dhmInput}
                    value={value}
                    onChangeText={set}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="center"
                    maxLength={label === 'Days' ? 3 : 2}
                  />
                  <Text style={styles.dhmLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Harvest behavior</Text>
            <View style={styles.harvestRow}>
              <Pressable
                style={[
                  styles.harvestBtn,
                  harvestBehavior === 'reharvest' && styles.harvestBtnActive,
                ]}
                onPress={() => setHarvestBehavior('reharvest')}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.harvestBtnText,
                    harvestBehavior === 'reharvest' && styles.harvestBtnTextActive,
                  ]}
                >
                  Re-harvestable
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.harvestBtn,
                  harvestBehavior === 'onetime' && styles.harvestBtnActive,
                ]}
                onPress={() => setHarvestBehavior('onetime')}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.harvestBtnText,
                    harvestBehavior === 'onetime' && styles.harvestBtnTextActive,
                  ]}
                >
                  One-time
                </Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={styles.saveBtn}
              onPress={() => void save()}
              accessibilityRole="button"
            >
              <Text style={styles.saveBtnText}>Save Seed</Text>
            </Pressable>

            {existing ? (
              <Pressable style={styles.deleteBtn} onPress={remove} accessibilityRole="button">
                <Text style={styles.deleteBtnText}>Delete Seed</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
