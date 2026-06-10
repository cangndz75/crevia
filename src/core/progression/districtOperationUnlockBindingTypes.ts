import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type DistrictUnlockBindingState = 'active' | 'next' | 'locked';

export type DistrictUnlockDistrictKind =
  | 'pilot'
  | 'residential'
  | 'commercial'
  | 'coastal'
  | 'industrial'
  | 'central'
  | 'unknown';

export type DistrictUnlockPresentationCategory =
  | 'pilot_area'
  | 'trust_sensitive'
  | 'resource_pressure'
  | 'crisis_ready'
  | 'map_expansion'
  | 'main_operation'
  | 'city_memory';

export type DistrictUnlockRelatedSystem =
  | 'authority'
  | 'district_trust'
  | 'district_operations'
  | 'main_operations'
  | 'map_layers'
  | 'advisor'
  | 'reports'
  | 'story_chains'
  | 'city_archive'
  | 'content_packs';

export type DistrictUnlockBindingItem = {
  id: string;
  districtId: MapDistrictId;
  title: string;
  subtitle: string;
  state: DistrictUnlockBindingState;
  districtKind: DistrictUnlockDistrictKind;
  presentationCategory: DistrictUnlockPresentationCategory;
  trustLabel?: string;
  pressureLabel?: string;
  unlockReason: string;
  unlockHint: string;
  authorityRequirementLabel?: string;
  operationRequirementLabel?: string;
  playerBenefit: string;
  relatedSystems: DistrictUnlockRelatedSystem[];
  detailTitle: string;
  detailBody: string;
  ctaLabel?: string;
  statePillLabel: string;
  categoryLabel: string;
};

export type MainOperationBindingItem = {
  id: string;
  title: string;
  subtitle: string;
  state: DistrictUnlockBindingState;
  linkedDistrictIds: string[];
  linkedSystemLabels: string[];
  unlockReason: string;
  playerBenefit: string;
  riskLabel?: string;
  detailTitle: string;
  detailBody: string;
  statePillLabel: string;
};

export type DistrictUnlockRecommendedStep = {
  title: string;
  hint: string;
  ctaLabel: string;
};

export type DistrictUnlockCategoryBlock = {
  id: DistrictUnlockPresentationCategory | 'city_expansion';
  title: string;
  subtitle: string;
  activeCount: number;
  totalCount: number;
  items: DistrictUnlockBindingItem[];
  previewItems: DistrictUnlockBindingItem[];
};

export type DistrictUnlockEmptyState = {
  visible: boolean;
  title: string;
  body: string;
};

export type DistrictOperationUnlockBindingSummary = {
  headline: string;
  subline: string;
  currentPhaseLabel: string;
  currentAuthorityLabel: string;
  activeDistrictCount: number;
  totalDistrictCount: number;
  activeDistricts: DistrictUnlockBindingItem[];
  nextDistricts: DistrictUnlockBindingItem[];
  lockedDistricts: DistrictUnlockBindingItem[];
  mainOperationLinks: MainOperationBindingItem[];
  recommendedNextStep?: DistrictUnlockRecommendedStep;
  categoryBlocks: DistrictUnlockCategoryBlock[];
  emptyState: DistrictUnlockEmptyState;
  allDistrictItems: DistrictUnlockBindingItem[];
};

export type DistrictOperationUnlockBindingCompactSummary = {
  visible: boolean;
  activeCountLabel: string;
  nextExpansionTitle?: string;
  nextExpansionLine?: string;
  ctaLabel: string;
  headline: string;
};

export type BuildDistrictOperationUnlockBindingInput = {
  currentDay?: number;
  pilotDay?: number;
  pilotStatus?: 'not_started' | 'active' | 'completed' | string;
  authorityState?: unknown;
  mainOperationSeason?: unknown;
  postPilotOperation?: unknown;
  operationSignals?: unknown;
  socialPulse?: unknown;
  crisisState?: unknown;
  resourceFatigue?: unknown;
  dailyReport?: unknown;
  carryOverMemory?: unknown;
};
