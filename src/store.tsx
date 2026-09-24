import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  cancelFarmNotification,
  fireDueNotification,
  syncAllNotifications,
  syncFarmNotification,
} from './notifications';
import { loadData, mergeStarterSeeds, newId, saveData } from './storage';
import type { Farm, Seed } from './types';
import { addMinutes, cycleMinutes, getStatus } from './utils/time';

type Store = {
  ready: boolean;
  farms: Farm[];
  seeds: Seed[];
  addFarm: (farm: Omit<Farm, 'id' | 'createdAt' | 'lastNotifiedReadyAt' | 'harvestedAt'>) => Promise<void>;
  updateFarm: (id: string, patch: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  resetFarm: (id: string) => Promise<void>;
  harvestFarm: (id: string) => Promise<void>;
  swapFarm: (id: string, newName: string, growMinutes: number) => Promise<void>;
  replantFarm: (id: string, newName: string, growMinutes: number) => Promise<void>;
  addSeed: (seed: Omit<Seed, 'id' | 'builtIn'>) => Promise<Seed>;
  updateSeed: (id: string, patch: Partial<Seed>) => Promise<void>;
  deleteSeed: (id: string) => Promise<void>;
  restoreStarterSeeds: () => Promise<void>;
  seedById: (id: string | null) => Seed | undefined;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);

  const persist = useCallback(async (nextFarms: Farm[], nextSeeds: Seed[]) => {
    await saveData({ farms: nextFarms, seeds: nextSeeds });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadData();
      if (cancelled) return;
      setFarms(data.farms);
      setSeeds(data.seeds);
      setReady(true);
      await syncAllNotifications(data.farms);

      const updated = [...data.farms];
      let changed = false;
      for (let i = 0; i < updated.length; i += 1) {
        const farm = updated[i];
        const fired = await fireDueNotification(farm);
        if (fired) {
          updated[i] = { ...farm, lastNotifiedReadyAt: farm.readyAt };
          changed = true;
        }
      }
      if (changed) {
        setFarms(updated);
        await saveData({ farms: updated, seeds: data.seeds });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addFarm: Store['addFarm'] = useCallback(
    async (farm) => {
      const entry: Farm = {
        ...farm,
        id: newId('farm'),
        createdAt: new Date().toISOString(),
        lastNotifiedReadyAt: null,
        harvestedAt: null,
      };
      const next = [...farms, entry];
      setFarms(next);
      await persist(next, seeds);
      await syncFarmNotification(entry);
    },
    [farms, persist, seeds]
  );

  const updateFarm: Store['updateFarm'] = useCallback(
    async (id, patch) => {
      const next = farms.map((farm) => (farm.id === id ? { ...farm, ...patch } : farm));
      setFarms(next);
      await persist(next, seeds);
      const updated = next.find((f) => f.id === id);
      if (updated) await syncFarmNotification(updated);
    },
    [farms, persist, seeds]
  );

  const deleteFarm: Store['deleteFarm'] = useCallback(
    async (id) => {
      const farm = farms.find((f) => f.id === id);
      if (farm) await cancelFarmNotification(farm);
      const next = farms.filter((f) => f.id !== id);
      setFarms(next);
      await persist(next, seeds);
    },
    [farms, persist, seeds]
  );

  const resetFarm: Store['resetFarm'] = useCallback(
    async (id) => {
      const farm = farms.find((f) => f.id === id);
      if (!farm) return;
      const seed = farm.seedId ? seeds.find((s) => s.id === farm.seedId) : undefined;
      const plantedAt = new Date().toISOString();
      const minutes = cycleMinutes(seed, farm);
      const nextFarm: Farm = {
        ...farm,
        plantedAt,
        readyAt: addMinutes(plantedAt, minutes),
        lastNotifiedReadyAt: null,
        harvestedAt: null,
      };
      const next = farms.map((f) => (f.id === id ? nextFarm : f));
      setFarms(next);
      await persist(next, seeds);
      await syncFarmNotification(nextFarm);
    },
    [farms, persist, seeds]
  );

  const harvestFarm: Store['harvestFarm'] = useCallback(
    async (id) => {
      const farm = farms.find((f) => f.id === id);
      if (!farm) return;
      const nextFarm: Farm = { ...farm, harvestedAt: new Date().toISOString() };
      const next = farms.map((f) => (f.id === id ? nextFarm : f));
      setFarms(next);
      await persist(next, seeds);
      await cancelFarmNotification(nextFarm);
    },
    [farms, persist, seeds]
  );

  /** Replace a ready farm with a fresh farm sharing the same seed type. */
  const swapFarm: Store['swapFarm'] = useCallback(
    async (id, newName, growMinutes) => {
      const farm = farms.find((f) => f.id === id);
      if (!farm) return;
      await cancelFarmNotification(farm);
      const plantedAt = new Date().toISOString();
      const nextFarm: Farm = {
        ...farm,
        name: newName,
        plantedAt,
        readyAt: addMinutes(plantedAt, growMinutes),
        manualOverride: true,
        lastNotifiedReadyAt: null,
        harvestedAt: null,
      };
      const next = farms.map((f) => (f.id === id ? nextFarm : f));
      setFarms(next);
      await persist(next, seeds);
      await syncFarmNotification(nextFarm);
    },
    [farms, persist, seeds]
  );

  /** Reset a harvested farm after replanting, using a new name and grow time. */
  const replantFarm: Store['replantFarm'] = useCallback(
    async (id, newName, growMinutes) => {
      const farm = farms.find((f) => f.id === id);
      if (!farm) return;
      const plantedAt = new Date().toISOString();
      const nextFarm: Farm = {
        ...farm,
        name: newName,
        plantedAt,
        readyAt: addMinutes(plantedAt, growMinutes),
        manualOverride: true,
        lastNotifiedReadyAt: null,
        harvestedAt: null,
      };
      const next = farms.map((f) => (f.id === id ? nextFarm : f));
      setFarms(next);
      await persist(next, seeds);
      await syncFarmNotification(nextFarm);
    },
    [farms, persist, seeds]
  );

  const addSeed: Store['addSeed'] = useCallback(
    async (seed) => {
      const entry: Seed = { ...seed, id: newId('seed'), builtIn: false };
      const nextSeeds = [...seeds, entry].sort((a, b) => a.name.localeCompare(b.name));
      setSeeds(nextSeeds);
      await persist(farms, nextSeeds);
      return entry;
    },
    [farms, persist, seeds]
  );

  const updateSeed: Store['updateSeed'] = useCallback(
    async (id, patch) => {
      const nextSeeds = seeds.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const seed = nextSeeds.find((s) => s.id === id);
      let nextFarms = farms;
      if (seed) {
        nextFarms = farms.map((farm) => {
          if (farm.seedId !== id) return farm;
          if (farm.manualOverride) {
            return { ...farm, seedName: seed.name };
          }
          const status = getStatus(farm.readyAt, undefined, farm.harvestedAt);
          if (status !== 'growing') {
            return { ...farm, seedName: seed.name };
          }
          return {
            ...farm,
            seedName: seed.name,
            readyAt: addMinutes(farm.plantedAt, seed.growTimeMinutes),
          };
        });
      }
      setSeeds(nextSeeds);
      setFarms(nextFarms);
      await persist(nextFarms, nextSeeds);
      await syncAllNotifications(nextFarms);
    },
    [farms, persist, seeds]
  );

  const deleteSeed: Store['deleteSeed'] = useCallback(
    async (id) => {
      const nextSeeds = seeds.filter((s) => s.id !== id);
      const nextFarms = farms.map((farm) =>
        farm.seedId === id ? { ...farm, seedId: null } : farm
      );
      setSeeds(nextSeeds);
      setFarms(nextFarms);
      await persist(nextFarms, nextSeeds);
    },
    [farms, persist, seeds]
  );

  const restoreStarterSeeds = useCallback(async () => {
    const nextSeeds = mergeStarterSeeds(seeds);
    setSeeds(nextSeeds);
    await persist(farms, nextSeeds);
  }, [farms, persist, seeds]);

  const seedById = useCallback(
    (id: string | null) => (id ? seeds.find((s) => s.id === id) : undefined),
    [seeds]
  );

  const value = useMemo(
    () => ({
      ready,
      farms,
      seeds,
      addFarm,
      updateFarm,
      deleteFarm,
      resetFarm,
      harvestFarm,
      swapFarm,
      replantFarm,
      addSeed,
      updateSeed,
      deleteSeed,
      restoreStarterSeeds,
      seedById,
    }),
    [
      addFarm,
      addSeed,
      deleteFarm,
      deleteSeed,
      farms,
      harvestFarm,
      ready,
      replantFarm,
      resetFarm,
      restoreStarterSeeds,
      seedById,
      seeds,
      swapFarm,
      updateFarm,
      updateSeed,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
