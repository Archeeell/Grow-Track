/** Maps seed IDs to display emoji. Fallback: '🌱' */
export const SEED_ICONS: Record<string, string> = {
  'pepper-tree': '🌶️',
  'laser-grid': '⚡',
  'chandelier': '🕯️',
  'sugar-cane': '🌿',
  'pinball-bumper': '🎯',
  'venus-guytrap': '🌱',
  'high-tech-block': '🔮',
};

export function getSeedIcon(seedId: string | null | undefined): string {
  if (!seedId) return '🌱';
  return SEED_ICONS[seedId] ?? '🌱';
}
