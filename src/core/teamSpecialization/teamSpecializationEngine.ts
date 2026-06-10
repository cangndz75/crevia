import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import {
  TEAM_SPECIALIZATION_EXPERIENCE_EMERGING_MIN,
  TEAM_SPECIALIZATION_EXPERIENCE_EXPERT_PREVIEW_MIN,
  TEAM_SPECIALIZATION_EXPERIENCE_RELIABLE_MIN,
  TEAM_SPECIALIZATION_EXPERIENCE_SPECIALIZED_MIN,
  TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS,
  TEAM_SPECIALIZATION_FATIGUE_ELEVATED_MIN,
  TEAM_SPECIALIZATION_FATIGUE_GAIN_REDUCTION_THRESHOLD,
  TEAM_SPECIALIZATION_FATIGUE_STRAINED_MIN,
  TEAM_SPECIALIZATION_FATIGUE_WATCHED_MIN,
  TEAM_SPECIALIZATION_FATIGUE_WEIGHTS,
  TEAM_SPECIALIZATION_GROUP_IDS,
  TEAM_SPECIALIZATION_HIGH_COMPATIBILITY_MIN,
  TEAM_SPECIALIZATION_MORALE_MOTIVATED_MIN,
  TEAM_SPECIALIZATION_MORALE_PRESSURED_MAX,
  TEAM_SPECIALIZATION_MORALE_STEADY_MAX,
  TEAM_SPECIALIZATION_MORALE_WEIGHTS,
  TEAM_SPECIALIZATION_PLAYER_LABELS,
  TEAM_SPECIALIZATION_POOR_COMPATIBILITY_MAX,
  TEAM_SPECIALIZATION_SCORE_MAX,
} from './teamSpecializationRuntimeConstants';
import { createInitialTeamSpecializationState } from './teamSpecializationState';
import type {
  SpecializationBand,
  TeamFatigueBand,
  TeamGroupId,
  TeamGroupSpecializationStateV1,
  TeamMoraleBand,
  TeamSpecializationDayCloseInput,
  TeamSpecializationStateV1,
  TeamSpecializationStorySignal,
  TeamSpecializationStorySignalType,
} from './teamSpecializationRuntimeTypes';

export function stableTeamSpecializationHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(TEAM_SPECIALIZATION_SCORE_MAX, Math.round(score)));
}

export function mapAssignmentPersonnelToTeamGroup(
  personnelGroup?: string,
): TeamGroupId | undefined {
  if (!personnelGroup) return undefined;
  const normalized = personnelGroup.toLocaleLowerCase('tr-TR');
  if (normalized.includes('backup')) return 'backup_team';
  if (normalized.includes('public') || normalized.includes('social')) return 'social_response';
  if (normalized.includes('technical') || normalized.includes('container')) {
    return 'container_service';
  }
  if (normalized.includes('inspection') || normalized.includes('route')) return 'route_cleanup';
  if (normalized.includes('field_response') || normalized.includes('rapid')) {
    return 'rapid_support';
  }
  if (normalized.includes('balanced') || normalized.includes('field')) {
    return 'field_coordination';
  }
  return 'field_coordination';
}

export function mapEventDomainToTeamGroup(domain?: string): TeamGroupId | undefined {
  if (!domain) return undefined;
  const normalized = domain.toLocaleLowerCase('tr-TR');
  if (normalized.includes('container')) return 'container_service';
  if (normalized.includes('vehicle') || normalized.includes('route')) return 'route_cleanup';
  if (normalized.includes('social') || normalized.includes('trust')) return 'social_response';
  if (normalized.includes('crisis')) return 'rapid_support';
  if (normalized.includes('personnel') || normalized.includes('operation')) {
    return 'field_coordination';
  }
  return undefined;
}

