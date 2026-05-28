import type { DailyPriorityFinalStatus, DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventContentCategory } from '@/core/events/eventContentTypes';

/** Günde gösterilecek maksimum carry-over sinyali. */
export const CARRY_OVER_MAX_SIGNALS_PER_DAY = 2;

/** Event scoring’e bias uygulayan maksimum sinyal sayısı / gün. */
export const CARRY_OVER_MAX_BIAS_SIGNALS_PER_DAY = 1;

export const CARRY_OVER_MAX_POSITIVE_FRACTION = 0.03;
export const CARRY_OVER_MAX_NEGATIVE_FRACTION = -0.02;
export const CARRY_OVER_TOTAL_BIAS_CLAMP = 0.03;

/** Fractional delta → event weight puanı (calculateEventWeight ölçeği). */
export const CARRY_OVER_WEIGHT_SCALE = 100;

export const CARRY_OVER_PRIORITY_CATEGORIES: Record<
  DailyPriorityKey,
  {
    positive: EventContentCategory[];
    negative: EventContentCategory[];
  }
> = {
  public_relief: {
    positive: ['social_pressure', 'community_support', 'noise'],
    negative: ['social_pressure', 'noise'],
  },
  operation_stability: {
    positive: ['waste_container', 'vehicle_route', 'maintenance', 'personnel_morale'],
    negative: ['waste_container', 'vehicle_route', 'maintenance'],
  },
  resource_protection: {
    positive: ['personnel_morale', 'maintenance', 'vehicle_route'],
    negative: ['personnel_morale', 'maintenance', 'vehicle_route'],
  },
};

export const CARRY_OVER_STATUS_DELTAS: Record<
  DailyPriorityFinalStatus,
  { positive: number; negative: number; applyBias: boolean }
> = {
  fulfilled: { positive: -0.02, negative: -0.01, applyBias: true },
  partial: { positive: 0.01, negative: 0.01, applyBias: false },
  failed: { positive: 0.03, negative: 0.02, applyBias: true },
};
