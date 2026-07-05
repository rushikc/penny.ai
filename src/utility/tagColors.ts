/**
 * Deterministic color mapping for expense tags. The same tag name always maps
 * to the same hue, so pills stay visually stable across sessions without
 * requiring any schema/data changes.
 */

const PALETTE = [
  '#FF3B30', // red
  '#FF9F0A', // orange
  '#FFCC00', // yellow
  '#34C759', // green
  '#30B0C7', // teal
  '#0A84FF', // blue
  '#5E5CE6', // indigo
  '#BF5AF2', // purple
  '#FF2D55', // pink
  '#A2845E', // brown
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export interface TagColor {
  /** Solid color for text and borders. */
  text: string;
  /** Low-opacity tint for the pill background. */
  tint: string;
}

const UNTAGGED_COLOR = '#8E8E93';

export const getTagColor = (tag?: string | null): TagColor => {
  const normalized = (tag || '').trim().toLowerCase();
  if (!normalized || normalized === 'untagged') {
    return {text: UNTAGGED_COLOR, tint: 'rgba(142,142,147,0.14)'};
  }
  const base = PALETTE[hashString(normalized) % PALETTE.length];
  return {text: base, tint: hexToTint(base, 0.14)};
};

/** Convert a #RRGGBB hex color into an rgba tint at the given alpha. */
const hexToTint = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
