import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import { DECISION_IMPACT_CHAIN } from '@/features/events/utils/operationWorkflowConsistencyPresentation';
import type { DecisionArchetypeId } from '@/features/events/utils/decisionTradeoffTypes';

const ARCHETYPE_OUTCOME_PREVIEW: Record<DecisionArchetypeId, string> = {
  rapid_response: 'Güven kaybı hızlı durdu; ekip yorgunluğu yarına taşındı.',
  preventive: 'Bugün daha az parlak; yarına daha sağlam kapandın.',
  resource_saving: 'Kaynak korundu; müdahale süresi mahalle sabrını zorladı.',
  social_trust: 'Mahalle tepkisi yumuşadı; kaynak baskısı arttı.',
  balanced: 'Risk büyümeden kontrol sağlandı; büyük sıçrama yok.',
};

export function buildPlanOutcomePreview(strategyId: EventPlanStrategyId): string {
  const chain = DECISION_IMPACT_CHAIN[strategyId];
  return chain.resultSummary;
}

export function buildArchetypeOutcomePreview(archetypeId: DecisionArchetypeId): string {
  return ARCHETYPE_OUTCOME_PREVIEW[archetypeId];
}

export function buildPlanDayEndStyleHint(strategyId: EventPlanStrategyId): string {
  return DECISION_IMPACT_CHAIN[strategyId].dayEndStyle;
}
