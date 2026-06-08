import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type ContentPackFullActivationPhaseId =
  | 'phase_0_lite'
  | 'phase_1_expanded_safe'
  | 'phase_2_full_main_operation'
  | 'phase_3_future';

export type ContentPackFullAccessMode = 'pilot' | 'post_pilot_light' | 'main_operation_full';

export type ContentPackFullReadinessStatus =
  | 'blocked'
  | 'risky'
  | 'ready_for_limited_full'
  | 'ready_for_full_implementation';

export type ContentPackFullGroupId =
  | 'district_pack'
  | 'vehicle_route_pack'
  | 'container_environment_pack'
  | 'personnel_morale_pack'
  | 'social_trust_pack'
  | 'crisis_adjacent_pack'
  | 'reward_comeback_pack'
  | 'operation_followup_pack';

export type ContentPackFullDomainId =
  | 'district_balance'
  | 'vehicle_route'
  | 'container_environment'
  | 'personnel_morale'
  | 'social_trust'
  | 'crisis_adjacent'
  | 'reward_positive'
  | 'comeback_recovery'
  | 'operation_followup'
  | 'resource_pressure';

export type ContentPackFullRiskLevel = 'low' | 'medium' | 'high';

export type ContentPackFullGroupPlan = {
  groupId: ContentPackFullGroupId;
  activationPhase: ContentPackFullActivationPhaseId;
  allowedDays: string;
  allowedAccessMode: ContentPackFullAccessMode[];
  maxPerDay: number;
  maxPerWeekWindow: number;
  districtCoverage: MapDistrictId[];
  storyChainTriggerRisk: ContentPackFullRiskLevel;
  archiveEntryRisk: ContentPackFullRiskLevel;
  reportDensityRisk: ContentPackFullRiskLevel;
  socialDensityRisk: ContentPackFullRiskLevel;
  readinessStatus: ContentPackFullReadinessStatus;
  blockerReason?: string;
};

export type ContentPackFullDomainPlan = {
  domainId: ContentPackFullDomainId;
  activationPhase: ContentPackFullActivationPhaseId;
  maxPerDay: number;
  maxPerWindowDays: number;
  maxPerWindowCount: number;
  semanticCluster: string;
  freshnessCooldownDays: number;
};

export type ContentPackFullDayCapPlan = {
  dayRange: string;
  accessMode: ContentPackFullAccessMode | 'pilot_day1' | 'pilot_day2_7';
  packOriginEventsMax: number;
  archiveEntriesFromPackMax: number;
  storyChainTriggersMax: number;
  reportPackEchoMax: number;
  socialEnrichmentExtraCount: number;
};

export type DistrictBalanceRisk = {
  overloadedDistricts: MapDistrictId[];
  underusedDistricts: MapDistrictId[];
  repeatedDomainWarnings: string[];
  recommendedWeightAdjustment: Partial<Record<MapDistrictId, number>>;
};

export type StoryChainPackRisk = {
  canStartChain: boolean;
  shouldAdvanceExisting: boolean;
  shouldSuppressChainTrigger: boolean;
  reason: string;
};

export type ContentPackFullReadinessScore = {
  catalogCoverageScore: number;
  duplicateRiskScore: number;
  storyChainRiskScore: number;
  archiveSpamRiskScore: number;
  reportDensityRiskScore: number;
  dayOneSafetyScore: number;
  postPilotBalanceScore: number;
  manualQaNeedScore: number;
  overallReadiness: ContentPackFullReadinessStatus;
  summaryLine: string;
};

export type ContentPackFullPlanningAuditCheck = {
  id: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
};

export type ContentPackFullPlanningAuditResult = {
  checks: ContentPackFullPlanningAuditCheck[];
  readinessScore: ContentPackFullReadinessScore;
  districtBalanceRisk: DistrictBalanceRisk;
  storyChainPackRiskSample: StoryChainPackRisk;
  runtimeActivationOpen: boolean;
  implementationBlocked: boolean;
};

export type ContentPackFullImplementationScope = {
  stage: string;
  included: string[];
  notIncluded: string[];
};