export function bandsFromExperienceScore(experienceScore: number): SpecializationBand {
  if (experienceScore >= TEAM_SPECIALIZATION_EXPERIENCE_EXPERT_PREVIEW_MIN) return 'expert_preview';
  if (experienceScore >= TEAM_SPECIALIZATION_EXPERIENCE_SPECIALIZED_MIN) return 'specialized';
  if (experienceScore >= TEAM_SPECIALIZATION_EXPERIENCE_RELIABLE_MIN) return 'reliable';
  if (experienceScore >= TEAM_SPECIALIZATION_EXPERIENCE_EMERGING_MIN) return 'emerging';
  return 'none';
}

export function bandsFromFatigueScore(fatigueScore: number): TeamFatigueBand {
  if (fatigueScore >= TEAM_SPECIALIZATION_FATIGUE_STRAINED_MIN) return 'strained';
  if (fatigueScore >= TEAM_SPECIALIZATION_FATIGUE_ELEVATED_MIN) return 'elevated';
  if (fatigueScore >= TEAM_SPECIALIZATION_FATIGUE_WATCHED_MIN) return 'watched';
  return 'low';
}

export function bandsFromMoraleScore(moraleScore: number): TeamMoraleBand {
  if (moraleScore >= TEAM_SPECIALIZATION_MORALE_MOTIVATED_MIN) return 'motivated';
  if (moraleScore <= TEAM_SPECIALIZATION_MORALE_PRESSURED_MAX) return 'tired';
  if (moraleScore <= TEAM_SPECIALIZATION_MORALE_STEADY_MAX) return 'pressured';
  return 'steady';
}

function domainMatchesGroup(groupId: TeamGroupId, domain?: string): boolean {
  if (!domain) return false;
  const mapped = mapEventDomainToTeamGroup(domain);
  return mapped === groupId;
}

function buildSuggestedUseLine(
  groupId: TeamGroupId,
  specializationBand: SpecializationBand,
  fatigueBand: TeamFatigueBand,
): string {
  const label = TEAM_SPECIALIZATION_PLAYER_LABELS[groupId];
  if (specializationBand === 'none' && fatigueBand === 'low') {
    return `${label} dengede.`;
  }
  if (specializationBand === 'emerging' || specializationBand === 'reliable') {
    return `${label} bu tür olaylarda deneyim kazanıyor.`;
  }
  if (specializationBand === 'specialized' || specializationBand === 'expert_preview') {
    return `${label} bu alanda güçlü iz bırakıyor.`;
  }
  if (fatigueBand === 'watched' || fatigueBand === 'elevated') {
    return `${label} yorgunluk izleniyor.`;
  }
  if (fatigueBand === 'strained') {
    return `${label} üst üste yoğun güne çıktı.`;
  }
  return `${label} dengede.`;
}

export function calculateTeamGroupExperienceScore(
  groupId: TeamGroupId,
  input: TeamSpecializationDayCloseInput,
  previous?: TeamGroupSpecializationStateV1,
): number {
  let score = previous?.experienceScore ?? 0;
  let gain = 0;

  const assignedGroup = mapAssignmentPersonnelToTeamGroup(input.assignmentPersonnelGroup);
  const compat = input.assignmentCompatibilityScore ?? 70;
  const sameDomain =
    domainMatchesGroup(groupId, input.assignmentDomain) ||
    (assignedGroup === groupId && Boolean(input.assignmentDomain));

  if (assignedGroup === groupId) {
    if (sameDomain) gain += TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS.sameDomainSuccess;
    if (compat >= TEAM_SPECIALIZATION_HIGH_COMPATIBILITY_MIN) {
      gain += TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS.highCompatibility;
    }
    if (compat <= TEAM_SPECIALIZATION_POOR_COMPATIBILITY_MAX) {
      gain += TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS.poorFitPenalty;
    }
    if (input.repeatedDistrictSuccess && input.districtId) gain += TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS.repeatedDistrictDomain;
  }

  if (input.comebackCompleted || input.resourceRecovery) {
    gain += TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS.rewardComebackPositive;
  }
  if (input.storyChainClosure) gain += TEAM_SPECIALIZATION_EXPERIENCE_WEIGHTS.storyChainClosure;

  if (input.contentPackDomains?.length) {
    for (const domain of input.contentPackDomains) {
      if (domainMatchesGroup(groupId, domain)) gain += 5;
    }
  }

  const prevFatigue = previous?.fatigueScore ?? 0;
  if (prevFatigue >= TEAM_SPECIALIZATION_FATIGUE_GAIN_REDUCTION_THRESHOLD) {
    gain = Math.round(gain * 0.5);
  }

  score += gain;
  return clampScore(score);
}

