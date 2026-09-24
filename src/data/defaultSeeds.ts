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
  seed('sugar-cane', 'Sugar Cane', 242),
  seed('venus-guytrap', 'Venus Guytrap', 1169),
  seed('pepper-tree', 'Pepper Tree', 1753),
  seed('pinball-bumper', 'Pinball Bumper', 2507),
  seed('laser-grid', 'Laser Grid', 5274),
  seed('high-tech-block', 'High Tech Block', 5509),
  seed('chandelier', 'Chandelier', 11018),
].sort((a, b) => a.name.localeCompare(b.name));
