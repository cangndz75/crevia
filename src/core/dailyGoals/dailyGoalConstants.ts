import type { DailyGoalMetricKey } from '@/core/dailyGoals/dailyGoalTypes';

export const DAILY_GOAL_THRESHOLDS = {
  satisfactionMin: 55,
  satisfactionRisk: 48,
  moraleMin: 45,
  moraleRisk: 50,
  riskMax: 35,
  riskWarning: 42,
  budgetMin: 50_000,
  budgetRisk: 45_000,
  socialPulseMin: 50,
  socialPulseRisk: 42,
  fatigueMax: 70,
  containerFillRisk: 75,
  vehicleBreakdownRisk: 55,
} as const;

export const DEFAULT_GOAL_REWARD_XP = {
  primary: 30,
  secondary: 15,
} as const;

export const METRIC_KEY_TO_CITY_FIELD: Partial<
  Record<DailyGoalMetricKey, 'publicSatisfaction' | 'budget' | 'morale' | 'riskScore'>
> = {
  publicSatisfaction: 'publicSatisfaction',
  budget: 'budget',
  personnelMorale: 'morale',
  operationRisk: 'riskScore',
};