export function calculateTeamGroupFatigueScore(
  groupId: TeamGroupId,
  input: TeamSpecializationDayCloseInput,
  previous?: TeamGroupSpecializationStateV1,
): number {
  let score = previous?.fatigueScore ?? 0;
  const assignedGroup = mapAssignmentPersonnelToTeamGroup(input.assignmentPersonnelGroup);
  const compat = input.assignmentCompatibilityScore ?? 70;
  const usedToday = assignedGroup === groupId;

  if (usedToday && (previous?.consecutiveUseDays ?? 0) > 0) {
    score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.consecutiveUsePerDay;
  }

  if (
    groupId === 'rapid_support' &&
    (input.crisisAdjacent || input.assignmentPersonnelGroup?.includes('field_response'))
  ) {
    score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.rapidSupportFieldResponse;
  }

  if (input.crisisAdjacent) score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.crisisAdjacent;

  if (usedToday && compat <= TEAM_SPECIALIZATION_POOR_COMPATIBILITY_MAX) {
    score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.poorFitAssignment;
  }

  if (input.recoveryRestWindow) score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.recoveryRestWindow;
  if (input.routeBalanced && usedToday) {
    score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.balancedAssignmentRelief;
  }

  if (groupId === 'backup_team' && usedToday && (previous?.consecutiveUseDays ?? 0) >= 1) {
    score += TEAM_SPECIALIZATION_FATIGUE_WEIGHTS.consecutiveUsePerDay;
  }

  return clampScore(score);
}

export function calculateTeamGroupMoraleScore(
  groupId: TeamGroupId,
  input: TeamSpecializationDayCloseInput,
  previous?: TeamGroupSpecializationStateV1,
): number {
  let score = previous?.moraleScore ?? 50;
  const assignedGroup = mapAssignmentPersonnelToTeamGroup(input.assignmentPersonnelGroup);

  if (input.assignmentOutcomePositive) score += TEAM_SPECIALIZATION_MORALE_WEIGHTS.positiveOutcome;
  if (input.socialTrustPositive) score += TEAM_SPECIALIZATION_MORALE_WEIGHTS.socialTrust;
  if (input.resourcePressure) score += TEAM_SPECIALIZATION_MORALE_WEIGHTS.repeatedStrain;
  if (input.teamCapacityStable) score += TEAM_SPECIALIZATION_MORALE_WEIGHTS.teamCapacityStable;

  if (
    groupId === 'backup_team' &&
    assignedGroup === 'backup_team' &&
    (previous?.consecutiveUseDays ?? 0) >= 1
  ) {
    score += TEAM_SPECIALIZATION_MORALE_WEIGHTS.backupOveruse;
  }

  if ((previous?.fatigueScore ?? 0) >= TEAM_SPECIALIZATION_FATIGUE_STRAINED_MIN) {
    score += TEAM_SPECIALIZATION_MORALE_WEIGHTS.repeatedStrain;
  }

  return clampScore(score);
}

