import type { ActiveTaskRouteDomain, ActiveTaskRouteModel } from '@/core/activeTaskRoutes/activeTaskRouteTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type {
  DistrictTrustLevel,
  DistrictTrustMemoryItem,
  DistrictTrustScoreResult,
} from '@/core/districtTrust/districtTrustTypes';
import type { EventFamilyDomain } from '@/core/eventFamilies/eventFamilyTypes';
import type { CreviaMapLayerId } from '@/core/mapLayers/mapLayerTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

export type DistrictOperationId = string;

export type DistrictOperationKind =
  | 'visible_service'
  | 'route_discipline'
  | 'container_network'
  | 'public_trust'
  | 'recovery_focus'
  | 'crisis_prevention'
  | 'resource_balance'
  | 'environmental_care'
  | 'district_memory_response'
  | 'operation_era_special';

export type DistrictOperationStatus =
  | 'unavailable'
  | 'preview'
  | 'ready'
  | 'recommended'
  | 'active'
  | 'completed'
  | 'cooldown'
  | 'future';

export type DistrictOperationTone =
  | 'neutral'
  | 'positive'
  | 'watch'
  | 'strained'
  | 'recovering'
  | 'crisis_watch';

export type DistrictOperationUnlockAxis =
  | 'rank_permission'
  | 'district_trust'
  | 'district_memory'
  | 'resource_stability'
  | 'event_family_signal'
  | 'active_task_route'
  | 'operation_era'
  | 'future_system';

export type DistrictOperationImpactDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'trust'
  | 'crisis'
  | 'map'
  | 'city_development';

export type DistrictOperationEligibilityReason =
  | 'rank_unlocked'
  | 'trust_level_met'
  | 'trust_needs_recovery'
  | 'repeated_pressure_detected'
  | 'resource_pressure_detected'
  | 'crisis_watch_detected'
  | 'event_family_relevant'
  | 'route_context_available'
  | 'operation_era_relevant'
  | 'future_locked'
  | 'fallback';

export type DistrictOperationDefinition = {
  id: DistrictOperationId;
  districtId: MapDistrictId;
  kind: DistrictOperationKind;
  title: string;
  shortLabel: string;
  description: string;
  districtFlavorLine: string;
  requiredPermissionId?: string;
  requiredTrustLevel?: DistrictTrustLevel;
  recommendedTrustLevels?: DistrictTrustLevel[];
  unlockAxes: DistrictOperationUnlockAxis[];
  impactDomains: DistrictOperationImpactDomain[];
  relatedEventFamilyDomains: EventFamilyDomain[];
  relatedMapLayerIds: CreviaMapLayerId[];
  relatedRouteDomains: ActiveTaskRouteDomain[];
  minDay?: number;
  isFutureOnly: boolean;
  playerFacingPriority: number;
  cooldownDays?: number;
  iconKey?: string;
};

export type DistrictOperationEventFamilySignal = {
  domain: EventFamilyDomain;
  strength?: 'low' | 'medium' | 'high';
};

export type DistrictOperationContext = {
  day?: number;
  districtId?: MapDistrictId | string;
  currentRankKey?: string;
  authorityTrust?: number;
  unlockedPermissionIds?: string[];
  districtTrustResults?: DistrictTrustScoreResult[];
  districtMemoryItems?: DistrictTrustMemoryItem[];
  eventFamilySignals?: DistrictOperationEventFamilySignal[];
  activeTaskRoute?: ActiveTaskRouteModel | null;
  mapLayerStates?: unknown;
  operationSignals?: OperationSignalsState | null;
  resourceFatigue?: unknown;
  operationalResources?: unknown;
  crisisState?: unknown;
  operationEra?: unknown;
  isPilotDay?: boolean;
  isLimitedMode?: boolean;
  isFullMode?: boolean;
};

export type DistrictOperationCandidate = {
  definition: DistrictOperationDefinition;
  status: DistrictOperationStatus;
  tone: DistrictOperationTone;
  eligibilityReasons: DistrictOperationEligibilityReason[];
  priority: number;
  readinessScore: number;
  summaryLine: string;
  unlockLine?: string;
  impactLines: string[];
  recommendedActionLine?: string;
  isVisibleToPlayer: boolean;
  isPreviewOnly: boolean;
};

export type DistrictOperationPresentationModel = {
  id: DistrictOperationId;
  title: string;
  subtitle: string;
  districtLabel: string;
  statusLabel: string;
  kindLabel: string;
  tone: DistrictOperationTone;
  summaryLine: string;
  trustLine?: string;
  memoryLine?: string;
  routeLine?: string;
  impactChips: DistrictOperationChipModel[];
  unlockLine?: string;
  ctaHint?: string;
};

export type DistrictOperationChipModel = {
  id: string;
  label: string;
  tone: DistrictOperationTone;
  iconKey?: string;
};

export type DistrictOperationAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
