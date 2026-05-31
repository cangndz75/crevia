import { getAdvisorLevelFromExperience } from '@/core/advisors/advisorState';
import { scaleGameplayDelta } from '@/core/balance/gameplayImpactTuning';
import type { GameplayImpactScaleContext } from '@/core/balance/gameplayImpactTypes';
import { deriveCrisisAccessMode } from '@/core/crisis/crisisEngine';
import {
  clampCrisisScore,
  getCrisisRiskLevel,
  markCrisisIncidentContained,
} from '@/core/crisis/crisisState';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import { getActiveMainOperationDistrictIds } from '@/core/mainOperation/mainOperationState';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import {
  buildOperationSignal,
  clampSignalScore,
} from '@/core/operations/operationSignalState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  ALL_CRISIS_ACTION_TYPES,
  CRISIS_ACTION_DEFINITIONS,
  CRISIS_ACTION_PREVENTIVE_SCORE_THRESHOLD,
  CRISIS_ACTION_REPORT_LINES,
} from './crisisActionConstants';
import {
  addCrisisResolutionAction,
  buildCrisisActionDailySummary,
  expireOldCrisisActions,
  getActiveCrisisAction,
  getSelectedCrisisActionForDay,
  hasSelectedCrisisActionForDay,
  markCrisisActionProcessed,
  normalizeCrisisActionState,
  pruneCrisisActionHistory,
  upsertCrisisResolutionAction,
} from './crisisActionState';
import type {
  CrisisActionAccessMode,
  CrisisActionEffect,
  CrisisActionEngineInput,
  CrisisActionState,
  CrisisActionType,
  CrisisResolutionAction,
} from './crisisActionTypes';

function buildScaleContext(input: CrisisActionEngineInput): GameplayImpactScaleContext {
  return {
    gameState: input.gameState,
    monetization: input.monetization,
    isDay1Tutorial: input.gameState.city.day <= 1,
    postPilotLightPhase: !isFullMainOperationAccess(input.gameState, input.monetization),
    isCrisisRelated: true,
    crisisRiskElevated:
      input.crisisState.riskLevel === 'elevated' ||
      input.crisisState.riskLevel === 'critical',
  };
}

function scaleEffects(
  effects: CrisisActionEffect[],
  input: CrisisActionEngineInput,
): CrisisActionEffect[] {
  const ctx = buildScaleContext(input);
  return effects
    .map((e) => ({
      ...e,
      delta: scaleGameplayDelta(e.delta, ctx),
    }))
    .filter((e) => e.delta !== 0);
}

export function deriveCrisisActionAccessMode(
  input: CrisisActionEngineInput,
): CrisisActionAccessMode {
  const day = input.gameState.city.day;
  if (input.gameState.pilot.status === 'active' || day < POST_PILOT_FIRST_OPERATION_DAY) {
    return 'inactive';
  }
  const crisisAccess = deriveCrisisAccessMode(input.gameState, input.monetization);
  if (crisisAccess === 'inactive') return 'inactive';
  if (crisisAccess === 'limited_preview') return 'limited_preview';
  if (!isFullMainOperationAccess(input.gameState, input.monetization)) {
    return 'limited_preview';
  }
  return 'active';
}

export function shouldGenerateCrisisAction(input: CrisisActionEngineInput): boolean {
  if (deriveCrisisActionAccessMode(input) !== 'active') return false;
  if (input.crisisState.accessMode !== 'active') return false;
  const day = input.gameState.city.day;
  if (hasSelectedCrisisActionForDay(input.crisisActionState, day)) return false;
  if (input.crisisActionState.lastGeneratedDay === day) return false;
  if (getActiveCrisisAction(input.crisisActionState)) return false;

  const incident = input.crisisState.activeIncident;
  if (incident?.status === 'active' || incident?.status === 'forming') {
    return true;
  }
  if (input.crisisState.cityCrisisScore >= CRISIS_ACTION_PREVENTIVE_SCORE_THRESHOLD) {
    return true;
  }
  if (
    input.crisisState.riskLevel === 'elevated' ||
    input.crisisState.riskLevel === 'critical'
  ) {
    return true;
  }
  return false;
}