function buildVehicleMaintenanceCautionLine(
  groupId: TeamGroupId,
  input: TeamSpecializationDayCloseInput,
): string | undefined {
  const vm = input.vehicleMaintenance?.fleetGroups;
  if (!vm) return undefined;

  if (groupId === 'route_cleanup') {
    const route = vm.route_support;
    if (
      route &&
      ((route.maintenanceNeedScore ?? 0) >= 65 ||
        route.conditionBand === 'maintenance_due' ||
        route.conditionBand === 'critical')
    ) {
      return 'Rota temizlik grubu, araç hattı bakım baskısıyla birlikte daha dikkatli kullanılmalı.';
    }
  }

  if (groupId === 'rapid_support') {
    const field = vm.field_response;
    if (
      field &&
      ((field.maintenanceNeedScore ?? 0) >= 65 || field.fatigueBand === 'high' || field.fatigueBand === 'severe')
    ) {
      return 'Hızlı destek ekibi, saha müdahale hattı yorgunluğuyla birlikte zorlanıyor.';
    }
  }

  return undefined;
}

function buildVehicleMaintenanceLinkSummary(
  input: TeamSpecializationDayCloseInput,
): TeamSpecializationStateV1['vehicleMaintenanceLinkSummary'] {
  const vm = input.vehicleMaintenance?.fleetGroups;
  if (!vm) {
    return {
      linkedFleetGroupIds: [],
      strainSignals: [],
      cautionActive: false,
    };
  }

  const linkedFleetGroupIds: string[] = [];
  const strainSignals: string[] = [];

  const route = vm.route_support;
  if (route && (route.maintenanceNeedScore ?? 0) >= 45) {
    linkedFleetGroupIds.push('route_support');
    strainSignals.push('route_support_strain');
  }

  const field = vm.field_response;
  if (field && (field.maintenanceNeedScore ?? 0) >= 45) {
    linkedFleetGroupIds.push('field_response');
    strainSignals.push('field_response_strain');
  }

  const cautionActive = strainSignals.length > 0;
  const playerLine = cautionActive
    ? 'Araç hattı baskısı ilgili ekip kullanımında dikkat istiyor.'
    : undefined;

  return { linkedFleetGroupIds, strainSignals, cautionActive, playerLine };
}

export function deriveInitialTeamScoresFromSignals(
  input: TeamSpecializationDayCloseInput,
): TeamSpecializationStateV1 {
  const state = createInitialTeamSpecializationState(input.day);
  const teamGroups = { ...state.teamGroups };

  for (const groupId of TEAM_SPECIALIZATION_GROUP_IDS) {
    const experienceScore = calculateTeamGroupExperienceScore(groupId, input, teamGroups[groupId]);
    const fatigueScore = calculateTeamGroupFatigueScore(groupId, input, teamGroups[groupId]);
    const moraleScore = calculateTeamGroupMoraleScore(groupId, input, teamGroups[groupId]);
    const specializationBand = bandsFromExperienceScore(experienceScore);
    const fatigueBand = bandsFromFatigueScore(fatigueScore);
    const moraleBand = bandsFromMoraleScore(moraleScore);

    teamGroups[groupId] = {
      ...teamGroups[groupId],
      specializationBand,
      fatigueBand,
      moraleBand,
      experienceScore,
      fatigueScore,
      moraleScore,
      dominantDomain: input.assignmentDomain ?? teamGroups[groupId].dominantDomain,
      suggestedUseLine: buildSuggestedUseLine(groupId, specializationBand, fatigueBand),
      cautionLine: buildVehicleMaintenanceCautionLine(groupId, input),
      duplicateKey: `team_group:${groupId}:d${input.day}`,
    };
  }

  return {
    ...state,
    teamGroups,
    vehicleMaintenanceLinkSummary: buildVehicleMaintenanceLinkSummary(input),
    updatedAtDay: input.day,
  };
}

