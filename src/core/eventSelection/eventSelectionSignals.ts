import type { OperationCareerPhase } from '@/core/openEndedProgression/openEndedProgressionTypes';
import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';
import type {
  CreviaEventSelectionContext,
  CreviaEventSelectionSignalSnapshot,
} from './eventSelectionTypes';

import { EVENT_SELECTION_DEFAULT_PHASE } from './eventSelectionConstants';

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(textBlob).join(' ');
  }
  return '';
}

function readString(value: unknown, keys: readonly string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const item = record[key];
    if (typeof item === 'string' && item.length > 0) return item;
  }
  return undefined;
}

function readNumber(value: unknown, keys: readonly string[]): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const item = record[key];
    if (typeof item === 'number' && Number.isFinite(item)) return item;
  }
  return undefined;
}

function bandFromScore(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 85) return 'critical';
  if (score >= 65) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function normalizePhase(value?: string): OperationCareerPhase {
  const phases: OperationCareerPhase[] = [
    'pilot_training',
    'light_main_operation',
    'district_responsibility',
    'crisis_recovery_management',
    'citywide_operations',
    'long_term_career',
  ];
  if (value && phases.includes(value as OperationCareerPhase)) {
    return value as OperationCareerPhase;
  }
  return EVENT_SELECTION_DEFAULT_PHASE;
}

export function buildRecentExposureSignal(context: CreviaEventSelectionContext) {
  return {
    familyIds: context.recentEventFamilyIds ?? [],
    districtIds: context.recentDistrictIds ?? [],
    domainIds: context.recentDomainIds ?? [],
    variantKinds: context.recentVariantKinds ?? [],
  };
}

export function buildDistrictSelectionSignal(context: CreviaEventSelectionContext) {
  return {
    districtId: context.districtId,
    trustBand: context.districtTrustBand ?? 'unknown',
    memoryPressure: context.districtMemoryPressure ?? 'low',
  };
}

export function buildResourceSelectionSignal(context: CreviaEventSelectionContext) {
  return {
    resourcePressureBand: context.resourcePressureBand ?? 'medium',
    vehicleMaintenancePressureBand: context.vehicleMaintenancePressureBand ?? 'low',
    containerNetworkPressureBand: context.containerNetworkPressureBand ?? 'low',
  };
}

export function buildCareerPhaseSelectionSignal(context: CreviaEventSelectionContext) {
  return {
    phase: normalizePhase(context.operationCareerPhase),
    day: context.day ?? 1,
  };
}

export function buildPlayerStyleSelectionSignal(context: CreviaEventSelectionContext) {
  return {
    playerStyleId: context.playerStyleId ?? 'unknown',
  };
}

export function buildOperationEraSelectionSignal(context: CreviaEventSelectionContext) {
  return {
    operationEraId: context.operationEraId,
  };
}

export function buildEventSelectionSignalSnapshot(
  context: CreviaEventSelectionContext = {},
): CreviaEventSelectionSignalSnapshot {
  const career = buildCareerPhaseSelectionSignal(context);
  return {
    day: context.day ?? 1,
    districtId: context.districtId,
    operationCareerPhase: career.phase,
    authorityBand: context.authorityBand ?? 'medium',
    districtTrustBand: buildDistrictSelectionSignal(context).trustBand,
    districtMemoryPressure: buildDistrictSelectionSignal(context).memoryPressure,
    operationEraId: context.operationEraId,
    crisisRiskBand: context.crisisRiskBand ?? 'low',
    resourcePressureBand: buildResourceSelectionSignal(context).resourcePressureBand,
    playerStyleId: (buildPlayerStyleSelectionSignal(context).playerStyleId ?? 'unknown') as PlayerStyleId,
    recentExposure: buildRecentExposureSignal(context),
  };
}

export function buildEventSelectionContextFromGameState(
  gameState: unknown,
  extras: Partial<CreviaEventSelectionContext> = {},
): CreviaEventSelectionContext {
  const day = readNumber(gameState, ['day', 'currentDay']) ?? extras.day ?? 1;
  const blob = textBlob(gameState);

  let resourcePressureBand: CreviaEventSelectionContext['resourcePressureBand'] = 'medium';
  if (blob.includes('critical') || blob.includes('strained')) resourcePressureBand = 'high';
  if (blob.includes('stable') || blob.includes('ready')) resourcePressureBand = 'low';

  let crisisRiskBand: CreviaEventSelectionContext['crisisRiskBand'] = 'low';
  if (blob.includes('critical')) crisisRiskBand = 'critical';
  else if (blob.includes('watch') || blob.includes('elevated')) crisisRiskBand = 'high';

  const operationCareerPhase =
    extras.operationCareerPhase ??
    (day <= 7 ? 'pilot_training' : day <= 14 ? 'light_main_operation' : 'district_responsibility');

  return {
    day,
    operationCareerPhase,
    districtId: readString(gameState, ['focusDistrictId', 'districtId']) ?? extras.districtId,
    authorityBand: extras.authorityBand ?? 'medium',
    resourcePressureBand: extras.resourcePressureBand ?? resourcePressureBand,
    crisisRiskBand: extras.crisisRiskBand ?? crisisRiskBand,
    recentEventFamilyIds: extras.recentEventFamilyIds ?? [],
    recentDistrictIds: extras.recentDistrictIds ?? [],
    recentDomainIds: extras.recentDomainIds ?? [],
    recentVariantKinds: extras.recentVariantKinds ?? [],
    existingDailyEventCount: extras.existingDailyEventCount ?? 0,
    unlockedPermissionIds: extras.unlockedPermissionIds ?? [],
    ...extras,
  };
}

export function inferTrustBandFromScore(score?: number): CreviaEventSelectionContext['districtTrustBand'] {
  if (score == null) return 'unknown';
  if (score <= 30) return 'fragile';
  if (score <= 45) return 'watch';
  if (score <= 70) return 'stable';
  return 'trusted';
}

export function inferPressureBandFromScore(score?: number): 'low' | 'medium' | 'high' | 'critical' {
  return bandFromScore(score ?? 40);
}
