import type { DecisionImpactExplanationKind } from './decisionImpactExplanationTypes';

export const DECISION_IMPACT_EXPLANATION_TITLE = 'Kararın etkisi';
export const DECISION_IMPACT_EXPLANATION_MAIN_LINE_LIMIT = 132;
export const DECISION_IMPACT_EXPLANATION_TOMORROW_LINE_LIMIT = 96;

export const DECISION_IMPACT_EXPLANATION_KINDS: readonly DecisionImpactExplanationKind[] = [
  'positive_tradeoff',
  'risk_tradeoff',
  'resource_pressure',
  'district_trust_shift',
  'social_response',
  'route_balance',
  'container_pressure',
  'personnel_fatigue',
  'crisis_prevention',
  'carry_over_warning',
  'recovery_signal',
  'neutral_learning',
  'fallback',
] as const;

export const DECISION_IMPACT_FORBIDDEN_TERMS: readonly string[] = [
  'mükemmel seçim',
  'kötü karar',
  'kaybettin',
  'ceza',
  'ödül kazan',
  'hemen geri gel',
  'fomo',
  'panik',
  'felaket',
  'çöktü',
] as const;

export const DECISION_IMPACT_DOMAIN_LABELS: Record<string, string> = {
  social: 'sosyal güven',
  route: 'rota dengesi',
  vehicle: 'araç yorgunluğu',
  container: 'konteyner baskısı',
  personnel: 'ekip yorgunluğu',
  crisis: 'risk eşiği',
  district: 'mahalle güveni',
  operations: 'operasyon dengesi',
};
