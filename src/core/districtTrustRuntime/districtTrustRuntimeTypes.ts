import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaEventSelectionRecommendedVariantKind } from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventVariantKind } from '@/core/eventVariants/eventVariantTypes';

export type CreviaDistrictTrustBand =
  | 'fragile'
  | 'strained'
  | 'watch'
  | 'stable'
  | 'trusted'
  | 'improving'
  | 'recovering';

export type CreviaDistrictTrustRuntimeHealthStatus = 'healthy' | 'watch' | 'strained' | 'fallback';

export type CreviaDistrictTrustTrend = 'falling' | 'strained' | 'steady' | 'improving' | 'recovering';

export type CreviaDistrictTrustDistrictSnapshot = {
  districtId: MapDistrictId;
  districtName: string;
  score: number;
  band: CreviaDistrictTrustBand;
  trend: CreviaDistrictTrustTrend;
  pressureDomains: string[];
  signalSources: string[];
  reasonLine: string;
  isFallback: boolean;
};

export type CreviaDistrictTrustRuntimeSnapshot = {
  day: number;
  focusDistrictId?: MapDistrictId;
  districts: CreviaDistrictTrustDistrictSnapshot[];
  healthStatus: CreviaDistrictTrustRuntimeHealthStatus;
  isTutorialSimplified: boolean;
  generatedAtDay: number;
};

export type CreviaDistrictTrustSignalContext = {
  day?: number;
  focusDistrictId?: MapDistrictId | string;
  dailyReport?: unknown;
  socialPulse?: unknown;
  operationSignals?: unknown;
  carryOverMemory?: unknown;
  recentEvents?: unknown;
  resourceFatigue?: unknown;
  crisisState?: unknown;
  districtOperationHints?: unknown;
  rankKey?: string;
  unlockedPermissionIds?: string[];
  rankPermissionUnlocked?: boolean;
};

export type CreviaDistrictTrustSelectionHint = {
  districtId: MapDistrictId;
  band: CreviaDistrictTrustBand;
  preferredDomains: string[];
  preferredVariantKinds: CreviaEventSelectionRecommendedVariantKind[];
  eventWeightIntent: string;
  isRuntimeHintOnly: boolean;
};

export type CreviaDistrictTrustVariantBias = {
  districtId: MapDistrictId;
  band: CreviaDistrictTrustBand;
  preferredVariants: CreviaEventVariantKind[];
  reasonLine: string;
  shouldStrengthenReward: boolean;
  shouldStrengthenComeback: boolean;
};

export type CreviaDistrictTrustFreshnessModifier = {
  districtId: MapDistrictId;
  band: CreviaDistrictTrustBand;
  familyRepeatMultiplier: number;
  districtRepeatMultiplier: number;
  variantRepeatMultiplier: number;
  rewardSpamGuard: boolean;
  softenRecoveryRepeat: boolean;
  reasonLine: string;
};

export type CreviaDistrictTrustRankVisibility = {
  mode: 'hidden' | 'compact' | 'standard' | 'detailed';
  showTrend: boolean;
  showRecoveryHint: boolean;
  showNextAction: boolean;
};

export type CreviaDistrictTrustPresentationModel = {
  districtId: MapDistrictId;
  districtName: string;
  band: CreviaDistrictTrustBand;
  bandLabel: string;
  shortLabel: string;
  tone: 'positive' | 'neutral' | 'warning';
  mapLine?: string;
  reportLine?: string;
  advisorLine?: string;
  tomorrowPreviewLine?: string;
  eventContextLine?: string;
  compactChip?: string;
  visibility: CreviaDistrictTrustRankVisibility;
};

export type CreviaDistrictTrustRuntimeRecommendation = {
  summaryLine: string;
  snapshot: CreviaDistrictTrustRuntimeSnapshot;
  selectionHints: CreviaDistrictTrustSelectionHint[];
  isRuntimeHintOnly: boolean;
};