export function selectBestCrisisActionType(
  input: CrisisActionEngineInput,
): CrisisActionType {
  const signals = input.operationSignals;
  const incident = input.crisisState.activeIncident;
  const weakFit = input.assignments?.dailyAssignmentSummary?.weakFitCount ?? 0;

  const vehicleStrained =
    signals.vehicles.status === 'strained' || signals.vehicles.status === 'critical';
  const containerStrained =
    signals.containers.status === 'strained' || signals.containers.status === 'critical';

  if (vehicleStrained && containerStrained) {
    return 'preventive_maintenance';
  }
  if (weakFit > 0) {
    return 'field_rebalance';
  }
  if (
    signals.districts.status === 'strained' ||
    signals.districts.status === 'critical' ||
    incident?.primaryDomain === 'social'
  ) {
    return 'public_briefing';
  }
  if (
    input.crisisState.riskLevel === 'critical' ||
    input.crisisState.riskLevel === 'elevated'
  ) {
    return 'crisis_coordination';
  }
  if (input.crisisState.cityCrisisScore >= CRISIS_ACTION_PREVENTIVE_SCORE_THRESHOLD) {
    return 'preventive_maintenance';
  }
  return 'monitor_only';
}

export function buildCrisisActionEffects(
  input: CrisisActionEngineInput,
  actionType: CrisisActionType,
): CrisisActionEffect[] {
  const weakFit = input.assignments?.dailyAssignmentSummary?.weakFitCount ?? 0;
  const signals = input.operationSignals;
  const containerChain =
    (signals.vehicles.status === 'strained' || signals.vehicles.status === 'critical') &&
    (signals.containers.status === 'strained' || signals.containers.status === 'critical');

  let raw: CrisisActionEffect[] = [];

  switch (actionType) {
    case 'crisis_coordination':
      raw = [
        { domain: 'crisis', delta: -10, reason: 'Kriz koordinasyonu', sourceTags: ['crisis_action'] },
        { domain: 'city', delta: -4, reason: 'Şehir baskısı düşer', sourceTags: ['crisis_action'] },
        { domain: 'districts', delta: -3, reason: 'Mahalle baskısı düşer', sourceTags: ['crisis_action'] },
        { domain: 'personnel', delta: 3, reason: 'Ekip yükü artar', sourceTags: ['crisis_action'] },
        { domain: 'vehicles', delta: 3, reason: 'Filo yükü artar', sourceTags: ['crisis_action'] },
        { domain: 'season', delta: -2, reason: 'Şehir dengesi hedefi desteklenir', sourceTags: ['crisis_action'] },
      ];
      break;
    case 'public_briefing':
      raw = [
        { domain: 'districts', delta: -7, reason: 'Mahalle gerilimi düşer', sourceTags: ['crisis_action'] },
        { domain: 'social', delta: -7, reason: 'Sosyal baskı düşer', sourceTags: ['crisis_action'] },
        { domain: 'crisis', delta: -4, reason: 'Kriz eşiği düşer', sourceTags: ['crisis_action'] },
        { domain: 'personnel', delta: 2, reason: 'Koordinasyon yükü', sourceTags: ['crisis_action'] },
        { domain: 'vehicles', delta: 1, reason: 'Saha çözümü yavaşlar', sourceTags: ['crisis_action'] },
      ];
      break;
    case 'field_rebalance':
      raw = [
        { domain: 'assignments', delta: -8, reason: 'Atama dengesi iyileşir', sourceTags: ['crisis_action'] },
        { domain: 'crisis', delta: -5, reason: 'Kriz baskısı düşer', sourceTags: ['crisis_action'] },
        { domain: 'personnel', delta: 2, reason: 'Yeniden dengeleme yükü', sourceTags: ['crisis_action'] },
        { domain: 'city', delta: -2, reason: 'Genel operasyon dengesi', sourceTags: ['crisis_action'] },
      ];
      if (weakFit > 0) {
        raw.push({
          domain: 'assignments',
          delta: -2,
          reason: 'Zayıf uyum telafi edildi',
          sourceTags: ['crisis_action', 'weak_fit'],
        });
      }
      break;
    case 'preventive_maintenance':
      raw = [
        { domain: 'vehicles', delta: -8, reason: 'Filo riski düşer', sourceTags: ['crisis_action'] },
        { domain: 'crisis', delta: -5, reason: 'Kriz eşiği düşer', sourceTags: ['crisis_action'] },
      ];
      if (containerChain) {
        raw.push({
          domain: 'containers',
          delta: -5,
          reason: 'Konteyner zinciri rahatlar',
          sourceTags: ['crisis_action', 'chain'],
        });
      }
      raw.push({
        domain: 'districts',
        delta: 1,
        reason: 'Sosyal baskı izlenir',
        sourceTags: ['crisis_action'],
      });
      break;
    case 'monitor_only':
      raw = [
        { domain: 'crisis', delta: 5, reason: 'Kriz izlenir', sourceTags: ['crisis_action'] },
        { domain: 'city', delta: 2, reason: 'Genel risk izlenir', sourceTags: ['crisis_action'] },
      ];
      break;
    default:
      break;
  }

  return scaleEffects(raw, input);
}

