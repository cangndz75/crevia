import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaEventSelectionRecommendedVariantKind } from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventVariantKind } from '@/core/eventVariants/eventVariantTypes';
import type { CreviaDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';

export type CreviaDistrictMemoryKind =
  | 'unresolved_carry_over'
  | 'repeated_pressure'
  | 'recent_improvement'
  | 'recovery_window'
  | 'trust_shift'
  | 'resource_strain'
  | 'social_echo'
  | 'crisis_watch'
  | 'operation_followup'
  | 'quiet_stable';

export type CreviaDistrictMemoryIntensity = 'low' | 'medium' | 'high';

export type CreviaDistrictMemoryTrend = 'worsening' | 'steady' | 'improving' | 'recovering';

export type CreviaDistrictMemoryRuntimeHealthStatus = 'healthy' | 'watch' | 'strained' | 'fallback';

export type CreviaDistrictMemoryTrace = {
  id: string;
  districtId: MapDistrictId;
  kind: CreviaDistrictMemoryKind;
  intensity: CreviaDistrictMemoryIntensity;
  sourceSurface: string;
  sourceDomain?: string;
  dayWindow: string;
  shortLine: string;
  selectionHint: string;
  mapHint: string;
  reportHint: string;
  advisorHint: string;
  tomorrowHint: string;
};

export type CreviaDistrictMemoryDistrictSnapshot = {
  districtId: MapDistrictId;
  districtName: string;
  primaryKind: CreviaDistrictMemoryKind;
  intensity: CreviaDistrictMemoryIntensity;
  trend: CreviaDistrictMemoryTrend;
  primaryTrace?: CreviaDistrictMemoryTrace;
  secondaryTrace?: CreviaDistrictMemoryTrace;
  optionalRecoveryTrace?: CreviaDistrictMemoryTrace;
  traces: CreviaDistrictMemoryTrace[];
  trustBand?: string;
  isFallback: boolean;
  reasonLine: string;
};

export type CreviaDistrictMemorySnapshot = {
  day: number;
  focusDistrictId?: MapDistrictId;
  districts: CreviaDistrictMemoryDistrictSnapshot[];
  healthStatus: CreviaDistrictMemoryRuntimeHealthStatus;
  isTutorialSimplified: boolean;
  trustSnapshotRef?: CreviaDistrictTrustRuntimeSnapshot;
};

export type CreviaDistrictMemorySignalContext = {
  day?: number;
  focusDistrictId?: MapDistrictId | string;
  carryOverMemory?: unknown;
  dailyReport?: unknown;
  reportTomorrowPreview?: unknown;
  recentEvents?: unknown;
  operationSignals?: unknown;
  socialPulse?: unknown;
  crisisState?: unknown;
  resourceFatigue?: unknown;
  districtOperationHints?: unknown;
  vehicleMaintenance?: unknown;
  containerNetwork?: unknown;
  teamSpecialization?: unknown;
  recentExposure?: {
    familyIds?: string[];
    districtIds?: string[];
    domainIds?: string[];
  };
  rankKey?: string;
  unlockedPermissionIds?: string[];
  trustSnapshot?: CreviaDistrictTrustRuntimeSnapshot;
};

export type CreviaDistrictMemorySelectionHint = {
  districtId: MapDistrictId;
  kind: CreviaDistrictMemoryKind;
  preferredDomains: string[];
  preferredVariantKinds: CreviaEventSelectionRecommendedVariantKind[];
  selectionIntent: string;
  deprioritizeProblemSpam: boolean;
  isRuntimeHintOnly: boolean;
};

export type CreviaDistrictMemoryVariantBias = {
  districtId: MapDistrictId;
  kind: CreviaDistrictMemoryKind;
  preferredVariants: CreviaEventVariantKind[];
  memoryReasonLine: string;
  shouldStrengthenReward: boolean;
  shouldStrengthenComeback: boolean;
};

export type CreviaDistrictMemoryFreshnessModifier = {
  districtId: MapDistrictId;
  kind: CreviaDistrictMemoryKind;
  familyRepeatMultiplier: number;
  variantRepeatMultiplier: number;
  rewardSpamGuard: boolean;
  softenRecoveryRepeat: boolean;
  reduceProblemSpam: boolean;
  reasonLine: string;
};

export type CreviaDistrictMemoryRankVisibility = {
  mode: 'hidden' | 'compact' | 'standard' | 'detailed';
  showKind: boolean;
  showReason: boolean;
  showRecoveryAction: boolean;
};

export type CreviaDistrictMemoryPresentationModel = {
  districtId: MapDistrictId;
  districtName: string;
  kind: CreviaDistrictMemoryKind;
  kindLabel: string;
  shortLabel: string;
  tone: 'positive' | 'neutral' | 'warning';
  mapLine?: string;
  reportLine?: string;
  advisorLine?: string;
  tomorrowPreviewLine?: string;
  eventContextLine?: string;
  compactChip?: string;
  visibility: CreviaDistrictMemoryRankVisibility;
};

export type CreviaDistrictMemoryTrustContext = {
  districtId: MapDistrictId;
  trustBand?: string;
  memoryKind: CreviaDistrictMemoryKind;
  combinedReasonLine: string;
  softCopyForFragile: boolean;
  boostRewardVisibility: boolean;
};

export type CreviaDistrictMemoryRuntimeRecommendation = {
  summaryLine: string;
  snapshot: CreviaDistrictMemorySnapshot;
  selectionHints: CreviaDistrictMemorySelectionHint[];
  isRuntimeHintOnly: boolean;
};
