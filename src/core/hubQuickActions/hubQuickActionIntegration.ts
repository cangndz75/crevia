import {
  HUB_QUICK_ACTION_DEFINITIONS,
  HUB_QUICK_ACTION_MAX_RECORDS,
} from './hubQuickActionConstants';
import {
  buildFieldDutyAssignment,
  buildFieldDutyResultLines,
} from './hubQuickActionFieldDutyPlan';
import {
  buildNeighborhoodPatrolAssignment,
  buildNeighborhoodPatrolResultLines,
} from './hubQuickActionNeighborhoodPatrolPlan';
import {
  buildRoutePreparationAssignment,
  buildRoutePreparationResultLines,
} from './hubQuickActionRoutePlan';
import {
  buildSocialResponseAssignment,
  buildSocialResponseResultLines,
} from './hubQuickActionSocialResponsePlan';
import { applySocialResponseEffect } from './hubQuickActionSocialResponseEffects';
import { createInitialHubQuickActionState } from './hubQuickActionSeed';
import type {
  HubQuickActionResult,
  HubQuickActionState,
  ProcessHubQuickActionInput,
  ProcessHubQuickActionOutput,
} from './hubQuickActionTypes';

function buildRecordId(day: number, sequence: number): string {
  return `hqa-${day}-${sequence}`;
}

function buildAlreadyUsedResult(
  actionId: ProcessHubQuickActionInput['actionId'],
  day: number,
): HubQuickActionResult {
  const def = HUB_QUICK_ACTION_DEFINITIONS[actionId];
  return {
    actionId,
    title: def.title,
    tone: 'warning',
    resultLine: 'Bu hamle bugün zaten kullanıldı.',
    day,
  };
}

function buildRoutePreparationUnavailableResult(day: number): HubQuickActionResult {
  const def = HUB_QUICK_ACTION_DEFINITIONS.route_preparation;
  return {
    actionId: 'route_preparation',
    title: def.title,
    tone: 'warning',
    resultLine: 'Uygun araç bulunamadı.',
    detailLine: 'Araçlar görevde, bakımda veya kritik durumda olabilir.',
    day,
  };
}

function buildNeighborhoodPatrolUnavailableResult(day: number): HubQuickActionResult {
  const def = HUB_QUICK_ACTION_DEFINITIONS.neighborhood_patrol;
  return {
    actionId: 'neighborhood_patrol',
    title: def.title,
    tone: 'warning',
    resultLine: 'Uygun mahalle bulunamadı.',
    detailLine: 'Mahalle listesi boş veya geçersiz.',
    day,
  };
}

function buildSocialResponseUnavailableResult(day: number): HubQuickActionResult {
  const def = HUB_QUICK_ACTION_DEFINITIONS.social_response;
  return {
    actionId: 'social_response',
    title: def.title,
    tone: 'warning',
    resultLine: 'Sosyal yanıt için uygun gündem bulunamadı.',
    detailLine: 'Sosyal nabız veya mahalle verisi eksik olabilir.',
    day,
  };
}

function buildSocialResponseBlockedResult(day: number, message: string): HubQuickActionResult {
  const def = HUB_QUICK_ACTION_DEFINITIONS.social_response;
  return {
    actionId: 'social_response',
    title: def.title,
    tone: 'warning',
    resultLine: message,
    detailLine: 'Sosyal ekranından bugün aynı gündeme yanıt verilmiş olabilir.',
    day,
  };
}

function buildFieldDutyUnavailableResult(day: number): HubQuickActionResult {
  const def = HUB_QUICK_ACTION_DEFINITIONS.field_duty;
  return {
    actionId: 'field_duty',
    title: def.title,
    tone: 'warning',
    resultLine: 'Bugün uygun ekip bulunamadı.',
    detailLine: 'Ekipler dinleniyor veya sahaya çıkamayacak durumda.',
    day,
  };
}

function ensureStateForDay(
  state: HubQuickActionState,
  currentDay: number,
): HubQuickActionState {
  if (state.day === currentDay) {
    return state;
  }
  return createInitialHubQuickActionState(currentDay);
}

