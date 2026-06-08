import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  CONTENT_RUNTIME_ACTIVATION_FIRST_DAY,
  CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY,
  CONTENT_RUNTIME_ACTIVATION_PRIORITY_DISTRICTS,
} from './contentRuntimeActivationConstants';
import { resolveContentRuntimeActivationModeForAccess } from './contentRuntimeActivationFullGuards';
import type {
  ContentRuntimeActivationGuardState,
  ContentRuntimeActivationInput,
  ContentRuntimeActivationMode,
  ContentRuntimeActivationModel,
  ContentRuntimeActivationPhase,
} from './contentRuntimeActivationTypes';

export function resolveContentRuntimeActivationPhase(
  input: ContentRuntimeActivationInput,
): ContentRuntimeActivationPhase {
  if (input.day <= 1) return 'pilot';
  if (input.day <= CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY) return 'pilot';
  if (
    input.postPilotPhase === 'main_operation_full' ||
    input.accessMode === 'full'
  ) {
    return 'main_operation_full';
  }
  if (
    input.postPilotPhase === 'main_operation_light' ||
    input.accessMode === 'limited'
  ) {
    return 'post_pilot_light';
  }
  if (input.day >= POST_PILOT_FIRST_OPERATION_DAY) return 'post_pilot_light';
  return 'pilot';
}

export function resolveContentRuntimeActivationMode(
  phase: ContentRuntimeActivationPhase,
  accessMode?: ContentRuntimeActivationInput['accessMode'],
): ContentRuntimeActivationMode {
  return resolveContentRuntimeActivationModeForAccess(phase, accessMode);
}

function emptyGuard(): ContentRuntimeActivationGuardState {
  return {
    blockedFamilies: [],
    blockedDistrictDomains: [],
    crisisAdjacentCount: 0,
    resourceFatigueCount: 0,
    reasons: [],
  };
}

export function isContentRuntimeActivationEligible(
  input: ContentRuntimeActivationInput,
  phase: ContentRuntimeActivationPhase,
): boolean {
  if (input.day <= 1) return false;
  if (input.day <= CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY) return false;
  if (input.day < CONTENT_RUNTIME_ACTIVATION_FIRST_DAY) return false;
  return phase === 'post_pilot_light' || phase === 'main_operation_full';
}

export function buildContentRuntimeActivationModel(
  input: ContentRuntimeActivationInput,
  phase: ContentRuntimeActivationPhase = resolveContentRuntimeActivationPhase(input),
): ContentRuntimeActivationModel {
  const activationMode = resolveContentRuntimeActivationMode(phase, input.accessMode);
  const isEligible = isContentRuntimeActivationEligible(input, phase);
  const sourceSignals: string[] = [];

  if (input.operationSignals) sourceSignals.push('operation_signals');
  if (input.districtTrustRuntime) sourceSignals.push('district_trust');
  if (input.districtMemoryRuntime) sourceSignals.push('district_memory');
  if (input.resourceFatigue) sourceSignals.push('resource_fatigue');
  if (input.focusDistrictId) sourceSignals.push('district_focus');

  const districtWeights: Record<string, number> = {};
  for (const districtId of CONTENT_RUNTIME_ACTIVATION_PRIORITY_DISTRICTS) {
    districtWeights[districtId] = 1;
  }
  if (input.focusDistrictId) {
    districtWeights[input.focusDistrictId] =
      (districtWeights[input.focusDistrictId] ?? 1) + 2;
  }
  if (input.operationSignals?.priorityDistrictId) {
    const id = input.operationSignals.priorityDistrictId;
    districtWeights[id] = (districtWeights[id] ?? 1) + 1.5;
  }

  const domainWeights: Record<string, number> = {};
  const signals = input.operationSignals;
  if (signals?.vehicles?.status === 'watch' || signals?.vehicles?.status === 'strained') {
    domainWeights.vehicle_route = (domainWeights.vehicle_route ?? 0) + 2;
  }
  if (signals?.containers?.status === 'watch' || signals?.containers?.status === 'strained') {
    domainWeights.container = (domainWeights.container ?? 0) + 2;
  }
  if (signals?.districts?.status === 'watch' || signals?.districts?.status === 'strained') {
    domainWeights.district_balance = (domainWeights.district_balance ?? 0) + 1.5;
  }

  const blockedReasons: string[] = [];
  if (input.day <= CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY) {
    blockedReasons.push('pilot_day_safety');
  }
  if (!isEligible) {
    blockedReasons.push('phase_not_eligible');
  }

  return {
    day: input.day,
    phase,
    isEligible,
    selectedPackIds: [],
    selectedFamilyIds: [],
    selectedVariantIds: [],
    districtWeights,
    domainWeights,
    blockedReasons,
    freshnessGuard: emptyGuard(),
    duplicateGuard: emptyGuard(),
    daySafetyGuard: emptyGuard(),
    activationMode,
    sourceSignals,
    presentationHint: undefined,
  };
}
