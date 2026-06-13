/** Merkez ekranı spacing / touch hedefleri — mobil polish için paylaşılan sabitler. */

export const CENTER_COMPACT_BREAKPOINT = 370;

export const CENTER_SECTION_GAP = 14;
export const CENTER_SECTION_GAP_COMPACT = 12;

export const CENTER_SUPPORT_SECTION_MARGIN = 14;

export const CENTER_MIN_TOUCH_TARGET = 44;

export const CENTER_HIT_SLOP = {
  top: 8,
  bottom: 8,
  left: 8,
  right: 8,
} as const;

export const CENTER_MIN_BODY_FONT = 11;

export function resolveCenterSectionGap(isCompact: boolean): number {
  return isCompact ? CENTER_SECTION_GAP_COMPACT : CENTER_SECTION_GAP;
}