function processFieldDutyAction(
  input: ProcessHubQuickActionInput,
  baseState: HubQuickActionState,
): ProcessHubQuickActionOutput {
  const { currentDay } = input;
  const def = HUB_QUICK_ACTION_DEFINITIONS.field_duty;

  if (!input.fieldDutyContext) {
    const result = buildFieldDutyUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const assignment = buildFieldDutyAssignment(input.fieldDutyContext, currentDay);
  if (!assignment) {
    const result = buildFieldDutyUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const lines = buildFieldDutyResultLines(assignment);
  const nextSequence = baseState.sequence + 1;
  const record = {
    id: buildRecordId(currentDay, nextSequence),
    actionId: 'field_duty' as const,
    day: currentDay,
    title: def.title,
    targetLabel: assignment.label,
    resultLine: lines.resultLine,
    createdAtDay: currentDay,
    createdAtSequence: nextSequence,
  };

  const result: HubQuickActionResult = {
    actionId: 'field_duty',
    title: def.title,
    tone: 'positive',
    resultLine: lines.resultLine,
    detailLine: lines.detailLine,
    day: currentDay,
  };

  const records = [...baseState.records, record].slice(-HUB_QUICK_ACTION_MAX_RECORDS);
  const nextState: HubQuickActionState = {
    day: currentDay,
    usedActionIds: [...baseState.usedActionIds, 'field_duty'],
    records,
    sequence: nextSequence,
    lastResult: result,
    fieldDuty: assignment,
    routePreparation: baseState.routePreparation,
    neighborhoodPatrol: baseState.neighborhoodPatrol,
    socialResponse: baseState.socialResponse,
  };

  return { state: nextState, result, stateChanged: true };
}

function processNeighborhoodPatrolAction(
  input: ProcessHubQuickActionInput,
  baseState: HubQuickActionState,
): ProcessHubQuickActionOutput {
  const { currentDay } = input;
  const def = HUB_QUICK_ACTION_DEFINITIONS.neighborhood_patrol;

  if (!input.neighborhoodPatrolContext) {
    const result = buildNeighborhoodPatrolUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const assignment = buildNeighborhoodPatrolAssignment(
    input.neighborhoodPatrolContext,
    currentDay,
  );
  if (!assignment) {
    const result = buildNeighborhoodPatrolUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const lines = buildNeighborhoodPatrolResultLines(assignment);
  const nextSequence = baseState.sequence + 1;
  const record = {
    id: buildRecordId(currentDay, nextSequence),
    actionId: 'neighborhood_patrol' as const,
    day: currentDay,
    title: def.title,
    targetLabel: assignment.label,
    resultLine: lines.resultLine,
    createdAtDay: currentDay,
    createdAtSequence: nextSequence,
  };

  const result: HubQuickActionResult = {
    actionId: 'neighborhood_patrol',
    title: def.title,
    tone: 'positive',
    resultLine: lines.resultLine,
    detailLine: lines.detailLine,
    day: currentDay,
  };

  const records = [...baseState.records, record].slice(-HUB_QUICK_ACTION_MAX_RECORDS);
  const nextState: HubQuickActionState = {
    day: currentDay,
    usedActionIds: [...baseState.usedActionIds, 'neighborhood_patrol'],
    records,
    sequence: nextSequence,
    lastResult: result,
    fieldDuty: baseState.fieldDuty,
    routePreparation: baseState.routePreparation,
    neighborhoodPatrol: assignment,
    socialResponse: baseState.socialResponse,
  };

  return { state: nextState, result, stateChanged: true };
}

function processSocialResponseAction(
  input: ProcessHubQuickActionInput,
  baseState: HubQuickActionState,
): ProcessHubQuickActionOutput {
  const { currentDay } = input;
  const def = HUB_QUICK_ACTION_DEFINITIONS.social_response;

  if (!input.socialResponseContext) {
    const result = buildSocialResponseUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const assignment = buildSocialResponseAssignment(
    input.socialResponseContext,
    currentDay,
  );
  if (!assignment) {
    const result = buildSocialResponseUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const effect = applySocialResponseEffect({
    socialPulseState: input.socialResponseContext.socialPulseState,
    assignment,
    currentDay,
  });

  if (effect.blocked) {
    const result = buildSocialResponseBlockedResult(
      currentDay,
      effect.message ?? 'Bu gündeme bugün zaten yanıt verildi.',
    );
    return { state: baseState, result, stateChanged: false };
  }

  if (!effect.success) {
    const result = buildSocialResponseUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const lines = buildSocialResponseResultLines(assignment);
  const nextSequence = baseState.sequence + 1;
  const record = {
    id: buildRecordId(currentDay, nextSequence),
    actionId: 'social_response' as const,
    day: currentDay,
    title: def.title,
    targetLabel: assignment.label,
    resultLine: lines.resultLine,
    createdAtDay: currentDay,
    createdAtSequence: nextSequence,
  };

  const result: HubQuickActionResult = {
    actionId: 'social_response',
    title: def.title,
    tone: 'positive',
    resultLine: lines.resultLine,
    detailLine: lines.detailLine,
    day: currentDay,
  };

  const records = [...baseState.records, record].slice(-HUB_QUICK_ACTION_MAX_RECORDS);
  const nextState: HubQuickActionState = {
    day: currentDay,
    usedActionIds: [...baseState.usedActionIds, 'social_response'],
    records,
    sequence: nextSequence,
    lastResult: result,
    fieldDuty: baseState.fieldDuty,
    routePreparation: baseState.routePreparation,
    neighborhoodPatrol: baseState.neighborhoodPatrol,
    socialResponse: assignment,
  };

  return {
    state: nextState,
    result,
    stateChanged: true,
    socialPulseState: effect.state,
  };
}

function processRoutePreparationAction(
  input: ProcessHubQuickActionInput,
  baseState: HubQuickActionState,
): ProcessHubQuickActionOutput {
  const { currentDay } = input;
  const def = HUB_QUICK_ACTION_DEFINITIONS.route_preparation;

  if (!input.routePreparationContext) {
    const result = buildRoutePreparationUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const assignment = buildRoutePreparationAssignment(
    input.routePreparationContext,
    currentDay,
  );
  if (!assignment) {
    const result = buildRoutePreparationUnavailableResult(currentDay);
    return { state: baseState, result, stateChanged: false };
  }

  const lines = buildRoutePreparationResultLines(assignment);
  const nextSequence = baseState.sequence + 1;
  const record = {
    id: buildRecordId(currentDay, nextSequence),
    actionId: 'route_preparation' as const,
    day: currentDay,
    title: def.title,
    targetLabel: assignment.label,
    resultLine: lines.resultLine,
    createdAtDay: currentDay,
    createdAtSequence: nextSequence,
  };

  const result: HubQuickActionResult = {
    actionId: 'route_preparation',
    title: def.title,
    tone: 'positive',
    resultLine: lines.resultLine,
    detailLine: lines.detailLine,
    day: currentDay,
  };

  const records = [...baseState.records, record].slice(-HUB_QUICK_ACTION_MAX_RECORDS);
  const nextState: HubQuickActionState = {
    day: currentDay,
    usedActionIds: [...baseState.usedActionIds, 'route_preparation'],
    records,
    sequence: nextSequence,
    lastResult: result,
    fieldDuty: baseState.fieldDuty,
    routePreparation: assignment,
    neighborhoodPatrol: baseState.neighborhoodPatrol,
    socialResponse: baseState.socialResponse,
  };

  return { state: nextState, result, stateChanged: true };
}

function processGenericHubQuickAction(
  input: ProcessHubQuickActionInput,
  baseState: HubQuickActionState,
): ProcessHubQuickActionOutput {
  const { actionId, currentDay } = input;
  const def = HUB_QUICK_ACTION_DEFINITIONS[actionId];

  const nextSequence = baseState.sequence + 1;
  const record = {
    id: buildRecordId(currentDay, nextSequence),
    actionId,
    day: currentDay,
    title: def.title,
    targetLabel: def.targetLabel,
    resultLine: def.defaultResultLine,
    createdAtDay: currentDay,
    createdAtSequence: nextSequence,
  };

  const result: HubQuickActionResult = {
    actionId,
    title: def.title,
    tone: 'positive',
    resultLine: def.defaultResultLine,
    detailLine: def.defaultDetailLine,
    day: currentDay,
  };

  const records = [...baseState.records, record].slice(-HUB_QUICK_ACTION_MAX_RECORDS);

  const nextState: HubQuickActionState = {
    day: currentDay,
    usedActionIds: [...baseState.usedActionIds, actionId],
    records,
    sequence: nextSequence,
    lastResult: result,
    fieldDuty: baseState.fieldDuty,
    routePreparation: baseState.routePreparation,
    neighborhoodPatrol: baseState.neighborhoodPatrol,
    socialResponse: baseState.socialResponse,
  };

  return { state: nextState, result, stateChanged: true };
}

export function processHubQuickActionForStore(
  input: ProcessHubQuickActionInput,
): ProcessHubQuickActionOutput {
  const { actionId, currentDay } = input;
  const baseState = ensureStateForDay(input.state, currentDay);

  if (baseState.usedActionIds.includes(actionId)) {
    const result = buildAlreadyUsedResult(actionId, currentDay);
    return {
      state: baseState,
      result,
      stateChanged: false,
    };
  }

  if (actionId === 'field_duty') {
    return processFieldDutyAction(input, baseState);
  }

  if (actionId === 'route_preparation') {
    return processRoutePreparationAction(input, baseState);
  }

  if (actionId === 'neighborhood_patrol') {
    return processNeighborhoodPatrolAction(input, baseState);
  }

  if (actionId === 'social_response') {
    return processSocialResponseAction(input, baseState);
  }

  return processGenericHubQuickAction(input, baseState);
}
