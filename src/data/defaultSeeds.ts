import type { Seed } from '../types';
import { rarityGrowMinutes } from '../utils/time';

function seed(
  id: string,
  name: string,
  rarity: number,
  reharvestIntervalMinutes: number | null = null
): Seed {
  return {
    id,
    name,
    growTimeMinutes: rarityGrowMinutes(rarity),
    reharvestIntervalMinutes,
    builtIn: true,
  };
}

/** Starter set from common farmables. Times follow the rarity grow-time formula and may be outdated. */
export const DEFAULT_SEEDS: Seed[] = [
  seed('sugar-cane', 'Sugar Cane', 24),
  seed('venus-guytrap', 'Venus Guytrap', 36),
  seed('pepper-tree', 'Pepper Tree', 47),
  seed('pinball-bumper', 'Pinball Bumper', 65),
  seed('laser-grid', 'Laser Grid', 68),
  seed('high-tech-block', 'High Tech Block', 69),
  seed('chandelier', 'Chandelier', 87),
].sort((a, b) => a.name.localeCompare(b.name));
