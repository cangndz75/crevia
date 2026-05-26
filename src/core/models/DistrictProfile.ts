import type { GameMetrics } from './GameMetrics';
import type { PilotEventType } from './PilotDayPlan';

export const PILOT_DISTRICT_IDS = [
  'central',
  'cumhuriyet',
  'industrial_market',
] as const;

export type PilotDistrictId = (typeof PILOT_DISTRICT_IDS)[number];

export const DEFAULT_PILOT_DISTRICT_ID: PilotDistrictId = 'central';

export type DistrictDifficulty = 'balanced' | 'challenging' | 'hard';

/** Bölge başlangıç metrikleri; GameMetrics ile uyumlu, opsiyonel risk skoru. */
export type DistrictStartingMetrics = GameMetrics & {
  riskScore?: number;
};

/** İleride event seçicide kullanılacak bölgesel eğilimler. */
export type DistrictEventBias = {
  eventTypeWeights?: Partial<Record<PilotEventType, number>>;
  /** Düşük değer = şikayetler daha kolay tetiklenir (0–1). */
  complaintThreshold?: number;
  socialPressureMultiplier?: number;
  operationalPressureMultiplier?: number;
};

export type DistrictProfile = {
  id: PilotDistrictId;
  name: string;
  shortName: string;
  description: string;
  difficulty: DistrictDifficulty;
  tags: string[];
  startingMetrics: DistrictStartingMetrics;
  eventBias: DistrictEventBias;
  briefingTitle: string;
  briefingText: string;
  visualKey: string;
};
