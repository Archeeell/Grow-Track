import { ImageSourcePropType } from 'react-native';

/** Maps seed ID to item image (shown in seed list cards). */
export const SEED_ITEM_IMAGES: Record<string, ImageSourcePropType> = {
  'pepper-tree': require('../../assets/items/pepper-item.webp'),
  'laser-grid': require('../../assets/items/laser-item.webp'),
  'chandelier': require('../../assets/items/chandelier-item.webp'),
  'fish-tank': require('../../assets/items/fish-item.webp'),
  'sugar-cane': require('../../assets/items/sugar-item.webp'),
  'pinball-bumper': require('../../assets/items/pinball-item.webp'),
  // high-tech-block: no asset in Figma Make source; falls back to emoji
};

/** Maps seed ID to seed image (shown in seed selector chips). */
export const SEED_SEED_IMAGES: Record<string, ImageSourcePropType> = {
  'pepper-tree': require('../../assets/items/pepper-seed.webp'),
  'laser-grid': require('../../assets/items/laser-seed.webp'),
  'chandelier': require('../../assets/items/chandelier-seed.webp'),
  'fish-tank': require('../../assets/items/fish-seed.webp'),
  'sugar-cane': require('../../assets/items/sugar-seed.webp'),
  'pinball-bumper': require('../../assets/items/pinball-seed.webp'),
  // high-tech-block: no asset in Figma Make source; falls back to emoji
};

/** Legacy emoji fallbacks (used when image not found) */
export const SEED_ICONS: Record<string, string> = {
  'pepper-tree': '🌶️',
  'laser-grid': '⚡',
  'chandelier': '🕯️',
  'sugar-cane': '🌿',
  'pinball-bumper': '🎯',
  'venus-guytrap': '🌱',
  'fish-tank': '🐟',
  'high-tech-block': '🔮',
};

export function getSeedIcon(seedId: string | null | undefined): string {
  if (!seedId) return '🌱';
  return SEED_ICONS[seedId] ?? '🌱';
}

export function getSeedItemImage(seedId: string | null | undefined): ImageSourcePropType | null {
  if (!seedId) return null;
  return SEED_ITEM_IMAGES[seedId] ?? null;
}

export function getSeedSeedImage(seedId: string | null | undefined): ImageSourcePropType | null {
  if (!seedId) return null;
  return SEED_SEED_IMAGES[seedId] ?? null;
}
