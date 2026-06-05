import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaDistrictMemorySnapshot } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import type { CreviaDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';

export type CreviaStoryChainId =
  | 'cumhuriyet_container_recovery_chain'
  | 'sanayi_route_pressure_chain'
  | 'istasyon_transfer_flow_chain'
  | 'yesilvadi_environmental_recovery_chain'
  | 'merkez_visible_service_chain'
  | 'social_trust_repair_chain'
  | 'crisis_watch_prevention_chain'
  | 'resource_fatigue_balance_chain';

export type CreviaStoryChainKind =
  | 'route_pressure_chain'
  | 'container_recovery_chain'
  | 'social_trust_chain'
  | 'crisis_watch_chain'
  | 'district_recovery_chain'
  | 'visible_service_chain'
  | 'resource_fatigue_chain'
  | 'operation_followup_chain';

export type CreviaStoryChainStatus =
  | 'preview'
  | 'candidate'
  | 'active_hint'
  | 'continued'
  | 'resolved'
  | 'cooled_down'
  | 'blocked';

export type CreviaStoryChainStepKind =
  | 'trigger'
  | 'follow_up'
  | 'pressure_shift'
  | 'recovery_window'
  | 'reward_echo'
  | 'comeback_window'
  | 'prevention_check'
  | 'closure';

export type CreviaStoryChainHealthStatus = 'healthy' | 'watch' | 'limited' | 'fallback' | 'blocked';

export type CreviaStoryChainStepHints = {
  mapHint: string;
  advisorHint: string;
  reportHint: string;
  socialHint: string;
  tomorrowHint: string;
  resultHint: string;
};

export type CreviaStoryChainStepTemplate = {
  stepKind: CreviaStoryChainStepKind;
  dayOffset: number;
  title: string;
  shortLine: string;
  eventFamilyIntent: string;
  variantBias: readonly string[];
  districtMemoryIntent: string;
  districtTrustIntent: string;
  relatedEventFamilyId?: string;
  hints: CreviaStoryChainStepHints;
};

export type CreviaStoryChainTemplate = {
  id: CreviaStoryChainId;
  kind: CreviaStoryChainKind;
  title: string;
  shortLabel: string;
  districtIds: readonly MapDistrictId[];
  relatedDomains: readonly string[];
  recommendedVariantKinds: readonly string[];
  relatedEventFamilyIds: readonly string[];
  memoryIntent: string;
  trustIntent: string;
  freshnessIntent: string;
  steps: readonly CreviaStoryChainStepTemplate[];
};

export type CreviaStoryChainContext = {
  currentDay: number;
  selectedDistrictId?: MapDistrictId | string;
  eventFamilyId?: string;
  eventFamilyDomains?: readonly string[];
  variantKind?: string;
  districtTrustSnapshot?: CreviaDistrictTrustRuntimeSnapshot;
  districtMemorySnapshot?: CreviaDistrictMemorySnapshot;
  districtOperationsRecommendation?: unknown;
  districtOperationActionState?: unknown;
  operationSignals?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  recentEventExposure?: {
    familyIds?: readonly string[];
    districtIds?: readonly string[];
    domainIds?: readonly string[];
  };
  activeRouteHint?: unknown;
  contentPackMetadata?: unknown;
  recentChainKindIds?: readonly CreviaStoryChainKind[];
  rankKey?: string;
  unlockedPermissionIds?: readonly string[];
};

export type CreviaStoryChainStep = {
  stepIndex: number;
  stepKind: CreviaStoryChainStepKind;
  dayOffset: number;
  title: string;
  shortLine: string;
  eventFamilyIntent: string;
  variantBias: readonly string[];
  districtMemoryIntent: string;
  districtTrustIntent: string;
  relatedEventFamilyId?: string;
  hints: CreviaStoryChainStepHints;
  isCurrentStep: boolean;
  isFutureStep: boolean;
};

export type CreviaResolvedStoryChain = {
  id: CreviaStoryChainId;
  kind: CreviaStoryChainKind;
  status: CreviaStoryChainStatus;
  healthStatus: CreviaStoryChainHealthStatus;
  title: string;
  shortLabel: string;
  districtId: MapDistrictId;
  districtName: string;
  currentDay: number;
  stepCount: number;
  currentStepIndex: number;
  steps: CreviaStoryChainStep[];
  score: number;
  scoreReasons: string[];
  memoryIntent: string;
  trustIntent: string;
  freshnessIntent: string;
  isRuntimeLinked: false;
  isComplexityHidden: boolean;
  reasonLine: string;
};

export type CreviaStoryChainPresentationModel = {
  chainId: CreviaStoryChainId;
  kind: CreviaStoryChainKind;
  status: CreviaStoryChainStatus;
  districtId: MapDistrictId;
  districtName: string;
  compactChip: string;
  hubLine: string;
  mapLine: string;
  reportLine: string;
  resultLine: string;
  advisorLine: string;
  tomorrowLine: string;
  stepCount: number;
  currentStepIndex: number;
  isRuntimeLinked: false;
};

export type CreviaStoryChainScoredCandidate = {
  templateId: CreviaStoryChainId;
  kind: CreviaStoryChainKind;
  score: number;
  reasons: string[];
};

export type CreviaStoryChainStepPreview = {
  chainId: CreviaStoryChainId;
  stepIndex: number;
  stepKind: CreviaStoryChainStepKind;
  title: string;
  shortLine: string;
  dayOffset: number;
  hints: CreviaStoryChainStepHints;
};

export type CreviaStoryChainDebugRow = {
  templateId: CreviaStoryChainId;
  kind: CreviaStoryChainKind;
  districtIds: string;
  score: number;
  status: CreviaStoryChainStatus;
  topReason: string;
};

export type CreviaStoryChainAnalyticsHint = {
  chainKind: CreviaStoryChainKind;
  status: CreviaStoryChainStatus;
  districtId: MapDistrictId;
  stepCount: number;
  variantBias: readonly string[];
  isRuntimeLinked: false;
};

export type CreviaStoryChainRuntimeHintSurface =
  | 'hub'
  | 'map'
  | 'result'
  | 'report'
  | 'advisor'
  | 'tomorrow';

export type CreviaStoryChainRuntimeHintVisibility =
  | 'hidden'
  | 'subtle'
  | 'compact'
  | 'standard'
  | 'detailed';

export type CreviaStoryChainRuntimeHintSource =
  | 'story_chain_resolver'
  | 'carry_over'
  | 'district_memory'
  | 'district_trust'
  | 'district_operation_action'
  | 'active_route'
  | 'crisis_watch'
  | 'resource_fatigue'
  | 'fallback';

export type CreviaStoryChainRuntimeHintHealthStatus =
  | 'healthy'
  | 'watch'
  | 'limited'
  | 'fallback'
  | 'blocked'
  | 'suppressed';

export type CreviaStoryChainRuntimeHintLine = {
  id: string;
  surface: CreviaStoryChainRuntimeHintSurface;
  text: string;
  label: string;
  chainKind?: CreviaStoryChainKind;
  stepKind?: CreviaStoryChainStepKind;
  districtId?: MapDistrictId;
  visibility: CreviaStoryChainRuntimeHintVisibility;
  source: CreviaStoryChainRuntimeHintSource;
  priority: number;
  iconKey: string;
  tone: 'teal' | 'mint' | 'gold' | 'neutral' | 'warn';
  isHintOnly: true;
  maxLines: 1 | 2;
  suppressionReason?: string;
};

export type CreviaStoryChainRuntimeHintModel = {
  visible: boolean;
  visibility: CreviaStoryChainRuntimeHintVisibility;
  healthStatus: CreviaStoryChainRuntimeHintHealthStatus;
  chainKind?: CreviaStoryChainKind;
  stepKind?: CreviaStoryChainStepKind;
  districtId?: MapDistrictId;
  hubLine?: CreviaStoryChainRuntimeHintLine;
  mapLine?: CreviaStoryChainRuntimeHintLine;
  resultLine?: CreviaStoryChainRuntimeHintLine;
  reportLine?: CreviaStoryChainRuntimeHintLine;
  advisorLine?: CreviaStoryChainRuntimeHintLine;
  tomorrowLine?: CreviaStoryChainRuntimeHintLine;
  isRuntimeLinked: false;
  suppressionReasons: string[];
  debugRows: string[];
};
