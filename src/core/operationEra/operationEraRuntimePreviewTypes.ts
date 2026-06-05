import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaDistrictMemorySnapshot } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import type { CreviaDistrictOperationActionState } from '@/core/districtOperationActions/districtOperationActionTypes';
import type { CreviaDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import type { CreviaStoryChainKind } from '@/core/storyChains/storyChainTypes';
import type { CreviaStoryChainRuntimeHintModel } from '@/core/storyChains/storyChainTypes';

export type CreviaOperationEraPreviewKind =
  | 'route_efficiency_era'
  | 'container_recovery_era'
  | 'social_trust_era'
  | 'crisis_prevention_era'
  | 'district_development_era'
  | 'resource_balance_era'
  | 'visible_service_era'
  | 'open_operation_career_era';

export type CreviaOperationEraPreviewStatus =
  | 'hidden'
  | 'pilot_prep'
  | 'preview'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaOperationEraPreviewVisibility =
  | 'hidden'
  | 'pilot_prep'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaOperationEraPreviewHealthStatus =
  | 'healthy'
  | 'watch'
  | 'limited'
  | 'fallback'
  | 'blocked'
  | 'suppressed';

export type CreviaOperationEraPreviewTone =
  | 'neutral'
  | 'teal'
  | 'mint'
  | 'gold'
  | 'watch'
  | 'recovery';

export type CreviaOperationEraPreviewEligibility = {
  visible: boolean;
  mode: CreviaOperationEraPreviewVisibility;
  isPostPilot: boolean;
  isLimitedMode: boolean;
  isFullMode: boolean;
  isHighRank: boolean;
  reasons: string[];
};

export type CreviaOperationEraPreviewDefinition = {
  kind: CreviaOperationEraPreviewKind;
  label: string;
  shortLabel: string;
  tone: CreviaOperationEraPreviewTone;
  relatedDomains: readonly string[];
  relatedDistricts: readonly MapDistrictId[];
  relatedContentPacks: readonly string[];
  recommendedMapLayerFocus: string;
  recommendedAdvisorFocus: string;
  recommendedStoryChainKinds: readonly CreviaStoryChainKind[];
  recommendedVariantBias: readonly string[];
  reportIntent: string;
  hubIntent: string;
  profileIntent: string;
  mapIntent: string;
  maxCopyLength: number;
  forbiddenTerms: readonly string[];
};

export type CreviaOperationEraPreviewLine = {
  id: string;
  surface: 'hub' | 'map' | 'report' | 'profile' | 'advisor';
  text: string;
  label: string;
  chipLabel?: string;
  kind: CreviaOperationEraPreviewKind;
  tone: CreviaOperationEraPreviewTone;
  iconKey: string;
  priority: number;
  source: string;
  isHintOnly: true;
  maxLines: 1 | 2;
};

export type CreviaOperationEraPreviewContext = {
  currentDay: number;
  selectedDistrictId?: MapDistrictId | string;
  rankKey?: string;
  authorityTrust?: number;
  unlockedPermissionIds?: string[];
  isPostPilot?: boolean;
  isPilotCompleted?: boolean;
  isLimitedMode?: boolean;
  isFullMode?: boolean;
  operationSignals?: unknown;
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot;
  districtOperationActionState?: CreviaDistrictOperationActionState;
  activeTaskRouteModel?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  storyChainRuntimeHint?: CreviaStoryChainRuntimeHintModel | null;
  contentPackCoverage?: readonly string[];
  reportSystemsSummary?: string;
  profileCareerSummary?: string;
  recentEraKindIds?: readonly CreviaOperationEraPreviewKind[];
  openEndedPhase?: string;
};

export type CreviaOperationEraRuntimePreviewModel = {
  visible: boolean;
  status: CreviaOperationEraPreviewStatus;
  visibility: CreviaOperationEraPreviewVisibility;
  healthStatus: CreviaOperationEraPreviewHealthStatus;
  kind: CreviaOperationEraPreviewKind;
  label: string;
  shortLabel: string;
  score: number;
  scoreReasons: string[];
  eligibility: CreviaOperationEraPreviewEligibility;
  hubLine?: CreviaOperationEraPreviewLine;
  reportLine?: CreviaOperationEraPreviewLine;
  profileLine?: CreviaOperationEraPreviewLine;
  mapLine?: CreviaOperationEraPreviewLine;
  advisorLine?: CreviaOperationEraPreviewLine;
  compactChip?: string;
  isRuntimeLinked: false;
  suppressionReasons: string[];
  debugRows: string[];
};

export type CreviaOperationEraScoredPreviewCandidate = {
  kind: CreviaOperationEraPreviewKind;
  score: number;
  reasons: string[];
};

export type CreviaOperationEraPreviewCardModel = {
  visible: boolean;
  title: string;
  subtitle: string;
  chipLabel?: string;
  line?: string;
  tone: CreviaOperationEraPreviewTone;
  iconKey: string;
  kind: CreviaOperationEraPreviewKind;
  isHintOnly: true;
};
