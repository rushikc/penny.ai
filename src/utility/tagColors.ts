/**
 * Neutral tag color mapping. All tags use the same gray pill style for a
 * clean, monochrome UI. Charts use `dataPalette` from tokens instead.
 */

import {neutralTag} from '../theme/tokens';

export interface TagColor {
  /** Solid color for text and borders. */
  text: string;
  /** Low-opacity tint for the pill background. */
  tint: string;
}

export const getTagColor = (_tag?: string | null): TagColor => ({
  text: neutralTag.text,
  tint: neutralTag.tint,
});
