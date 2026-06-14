export type EventGameplayPressureDomain =
  | 'transport'
  | 'environment'
  | 'social'
  | 'logistics'
  | 'maintenance'
  | 'container'
  | 'general';

export type EventGameplayPressureKind =
  | 'time_pressure'
  | 'resource_pressure'
  | 'social_sensitivity'
  | 'district_trust_pressure'
  | 'route_pressure'
  | 'team_fatigue_pressure'
  | 'vehicle_maintenance_pressure'
  | 'container_network_pressure'
  | 'tomorrow_risk_pressure'
  | 'opportunity_window'
  | 'calm_standard';

export type EventGameplayStrategyBias =
  | 'rapid_response'
  | 'balanced_plan'
  | 'long_term_fix'
  | 'mixed'
  | 'none';

export type EventGameplayDecisionShape =
  | 'fast_vs_costly'
  | 'social_vs_resource'
  | 'short_term_vs_long_term'
  | 'safe_vs_risky'
  | 'repair_vs_prevent'
  | 'coverage_vs_depth'
  | 'standard';

export type EventGameplayRepetitionRisk = 'low' | 'medium' | 'high';

export type EventGameplayVarietyProfile = {
  eventId: string;
  familyId?: string;
  variantId?: string;
  domain: EventGameplayPressureDomain;
  primaryPressure: EventGameplayPressureKind;
  secondaryPressures: EventGameplayPressureKind[];
  strategyBias: EventGameplayStrategyBias;
  decisionShape: EventGameplayDecisionShape;
  freshnessScore: number;
  repetitionRisk: EventGameplayRepetitionRisk;
  playerFacingLine: string;
  planHintLine?: string;
  dispatchHintLine?: string;
  fieldHintLine?: string;
  sourceLabel: string;
  sourceIds: string[];
};

export type BuildEventGameplayVarietyProfileInput = {
  day?: number;
  isDay1LearningEvent?: boolean;
  /** Son N event profili — repetition risk için (presentation/selection hint). */
  recentProfiles?: Pick<
    EventGameplayVarietyProfile,
    'domain' | 'primaryPressure' | 'decisionShape'
  >[];
};

export const EVENT_GAMEPLAY_PRESSURE_DOMAINS: EventGameplayPressureDomain[] = [
  'transport',
  'environment',
  'social',
  'logistics',
  'maintenance',
  'container',
  'general',
];

export const EVENT_GAMEPLAY_PRESSURE_KINDS: EventGameplayPressureKind[] = [
  'time_pressure',
  'resource_pressure',
  'social_sensitivity',
  'district_trust_pressure',
  'route_pressure',
  'team_fatigue_pressure',
  'vehicle_maintenance_pressure',
  'container_network_pressure',
  'tomorrow_risk_pressure',
  'opportunity_window',
  'calm_standard',
];

export const EVENT_GAMEPLAY_DECISION_SHAPES: EventGameplayDecisionShape[] = [
  'fast_vs_costly',
  'social_vs_resource',
  'short_term_vs_long_term',
  'safe_vs_risky',
  'repair_vs_prevent',
  'coverage_vs_depth',
  'standard',
];

export const EVENT_GAMEPLAY_STRATEGY_BIASES: EventGameplayStrategyBias[] = [
  'rapid_response',
  'balanced_plan',
  'long_term_fix',
  'mixed',
  'none',
];
