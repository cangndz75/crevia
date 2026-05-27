import {
  BASE_XP_BY_SEVERITY,
  EFFICIENCY_BONUS_BUDGET_ONLY,
  EFFICIENCY_BONUS_FULL,
  QUALITY_BONUS_FULL,
  QUALITY_BONUS_PARTIAL,
  RISK_BONUS_TIER_HIGH,
  RISK_BONUS_TIER_LOW,
  RISK_DELTA_HIGH_THRESHOLD,
  RISK_DELTA_LOW_THRESHOLD,
  STAFF_FATIGUE_EFFICIENCY_THRESHOLD,
} from '@/core/xp/constants';
import type {
  EfficiencyBonusInput,
  EventSeverity,
  QualityBonusInput,
} from '@/core/xp/types';

export function calculateBaseEventXp(severity: EventSeverity): number {
  return BASE_XP_BY_SEVERITY[severity];
}

/**
 * riskDelta negatifse risk azalmıştır; artışta ceza yok, yalnızca bonus yok.
 */
export function calculateRiskBonus(riskDelta: number): number {
  if (riskDelta <= RISK_DELTA_HIGH_THRESHOLD) {
    return RISK_BONUS_TIER_HIGH;
  }
  if (riskDelta <= RISK_DELTA_LOW_THRESHOLD) {
    return RISK_BONUS_TIER_LOW;
  }
  return 0;
}

export function calculateEfficiencyBonus(input: EfficiencyBonusInput): number {
  const withinBudget = input.budgetSpent <= input.expectedBudget;

  if (withinBudget && input.staffFatigueDelta <= STAFF_FATIGUE_EFFICIENCY_THRESHOLD) {
    return EFFICIENCY_BONUS_FULL;
  }
  if (withinBudget) {
    return EFFICIENCY_BONUS_BUDGET_ONLY;
  }
  return 0;
}

/**
 * Memnuniyet / risk dengesi bonusu.
 * MVP'de breakdown'da ayrı satır olarak gösterilir; kategori `event` (kalite alt kalemi).
 */
export function calculateQualityBonus(input: QualityBonusInput): number {
  if (input.satisfactionDelta > 0 && input.riskDelta < 0) {
    return QUALITY_BONUS_FULL;
  }
  if (input.satisfactionDelta >= 0) {
    return QUALITY_BONUS_PARTIAL;
  }
  return 0;
}