export function updateTeamSpecializationForDay(
  state: TeamSpecializationStateV1,
  input: TeamSpecializationDayCloseInput,
): TeamSpecializationStateV1 {
  const teamGroups = { ...state.teamGroups };
  const sourceSignals = new Set(state.sourceSignals);

  if (input.assignmentPersonnelGroup) sourceSignals.add('assignment');
  if (input.cityArchiveRecentKinds?.length) sourceSignals.add('city_archive');
  if (input.contentPackDomains?.length) sourceSignals.add('content_pack');
  if (input.storyChainKinds?.length) sourceSignals.add('story_chain');
  if (input.vehicleMaintenance) sourceSignals.add('vehicle_maintenance');

  const assignedGroup = mapAssignmentPersonnelToTeamGroup(input.assignmentPersonnelGroup);
  let highestExperience = 0;
  let highestExperienceGroupId: TeamGroupId | undefined;
  const strainedGroupIds: TeamGroupId[] = [];

  for (const groupId of TEAM_SPECIALIZATION_GROUP_IDS) {
    const prev = teamGroups[groupId];
    const usedToday = assignedGroup === groupId;
    const consecutiveUseDays = usedToday ? (prev.consecutiveUseDays ?? 0) + 1 : 0;

    const experienceScore = calculateTeamGroupExperienceScore(groupId, input, {
      ...prev,
      consecutiveUseDays,
    });
    const fatigueScore = calculateTeamGroupFatigueScore(groupId, input, {
      ...prev,
      consecutiveUseDays,
    });
    const moraleScore = calculateTeamGroupMoraleScore(groupId, input, prev);

    const specializationBand = bandsFromExperienceScore(experienceScore);
    const fatigueBand = bandsFromFatigueScore(fatigueScore);
    const moraleBand = bandsFromMoraleScore(moraleScore);

    if (experienceScore > highestExperience) {
      highestExperience = experienceScore;
      highestExperienceGroupId = groupId;
    }
    if (fatigueBand === 'strained' || fatigueBand === 'elevated') {
      strainedGroupIds.push(groupId);
    }

    const districtExperienceIds = input.districtId
      ? [...new Set([...(prev.districtExperienceIds ?? []), input.districtId as MapDistrictId])].slice(
          -4,
        )
      : prev.districtExperienceIds;

    teamGroups[groupId] = {
      ...prev,
      specializationBand,
      fatigueBand,
      moraleBand,
      experienceScore,
      fatigueScore,
      moraleScore,
      consecutiveUseDays,
      lastAssignedDay: usedToday ? input.day : prev.lastAssignedDay,
      dominantDomain: usedToday
        ? input.assignmentDomain ?? prev.dominantDomain
        : prev.dominantDomain,
      districtExperienceIds,
      suggestedUseLine: buildSuggestedUseLine(groupId, specializationBand, fatigueBand),
      cautionLine: buildVehicleMaintenanceCautionLine(groupId, input) ?? prev.cautionLine,
      duplicateKey: `team_group:${groupId}:d${input.day}`,
    };
  }

  const overallFatigueBand = strainedGroupIds.length
    ? bandsFromFatigueScore(
        Math.max(...strainedGroupIds.map((id) => teamGroups[id].fatigueScore)),
      )
    : 'low';

  const moraleScores = TEAM_SPECIALIZATION_GROUP_IDS.map((id) => teamGroups[id].moraleScore);
  const avgMorale = moraleScores.reduce((a, b) => a + b, 0) / moraleScores.length;

  return {
    ...state,
    updatedAtDay: input.day,
    teamGroups,
    specializationSummary: {
      highestExperienceGroupId,
      overallFatigueBand,
      overallMoraleBand: bandsFromMoraleScore(avgMorale),
      playerLine: highestExperienceGroupId
        ? teamGroups[highestExperienceGroupId].suggestedUseLine
        : undefined,
    },
    fatigueSummary: {
      strainedGroupIds,
      consecutiveHeavyDays:
        strainedGroupIds.length > 0 ? state.fatigueSummary.consecutiveHeavyDays + 1 : 0,
      playerLine: strainedGroupIds[0]
        ? teamGroups[strainedGroupIds[0]].suggestedUseLine
        : undefined,
    },
    assignmentFitSummary: {
      lastPersonnelGroupUsed: input.assignmentPersonnelGroup,
      compatibilityScore: input.assignmentCompatibilityScore,
      fitDelta: input.assignmentCompatibilityScore
        ? 100 - input.assignmentCompatibilityScore
        : 0,
      playerLine: assignedGroup
        ? teamGroups[assignedGroup].suggestedUseLine
        : undefined,
    },
    districtExperienceSummary: {
      dominantDistrictId: input.districtId,
      experienceScore: highestExperience,
      playerLine: input.districtId
        ? `${TEAM_SPECIALIZATION_PLAYER_LABELS[highestExperienceGroupId ?? 'field_coordination']} ${input.districtId} hattında iz bırakıyor.`
        : undefined,
    },
    cityArchiveLinkSummary: {
      recentEntryKinds: input.cityArchiveRecentKinds ?? state.cityArchiveLinkSummary.recentEntryKinds,
      linkedEntryIds: state.cityArchiveLinkSummary.linkedEntryIds,
      duplicateGuardActive: true,
    },
    vehicleMaintenanceLinkSummary: buildVehicleMaintenanceLinkSummary(input),
    sourceSignals: [...sourceSignals],
  };
}

