import type {
  CrisisFrequencyStatus,
  FullSeasonPlayerProfile,
  FullSeasonSimulationLength,
  MicroDecisionFrequencyStatus,
  ResourcePressureStatus,
  SeasonGoalProgressStatus,
} from './fullSeasonSimulationTypes';

export const FULL_SEASON_SIM_DEFAULT_LENGTH: FullSeasonSimulationLength = 14;
export const FULL_SEASON_SIM_EXTENDED_LENGTH: FullSeasonSimulationLength = 21;
export const FULL_SEASON_SIM_DEFAULT_SEED = 91038421;
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

export const FULL_SEASON_SIM_FIRST_DAY = POST_PILOT_FIRST_OPERATION_DAY;

export const FULL_SEASON_SIM_PROFILES: readonly FullSeasonPlayerProfile[] = [
  'strong_player',
  'weak_player',
  'balanced_player',
  'random_player',
  'crisis_heavy_player',
  'low_resource_player',
  'limited_player',
] as const;

export const STRONG_VS_WEAK_SIGNAL_GAP_MIN = 8;
export const STRONG_VS_WEAK_SIGNAL_GAP_WARN_HIGH = 22;
export const STRONG_VS_WEAK_SIGNAL_GAP_FAIL_HIGH = 30;
export const STRONG_VS_WEAK_GOAL_GAP_MIN = 2;

export const HEALTHY_CRITICAL_RESOURCE_DAYS_MAX = 4;
export const WARN_CRITICAL_RESOURCE_DAYS_MAX = 7;

export const FULL_MODE_CRISIS_INCIDENT_MIN = 1;
export const FULL_MODE_CRISIS_INCIDENT_MAX = 4;
export const FULL_MODE_CRISIS_INCIDENT_WARN = 5;
export const FULL_MODE_CRISIS_INCIDENT_FAIL = 6;

export const FULL_MODE_CRISIS_ACTION_MIN = 1;
export const FULL_MODE_CRISIS_ACTION_MAX = 7;
export const FULL_MODE_CRISIS_ACTION_FAIL = 8;

export const FULL_MODE_MICRO_DECISION_MIN = 4;
export const FULL_MODE_MICRO_DECISION_MAX = 18;
export const FULL_MODE_MICRO_DECISION_WARN_LOW = 3;
export const FULL_MODE_MICRO_DECISION_WARN_HIGH = 24;
export const FULL_MODE_MICRO_DECISION_FAIL = 25;

export const SEASON_GOAL_PROGRESS_DAY14_MIN = 35;
export const SEASON_GOAL_PROGRESS_DAY14_MAX = 85;
export const SEASON_GOAL_PROGRESS_WARN_LOW = 25;
export const SEASON_GOAL_PROGRESS_WARN_HIGH = 90;
export const SEASON_GOAL_PROGRESS_FAIL_LOW = 15;
export const SEASON_GOAL_EARLY_COMPLETE_DAY = 10;

export const REPORT_DENSITY_MIN = 3;
export const REPORT_DENSITY_MAX = 12;
export const REPORT_DENSITY_WARN_HIGH = 14;

export const ADVISOR_DENSITY_WARN_PER_DAY = 5;

export const LIMITED_VS_FULL_VALUE_SCORE_MIN = 2;

export const CATEGORY_SPAM_CONSECUTIVE_DAYS = 4;

export const SIGNAL_HEALTHY_RANGES: Record<
  FullSeasonPlayerProfile,
  { min: number; max: number } | null
> = {
  strong_player: { min: 8, max: 35 },
  balanced_player: { min: 25, max: 55 },
  weak_player: { min: 35, max: 70 },
  random_player: null,
  crisis_heavy_player: null,
  low_resource_player: null,
  limited_player: null,
};

export const FORBIDDEN_SIMULATION_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
] as const;

export function classifyCrisisIncidentCount(
  count: number,
  mode: 'full' | 'limited',
): CrisisFrequencyStatus {
  if (mode === 'limited') {
    return count === 0 ? 'healthy' : 'too_high';
  }
  if (count >= FULL_MODE_CRISIS_INCIDENT_FAIL) return 'too_high';
  if (count === 0 || count === FULL_MODE_CRISIS_INCIDENT_WARN) return 'too_low';
  if (count >= FULL_MODE_CRISIS_INCIDENT_MIN && count <= FULL_MODE_CRISIS_INCIDENT_MAX) {
    return 'healthy';
  }
  return count < FULL_MODE_CRISIS_INCIDENT_MIN ? 'too_low' : 'too_high';
}

export function classifyCriticalResourceDays(days: number): ResourcePressureStatus {
  if (days <= HEALTHY_CRITICAL_RESOURCE_DAYS_MAX) return 'healthy';
  if (days <= WARN_CRITICAL_RESOURCE_DAYS_MAX) return 'too_high';
  return 'too_high';
}

export function classifyMicroDecisionTotal(total: number, mode: 'full' | 'limited'): MicroDecisionFrequencyStatus {
  if (mode === 'limited') {
    if (total <= FULL_MODE_MICRO_DECISION_WARN_HIGH) return 'healthy';
    return 'too_high';
  }
  if (total >= FULL_MODE_MICRO_DECISION_FAIL) return 'too_high';
  if (total <= FULL_MODE_MICRO_DECISION_WARN_LOW || total >= FULL_MODE_MICRO_DECISION_WARN_HIGH) {
    return total === 0 ? 'too_low' : 'too_high';
  }
  if (total >= FULL_MODE_MICRO_DECISION_MIN && total <= FULL_MODE_MICRO_DECISION_MAX) {
    return 'healthy';
  }
  return total < FULL_MODE_MICRO_DECISION_MIN ? 'too_low' : 'too_high';
}

export function classifySeasonGoalProgress(
  progress: number,
  finalDay: number,
): SeasonGoalProgressStatus {
  if (progress < SEASON_GOAL_PROGRESS_FAIL_LOW) return 'too_slow';
  if (progress >= 100 && finalDay < SEASON_GOAL_EARLY_COMPLETE_DAY) return 'too_fast';
  if (progress < SEASON_GOAL_PROGRESS_WARN_LOW) return 'too_slow';
  if (progress > SEASON_GOAL_PROGRESS_WARN_HIGH) return 'too_fast';
  if (progress >= SEASON_GOAL_PROGRESS_DAY14_MIN && progress <= SEASON_GOAL_PROGRESS_DAY14_MAX) {
    return 'healthy';
  }
  return progress < SEASON_GOAL_PROGRESS_DAY14_MIN ? 'too_slow' : 'too_fast';
}
