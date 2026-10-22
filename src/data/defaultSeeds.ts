import type { Seed } from '../types';

function seed(
  id: string,
  name: string,
  growTimeMinutes: number,
  reharvestIntervalMinutes: number | null = null
): Seed {
  return {
    id,
    name,
    growTimeMinutes,
    reharvestIntervalMinutes,
    builtIn: true,
  };
}

/** Starter set from common farmables. */
export const DEFAULT_SEEDS: Seed[] = [
  seed('sugar-cane', 'Sugar Cane', 242),          // ~4h — one-time (no reharvest)
  seed('fish-tank', 'Fish Tank', 1386, 1386),      // ~23h 06m — re-harvest
  seed('pepper-tree', 'Pepper Tree', 1753, 1753),  // ~2d 04h — re-harvest
  seed('pinball-bumper', 'Pinball Bumper', 1440, 1440), // ~1d — re-harvest
  seed('laser-grid', 'Laser Grid', 5274, 5274),    // ~3d 15h — re-harvest
  seed('chandelier', 'Chandelier', 10896, 10896),  // ~7d 13h — re-harvest
].sort((a, b) => a.name.localeCompare(b.name));
