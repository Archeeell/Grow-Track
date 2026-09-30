import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SEEDS } from './data/defaultSeeds';
import type { AppData, Farm, Seed } from './types';

const KEY_NEW = 'growtopia-farm-tracker';
const KEY_OLD = 'growtopia-farm-tracker:v1';
const CURRENT_VERSION = 2;

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

/** Validate a seed object. */
function isValidSeed(obj: any): obj is Seed {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    obj.id.length > 0 &&
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    typeof obj.growTimeMinutes === 'number' &&
    !isNaN(obj.growTimeMinutes) &&
    obj.growTimeMinutes >= 0 &&
    (obj.reharvestIntervalMinutes === null ||
      (typeof obj.reharvestIntervalMinutes === 'number' &&
        !isNaN(obj.reharvestIntervalMinutes) &&
        obj.reharvestIntervalMinutes >= 0)) &&
    typeof obj.builtIn === 'boolean'
  );
}

/** Validate a farm object. */
function isValidFarm(obj: any): obj is Farm {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    obj.id.length > 0 &&
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    (obj.seedId === null || typeof obj.seedId === 'string') &&
    typeof obj.seedName === 'string' &&
    obj.seedName.length > 0 &&
    typeof obj.plantedAt === 'string' &&
    obj.plantedAt.length > 0 &&
    typeof obj.readyAt === 'string' &&
    obj.readyAt.length > 0 &&
    typeof obj.manualOverride === 'boolean' &&
    typeof obj.notificationsEnabled === 'boolean' &&
    (obj.lastNotifiedReadyAt === null ||
      typeof obj.lastNotifiedReadyAt === 'string') &&
    typeof obj.createdAt === 'string' &&
    obj.createdAt.length > 0 &&
    (obj.harvestedAt === null ||
      typeof obj.harvestedAt === 'string')
  );
}

export async function loadData(): Promise<AppData> {
  // Try new key first, then fall back to old key
  let raw = await AsyncStorage.getItem(KEY_NEW);
  let source = KEY_NEW;
  if (raw === null) {
    raw = await AsyncStorage.getItem(KEY_OLD);
    source = KEY_OLD;
  }
  // If no storage at all, return defaults
  if (raw === null) {
    return { seeds: DEFAULT_SEEDS, farms: [] };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse storage data: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Storage data is not an object');
  }

  // Determine version: if missing, assume v1 (the old format without version field)
  const version = typeof parsed.version === 'number' ? parsed.version : 1;
  let seeds: any[] = Array.isArray(parsed.seeds) ? parsed.seeds : [];
  let farms: any[] = Array.isArray(parsed.farms) ? parsed.farms : [];

  // If we are reading from the old key or the version is old, we will migrate to new format
  const isOldFormat = source === KEY_OLD || version < CURRENT_VERSION;

  // Prune removed built-ins and update built-in grow times
  seeds = pruneRemovedBuiltins(seeds);
  seeds = updateBuiltInGrowTimes(seeds);

  // Migrate farms (ensure harvestedAt exists)
  farms = migrateFarms(farms);

  // Validate seeds and farms, keeping only valid entries
  const validSeeds: Seed[] = seeds.filter(isValidSeed);
  const validFarms: Farm[] = farms.filter(isValidFarm);

  // If we had data but ended up with no valid seeds or farms, treat as corruption
  if (
    raw !== null &&
    (seeds.length > 0 || farms.length > 0) &&
    (validSeeds.length === 0 && validFarms.length === 0)
  ) {
    throw new Error('Storage contained no valid seed or farm data');
  }

  // If we are migrating from old format or version changed, save to new key and remove old key
  if (isOldFormat) {
    await AsyncStorage.setItem(
      KEY_NEW,
      JSON.stringify({
        version: CURRENT_VERSION,
        seeds: validSeeds,
        farms: validFarms,
      })
    );
    await AsyncStorage.removeItem(KEY_OLD);
  }

  return { seeds: validSeeds, farms: validFarms };
}

export async function saveData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(
    KEY_NEW,
    JSON.stringify({
      version: CURRENT_VERSION,
      seeds: data.seeds,
      farms: data.farms,
    })
  );
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
