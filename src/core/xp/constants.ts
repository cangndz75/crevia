import type { EventSeverity, LevelThreshold, XpCategory } from '@/core/xp/types';

export const LEVEL_THRESHOLDS: LevelThreshold[] = [
  { level: 1, requiredTotalXp: 0 },
  { level: 2, requiredTotalXp: 120 },
  { level: 3, requiredTotalXp: 320 },
  { level: 4, requiredTotalXp: 650 },
  { level: 5, requiredTotalXp: 1100 },
  { level: 6, requiredTotalXp: 1700 },
];

export const MAX_LEVEL = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level;

export const BASE_XP_BY_SEVERITY: Record<EventSeverity, number> = {
  low: 20,
  medium: 40,
  high: 65,
  critical: 90,
};

/** Günlük kategori cap'leri — event, daily_goal, butterfly ve tutorial hariç. */
export const DAILY_XP_CAPS: Partial<Record<XpCategory, number>> = {
  risk: 30,
  efficiency: 25,
  district: 40,
};

export const CAPPED_XP_CATEGORIES: XpCategory[] = ['risk', 'efficiency', 'district'];

export const DAILY_GOAL_BONUS_XP = 25;
export const BUTTERFLY_BONUS_XP = 25;
export const TUTORIAL_BONUS_XP = 10;

export const RISK_BONUS_TIER_HIGH = 15;
export const RISK_BONUS_TIER_LOW = 8;
export const RISK_DELTA_HIGH_THRESHOLD = -3;
export const RISK_DELTA_LOW_THRESHOLD = -1;

export const EFFICIENCY_BONUS_FULL = 10;
export const EFFICIENCY_BONUS_BUDGET_ONLY = 5;
export const STAFF_FATIGUE_EFFICIENCY_THRESHOLD = 10;

export const QUALITY_BONUS_FULL = 15;
export const QUALITY_BONUS_PARTIAL = 8;

export const DISTRICT_BONUS_AMOUNT = 10;
export const DISTRICT_BONUS_QUICK_RESOLVE = 5;
/** Cumhuriyet: sosyal risk önlendi (Merkez kadar güçlü sosyal medya etkisi yok). */
export const DISTRICT_BONUS_SOCIAL_RISK_MODERATE = 5;

/**
 * Seviye → yeni açılan yetki id'leri (kümülatif değil, o seviyede eklenenler).
 * getUnlockedAuthoritiesForLevel kümülatif listeyi döndürür.
 */
export const AUTHORITY_UNLOCKS_BY_LEVEL: Record<number, string[]> = {
  1: ['assign_team', 'make_announcement'],
  2: ['create_route', 'basic_risk_analysis'],
  3: ['start_maintenance', 'view_vehicle_status'],
  4: ['staff_calendar', 'fixed_district_assignment'],
  5: ['advisor_comment', 'social_media_statement'],
  6: ['permanent_solution', 'butterfly_tracking'],
};
