import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import { fonts, radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { makeStyles } from '../theme/makeStyles';
import { withAlpha } from '../theme/withAlpha';
import type { Farm } from '../types';
import { ensureNotificationPermission } from '../notifications';
import { confirmAction } from '../utils/confirm';
import { getSeedIcon, getSeedSeedImage } from '../data/seedIcons';
import {
  addMinutes,
  formatDateTime,
  minutesToDHM,
  parseNonNegInt,
} from '../utils/time';
import { CheckIcon, SearchIcon } from '../components/dashboard/DashboardIcons';
import { Clock3Icon, XIcon } from '../components/settings/SettingsIcons';

type Props = {
  farmId?: string;
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.mutedForeground,
    fontSize: 20,
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
    width: 44,
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
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: fonts.bodySemiBold,
  },
  sectionLabel: {
    color: colors.foreground,
    fontWeight: '500',
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  seedSearchWrap: {
    marginBottom: 8,
    position: 'relative',
  },
  seedSearchInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    height: 44,
    paddingHorizontal: spacing.md,
    paddingLeft: 40,
    fontSize: 14,
    fontFamily: fonts.body,
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
    borderRadius: radius.lg,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 56,
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seedChipOn: {
    backgroundColor: withAlpha(colors.primary, 0.10),
    borderColor: colors.primary,
  },
  seedChipIconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedChipImg: {
    width: 24,
    height: 24,
  },
  seedChipEmoji: {
    fontSize: 20,
  },
  seedChipText: {
    color: colors.foreground,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    fontFamily: fonts.bodySemiBold,
  },
  seedChipTextOn: {
    color: colors.foreground,
  },
  checkmark: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.body,
  },
  dhmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dhmCell: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  dhmInput: {
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    height: 56,
    width: '100%',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
  },
  dhmLabel: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.bodySemiBold,
  },
  flex: {
    flex: 1,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  notifyTitle: {
    color: colors.foreground,
    fontWeight: '500',
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: withAlpha(colors.accentBlue, 0.20),
    backgroundColor: withAlpha(colors.accentBlue, 0.05),
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  previewLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewLabel: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: fonts.bodyBold,
  },
  previewTime: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: fonts.bodySemiBold,
  },
  previewSeed: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 4,
    fontFamily: fonts.body,
  },
  error: {
    color: colors.destruct,
    fontSize: 13,
    fontFamily: fonts.body,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 14,
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
    fontSize: 14,
    fontFamily: fonts.bodyBold,
  },
}));

export function FarmFormScreen({ farmId, onBack }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { farms, seeds, addFarm, updateFarm, deleteFarm } = useStore();
  const existing = farmId ? farms.find((f) => f.id === farmId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [seedId, setSeedId] = useState<string | null>(
    existing?.seedId ?? seeds[0]?.id ?? null
  );
  const [notify, setNotify] = useState(existing?.notificationsEnabled ?? true);
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
        <Pressable onPress={onBack} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
          <XIcon size={20} color={colors.mutedForeground} />
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
          <Text style={styles.fieldLabel}>World name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. ARCHELLGT"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
            autoCapitalize="characters"
            maxLength={24}
          />
        </View>

        {/* Seed selector */}
        <Text style={styles.sectionLabel}>Seed</Text>
        <View style={styles.seedSearchWrap}>
          <TextInput
            style={styles.seedSearchInput}
            placeholder="Find a seed"
            placeholderTextColor={colors.mutedForeground}
            value={seedSearch}
            onChangeText={setSeedSearch}
          />
        </View>
        <View style={styles.seedGrid}>
          {filteredSeeds.map((seed) => {
            const img = getSeedSeedImage(seed.id);
            const emoji = getSeedIcon(seed.id);
            return (
              <SeedChip
                key={seed.id}
                image={img}
                emoji={emoji}
                label={seed.name}
                selected={seedId === seed.id}
                onPress={() => handleSeedSelect(seed.id)}
              />
            );
          })}
        </View>

        {selectedSeed ? (
          <Text style={styles.hint}>
            Default grow time: {selectedSeed.growTimeMinutes}m · Adjust below if needed.
          </Text>
        ) : (
          <Text style={styles.hint}>Enter how long is left until harvest.</Text>
        )}

        {/* Duration */}
        <Text style={styles.sectionLabel}>Grow duration</Text>
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
            <Text style={styles.hint}>Get notified when this farm is ready.</Text>
          </View>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Preview card */}
        {previewReady ? (
          <View style={styles.previewCard}>
            <View style={styles.previewLabelRow}>
              <Clock3Icon size={14} color={colors.accentBlue} />
              <Text style={styles.previewLabel}>ESTIMATED HARVEST</Text>
            </View>
            <Text style={styles.previewTime}>{formatDateTime(previewReady)}</Text>
            {selectedSeed && (
              <Text style={styles.previewSeed}>
                {selectedSeed.name} · {remainDays ? `${remainDays}d ` : ''}{remainHours ? `${remainHours}h ` : ''}{remainMinutes ? `${remainMinutes}m` : ''}
              </Text>
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
            {existing ? 'Save changes' : 'Add Farm'}
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
  image,
  emoji,
  label,
  selected,
  onPress,
}: {
  image: ReturnType<typeof getSeedSeedImage>;
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.seedChip, selected && styles.seedChipOn]}
    >
      <View style={styles.seedChipIconWrap}>
        {image ? (
          <Image source={image} style={styles.seedChipImg} resizeMode="contain" />
        ) : (
          <Text style={styles.seedChipEmoji}>{emoji}</Text>
        )}
      </View>
      <Text style={[styles.seedChipText, selected && styles.seedChipTextOn]} numberOfLines={2}>
        {label}
      </Text>
      {selected && <CheckIcon size={14} color={colors.primary} />}
    </Pressable>
  );
}
