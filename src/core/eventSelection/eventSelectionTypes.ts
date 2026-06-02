import type { OperationCareerPhase } from '@/core/openEndedProgression/openEndedProgressionTypes';
import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';

export type CreviaEventSelectionCandidateKind =
  | 'event_family'
  | 'district_operation_hint'
  | 'operation_era_context';

export type CreviaEventSelectionHealthStatus = 'healthy' | 'watch' | 'strained' | 'blocked';

export type CreviaEventSelectionRecommendedVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'reward'
  | 'comeback'
  | 'resource_fatigue'
  | 'district_trust'
  | 'crisis_adjacent'
  | 'operation_era';

export type CreviaEventSelectionContext = {
  day?: number;
  operationCareerPhase?: OperationCareerPhase;
  rankKey?: string;
  authorityBand?: 'low' | 'medium' | 'high';
  districtId?: string;
  districtTrustBand?: 'fragile' | 'watch' | 'stable' | 'trusted' | 'unknown';
  districtMemoryPressure?: 'low' | 'medium' | 'high';
  operationEraId?: string;
  crisisRiskBand?: 'low' | 'medium' | 'high' | 'critical';
  resourcePressureBand?: 'low' | 'medium' | 'high' | 'critical';
  vehicleMaintenancePressureBand?: 'low' | 'medium' | 'high';
  containerNetworkPressureBand?: 'low' | 'medium' | 'high';
  teamSpecializationFitBand?: 'weak' | 'acceptable' | 'strong';
  playerStyleId?: PlayerStyleId;
  recentEventFamilyIds?: string[];
  recentDistrictIds?: string[];
  recentDomainIds?: string[];
  recentVariantKinds?: string[];
  existingDailyEventCount?: number;
  unlockedPermissionIds?: string[];
};

export type CreviaEventSelectionSignalSnapshot = {
  day: number;
  districtId?: string;
  operationCareerPhase: OperationCareerPhase;
  authorityBand: 'low' | 'medium' | 'high';
  districtTrustBand: CreviaEventSelectionContext['districtTrustBand'];
  districtMemoryPressure: CreviaEventSelectionContext['districtMemoryPressure'];
  operationEraId?: string;
  crisisRiskBand: CreviaEventSelectionContext['crisisRiskBand'];
  resourcePressureBand: CreviaEventSelectionContext['resourcePressureBand'];
  playerStyleId: PlayerStyleId;
  recentExposure: {
    familyIds: string[];
    districtIds: string[];
    domainIds: string[];
    variantKinds: string[];
  };
};

export type CreviaEventSelectionWeightBreakdown = {
  districtRelevance: number;
  domainRelevance: number;
  operationPhaseRelevance: number;
  rankUnlockRelevance: number;
  operationEraRelevance: number;
  resourcePressureRelevance: number;
  districtTrustRelevance: number;
  crisisRelevance: number;
  playerStyleRelevance: number;
  freshnessPenalty: number;
  duplicatePenalty: number;
  echoCompletenessBonus: number;
  contentQualityBonus: number;
  mobileReadinessBonus: number;
  total: number;
};

export type CreviaEventSelectionCandidate = {
  id: string;
  kind: CreviaEventSelectionCandidateKind;
  sourceItemId: string;
  eventFamilyId?: string;
  operationEraId?: string;
  districtOperationKind?: string;
  districtIds: string[];
  domains: string[];
  title: string;
  tags: string[];
  score: number;
  weightBreakdown: CreviaEventSelectionWeightBreakdown;
  recommendedVariantKind: CreviaEventSelectionRecommendedVariantKind;
  isBlocked: boolean;
  blockReason?: string;
  isSelectablePrimary: boolean;
  isHeavyForTutorial: boolean;
};

export type CreviaEventSelectionDecision = {
  selectedCandidateId?: string;
  selectedEventFamilyId?: string;
  recommendedVariantKind?: CreviaEventSelectionRecommendedVariantKind;
  operationEraHintId?: string;
  districtOperationHintId?: string;
  reasonLine: string;
};

export type CreviaEventSelectionResult = {
  context: CreviaEventSelectionContext;
  signalSnapshot: CreviaEventSelectionSignalSnapshot;
  healthStatus: CreviaEventSelectionHealthStatus;
  candidates: CreviaEventSelectionCandidate[];
  rankedCandidates: CreviaEventSelectionCandidate[];
  primaryCandidates: CreviaEventSelectionCandidate[];
  decision: CreviaEventSelectionDecision;
  operationEraHints: CreviaEventSelectionCandidate[];
  districtOperationHints: CreviaEventSelectionCandidate[];
};

export type CreviaEventSelectionDebugReport = {
  title: string;
  summaryLine: string;
  candidateCount: number;
  rows: string[];
  weightRows: string[];
  freshnessWarnings: string[];
};

export type CreviaEventSelectionRecommendation = {
  summaryLine: string;
  eventFamilyId?: string;
  districtId?: string;
  recommendedVariantKind?: CreviaEventSelectionRecommendedVariantKind;
  isRuntimeHintOnly: boolean;
  debugReport?: CreviaEventSelectionDebugReport;
};
