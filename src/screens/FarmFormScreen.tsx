import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { Field } from "../components/Field";
import { Screen, ScreenScroll } from "../components/Screen";
import { useStore } from "../store";
import { colors, radius, spacing } from "../theme";
import type { Farm } from "../types";
import { ensureNotificationPermission } from "../notifications";
import { confirmAction } from "../utils/confirm";
import {
  addMinutes,
  formatDateTime,
  minutesToDHM,
  parseNonNegInt,
} from "../utils/time";

type Props = {
  farmId?: string;
  onBack: () => void;
};

export function FarmFormScreen({ farmId, onBack }: Props) {
  const { farms, seeds, addFarm, updateFarm, deleteFarm } = useStore();
  const existing = farmId ? farms.find((f) => f.id === farmId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [seedId, setSeedId] = useState<string | null>(
    existing?.seedId ?? seeds[0]?.id ?? null,
  );
  const [notify, setNotify] = useState(existing?.notificationsEnabled ?? false);
  const [error, setError] = useState<string | null>(null);

  // Grow duration remaining — days / hours / minutes
  const [remainDays, setRemainDays] = useState("");
  const [remainHours, setRemainHours] = useState("");
  const [remainMinutes, setRemainMinutes] = useState("");

  // Track whether the user has manually edited the duration fields
  const [durationTouched, setDurationTouched] = useState(false);

  const selectedSeed = useMemo(
    () => (seedId ? seeds.find((s) => s.id === seedId) : undefined),
    [seedId, seeds],
  );

  // Auto-populate duration fields from selected seed (unless user has overridden them)
  useEffect(() => {
    if (durationTouched) return;

    if (selectedSeed) {
      const dhm = minutesToDHM(selectedSeed.growTimeMinutes);
      setRemainDays(dhm.days > 0 ? String(dhm.days) : "");
      setRemainHours(dhm.hours > 0 ? String(dhm.hours) : "");
      setRemainMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
    } else if (existing) {
      const remainMs = new Date(existing.readyAt).getTime() - Date.now();
      if (remainMs > 0) {
        const dhm = minutesToDHM(Math.round(remainMs / 60_000));
        setRemainDays(dhm.days > 0 ? String(dhm.days) : "");
        setRemainHours(dhm.hours > 0 ? String(dhm.hours) : "");
        setRemainMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
      } else {
        setRemainDays("");
        setRemainHours("");
        setRemainMinutes("");
      }
    } else {
      setRemainDays("");
      setRemainHours("");
      setRemainMinutes("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSeed]);

  // When user selects a different seed, reset the touch flag so fields re-populate
  const handleSeedSelect = (id: string | null) => {
    setSeedId(id);
    setDurationTouched(false);
  };

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

  // Total remaining minutes from the D/H/M fields
  const totalRemainMinutes = useMemo(() => {
    const d = parseNonNegInt(remainDays || "0") ?? 0;
    const h = parseNonNegInt(remainHours || "0") ?? 0;
    const m = parseNonNegInt(remainMinutes || "0") ?? 0;
    return d * 24 * 60 + h * 60 + m;
  }, [remainDays, remainHours, remainMinutes]);

  const previewReady = useMemo(() => {
    if (totalRemainMinutes < 1) return null;
    return addMinutes(new Date().toISOString(), totalRemainMinutes);
  }, [totalRemainMinutes]);

  const save = async () => {
    const trimmed = name.trim().toUpperCase();
    if (!trimmed) {
      setError("Give this farm a name so you can spot it later.");
      return;
    }
    if (totalRemainMinutes < 1) {
      setError("Enter a remaining grow duration of at least 1 minute.");
      return;
    }

    const now = new Date();
    const readyAt = addMinutes(now.toISOString(), totalRemainMinutes);
    const plantedAt = selectedSeed
      ? addMinutes(
          now.toISOString(),
          -selectedSeed.growTimeMinutes + totalRemainMinutes,
        )
      : now.toISOString();

    let notificationsEnabled = notify;
    if (notificationsEnabled) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        notificationsEnabled = false;
        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(
            "Farm was saved without alerts. Enable notifications in the browser to get harvest pings.",
          );
        } else {
          Alert.alert(
            "Notifications blocked",
            "Farm was saved without alerts. Enable notifications in system settings to get harvest pings.",
          );
        }
      }
    }

    const payload: Omit<Farm, "id" | "createdAt" | "lastNotifiedReadyAt" | "harvestedAt"> = {
      name: trimmed,
      seedId: selectedSeed?.id ?? null,
      seedName: selectedSeed?.name ?? "Custom / manual",
      plantedAt,
      readyAt,
      manualOverride: true,
      notificationsEnabled,
    };

    if (existing) {
      await updateFarm(existing.id, {
        ...payload,
        harvestedAt: null,
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
      "Delete farm?",
      `Remove "${existing.name}" from the tracker.`,
      "Delete",
      () => {
        void deleteFarm(existing.id).then(onBack);
      },
      true,
    );
  };

  return (
    <Screen title={existing ? "Edit farm" : "Add farm"} onBack={onBack}>
      <ScreenScroll>
        <Field
          label="Farm name"
          placeholder="WORLD NAME"
          value={name}
          onChangeText={setName}
          autoCorrect={false}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Seed type</Text>
        <View style={styles.chips}>
          <Chip
            label="Custom / manual"
            selected={seedId === null}
            onPress={() => handleSeedSelect(null)}
          />
          {seeds.map((seed) => (
            <Chip
              key={seed.id}
              label={seed.name}
              selected={seedId === seed.id}
              onPress={() => handleSeedSelect(seed.id)}
            />
          ))}
        </View>
        {selectedSeed ? (
          <Text style={styles.hint}>
            Default grow time: {selectedSeed.growTimeMinutes}m · Adjust below if
            needed.
          </Text>
        ) : (
          <Text style={styles.hint}>Enter how long is left until harvest.</Text>
        )}

        <Text style={styles.section}>Time remaining until harvest</Text>
        <View style={styles.dhmRow}>
          <View style={styles.dhmField}>
            <Field
              label="Days"
              keyboardType="numeric"
              value={remainDays}
              onChangeText={handleDayChange}
              placeholder="0"
            />
          </View>
          <View style={styles.dhmField}>
            <Field
              label="Hours"
              keyboardType="numeric"
              value={remainHours}
              onChangeText={handleHourChange}
              placeholder="0"
            />
          </View>
          <View style={styles.dhmField}>
            <Field
              label="Minutes"
              keyboardType="numeric"
              value={remainMinutes}
              onChangeText={handleMinuteChange}
              placeholder="0"
            />
          </View>
        </View>

        <View style={styles.notifyRow}>
          <View style={styles.flex}>
            <Text style={styles.notifyTitle}>Harvest notification</Text>
            <Text style={styles.hint}>
              Off by default. Works in the background on iOS/Android.
            </Text>
          </View>
          <Switch
            value={notify}
            onValueChange={setNotify}
            trackColor={{ false: colors.border, true: colors.accentDim }}
            thumbColor={notify ? colors.accent : colors.muted}
          />
        </View>

        {previewReady ? (
          <Text style={styles.preview}>
            Estimated ready at {formatDateTime(previewReady)}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={existing ? "Save changes" : "Add farm"}
          onPress={() => void save()}
        />
        {existing ? (
          <Button label="Delete farm" variant="danger" onPress={remove} />
        ) : null}
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
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    color: colors.text,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
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
    fontWeight: "600",
  },
  chipTextOn: {
    color: colors.accent,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  dhmRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dhmField: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  notifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notifyTitle: {
    color: colors.text,
    fontWeight: "700",
  },
  preview: {
    color: colors.accent,
    fontWeight: "700",
  },
  error: {
    color: colors.danger,
  },
});
