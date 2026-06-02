import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaDistrictMemoryKind } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import type { CreviaEventSelectionRecommendedVariantKind } from '@/core/eventSelection/eventSelectionTypes';

export type CreviaDistrictOperationRuntimeKind = string;

export type CreviaDistrictOperationRuntimeHealthStatus = 'healthy' | 'watch' | 'strained' | 'fallback';

export type CreviaDistrictOperationRuntimeTiming = 'today' | 'next_window' | 'when_ready';

export type CreviaDistrictOperationRuntimeKindDefinition = {
  kind: CreviaDistrictOperationRuntimeKind;
  label: string;
  shortLabel: string;
  districtId: MapDistrictId;
  domainFocus: string[];
  trustIntent: string;
  memoryIntent: string;
  resourceIntent: string;
  recommendedVariantBias: readonly CreviaEventSelectionRecommendedVariantKind[];
  mapHintIntent: string;
  reportHintIntent: string;
  advisorHintIntent: string;
  tomorrowHintIntent: string;
  maxCopyLength: number;
  forbiddenTerms: readonly string[];
  foundationKind?: string;
};

export type CreviaDistrictOperationRuntimeCandidate = {
  id: string;
  districtId: MapDistrictId;
  kind: CreviaDistrictOperationRuntimeKind;
  label: string;
  shortLabel: string;
  score: number;
  priority: number;
  confidence: 'low' | 'medium' | 'high';
  recommendedTiming: CreviaDistrictOperationRuntimeTiming;
  relatedDomains: string[];
  relatedTrustBand?: CreviaDistrictTrustBand;
  relatedMemoryKind?: CreviaDistrictMemoryKind;
  shortReason: string;
  mapLine: string;
  reportLine: string;
  advisorLine: string;
  tomorrowLine: string;
  eventSelectionHint: string;
  isSelectableNow: false;
  isRuntimeHintOnly: true;
};

export type CreviaDistrictOperationRuntimeRecommendation = CreviaDistrictOperationRuntimeCandidate;

export type CreviaDistrictOperationRuntimeDistrictSnapshot = {
  districtId: MapDistrictId;
  districtName: string;
  primary?: CreviaDistrictOperationRuntimeRecommendation;
  secondary?: CreviaDistrictOperationRuntimeRecommendation;
  candidates: CreviaDistrictOperationRuntimeCandidate[];
  isFallback: boolean;
};

export type CreviaDistrictOperationRuntimeSnapshot = {
  day: number;
  focusDistrictId?: MapDistrictId;
  districts: CreviaDistrictOperationRuntimeDistrictSnapshot[];
  healthStatus: CreviaDistrictOperationRuntimeHealthStatus;
  isTutorialSimplified: boolean;
};

export type CreviaDistrictOperationRuntimeContext = {
  day?: number;
  focusDistrictId?: MapDistrictId | string;
  operationSignals?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  operationEraId?: string;
  recentOperationKinds?: string[];
  rankKey?: string;
  unlockedPermissionIds?: string[];
  trustSnapshot?: import('@/core/districtTrustRuntime/districtTrustRuntimeTypes').CreviaDistrictTrustRuntimeSnapshot;
  memorySnapshot?: import('@/core/districtMemoryRuntime/districtMemoryRuntimeTypes').CreviaDistrictMemorySnapshot;
  selectionRecommendation?: import('@/core/eventSelection/eventSelectionTypes').CreviaEventSelectionRecommendation;
};

export type CreviaDistrictOperationRuntimeRankVisibility = {
  mode: 'hidden' | 'compact' | 'standard' | 'detailed';
  showKind: boolean;
  showReason: boolean;
  showTrustMemoryLink: boolean;
};

export type CreviaDistrictOperationRuntimePresentationModel = {
  districtId: MapDistrictId;
  districtName: string;
  primaryKind?: CreviaDistrictOperationRuntimeKind;
  hubLine?: string;
  mapLine?: string;
  reportLine?: string;
  advisorLine?: string;
  tomorrowPreviewLine?: string;
  compactChip?: string;
  visibility: CreviaDistrictOperationRuntimeRankVisibility;
};

export type CreviaDistrictOperationRuntimeFreshnessModifier = {
  districtId: MapDistrictId;
  operationKind: CreviaDistrictOperationRuntimeKind;
  repeatPenalty: number;
  reasonLine: string;
};
