/**
 * Helper to compute an RGBA color string from hex or rgb/rgba with an exact alpha.
 * Accepts:
 *   - 6-digit hex: '#45d483'
 *   - 3-digit hex: '#fff'
 *   - 8-digit hex: '#45d48380' (overrides embedded alpha with provided alpha)
 *   - rgb / rgba strings: 'rgb(69, 212, 131)' or 'rgba(69, 212, 131, 0.5)'
 * Alpha is clamped to [0, 1]. If alpha > 1, it is treated as a percentage (e.g. 15 -> 0.15).
 */
export function withAlpha(color: string, alpha: number): string {
  if (!color) return color;
  const a = alpha > 1 ? Math.min(1, Math.max(0, alpha / 100)) : Math.min(1, Math.max(0, alpha));

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    let r = 0;
    let g = 0;
    let b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else {
      return color;
    }
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const rgbMatch = color.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${a})`;
  }

  return color;
}
