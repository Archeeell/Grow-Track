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
  seed('dirt', 'Dirt', 1),
  seed('grass', 'Grass', 2),
  seed('daisy', 'Daisy', 3),
  seed('rose', 'Rose', 10),
  seed('cactus', 'Cactus', 17),
  seed('love', 'Love', 19),
  seed('blueberry', 'Blueberry', 19),
  seed('tomato', 'Tomato', 20),
  seed('rice', 'Rice', 23),
  seed('sugar-cane', 'Sugar Cane', 24),
  seed('ladder', 'Ladder', 26),
  seed('lava', 'Lava', 22),
  seed('wheat', 'Wheat', 22),
  seed('cotton', 'Cotton', 22),
  seed('apple', 'Apple', 18),
  seed('bamboo', 'Bamboo', 18),
  seed('grapes', 'Grapes', 25),
  seed('pineapple', 'Pineapple', 30),
  seed('venus-guytrap', 'Venus Guytrap', 36),
  seed('tiki-eye', 'Tiki Eye', 42),
  seed('pepper-tree', 'Pepper Tree', 47),
  seed('pinball-bumper', 'Pinball Bumper', 65),
  seed('laser-grid', 'Laser Grid', 68),
  seed('high-tech-block', 'High Tech Block', 69),
  seed('chandelier', 'Chandelier', 87),
  seed('time-space-rupture', 'Time-Space Rupture', 97),
  {
    id: 'magic-egg',
    name: 'Magic Egg',
    growTimeMinutes: 60,
    reharvestIntervalMinutes: null,
    builtIn: true,
  },
].sort((a, b) => a.name.localeCompare(b.name));
