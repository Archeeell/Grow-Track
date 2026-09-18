import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SEEDS } from './data/defaultSeeds';
import type { AppData, Farm, Seed } from './types';

const KEY = 'growtopia-farm-tracker:v1';

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) {
      return { seeds: DEFAULT_SEEDS, farms: [] };
    }
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      seeds: Array.isArray(parsed.seeds) && parsed.seeds.length > 0 ? parsed.seeds : DEFAULT_SEEDS,
      farms: Array.isArray(parsed.farms) ? parsed.farms : [],
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
  };
}

export function mergeStarterSeeds(existing: Seed[]): Seed[] {
  const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s]));
  const merged = [...existing];
  for (const seed of DEFAULT_SEEDS) {
    if (!byName.has(seed.name.toLowerCase())) {
      merged.push(seed);
      byName.set(seed.name.toLowerCase(), seed);
    }
  }
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
