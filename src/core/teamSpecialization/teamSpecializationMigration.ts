import type { CityArchiveV1State } from '@/core/cityArchive/cityArchiveTypes';

import {
  deriveInitialTeamScoresFromSignals,
  mapAssignmentPersonnelToTeamGroup,
} from './teamSpecializationEngine';
import {
  createInitialTeamSpecializationState,
  normalizeTeamSpecializationState,
} from './teamSpecializationState';
import {
  TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION,
  TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
} from './teamSpecializationRuntimeConstants';
import type {
  TeamSpecializationDayCloseInput,
  TeamSpecializationStateV1,
} from './teamSpecializationRuntimeTypes';

export type TeamSpecializationPersistLoadInput = {
  rawTeamSpecialization?: unknown;
  saveVersion: number;
  currentDay: number;
  operationSignals?: TeamSpecializationDayCloseInput['operationSignals'];
  cityArchive?: CityArchiveV1State | null;
  assignmentPersonnelGroup?: string;
  assignmentCompatibilityScore?: number;
  vehicleMaintenance?: TeamSpecializationDayCloseInput['vehicleMaintenance'];
};

export function migrateTeamSpecializationFromSaveV25(
  input: TeamSpecializationPersistLoadInput,
): TeamSpecializationStateV1 {
  const warnings: string[] = [];
  let state = input.rawTeamSpecialization
    ? normalizeTeamSpecializationState(input.rawTeamSpecialization, input.currentDay)
    : createInitialTeamSpecializationState(input.currentDay);

  if (
    state.migrationMeta.migratedFromVersion === TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION &&
    state.migrationMeta.idempotent &&
    state.migrationMeta.targetSaveVersion === TEAM_SPECIALIZATION_TARGET_SAVE_VERSION
  ) {
    return state;
  }

  if (input.currentDay <= 7) {
    return {
      ...createInitialTeamSpecializationState(input.currentDay),
      migrationMeta: {
        targetSaveVersion: TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
        migratedFromVersion: TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION,
        derivedFromAssignment: false,
        derivedFromArchive: false,
        idempotent: true,
        warnings,
      },
    };
  }

  const recentKinds =
    input.cityArchive?.entries?.slice(-12).map((e) => e.kind) ?? [];

  let assignmentPersonnelGroup = input.assignmentPersonnelGroup;
  if (!assignmentPersonnelGroup) {
    warnings.push('missing_assignment_personnel_group');
  }

  const derived = deriveInitialTeamScoresFromSignals({
    day: input.currentDay,
    operationSignals: input.operationSignals,
    cityArchiveRecentKinds: recentKinds,
    assignmentPersonnelGroup,
    assignmentCompatibilityScore: input.assignmentCompatibilityScore ?? 70,
    routeBalanced: recentKinds.includes('route_balanced'),
    resourceRecovery: recentKinds.includes('resource_recovery'),
    comebackCompleted: recentKinds.includes('comeback_completed'),
    resourcePressure: recentKinds.includes('resource_pressure'),
    crisisAdjacent:
      recentKinds.some((k) => String(k).includes('crisis')) ||
      input.operationSignals?.districts?.status === 'watch',
    socialTrustPositive: recentKinds.some((k) => String(k).includes('social') || String(k).includes('trust')),
    vehicleMaintenance: input.vehicleMaintenance,
    storyChainClosure: recentKinds.some((k) => k.includes('chain')),
  });

  let migratedGroups = derived.teamGroups;
  if (input.assignmentCompatibilityScore != null && input.assignmentCompatibilityScore >= 75) {
    const assignedGroupId = mapAssignmentPersonnelToTeamGroup(assignmentPersonnelGroup);
    if (assignedGroupId) {
      const assigned = derived.teamGroups[assignedGroupId];
      migratedGroups = {
        ...derived.teamGroups,
        [assignedGroupId]: {
          ...assigned,
          specializationBand: 'emerging',
          experienceScore: Math.max(assigned.experienceScore, 20),
        },
      };
    }
  }

  state = {
    ...derived,
    teamGroups: migratedGroups,
    migrationMeta: {
      targetSaveVersion: TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
      migratedFromVersion: TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION,
      derivedFromAssignment: Boolean(assignmentPersonnelGroup),
      derivedFromArchive: recentKinds.length > 0,
      idempotent: true,
      warnings,
    },
  };

  return state;
}

export function resolveTeamSpecializationOnPersistLoad(
  input: TeamSpecializationPersistLoadInput,
): TeamSpecializationStateV1 {
  if (input.saveVersion >= TEAM_SPECIALIZATION_TARGET_SAVE_VERSION && input.rawTeamSpecialization != null) {
    return normalizeTeamSpecializationState(
      input.rawTeamSpecialization,
      input.currentDay,
    );
  }

  if (
    input.saveVersion === TEAM_SPECIALIZATION_MIGRATION_FROM_SAVE_VERSION ||
    input.rawTeamSpecialization == null
  ) {
    return migrateTeamSpecializationFromSaveV25(input);
  }

  try {
    return normalizeTeamSpecializationState(
      input.rawTeamSpecialization,
      input.currentDay,
    );
  } catch {
    return migrateTeamSpecializationFromSaveV25({
      ...input,
      rawTeamSpecialization: undefined,
    });
  }
}
