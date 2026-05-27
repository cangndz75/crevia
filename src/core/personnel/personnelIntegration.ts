import type { DecisionAppliedEffects } from '@/core/models/DecisionRecord';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameResources } from '@/core/models/GameResources';
import type { Neighborhood } from '@/core/models/Neighborhood';

import { MISTAKE_RISK } from './personnelConstants';
import {
  applyEndOfDayPersonnelUpdate,
  applyPersonnelTaskResult,
  applyRestAction,
  buildPersonnelTaskInput,
  getMaxTeamFatigue,
  getRecommendedPersonnelForTask,
  inferPreferredRole,
  inferTaskDifficulty,
  syncCityMoraleFromTeams,
} from './personnelEngine';
import type { PersonnelMistakeDayContext } from './personnelMistakeRisk';
import type {
  PersonnelDayAssignment,
  PersonnelState,
  RestActionType,
} from './personnelTypes';

export type ProcessPersonnelDecisionParams = {
  personnelState: PersonnelState;
  event: EventCard;
  decision: EventDecision;
  day: number;
  neighborhoods: Neighborhood[];
  resources: GameResources;
};

export type ProcessPersonnelDecisionResult = {
  personnelState: PersonnelState;
  assignment: PersonnelDayAssignment | null;
  cityMorale: number | null;
  metricEffects: DecisionAppliedEffects;
  staffFatiguePeak: number;
};

function findNeighborhood(
  neighborhoods: Neighborhood[],
  event: EventCard,
): Neighborhood | undefined {
  if (event.neighborhoodId) {
    return neighborhoods.find((n) => n.id === event.neighborhoodId);
  }
  return neighborhoods.find((n) => n.name === event.district);
}

export function processPersonnelAfterDecision(
  params: ProcessPersonnelDecisionParams,
  currentCityMorale: number,
): ProcessPersonnelDecisionResult {
  const { personnelState, event, decision, day, neighborhoods, resources } =
    params;

  const preferredRole = inferPreferredRole(event, decision);
  const districtId = event.neighborhoodId ?? event.district;
  const difficulty = inferTaskDifficulty(event.riskLevel);

  const assignableState = {
    ...personnelState,
    teams: personnelState.teams.filter((t) => t.restMode !== 'full_rest'),
  };

  const team = getRecommendedPersonnelForTask(assignableState, {
    preferredRole,
    districtId,
    difficulty,
  });

  if (!team) {
    return {
      personnelState,
      assignment: null,
      cityMorale: null,
      metricEffects: {},
      staffFatiguePeak: getMaxTeamFatigue(personnelState),
    };
  }

  const equipmentSupportActive =
    personnelState.equipmentSupportUntilDay != null &&
    day <= personnelState.equipmentSupportUntilDay;

  const taskInput = buildPersonnelTaskInput({
    team,
    event,
    decision,
    neighborhood: findNeighborhood(neighborhoods, event),
    resources,
    equipmentSupportActive,
    day,
  });

  const mistakeContext: PersonnelMistakeDayContext = {
    day,
    existingIncidents: personnelState.dayIncidents ?? [],
  };

  const { team: updatedTeam, result } = applyPersonnelTaskResult(
    team,
    taskInput,
    {
      eventId: event.id,
      decisionId: decision.id,
    },
    mistakeContext,
  );

  const assignment: PersonnelDayAssignment = {
    day,
    teamId: updatedTeam.id,
    eventId: event.id,
    decisionId: decision.id,
    districtId,
    difficulty,
    outcome: result.outcome,
    successScore: result.successScore,
    fatigueGain: result.fatigueGain,
    moraleDelta: result.moraleDelta,
  };

  const teams = personnelState.teams.map((t) =>
    t.id === updatedTeam.id ? updatedTeam : t,
  );

  const dayIncidents = result.operationalIncident
    ? [...(personnelState.dayIncidents ?? []), result.operationalIncident]
    : (personnelState.dayIncidents ?? []);

  const nextState: PersonnelState = {
    ...personnelState,
    teams,
    dayAssignments: [...personnelState.dayAssignments, assignment],
    dayIncidents,
  };

  const metricEffects: DecisionAppliedEffects = {};

  if (result.outcome === 'success') {
    metricEffects.publicSatisfaction = 1;
  } else if (result.outcome === 'partial') {
    metricEffects.publicSatisfaction = 0;
  } else if (result.outcome === 'weak') {
    metricEffects.publicSatisfaction = -1;
    metricEffects.risk = 1;
  } else {
    metricEffects.publicSatisfaction = -2;
    metricEffects.risk = 2;
    metricEffects.staffMorale = -1;
  }

  if (result.operationalIncident) {
    const { outcome: oCfg } = MISTAKE_RISK;
    const isModerate = result.operationalIncident.severity === 'moderate';
    metricEffects.risk =
      (metricEffects.risk ?? 0) +
      (isModerate ? oCfg.metricRiskModerate : oCfg.metricRiskMinor);
    metricEffects.publicSatisfaction =
      (metricEffects.publicSatisfaction ?? 0) +
      (isModerate ? oCfg.metricPublicSatModerate : oCfg.metricPublicSatMinor);
  } else if (result.operationalIncidentRisk) {
    metricEffects.risk = (metricEffects.risk ?? 0) + 1;
  }

  const cityMorale = syncCityMoraleFromTeams(teams, currentCityMorale);

  return {
    personnelState: nextState,
    assignment,
    cityMorale,
    metricEffects,
    staffFatiguePeak: getMaxTeamFatigue(nextState),
  };
}

export function processPersonnelEndOfDay(
  personnelState: PersonnelState,
  closingDay: number,
): PersonnelState {
  return applyEndOfDayPersonnelUpdate(personnelState, closingDay);
}

export { applyPersonnelRestAction, canUseRestAction } from './personnelRestActions';
export type { RestPersonnelActionResult } from './personnelRestActions';

export function applyPersonnelRest(
  personnelState: PersonnelState,
  teamId: string,
  restType: RestActionType,
  day: number,
): PersonnelState {
  return applyRestAction(personnelState, teamId, restType, day);
}
