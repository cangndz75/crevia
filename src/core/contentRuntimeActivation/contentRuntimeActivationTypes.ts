import type { EventCard } from '@/core/models/EventCard';
import type { PostPilotPhase } from '@/core/postPilot/postPilotOperationTypes';

export type ContentRuntimeActivationPhase =
  | 'pilot'
  | 'post_pilot_light'
  | 'main_operation_full';

export type ContentRuntimeActivationMode = 'off' | 'preview' | 'lite' | 'full_ready';

export type ContentRuntimeActivationPackId =
  | 'district_pack_one'
  | 'vehicle_route_pack_one'
  | 'container_environment_pack_one';

export type ContentRuntimeActivationGuardState = {
  blockedFamilies: string[];
  blockedDistrictDomains: string[];
  crisisAdjacentCount: number;
  resourceFatigueCount: number;
  reasons: string[];
};

export type ContentRuntimeActivationModel = {
  day: number;
  phase: ContentRuntimeActivationPhase;
  isEligible: boolean;
  selectedPackIds: ContentRuntimeActivationPackId[];
  selectedFamilyIds: string[];
  selectedVariantIds: string[];
  districtWeights: Record<string, number>;
  domainWeights: Record<string, number>;
  blockedReasons: string[];
  freshnessGuard: ContentRuntimeActivationGuardState;
  duplicateGuard: ContentRuntimeActivationGuardState;
  daySafetyGuard: ContentRuntimeActivationGuardState;
  activationMode: ContentRuntimeActivationMode;
  sourceSignals: string[];
  presentationHint?: string;
};

export type ContentRuntimeActivationOperationSignalsInput = {
  priorityDistrictId?: string;
  vehicles?: { status?: string; summary?: string };
  containers?: { status?: string; summary?: string };
  personnel?: { status?: string; summary?: string };
  districts?: { status?: string; summary?: string };
  overall?: { status?: string; summary?: string };
};

export type ContentRuntimeActivationInput = {
  day: number;
  postPilotPhase?: PostPilotPhase;
  accessMode?: 'none' | 'limited' | 'full';
  operationSignals?: ContentRuntimeActivationOperationSignalsInput | null;
  districtTrustRuntime?: Record<string, { state?: string }> | null;
  districtMemoryRuntime?: Record<string, { kind?: string }> | null;
  resourceFatigue?: Record<string, { state?: string; note?: string }> | null;
  focusDistrictId?: string;
  previousFamilyIds?: string[];
  previousDistrictDomainKeys?: string[];
  previousTitles?: string[];
  stableSeed?: string;
};

export type ContentRuntimeActivationFamilyCandidate = {
  packId: ContentRuntimeActivationPackId;
  familyId: string;
  title: string;
  districtIds: string[];
  domains: string[];
  variantCopies: Array<{ kind: string; text: string }>;
  recommendedVariantKinds: string[];
  echoes: {
    advisor: string;
    report: string;
    social: string;
    map: string;
    tomorrow_preview: string;
    result: string;
  };
  scene: string;
  problem: string;
  tradeoff: string;
  shortTermEffect: string;
  carryOver: string;
  intents: {
    trust?: string;
    memory?: string;
    resource?: string;
    vehicleMaintenance?: string;
    containerNetwork?: string;
    environmentCare?: string;
    crisisAdjacency?: string;
  };
  score: number;
  selectedDistrictId: string;
  selectedVariantKind: string;
  selectedVariantText: string;
  blockedReason?: string;
};

export type ContentRuntimeActivationSelectionResult = {
  model: ContentRuntimeActivationModel;
  candidates: ContentRuntimeActivationFamilyCandidate[];
  eventCards: EventCard[];
};

export type ContentRuntimeActivationEventMeta = {
  packId: ContentRuntimeActivationPackId;
  familyId: string;
  variantId: string;
  variantKind: string;
  domain: string;
  districtId: string;
  advisorEcho?: string;
  reportEcho?: string;
  socialEcho?: string;
  mapHint?: string;
  tomorrowPreview?: string;
  resultEcho?: string;
  vehicleMaintenanceIntent?: string;
  containerNetworkIntent?: string;
  environmentCareIntent?: string;
  resourceFatigueIntent?: string;
  districtTrustIntent?: string;
  operationEraIntent?: string;
  activeRouteIntent?: string;
  source: 'content_runtime_activation_lite';
};

export type ContentRuntimeActivationPresentationHint = {
  label: string;
  line: string;
  domains: string[];
  districtIds: string[];
};