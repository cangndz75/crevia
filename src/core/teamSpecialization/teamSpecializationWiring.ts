import { appendCityArchiveEntries } from '@/core/cityArchive/cityArchiveEngine';
import { makeCityArchiveDuplicateKey } from '@/core/cityArchive/cityArchiveEngine';
import type {
  CityArchiveEntry,
  CityArchiveEntryKind,
  CityArchiveEntrySourceKind,
  CityArchiveV1State,
} from '@/core/cityArchive/cityArchiveTypes';

import {
  normalizeTeamSpecializationStateFromInput,
  updateTeamSpecializationForDay,
} from './teamSpecializationEngine';
import { selectTeamSpecializationSurfaceLines } from './teamSpecializationSelectors';
import { TEAM_SPECIALIZATION_MAX_ARCHIVE_ENTRIES_PER_DAY } from './teamSpecializationRuntimeConstants';
import type {
  TeamSpecializationDayCloseInput,
  TeamSpecializationStateV1,
} from './teamSpecializationRuntimeTypes';

const TEAM_ARCHIVE_SUPPRESS_KINDS = new Set([
  'story_chain_step',
  'comeback_completed',
  'reward_positive',
  'vehicle_maintenance_suggested',
]);

export function buildTeamSpecializationArchiveEntry(
  state: TeamSpecializationStateV1,
  input: TeamSpecializationDayCloseInput,
): CityArchiveEntry | null {
  if (input.day < 8) return null;

  const surfaces = selectTeamSpecializationSurfaceLines(state, input);
  const line = surfaces.reportLine ?? surfaces.hubLine ?? surfaces.journalLabel;
  if (!line) return null;

  const recentKinds = input.cityArchiveRecentKinds ?? [];
  if (recentKinds.some((k) => TEAM_ARCHIVE_SUPPRESS_KINDS.has(k))) {
    return null;
  }

  const teamArchiveCountToday = recentKinds.filter((k) => k.startsWith('team_')).length;
  if (teamArchiveCountToday >= TEAM_SPECIALIZATION_MAX_ARCHIVE_ENTRIES_PER_DAY) {
    return null;
  }

  const focusGroup =
    state.specializationSummary.highestExperienceGroupId ??
    state.fatigueSummary.strainedGroupIds[0] ??
    'field_coordination';
  const group = state.teamGroups[focusGroup];

  let kind: CityArchiveEntryKind;
  if (focusGroup === 'backup_team' && group.consecutiveUseDays >= 2) {
    kind = 'backup_team_overused';
  } else if (group.moraleBand === 'motivated') {
    kind = 'team_morale_recovered';
  } else if (group.specializationBand === 'specialized' || group.specializationBand === 'expert_preview') {
    kind = 'team_domain_mastery';
  } else if (group.fatigueBand === 'strained' || group.fatigueBand === 'elevated') {
    kind = 'team_fatigue_warning';
  } else {
    kind = 'team_specialization_gained';
  }

  const sourceKind: CityArchiveEntrySourceKind = 'teamSpecialization';

  const duplicateKey = makeCityArchiveDuplicateKey({
    day: input.day,
    kind,
    districtId: input.districtId,
    sourceKind,
  });

  return {
    id: `tsa_${kind}_d${input.day}_${focusGroup}`,
    day: input.day,
    kind,
    districtId: input.districtId,
    sourceKind,
    title: kind === 'team_morale_recovered' ? 'Ekip toparlandı' : 'Ekip izi',
    shortLine: line.replace(/^Ekip (izi|yorgunluğu|desteği):\s*/i, '').slice(0, 120),
    reportLine: surfaces.reportLine ?? line,
    mapLine: surfaces.mapHint,
    isPlayerVisible: true,
    priority: 'medium',
    duplicateKey,
    createdFrom: sourceKind,
    createdAtDay: input.day,
  };
}

export function appendTeamSpecializationDayCloseArchive(
  archive: CityArchiveV1State,
  state: TeamSpecializationStateV1,
  input: TeamSpecializationDayCloseInput,
): CityArchiveV1State {
  const entry = buildTeamSpecializationArchiveEntry(state, input);
  if (!entry) return archive;
  return appendCityArchiveEntries(archive, [entry], {
    day: input.day,
    skipDuplicate: true,
  });
}

export function applyTeamSpecializationOnDayClose(
  state: TeamSpecializationStateV1 | null | undefined,
  input: TeamSpecializationDayCloseInput,
): TeamSpecializationStateV1 {
  return normalizeTeamSpecializationStateFromInput(state, input);
}

export function buildTeamSpecializationDayCloseBundle(
  teamSpecialization: TeamSpecializationStateV1 | null | undefined,
  input: TeamSpecializationDayCloseInput,
): {
  teamSpecialization: TeamSpecializationStateV1;
  surfaces: ReturnType<typeof selectTeamSpecializationSurfaceLines>;
} {
  const next = updateTeamSpecializationForDay(
    teamSpecialization ?? normalizeTeamSpecializationStateFromInput(undefined, input),
    input,
  );
  const surfaces = selectTeamSpecializationSurfaceLines(next, input);
  return { teamSpecialization: next, surfaces };
}
