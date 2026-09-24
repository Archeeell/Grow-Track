import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SEEDS } from './data/defaultSeeds';
import type { AppData, Farm, Seed } from './types';

const KEY = 'growtopia-farm-tracker:v1';

/** IDs of the current built-in seed set, used to prune removed defaults from storage. */
const BUILTIN_IDS = new Set(DEFAULT_SEEDS.map((s) => s.id));
const DEFAULT_SEEDS_BY_ID = new Map(DEFAULT_SEEDS.map((s) => [s.id, s]));

/** Remove any stored seed that was built-in but is no longer in DEFAULT_SEEDS. */
function pruneRemovedBuiltins(seeds: Seed[]): Seed[] {
  return seeds.filter((s) => !s.builtIn || BUILTIN_IDS.has(s.id));
}

function updateBuiltInGrowTimes(seeds: Seed[]): Seed[] {
  return seeds.map((seed) => {
    if (!seed.builtIn) return seed;
    const defaultSeed = DEFAULT_SEEDS_BY_ID.get(seed.id);
    return defaultSeed ? { ...seed, growTimeMinutes: defaultSeed.growTimeMinutes } : seed;
  });
}

/** Ensure every farm has the harvestedAt field (back-fill older persisted data). */
function migrateFarms(farms: Farm[]): Farm[] {
  return farms.map((f) => (f.harvestedAt === undefined ? { ...f, harvestedAt: null } : f));
}

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { seeds: DEFAULT_SEEDS, farms: [] };
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    const stored = Array.isArray(parsed.seeds) && parsed.seeds.length > 0
      ? pruneRemovedBuiltins(parsed.seeds)
      : DEFAULT_SEEDS;
    const rawFarms = Array.isArray(parsed.farms) ? parsed.farms : [];
    return {
      seeds: updateBuiltInGrowTimes(stored),
      farms: migrateFarms(rawFarms),
    };
  } catch {
    return { seeds: DEFAULT_SEEDS, farms: [] };
  }
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyFarmDraft(): Omit<Farm, 'id' | 'createdAt'> {
  const plantedAt = new Date().toISOString();
  return {
    name: '',
    seedId: null,
    seedName: 'Custom / manual',
    plantedAt,
    readyAt: plantedAt,
    manualOverride: false,
    notificationsEnabled: false,
    lastNotifiedReadyAt: null,
    harvestedAt: null,
  };
}

export function mergeStarterSeeds(existing: Seed[]): Seed[] {
  // First prune any built-ins that are no longer in DEFAULT_SEEDS.
  const pruned = updateBuiltInGrowTimes(pruneRemovedBuiltins(existing));
  const byName = new Map(pruned.map((s) => [s.name.toLowerCase(), s]));
  const merged = [...pruned];
  for (const seed of DEFAULT_SEEDS) {
    if (!byName.has(seed.name.toLowerCase())) {
      merged.push(seed);
      byName.set(seed.name.toLowerCase(), seed);
    }
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
