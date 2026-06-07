/** Copy variant helpers — presentation-only; no gameplay impact. */

const WATCH_NOTE_VARIANTS = [
  'izleme notunda',
  'takip listesinde',
  'yarına not düştü',
] as const;

const VISIBLE_SERVICE_VARIANTS = [
  'görünür hizmet etkisi',
  'sahada fark edildi',
  'mahalle akışına yansıdı',
  'hizmet algısını destekledi',
] as const;

function stableIndex(seed: number, length: number): number {
  if (length <= 0) return 0;
  return Math.abs(seed) % length;
}

export function pickWatchNotePhrase(day: number, districtSeed = 0): string {
  return WATCH_NOTE_VARIANTS[stableIndex(day + districtSeed, WATCH_NOTE_VARIANTS.length)]!;
}

export function pickVisibleServicePhrase(day: number, districtSeed = 0): string {
  return VISIBLE_SERVICE_VARIANTS[
    stableIndex(day * 3 + districtSeed, VISIBLE_SERVICE_VARIANTS.length)
  ]!;
}

export function softenRepeatedWatchNoteCopy(text: string, day: number, districtSeed = 0): string {
  if (!text.includes('izleme notunda')) return text;
  const variant = pickWatchNotePhrase(day, districtSeed);
  return text.replace(/izleme notunda/g, variant);
}

export function softenRepeatedVisibleServiceCopy(text: string, day: number, districtSeed = 0): string {
  if (!text.includes('görünür hizmet etkisi')) return text;
  const variant = pickVisibleServicePhrase(day, districtSeed);
  return text.replace(/görünür hizmet etkisi/g, variant);
}
