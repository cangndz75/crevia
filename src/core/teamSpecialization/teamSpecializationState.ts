import {
  TEAM_SPECIALIZATION_GROUP_IDS,
  TEAM_SPECIALIZATION_PLAYER_LABELS,
  TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
  TEAM_SPECIALIZATION_V1_VERSION,
} from './teamSpecializationRuntimeConstants';
import type {
  TeamGroupId,
  TeamGroupSpecializationStateV1,
  TeamSpecializationStateV1,
} from './teamSpecializationRuntimeTypes';

function defaultTeamGroup(groupId: TeamGroupId, day: number): TeamGroupSpecializationStateV1 {
  return {
    groupId,
    label: TEAM_SPECIALIZATION_PLAYER_LABELS[groupId],
    specializationBand: 'none',
    fatigueBand: 'low',
    moraleBand: 'steady',
    dominantDomain: 'generic_operation',
    experienceScore: 0,
    fatigueScore: 0,
    moraleScore: 50,
    consecutiveUseDays: 0,
    districtExperienceIds: [],
    relatedArchiveEntryIds: [],
    suggestedUseLine: `${TEAM_SPECIALIZATION_PLAYER_LABELS[groupId]} dengede.`,
    duplicateKey: `team_group:${groupId}:d${day}`,
  };
}

export function createInitialTeamSpecializationState(day: number): TeamSpecializationStateV1 {
  const teamGroups = Object.fromEntries(
    TEAM_SPECIALIZATION_GROUP_IDS.map((id) => [id, defaultTeamGroup(id, day)]),
  ) as Record<TeamGroupId, TeamGroupSpecializationStateV1>;

  return {
    version: TEAM_SPECIALIZATION_V1_VERSION,
    createdAtDay: day,
    updatedAtDay: day,
    teamGroups,
    specializationSummary: {
      overallFatigueBand: 'low',
      overallMoraleBand: 'steady',
    },
    fatigueSummary: {
      strainedGroupIds: [],
      consecutiveHeavyDays: 0,
    },
    assignmentFitSummary: {
      fitDelta: 0,
    },
    districtExperienceSummary: {
      experienceScore: 0,
    },
    cityArchiveLinkSummary: {
      recentEntryKinds: [],
      linkedEntryIds: [],
      duplicateGuardActive: true,
    },
    vehicleMaintenanceLinkSummary: {
      linkedFleetGroupIds: [],
      strainSignals: [],
      cautionActive: false,
    },
    migrationMeta: {
      targetSaveVersion: TEAM_SPECIALIZATION_TARGET_SAVE_VERSION,
      derivedFromAssignment: false,
      derivedFromArchive: false,
      idempotent: true,
    },
    sourceSignals: [],
  };
}

function isTeamGroupId(value: string): value is TeamGroupId {
  return (TEAM_SPECIALIZATION_GROUP_IDS as readonly string[]).includes(value);
}

export function normalizeTeamSpecializationState(
  raw: unknown,
  currentDay: number,
): TeamSpecializationStateV1 {
  if (!raw || typeof raw !== 'object') {
    return createInitialTeamSpecializationState(currentDay);
  }

  const record = raw as Partial<TeamSpecializationStateV1>;
  const base = createInitialTeamSpecializationState(currentDay);
  const teamGroups = { ...base.teamGroups };

  if (record.teamGroups && typeof record.teamGroups === 'object') {
    for (const [key, value] of Object.entries(record.teamGroups)) {
      if (!isTeamGroupId(key) || !value || typeof value !== 'object') continue;
      const group = value as TeamGroupSpecializationStateV1;
      teamGroups[key] = {
        ...defaultTeamGroup(key, currentDay),
        ...group,
        groupId: key,
        label: group.label || TEAM_SPECIALIZATION_PLAYER_LABELS[key],
        experienceScore: Math.max(0, Math.min(100, Number(group.experienceScore) || 0)),
        fatigueScore: Math.max(0, Math.min(100, Number(group.fatigueScore) || 0)),
        moraleScore: Math.max(0, Math.min(100, Number(group.moraleScore) || 50)),
        duplicateKey: group.duplicateKey || `team_group:${key}:d${currentDay}`,
      };
    }
  }

  return {
    ...base,
    ...record,
    version: TEAM_SPECIALIZATION_V1_VERSION,
    createdAtDay: Number(record.createdAtDay) || currentDay,
    updatedAtDay: Number(record.updatedAtDay) || currentDay,
    teamGroups,
    specializationSummary: {
      ...base.specializationSummary,
      ...(record.specializationSummary ?? {}),
    },
    fatigueSummary: {
      ...base.fatigueSummary,
      ...(record.fatigueSummary ?? {}),
    },
    assignmentFitSummary: {
      ...base.assignmentFitSummary,
      ...(record.assignmentFitSummary ?? {}),
    },
    districtExperienceSummary: {
      ...base.districtExperienceSummary,
      ...(record.districtExperienceSummary ?? {}),
    },
    cityArchiveLinkSummary: {
      ...base.cityArchiveLinkSummary,
      ...(record.cityArchiveLinkSummary ?? {}),
    },
    vehicleMaintenanceLinkSummary: {
      ...base.vehicleMaintenanceLinkSummary,
      ...(record.vehicleMaintenanceLinkSummary ?? {}),
    },
    migrationMeta: {
      ...base.migrationMeta,
      ...(record.migrationMeta ?? {}),
    },
    sourceSignals: Array.isArray(record.sourceSignals)
      ? record.sourceSignals.map(String)
      : [],
  };
}
