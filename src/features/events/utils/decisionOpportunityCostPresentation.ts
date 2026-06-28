import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import {
  ARCHETYPE_BADGE_LABELS,
  type DecisionArchetypeId,
} from '@/features/events/utils/decisionTradeoffTypes';

const PLAN_OPPORTUNITY_COST: Record<EventPlanStrategyId, string> = {
  rapid_response:
    'Güven hızlı toparlanır; ikinci operasyon için ekip gücü azalır.',
  balanced_plan:
    'Büyük risk almazsın; kritik baskıda etki sınırlı kalabilir.',
  long_term_fix:
    'Yarına sağlam kapanırsın; mahalle sabrı kısa vadede zorlanabilir.',
};

const ARCHETYPE_OPPORTUNITY_COST: Record<DecisionArchetypeId, string> = {
  rapid_response:
    'Güven kaybı hızlı durur; ekip yorgunluğu yarına taşınabilir.',
  preventive:
    'Bakımı güçlendirirsin; acil baskı yavaş söner.',
  resource_saving:
    'Kaynağı korursun; mahalle tepkisi yarına taşınabilir.',
  social_trust:
    'Mahalle tepkisi yumuşar; kaynak baskısı artabilir.',
  balanced:
    'Birden çok sistemi korursun; büyük kazanım yaratmaz.',
};

export function buildPlanOpportunityCost(strategyId: EventPlanStrategyId): string {
  return PLAN_OPPORTUNITY_COST[strategyId];
}

export function buildArchetypeOpportunityCost(archetypeId: DecisionArchetypeId): string {
  return ARCHETYPE_OPPORTUNITY_COST[archetypeId];
}

export function buildOpportunityCostVsAlternative(
  selectedId: EventPlanStrategyId,
  alternativeId: EventPlanStrategyId,
): string | null {
  if (selectedId === alternativeId) return null;
  const selected = ARCHETYPE_BADGE_LABELS[
    selectedId === 'rapid_response'
      ? 'rapid_response'
      : selectedId === 'long_term_fix'
        ? 'preventive'
        : 'balanced'
  ];
  const alt =
    alternativeId === 'rapid_response'
      ? 'hızlı müdahale'
      : alternativeId === 'long_term_fix'
        ? 'önleyici plan'
        : 'dengeli plan';
  return `${selected} seçilirse ${alt} fırsatı ertelenir.`;
}
