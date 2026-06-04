export const DISTRICT_OPERATION_ACTION_MAX_PER_DAY = 1;
export const DISTRICT_OPERATION_ACTION_MIN_SELECTABLE_DAY = 4;
export const DISTRICT_OPERATION_ACTION_PREVIEW_START_DAY = 2;
export const DISTRICT_OPERATION_ACTION_MAX_COPY = 96;

export const DISTRICT_OPERATION_ACTION_FORBIDDEN_TERMS: readonly string[] = [
  'oyun sonu',
  'sezon finali',
  '14 gün bitti',
  'premium',
  'satın al',
  'kilitli',
  'panik',
  'çöktü',
  'başarısız',
  'kesin çözüldü',
] as const;

export const DISTRICT_OPERATION_ACTION_CTA_LABELS = {
  available: 'Günlük hamle olarak seç',
  selected: 'Bugünün odağında',
  applied: 'Bugünün odağında',
  preview_only: 'Mahalle odağı önizlemede',
  blocked: 'Bugün izleme modunda',
  expired: 'Süre doldu',
} as const;