function pickAffectedDistrictIds(input: CrisisActionEngineInput): string[] {
  const ids = new Set<string>();
  const incident = input.crisisState.activeIncident;
  if (incident) {
    for (const id of incident.affectedDistrictIds) ids.add(id);
  }
  if (input.mainOperationSeason) {
    for (const id of getActiveMainOperationDistrictIds(input.mainOperationSeason)) {
      ids.add(id);
    }
  }
  if (input.operationSignals.priorityDistrictId) {
    ids.add(input.operationSignals.priorityDistrictId);
  }
  return [...ids].slice(0, 3);
}

export function buildCrisisResolutionActionForDay(
  input: CrisisActionEngineInput,
  type?: CrisisActionType,
): CrisisResolutionAction | undefined {
  if (!shouldGenerateCrisisAction(input)) return undefined;

  const day = input.gameState.city.day;
  const actionType = type ?? selectBestCrisisActionType(input);
  const def = CRISIS_ACTION_DEFINITIONS[actionType];
  const incident = input.crisisState.activeIncident;

  const action: CrisisResolutionAction = {
    id: `crisis_action_${day}_${actionType}`,
    day,
    type: actionType,
    status: 'available',
    title: def.label,
    summary: def.summary,
    reasonLine: incident
      ? `${incident.title} için özel kriz hamlesi öneriliyor.`
      : 'Kritik eşik için özel kriz hamlesi öneriliyor.',
    tradeoffLine: def.tradeoff,
    relatedIncidentId: incident?.id,
    affectedDistrictIds: pickAffectedDistrictIds(input),
    effects: buildCrisisActionEffects(input, actionType),
    expiresAtDay: day + 1,
    sourceTags: ['crisis_action', actionType],
  };

  return action;
}

export function refreshCrisisActionsForDay(
  input: CrisisActionEngineInput,
): CrisisActionState {
  const day = input.gameState.city.day;
  let state = normalizeCrisisActionState(input.crisisActionState);
  state = expireOldCrisisActions(state, day);

  if (deriveCrisisActionAccessMode(input) !== 'active') {
    return state;
  }

  if (shouldGenerateCrisisAction({ ...input, crisisActionState: state })) {
    const action = buildCrisisResolutionActionForDay({ ...input, crisisActionState: state });
    if (action) {
      state = addCrisisResolutionAction(state, action);
      state = { ...state, lastGeneratedDay: day };
    }
  }

  return pruneCrisisActionHistory(state, day);
}

export function selectCrisisActionByType(
  state: CrisisActionState,
  input: CrisisActionEngineInput,
  actionType: CrisisActionType,
): CrisisActionState {
  const day = input.gameState.city.day;
  if (deriveCrisisActionAccessMode(input) !== 'active') return state;
  if (hasSelectedCrisisActionForDay(state, day)) return state;

  const def = CRISIS_ACTION_DEFINITIONS[actionType];
  const incident = input.crisisState.activeIncident;
  const action: CrisisResolutionAction = {
    id: `crisis_action_${day}_${actionType}_selected`,
    day,
    type: actionType,
    status: 'selected',
    title: def.label,
    summary: def.summary,
    reasonLine: incident
      ? `${incident.title} için kriz hamlesi seçildi.`
      : 'Kritik eşik için kriz hamlesi seçildi.',
    tradeoffLine: def.tradeoff,
    relatedIncidentId: incident?.id,
    affectedDistrictIds: pickAffectedDistrictIds(input),
    effects: buildCrisisActionEffects(input, actionType),
    selectedAtDay: day,
    sourceTags: ['crisis_action', actionType],
  };

  let next = { ...state, actionsById: { ...state.actionsById } };
  if (state.activeActionId && next.actionsById[state.activeActionId]) {
    const { [state.activeActionId]: _, ...rest } = next.actionsById;
    next = { ...next, actionsById: rest, activeActionId: undefined };
  }
  return upsertCrisisResolutionAction(next, action);
}

