import type {
  CreviaEventSelectionCandidateKind,
  CreviaEventSelectionHealthStatus,
  CreviaEventSelectionRecommendedVariantKind,
} from './eventSelectionTypes';

export const EVENT_SELECTION_SCORE_RANGE = { min: 0, max: 100 } as const;

export const EVENT_SELECTION_WEIGHTS = {
  districtRelevance: 14,
  domainRelevance: 12,
  operationPhaseRelevance: 8,
  rankUnlockRelevance: 8,
  operationEraRelevance: 10,
  resourcePressureRelevance: 10,
  districtTrustRelevance: 8,
  crisisRelevance: 8,
  playerStyleRelevance: 6,
  echoCompletenessBonus: 8,
  contentQualityBonus: 6,
  mobileReadinessBonus: 4,
  freshnessFamilyPenalty: 18,
  freshnessDistrictPenalty: 10,
  freshnessDomainPenalty: 8,
  duplicatePenalty: 15,
  echoRepeatPenalty: 4,
} as const;

export const EVENT_SELECTION_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun bitti',
  'yeni sezona başla',
  'premium al',
  'paywall',
  'panik',
  'felaket',
  'çöküş',
] as const;

export const EVENT_SELECTION_PANIC_WORDING_TERMS: readonly string[] = [
  'panik',
  'felaket',
  'çöküş',
  'kaos',
] as const;

export const EVENT_SELECTION_CANDIDATE_KINDS: readonly CreviaEventSelectionCandidateKind[] = [
  'event_family',
  'district_operation_hint',
  'operation_era_context',
] as const;

export const EVENT_SELECTION_VARIANT_KINDS: readonly CreviaEventSelectionRecommendedVariantKind[] = [
  'normal',
  'improved',
  'worsened',
  'carry_over',
  'reward',
  'comeback',
  'resource_fatigue',
  'district_trust',
  'crisis_adjacent',
  'operation_era',
] as const;

export const EVENT_SELECTION_HEALTH_THRESHOLDS = {
  healthyMin: 70,
  watchMin: 45,
  strainedMin: 25,
} as const;

export const EVENT_SELECTION_TUTORIAL_MAX_DAY = 1;

export const EVENT_SELECTION_HEAVY_TAGS = [
  'crisis_watch',
  'operation_era',
  'authority_milestone',
  'citywide',
] as const;

export const EVENT_SELECTION_HEAVY_DOMAINS = [
  'crisis_adjacent',
  'authority_milestone',
  'operation_era',
] as const;

export const EVENT_SELECTION_PLAYER_STYLE_DOMAIN_AFFINITY: Record<string, readonly string[]> = {
  fast_responder: ['vehicle_route', 'personnel'],
  preventive_planner: ['resource_recovery', 'district_balance'],
  public_focused: ['social', 'district_balance'],
  resource_guardian: ['personnel', 'resource_recovery'],
  crisis_watcher: ['crisis_adjacent', 'resource_recovery'],
  balanced_operator: ['generic_operation', 'district_balance'],
  route_focused: ['vehicle_route', 'personnel'],
  district_loyalist: ['district_balance', 'social'],
  inconsistent_operator: ['generic_operation'],
  unknown: ['generic_operation'],
};

export const EVENT_SELECTION_PHASE_DOMAIN_AFFINITY: Record<string, readonly string[]> = {
  pilot_training: ['generic_operation', 'container'],
  light_main_operation: ['container', 'social'],
  district_responsibility: ['district_balance', 'social'],
  crisis_recovery_management: ['crisis_adjacent', 'resource_recovery'],
  citywide_operations: ['authority_milestone', 'operation_era'],
  long_term_career: ['operation_era', 'authority_milestone'],
};

export const EVENT_SELECTION_DEFAULT_PHASE = 'light_main_operation' as const;

export const EVENT_SELECTION_DEBUG_MIN_CANDIDATES = 5;
