import { BALANCE_COPY, DOMAIN_IMPACT_LABELS } from './gameplayImpactConstants';
import { classifyGameplayImpact, normalizeTradeoffCopy } from './gameplayImpactTuning';
import type { GameplayImpactDomain } from './gameplayImpactTypes';

export type CarryOverRiskKind =
  | 'plan_keep'
  | 'monitor'
  | 'low_resource'
  | 'preventive_delay'
  | 'rest_rotation';

export function getCarryOverRiskLine(kind: CarryOverRiskKind): string {
  switch (kind) {
    case 'plan_keep':
      return BALANCE_COPY.carryOverPlanKeep;
    case 'monitor':
      return BALANCE_COPY.carryOverMonitor;
    case 'low_resource':
      return BALANCE_COPY.carryOverLowResource;
    case 'preventive_delay':
      return BALANCE_COPY.preventiveTradeoff;
    case 'rest_rotation':
      return 'Dinlendirme odağı bugünkü müdahale hızını sınırladı; acil sinyal yarına taşınabilir.';
    default:
      return BALANCE_COPY.carryOverRisk;
  }
}

export function describeDomainImpactChange(
  domain: GameplayImpactDomain,
  delta: number,
): string {
  const labels = DOMAIN_IMPACT_LABELS[domain];
  const magnitude = classifyGameplayImpact(delta);
  if (delta === 0) {
    return labels.improve.replace('belirgin ', '');
  }
  if (delta < 0) {
    if (magnitude === 'strong' || magnitude === 'medium') {
      return labels.improve;
    }
    return BALANCE_COPY.slightImprovement;
  }
  if (magnitude === 'strong' || magnitude === 'medium') {
    return labels.worsen;
  }
  return BALANCE_COPY.pressureIncreased;
}

export function formatImpactMagnitudeLabel(delta: number): string {
  const abs = Math.abs(delta);
  if (abs >= 6) return BALANCE_COPY.noticeableImprovement;
  if (abs >= 3) return BALANCE_COPY.slightImprovement;
  if (delta > 0) return BALANCE_COPY.pressureIncreased;
  return BALANCE_COPY.slightImprovement;
}

export function buildAdvisorImpactExplanation(params: {
  level: number;
  kind: CarryOverRiskKind | 'tradeoff' | 'strong_fit';
}): string {
  if (params.level <= 1) {
    return normalizeTradeoffCopy(BALANCE_COPY.eceLevel1Cautious);
  }
  if (params.level === 2) {
    if (params.kind === 'low_resource') {
      return normalizeTradeoffCopy(BALANCE_COPY.eceLevel2LowResource);
    }
    return normalizeTradeoffCopy(
      'Bu karar bugünkü baskıyı hafifletir; yarın aynı sinyali tekrar görebiliriz.',
    );
  }
  if (params.kind === 'tradeoff') {
    return normalizeTradeoffCopy(BALANCE_COPY.eceLevel3Tradeoff);
  }
  if (params.kind === 'strong_fit') {
    return normalizeTradeoffCopy(
      'Güçlü saha uyumu bugünkü etkiyi belirginleştirir; ilgili sinyali izlemek yeterli.',
    );
  }
  return normalizeTradeoffCopy(BALANCE_COPY.eceLevel1Cautious);
}

export function buildImpactSummaryLine(
  domain: GameplayImpactDomain,
  delta: number,
  carryOver?: CarryOverRiskKind,
): string {
  const base = describeDomainImpactChange(domain, delta);
  if (carryOver) {
    return `${base}. ${getCarryOverRiskLine(carryOver)}`;
  }
  return normalizeTradeoffCopy(base);
}
