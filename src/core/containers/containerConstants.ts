import type {
  ContainerNeighborhoodId,
  ContainerOverflowRisk,
  ContainerType,
  NeighborhoodContainerRecommendedAction,
  NeighborhoodContainerStatusLabel,
} from './containerTypes';

export const CONTAINER_NEIGHBORHOOD_IDS: readonly ContainerNeighborhoodId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const CONTAINER_FILL_THRESHOLDS = {
  medium: 55,
  high: 70,
  critical: 85,
} as const;

export const CONTAINER_ODOR_THRESHOLDS = {
  medium: 45,
  high: 65,
  critical: 80,
} as const;

export const CONTAINER_CONDITION_THRESHOLDS = {
  maintenanceWatch: 65,
  needsMaintenance: 45,
  critical: 30,
  disabled: 25,
} as const;

export const CONTAINER_MAINTENANCE_THRESHOLDS = {
  watch: 45,
  high: 65,
  critical: 80,
} as const;

export const CONTAINER_UNIT_FILL_OVERFLOW = 90;

export const CONTAINER_TYPE_BASE_DAILY_FILL: Record<ContainerType, number> = {
  standard_waste: 8,
  recycling: 4,
  organic: 7,
  market_waste: 10,
  industrial_waste: 10,
  park_bin: 5,
};

export const CONTAINER_TYPE_ODOR_MULTIPLIER: Record<ContainerType, number> = {
  standard_waste: 1,
  recycling: 0.45,
  organic: 1.1,
  market_waste: 1.15,
  industrial_waste: 1.0,
  park_bin: 0.75,
};

export const CONTAINER_OVERFLOW_RISK_PRIORITY: Record<
  ContainerOverflowRisk,
  number
> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export const CONTAINER_STATUS_LABEL_PRIORITY: Record<
  NeighborhoodContainerStatusLabel,
  number
> = {
  Dengeli: 0,
  'Doluluk Artıyor': 1,
  'Bakım Gerekli': 2,
  'Koku Baskısı': 3,
  'Taşma Riski': 4,
  Kritik: 5,
};

export const CONTAINER_ACTION_LABELS: Record<
  NeighborhoodContainerRecommendedAction,
  string
> = {
  collect_now: 'Toplamayı öne al',
  inspect: 'Saha incelemesi',
  repair: 'Bakım gönder',
  monitor: 'İzle',
  communicate: 'Mahalle bilgilendir',
};

export const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  standard_waste: 'Standart atık',
  recycling: 'Geri dönüşüm',
  organic: 'Organik',
  market_waste: 'Pazar atığı',
  industrial_waste: 'Endüstriyel atık',
  park_bin: 'Park kutusu',
};

export const CONTAINER_COMPLAINT_CRITICAL_OVERFLOW_BONUS = 10;

export const CONTAINER_NEIGHBORHOOD_DAILY_PRESSURE: Record<
  ContainerNeighborhoodId,
  number
> = {
  merkez: 0.98,
  cumhuriyet: 0.82,
  sanayi: 1.08,
  istasyon: 0.92,
  yesilvadi: 0.55,
};

export const CONTAINER_DAILY_CONDITION_DECAY_BY_TYPE: Record<
  ContainerType,
  number
> = {
  standard_waste: 0.65,
  recycling: 0.35,
  organic: 0.55,
  market_waste: 0.75,
  industrial_waste: 0.85,
  park_bin: 0.4,
};

export const CONTAINER_MAINTENANCE_GAIN_BY_TYPE: Record<ContainerType, number> = {
  standard_waste: 0.8,
  recycling: 0.45,
  organic: 0.75,
  market_waste: 1.0,
  industrial_waste: 1.25,
  park_bin: 0.55,
};

export const CONTAINER_DAILY_UPDATE_LIMITS = {
  maxFillGainPerDay: 15,
  maxOdorGainPerDay: 12,
  maxMaintenanceGainPerDay: 10,
  maxConditionLossPerDay: 3,
} as const;

/** Pazar günü market_waste doluluk çarpanı */
export const CONTAINER_MARKET_DAY_FILL_MULTIPLIER = 1.35;

/** Gecikmiş toplama koku baskısı (gün başına) */
export const CONTAINER_COLLECTION_DELAY_ODOR_BONUS = 3;

/** Yüksek dolulukta ek koku */
export const CONTAINER_HIGH_FILL_ODOR_THRESHOLD = 70;
export const CONTAINER_HIGH_FILL_ODOR_FACTOR = 1.12;

/** Yüksek doluluk / bakım condition kaybı */
export const CONTAINER_HIGH_FILL_CONDITION_THRESHOLD = 85;
export const CONTAINER_HIGH_FILL_CONDITION_EXTRA_LOSS = 0.55;
export const CONTAINER_HIGH_MAINTENANCE_CONDITION_THRESHOLD = 70;
export const CONTAINER_HIGH_MAINTENANCE_CONDITION_EXTRA_LOSS = 0.4;

/** Doluluk kademeli yavaşlama — calculateDailyFillGain içinde kullanılır */
export const CONTAINER_FILL_SLOWDOWN_TIERS = [
  { minFillRate: 85, multiplier: 0.35 },
  { minFillRate: 75, multiplier: 0.55 },
  { minFillRate: 65, multiplier: 0.75 },
] as const;

/** Disabled unit minimal günlük fill */
export const CONTAINER_DISABLED_DAILY_FILL_GAIN = 0.5;