export function applyCrisisActionEffectsToCrisisState(
  crisisState: CrisisState,
  effects: CrisisActionEffect[],
): CrisisState {
  let score = crisisState.cityCrisisScore;
  for (const e of effects) {
    if (e.domain === 'crisis' || e.domain === 'city') {
      score += e.delta;
    }
  }
  const clamped = clampCrisisScore(score);
  return {
    ...crisisState,
    cityCrisisScore: clamped,
    riskLevel: getCrisisRiskLevel(clamped),
    previousCityCrisisScore: crisisState.cityCrisisScore,
  };
}

export function applyCrisisActionEffectsToOperationSignals(
  operationSignals: OperationSignalsState,
  effects: CrisisActionEffect[],
): OperationSignalsState {
  if (effects.length === 0) return operationSignals;

  let personnelScore = operationSignals.personnel.score;
  let vehiclesScore = operationSignals.vehicles.score;
  let containersScore = operationSignals.containers.score;
  let districtsScore = operationSignals.districts.score;
  let overallScore = operationSignals.overall.score;
  const day = operationSignals.personnel.lastUpdatedDay;

  for (const e of effects) {
    switch (e.domain) {
      case 'personnel':
        personnelScore += e.delta;
        break;
      case 'vehicles':
        vehiclesScore += e.delta;
        break;
      case 'containers':
        containersScore += e.delta;
        break;
      case 'districts':
      case 'social':
        districtsScore += e.delta;
        break;
      case 'assignments':
      case 'city':
      case 'season':
        overallScore += e.delta;
        break;
      default:
        break;
    }
  }

  const tags = ['crisis_action'];
  const mk = (
    domain: 'personnel' | 'vehicles' | 'containers' | 'districts' | 'overall',
    score: number,
    prev: OperationSignalsState['personnel'],
  ) =>
    buildOperationSignal(
      domain,
      clampSignalScore(score),
      prev.score,
      day,
      prev.title,
      'Kriz hamlesi etkisi.',
      [...new Set([...prev.sourceTags, ...tags])],
    );

  return {
    ...operationSignals,
    personnel: mk('personnel', personnelScore, operationSignals.personnel),
    vehicles: mk('vehicles', vehiclesScore, operationSignals.vehicles),
    containers: mk('containers', containersScore, operationSignals.containers),
    districts: mk('districts', districtsScore, operationSignals.districts),
    overall: mk('overall', overallScore, operationSignals.overall),
  };
}

export function applyCrisisActionEffectsToMainOperationSeason(
  season: MainOperationSeasonState,
  effects: CrisisActionEffect[],
): MainOperationSeasonState {
  const seasonEffects = effects.filter((e) => e.domain === 'season');
  if (seasonEffects.length === 0) return season;
  const bump = seasonEffects.reduce((s, e) => s - e.delta, 0);
  if (bump <= 0) return season;
  return {
    ...season,
    goals: season.goals.map((g) =>
      g.domain === 'city_balance'
        ? {
            ...g,
            progress: Math.min(100, Math.max(0, g.progress + Math.min(3, bump))),
          }
        : g,
    ),
  };
}

function maybeContainIncident(
  crisisState: CrisisState,
  action: CrisisResolutionAction,
  day: number,
): CrisisState {
  if (!crisisState.activeIncident) return crisisState;
  if (action.type === 'monitor_only') return crisisState;
  if (
    action.type !== 'crisis_coordination' &&
    action.type !== 'field_rebalance' &&
    action.type !== 'preventive_maintenance' &&
    action.type !== 'public_briefing'
  ) {
    return crisisState;
  }
  const drop =
    (crisisState.previousCityCrisisScore ?? crisisState.cityCrisisScore) -
    crisisState.cityCrisisScore;
  if (crisisState.riskLevel === 'watch' || crisisState.riskLevel === 'stable' || drop >= 8) {
    return markCrisisIncidentContained(
      crisisState,
      day,
      'Kriz hamlesi şehir baskısını kontrol altına aldı.',
    );
  }
  return crisisState;
}

export function buildCrisisActionReportLines(
  _input: CrisisActionEngineInput,
  summary: import('./crisisActionTypes').CrisisActionDailySummary,
  action?: CrisisResolutionAction,
): string[] {
  if (!action) return [];
  const line = CRISIS_ACTION_REPORT_LINES[action.type];
  return [line, action.tradeoffLine].filter(Boolean).slice(0, 3);
}