export function normalizeTeamSpecializationStateFromInput(
  state: TeamSpecializationStateV1 | null | undefined,
  input: TeamSpecializationDayCloseInput,
): TeamSpecializationStateV1 {
  const base = state ?? createInitialTeamSpecializationState(input.day);
  return updateTeamSpecializationForDay(base, input);
}

const STORY_SIGNAL_BY_GROUP: Record<TeamGroupId, TeamSpecializationStorySignalType> = {
  field_coordination: 'field_coordination_followup_hint',
  route_cleanup: 'route_cleanup_chain_hint',
  container_service: 'container_service_chain_hint',
  social_response: 'social_response_trust_hint',
  rapid_support: 'rapid_support_fatigue_hint',
  backup_team: 'backup_team_strain_hint',
};

export function buildTeamSpecializationStorySignal(
  state: TeamSpecializationStateV1,
): TeamSpecializationStorySignal {
  const ranked = TEAM_SPECIALIZATION_GROUP_IDS.map((groupId) => ({
    groupId,
    experience: state.teamGroups[groupId].experienceScore,
    fatigue: state.teamGroups[groupId].fatigueScore,
  })).sort((a, b) => {
    const pressureA = a.fatigue + a.experience * 0.2;
    const pressureB = b.fatigue + b.experience * 0.2;
    if (pressureB !== pressureA) return pressureB - pressureA;
    return (
      stableTeamSpecializationHash(`${state.updatedAtDay}|${a.groupId}`) -
      stableTeamSpecializationHash(`${state.updatedAtDay}|${b.groupId}`)
    );
  });

  const focus = ranked[0];
  const group = state.teamGroups[focus.groupId];
  const fatigueHigh = group.fatigueScore >= TEAM_SPECIALIZATION_FATIGUE_ELEVATED_MIN;
  const experienceGain = group.experienceScore >= TEAM_SPECIALIZATION_EXPERIENCE_RELIABLE_MIN;
  const moraleRecovered = group.moraleBand === 'motivated' || group.moraleBand === 'steady';

  return {
    signalType: STORY_SIGNAL_BY_GROUP[focus.groupId],
    groupId: focus.groupId,
    priority: 'low',
    canStrengthenChain: fatigueHigh || experienceGain,
    shouldSoftenChain: moraleRecovered && !fatigueHigh,
    reason: fatigueHigh
      ? 'Team fatigue may strengthen resource chain under guard.'
      : experienceGain
        ? 'Team domain success may advance related chain.'
        : 'No team specialization story pressure.',
  };
}
