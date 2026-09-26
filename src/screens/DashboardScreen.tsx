import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { FarmRow } from "../components/FarmRow";
import { Screen } from "../components/Screen";
import { Button } from "../components/Button";
import { useNow } from "../hooks/useNow";
import { useStore } from "../store";
import { colors, radius, spacing } from "../theme";
import type { Farm, HarvestStatus, Seed } from "../types";
import { confirmAction } from "../utils/confirm";
import {
  addMinutes,
  getStatus,
  minutesToDHM,
  parseNonNegInt,
} from "../utils/time";

const rank: Record<HarvestStatus, number> = {
  ready: 0,
  harvested: 1,
  growing: 2,
};

type Props = {
  onAddFarm: () => void;
  onOpenSeeds: () => void;
  onEditFarm: (id: string) => void;
};

// ─── Swap / Replant modal state ───────────────────────────────────────────────
type ActionModal =
  | { type: "swap"; farm: Farm; seed: Seed | undefined }
  | { type: "replant"; farm: Farm; seed: Seed | undefined };

export function DashboardScreen({ onAddFarm, onOpenSeeds, onEditFarm }: Props) {
  const { farms, seeds, resetFarm, harvestFarm, swapFarm, replantFarm } =
    useStore();
  const now = useNow(1000);

  const [modal, setModal] = useState<ActionModal | null>(null);

  // Fields inside the modal
  const [modalName, setModalName] = useState("");
  const [modalDays, setModalDays] = useState("");
  const [modalHours, setModalHours] = useState("");
  const [modalMinutes, setModalMinutes] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  const sorted = useMemo(() => {
    return [...farms].sort((a, b) => {
      const sa = getStatus(a.readyAt, now, a.harvestedAt);
      const sb = getStatus(b.readyAt, now, b.harvestedAt);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      return new Date(a.readyAt).getTime() - new Date(b.readyAt).getTime();
    });
  }, [farms, now]);

  const readyCount = sorted.filter(
    (f) => getStatus(f.readyAt, now, f.harvestedAt) !== "growing",
  ).length;

  const confirmReset = (farm: Farm) => {
    confirmAction(
      "Reset timer?",
      `Start a new cycle for "${farm.name}" as if just planted.`,
      "Reset",
      () => void resetFarm(farm.id),
    );
  };

  // ── Open modal helpers ────────────────────────────────────────────────────
  const openSwap = (farm: Farm) => {
    const seed = farm.seedId
      ? seeds.find((s) => s.id === farm.seedId)
      : undefined;
    // Prefill grow time from seed default
    const defaultMinutes = seed?.growTimeMinutes ?? 0;
    const dhm = minutesToDHM(defaultMinutes);
    setModalName("");
    setModalDays(dhm.days > 0 ? String(dhm.days) : "");
    setModalHours(dhm.hours > 0 ? String(dhm.hours) : "");
    setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
    setModalError(null);
    setModal({ type: "swap", farm, seed });
  };

  const openReplant = (farm: Farm) => {
    const seed = farm.seedId
      ? seeds.find((s) => s.id === farm.seedId)
      : undefined;
    const defaultMinutes = seed?.growTimeMinutes ?? 0;
    const dhm = minutesToDHM(defaultMinutes);
    setModalName(farm.name);
    setModalDays(dhm.days > 0 ? String(dhm.days) : "");
    setModalHours(dhm.hours > 0 ? String(dhm.hours) : "");
    setModalMinutes(dhm.minutes > 0 ? String(dhm.minutes) : "");
    setModalError(null);
    setModal({ type: "replant", farm, seed });
  };

  const closeModal = () => setModal(null);

  const totalModalMinutes = useMemo(() => {
    const d = parseNonNegInt(modalDays || "0") ?? 0;
    const h = parseNonNegInt(modalHours || "0") ?? 0;
    const m = parseNonNegInt(modalMinutes || "0") ?? 0;
    return d * 24 * 60 + h * 60 + m;
  }, [modalDays, modalHours, modalMinutes]);

  const modalPreviewReady = useMemo(() => {
    if (totalModalMinutes < 1) return null;
    return addMinutes(new Date().toISOString(), totalModalMinutes);
  }, [totalModalMinutes]);

  const confirmModal = async () => {
    if (!modal) return;
    const trimmedName = modalName.trim();
    if (!trimmedName) {
      setModalError("Please enter a name for this farm.");
      return;
    }
    if (totalModalMinutes < 1) {
      setModalError("Enter a grow duration of at least 1 minute.");
      return;
    }
    closeModal();
    if (modal.type === "swap") {
      await swapFarm(modal.farm.id, trimmedName, totalModalMinutes);
    } else {
      await replantFarm(modal.farm.id, trimmedName, totalModalMinutes);
    }
  };

  const confirmHarvest = (farm: Farm) => {
    confirmAction(
      "Mark as harvested?",
      `"${farm.name}" will be marked as harvested and waiting to be replanted.`,
      "Harvested",
      () => void harvestFarm(farm.id),
    );
  };

  return (
    <Screen title="Farms" rightLabel="Seeds" onRight={onOpenSeeds}>
      <View style={styles.body}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Grow times are estimates and can change in-game. Verify in
            Growtopia, then edit the seed table if needed.
          </Text>
        </View>
        <View style={styles.toolbar}>
          <Text style={styles.summary}>
            {farms.length === 0
              ? "No farms yet"
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
              <Text style={styles.emptyTitle}>
                Track harvest windows in one place
              </Text>
              <Text style={styles.emptyBody}>
                Add each world or farm plot, pick a seed (or a manual timer),
                and check this list instead of logging into every world.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <FarmRow
              farm={item}
              now={now}
              status={getStatus(item.readyAt, now, item.harvestedAt)}
              onPress={() => onEditFarm(item.id)}
              onReset={() => confirmReset(item)}
              onSwap={() => openSwap(item)}
              onHarvested={() => confirmHarvest(item)}
              onReplanted={() => openReplant(item)}
            />
          )}
        />
      </View>

      {/* ── Swap / Replant Modal ─────────────────────────────────────────── */}
      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={styles.sheet}>
            {modal && (
              <>
                <Text style={styles.sheetTitle}>
                  {modal.type === "swap" ? "↔ Swap Farm" : "🌱 Replant Farm"}
                </Text>

                {/* Seed type (locked, inherited) */}
                <View style={styles.seedPill}>
                  <Text style={styles.seedPillLabel}>Seed type</Text>
                  <Text style={styles.seedPillValue}>
                    {modal.seed?.name ?? "Custom / manual"}
                  </Text>
                </View>

                {modal.type === "swap" ? (
                  <Text style={styles.sheetHint}>
                    Enter the name of the new farm. The seed type stays the
                    same.
                  </Text>
                ) : (
                  <Text style={styles.sheetHint}>
                    Confirm the farm name and adjust the grow time if needed.
                  </Text>
                )}

                {/* Farm name */}
                <Text style={styles.fieldLabel}>Farm name</Text>
                <TextInput
                  style={styles.input}
                  value={modalName}
                  onChangeText={(v) => {
                    setModalName(v);
                    setModalError(null);
                  }}
                  placeholder={
                    modal.type === "swap"
                      ? "World ABCXYZ — Lower Left"
                      : modal.farm.name
                  }
                  placeholderTextColor={colors.muted}
                />

                {/* Grow duration */}
                <Text style={styles.fieldLabel}>Grow duration</Text>
                <View style={styles.dhmRow}>
                  <View style={styles.dhmCell}>
                    <Text style={styles.dhmLabel}>Days</Text>
                    <TextInput
                      style={styles.input}
                      value={modalDays}
                      onChangeText={(v) => {
                        setModalDays(v);
                        setModalError(null);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={styles.dhmCell}>
                    <Text style={styles.dhmLabel}>Hours</Text>
                    <TextInput
                      style={styles.input}
                      value={modalHours}
                      onChangeText={(v) => {
                        setModalHours(v);
                        setModalError(null);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={styles.dhmCell}>
                    <Text style={styles.dhmLabel}>Minutes</Text>
                    <TextInput
                      style={styles.input}
                      value={modalMinutes}
                      onChangeText={(v) => {
                        setModalMinutes(v);
                        setModalError(null);
                      }}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                {modalPreviewReady ? (
                  <Text style={styles.preview}>
                    Ready at{" "}
                    {new Date(modalPreviewReady).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                ) : null}

                {modalError ? (
                  <Text style={styles.modalError}>{modalError}</Text>
                ) : null}

                <View style={styles.sheetActions}>
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={closeModal}
                    style={styles.sheetBtn}
                  />
                  <Button
                    label={modal.type === "swap" ? "Swap" : "Replant"}
                    variant="primary"
                    onPress={() => void confirmModal()}
                    style={styles.sheetBtn}
                  />
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  summary: {
    color: colors.muted,
    fontWeight: "600",
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
    fontWeight: "700",
  },
  emptyBody: {
    color: colors.muted,
    lineHeight: 20,
  },

  // ── Modal ──────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.xs,
  },
  sheetHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  seedPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  seedPillLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  seedPillValue: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dhmRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dhmCell: {
    flex: 1,
    gap: 4,
  },
  dhmLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  preview: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  modalError: {
    color: colors.danger,
    fontSize: 13,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sheetBtn: {
    flex: 1,
  },
});