export function getCrisisActionAdvisorLine(
  input: CrisisActionEngineInput,
  action: CrisisResolutionAction,
): string | undefined {
  const level = getAdvisorLevelFromExperience(input.advisorState?.experience ?? 0);
  if (level <= 1) {
    return 'Bu hamle krizi yumuşatabilir, ama ekip üzerindeki yük artabilir.';
  }
  if (level === 2) {
    if (action.type === 'crisis_coordination') {
      return 'Kriz koordinasyonu şehir baskısını düşürür. Personel ve araç sinyalini gün sonunda izle.';
    }
    return `${action.summary} ${action.tradeoffLine}`;
  }
  if (action.type === 'preventive_maintenance') {
    return 'Bu kriz araç ve konteyner zincirinden geliyor. Önleyici bakım riski daha kalıcı düşürür, koordinasyon ise şehir baskısını daha hızlı kontrol eder.';
  }
  if (action.type === 'crisis_coordination') {
    return 'Kriz koordinasyonu şehir baskısını hızlı düşürür; personel ve filo maliyetini birlikte izle.';
  }
  return `${action.summary} ${action.tradeoffLine}`;
}

export function processCrisisActionsEndOfDay(
  input: CrisisActionEngineInput,
  closingDay: number,
): {
  crisisActionState: CrisisActionState;
  operationSignals: OperationSignalsState;
  crisisState: CrisisState;
  mainOperationSeason?: MainOperationSeasonState;
} {
  let state = expireOldCrisisActions(input.crisisActionState, closingDay);
  let operationSignals = input.operationSignals;
  let crisisState = input.crisisState;
  let mainOperationSeason = input.mainOperationSeason;

  if (state.lastProcessedDay === closingDay) {
    return { crisisActionState: state, operationSignals, crisisState, mainOperationSeason };
  }

  const selected = getSelectedCrisisActionForDay(state, closingDay);
  if (selected && selected.status === 'selected') {
    operationSignals = applyCrisisActionEffectsToOperationSignals(
      operationSignals,
      selected.effects,
    );
    crisisState = applyCrisisActionEffectsToCrisisState(crisisState, selected.effects);
    if (mainOperationSeason) {
      mainOperationSeason = applyCrisisActionEffectsToMainOperationSeason(
        mainOperationSeason,
        selected.effects,
      );
    }
    crisisState = maybeContainIncident(crisisState, selected, closingDay);
    state = markCrisisActionProcessed(state, selected.id, closingDay);
  }

  for (const action of Object.values(state.actionsById)) {
    if (action.status === 'available' && action.day === closingDay) {
      state = upsertCrisisResolutionAction(state, { ...action, status: 'expired' });
    }
  }

  const summary = buildCrisisActionDailySummary(state, closingDay);
  summary.reportLines = buildCrisisActionReportLines(input, summary, selected ?? undefined);
  state = {
    ...state,
    dailySummary: summary,
    lastProcessedDay: closingDay,
    activeActionId: undefined,
  };
  state = pruneCrisisActionHistory(state, closingDay);

  return { crisisActionState: state, operationSignals, crisisState, mainOperationSeason };
}

export function buildCrisisActionEngineInputFromStore(state: {
  gameState: CrisisActionEngineInput['gameState'];
  monetization: CrisisActionEngineInput['monetization'];
  crisisState: CrisisState;
  operationSignals: OperationSignalsState;
  assignments?: CrisisActionEngineInput['assignments'];
  dailyOperationsPlan?: CrisisActionEngineInput['dailyOperationsPlan'];
  mainOperationSeason?: MainOperationSeasonState;
  advisorState?: CrisisActionEngineInput['advisorState'];
  crisisActionState: CrisisActionState;
}): CrisisActionEngineInput {
  return { ...state };
}

export function isCrisisActionOfferVisible(input: CrisisActionEngineInput): boolean {
  if (deriveCrisisActionAccessMode(input) !== 'active') return false;
  const day = input.gameState.city.day;
  if (hasSelectedCrisisActionForDay(input.crisisActionState, day)) return true;
  return (
    shouldGenerateCrisisAction(input) ||
    getActiveCrisisAction(input.crisisActionState) != null ||
    input.crisisActionState.lastGeneratedDay === day
  );
}

export { ALL_CRISIS_ACTION_TYPES };
