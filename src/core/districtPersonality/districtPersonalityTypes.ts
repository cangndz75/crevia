import type {
  EventGameplayDecisionShape,
  EventGameplayPressureDomain,
  EventGameplayPressureKind,
} from '@/core/eventVariety/eventGameplayVarietyTypes';
import type { MapGameplayRole } from '@/core/mapGameplayBinding/mapGameplayBindingTypes';

export const DISTRICT_CRITERION_IDS = [
  'social_sensitivity',
  'route_difficulty',
  'container_density',
  'trust_fragility',
  'recovery_potential',
  'neglect_risk',
  'maintenance_exposure',
  'operation_history_weight',
  'public_visibility',
  'resource_dependency',
] as const;

export type DistrictCriterionId = (typeof DISTRICT_CRITERION_IDS)[number];

export const DISTRICT_ARCHETYPE_IDS = [
  'balanced_district',
  'socially_sensitive',
  'route_bottleneck',
  'container_dense',
  'trust_fragile',
  'recovery_ready',
  'neglect_prone',
  'maintenance_exposed',
  'public_attention_zone',
  'resource_heavy',
] as const;

export type DistrictArchetypeId = (typeof DISTRICT_ARCHETYPE_IDS)[number];

export const DISTRICT_PERSONALITY_SOURCE_KINDS = [
  'design_baseline',
  'district_identity',
  'district_trust',
  'district_memory',
  'social_pulse',
  'operation_signal',
  'resource_pressure',
  'container_network',
  'vehicle_maintenance',
  'team_specialization',
  'active_task_route',
  'city_archive',
  'decision_consequence',
  'event_history',
  'fallback',
] as const;

export type DistrictPersonalitySourceKind =
  (typeof DISTRICT_PERSONALITY_SOURCE_KINDS)[number];

export type DistrictCriterionBand = 'low' | 'medium' | 'high';

export type DistrictCriterionScore = {
  id: DistrictCriterionId;
  score: number;
  band: DistrictCriterionBand;
  label: string;
  gameplayMeaning: string;
  sourceKinds: DistrictPersonalitySourceKind[];
  sourceIds: string[];
};

export const DISTRICT_GAMEPLAY_TAGS = [
  'social_watch',
  'route_watch',
  'container_watch',
  'trust_watch',
  'recovery_window',
  'neglect_watch',
  'maintenance_watch',
  'resource_watch',
  'memory_watch',
  'balanced_watch',
] as const;

export type DistrictGameplayTag = (typeof DISTRICT_GAMEPLAY_TAGS)[number];

export type DistrictEventBias = {
  preferredDomains: EventGameplayPressureDomain[];
  pressureHints: EventGameplayPressureKind[];
};

export type DistrictStrategyBias = {
  rapidResponseRisk: DistrictCriterionBand;
  balancedPlanFit: DistrictCriterionBand;
  longTermFixValue: DistrictCriterionBand;
  recommendedCautionLine: string;
};

export type DistrictMapBias = {
  preferredMapRoles: Extract<
    MapGameplayRole,
    | 'risk_reader'
    | 'resource_board'
    | 'district_memory'
    | 'route_support'
    | 'result_trace'
    | 'overview'
  >[];
  mapSignalLine: string;
};

export type DistrictEceToneHint =
  | 'calm'
  | 'cautious'
  | 'strategic'
  | 'recovery'
  | 'warning'
  | 'positive';

export type DistrictPersonalityProfile = {
  districtId: string;
  districtName: string;
  archetypeIds: DistrictArchetypeId[];
  primaryArchetypeId: DistrictArchetypeId;
  criteria: DistrictCriterionScore[];
  primaryCriterionId: DistrictCriterionId;
  secondaryCriterionIds: DistrictCriterionId[];
  gameplayTags: DistrictGameplayTag[];
  eventBias: DistrictEventBias;
  strategyBias: DistrictStrategyBias;
  mapBias: DistrictMapBias;
  eceToneHint: DistrictEceToneHint;
  retentionHookHint?: string;
  confidence: 'low' | 'medium' | 'high';
  isFallback: boolean;
  sourceLabel: string;
  sourceIds: string[];
};

export type DistrictPersonalityInput = {
  districtId?: string | null;
  districtName?: string | null;
  day?: number;
  unlockedPermissionIds?: string[];
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  socialSignals?: unknown;
  operationSignals?: unknown;
  resourceSignals?: unknown;
  containerNetworkSignals?: unknown;
  vehicleMaintenanceSignals?: unknown;
  teamSpecializationSignals?: unknown;
  activeTaskRouteSignals?: unknown;
  cityArchiveSignals?: unknown;
  decisionConsequenceSignals?: unknown;
  eventHistorySignals?: unknown;
};

export type DistrictPersonalityLineKind =
  | 'map_signal'
  | 'ece_hint'
  | 'event_inspect'
  | 'event_plan'
  | 'report_note'
  | 'retention_hook'
  | 'authority_teaser'
  | 'fallback';

export type DistrictPersonalityEventContext = {
  domainBiases: EventGameplayPressureDomain[];
  pressureBiases: EventGameplayPressureKind[];
  decisionShapeHint?: EventGameplayDecisionShape;
  inspectLine?: string;
  planLine?: string;
  strategyCautionLine?: string;
};

export type DistrictPersonalityAdvisorContext = {
  phase: 'hub' | 'inspect' | 'plan' | 'report' | 'retention';
  day?: number;
  permissionVisibility?: 'hidden' | 'teaser' | 'summary' | 'detailed';
  sourceConfidence?: 'low' | 'medium' | 'high';
  activeCriterionId?: DistrictCriterionId;
};

export type DistrictRetentionHint = {
  districtId: string;
  title: string;
  line: string;
  priority: number;
  sourceKinds: DistrictPersonalitySourceKind[];
  isActionable: boolean;
};
