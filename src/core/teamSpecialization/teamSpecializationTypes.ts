import type { ActiveTaskRouteDomain, ActiveTaskRouteModel } from '@/core/activeTaskRoutes/activeTaskRouteTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { DistrictOperationCandidate } from '@/core/districtOperations/districtOperationTypes';
import type {
  DistrictTrustMemoryItem,
  DistrictTrustScoreResult,
} from '@/core/districtTrust/districtTrustTypes';
import type { EventFamilyDomain } from '@/core/eventFamilies/eventFamilyTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

export type TeamSpecializationId = string;

export type TeamSpecializationGroupId =
  | 'field_team'
  | 'technical_team'
  | 'public_communication_team'
  | 'route_support_team'
  | 'crisis_support_team';

export type TeamSpecializationDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis'
  | 'district_balance'
  | 'resource_recovery'
  | 'public_trust'
  | 'environmental_care'
  | 'generic_operation';

export type TeamSpecializationCapability =
  | 'fast_response'
  | 'preventive_maintenance'
  | 'route_discipline'
  | 'public_communication'
  | 'crisis_coordination'
  | 'container_network_support'
  | 'field_execution'
  | 'morale_stabilization'
  | 'recovery_support'
  | 'district_memory_response'
  | 'operation_era_support';

export type TeamSpecializationFitLevel =
  | 'poor'
  | 'weak'
  | 'acceptable'
  | 'good'
  | 'strong'
  | 'excellent';

export type TeamSpecializationStatus =
  | 'unavailable'
  | 'preview'
  | 'available'
  | 'recommended'
  | 'active'
  | 'strained'
  | 'future';

export type TeamSpecializationTone =
  | 'neutral'
  | 'positive'
  | 'watch'
  | 'strained'
  | 'recovering'
  | 'crisis';

export type TeamSpecializationSource =
  | 'operational_resource'
  | 'assignment'
  | 'district_operation'
  | 'event_family'
  | 'active_task_route'
  | 'district_trust'
  | 'resource_fatigue'
  | 'crisis_state'
  | 'fallback';

export type TeamSpecializationDefinition = {
  id: TeamSpecializationId;
  groupId: TeamSpecializationGroupId;
  title: string;
  shortLabel: string;
  description: string;
  primaryDomains: TeamSpecializationDomain[];
  secondaryDomains: TeamSpecializationDomain[];
  capabilities: TeamSpecializationCapability[];
  preferredDistrictOperationKinds: string[];
  preferredEventFamilyDomains: EventFamilyDomain[];
  preferredRouteDomains: ActiveTaskRouteDomain[];
  preferredImpactDomains: TeamSpecializationDomain[];
  weaknessDomains: TeamSpecializationDomain[];
  unlockPermissionId?: string;
  requiredRankKey?: string;
  minDay?: number;
  isFutureOnly: boolean;
  playerFacingPriority: number;
  iconKey?: string;
};

export type TeamSpecializationEventFamilySignal = {
  domain: EventFamilyDomain;
  strength?: 'low' | 'medium' | 'high';
};

export type TeamSpecializationContext = {
  day?: number;
  selectedTeamGroupId?: TeamSpecializationGroupId | string;
  assignment?: EventAssignmentState | null;
  districtOperationCandidate?: DistrictOperationCandidate | null;
  activeTaskRoute?: ActiveTaskRouteModel | null;
  eventFamilySignals?: TeamSpecializationEventFamilySignal[];
  districtTrustResult?: DistrictTrustScoreResult | null;
  districtMemoryItems?: DistrictTrustMemoryItem[];
  operationalResources?: unknown;
  resourceFatigue?: unknown;
  operationSignals?: OperationSignalsState | null;
  crisisState?: unknown;
  currentRankKey?: string;
  authorityTrust?: number;
  unlockedPermissionIds?: string[];
  isDispatchPhase?: boolean;
  isFieldPhase?: boolean;
  isPilotDay?: boolean;
};

export type TeamSpecializationFitResult = {
  specialization: TeamSpecializationDefinition;
  fitScore: number;
  fitLevel: TeamSpecializationFitLevel;
  status: TeamSpecializationStatus;
  tone: TeamSpecializationTone;
  matchedDomains: TeamSpecializationDomain[];
  missingDomains: TeamSpecializationDomain[];
  matchedCapabilities: TeamSpecializationCapability[];
  pressureWarnings: string[];
  sourceSignals: TeamSpecializationSource[];
  summaryLine: string;
  recommendationLine?: string;
  isVisibleToPlayer: boolean;
  isPreviewOnly: boolean;
};

export type TeamSpecializationPresentationModel = {
  id: TeamSpecializationId;
  title: string;
  subtitle: string;
  fitLabel: string;
  statusLabel: string;
  tone: TeamSpecializationTone;
  compactLine: string;
  capabilityChips: TeamSpecializationChipModel[];
  warningLine?: string;
  recommendationLine?: string;
  unlockLine?: string;
};

export type TeamSpecializationChipModel = {
  id: string;
  label: string;
  tone: TeamSpecializationTone;
  iconKey?: string;
};

export type TeamSpecializationAuditResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
};
