import {
  createInitialAssignmentsState,
  confirmEventAssignment,
  upsertEventAssignment,
} from '@/core/assignments/assignmentState';
import {
  buildDefaultAssignmentForEvent,
  calculateAssignmentCompatibility,
  calculateAssignmentEffects,
  applyAssignmentEffectsToOperationSignals,
  getCompatibilityLabel,
  processAssignmentsEndOfDay,
} from '@/core/assignments/assignmentEngine';
import type { AssignmentEngineInput } from '@/core/assignments/assignmentTypes';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { createInitialAdvisorState } from '@/core/advisors/advisorState';
import {
  applyCrisisActionEffectsToCrisisState,
  applyCrisisActionEffectsToOperationSignals,
  refreshCrisisActionsForDay,
  selectCrisisActionByType,
} from '@/core/crisisActions/crisisActionEngine';
import {
  createInitialCrisisActionState,
  getActiveCrisisAction,
} from '@/core/crisisActions/crisisActionState';
import type { CrisisActionEngineInput } from '@/core/crisisActions/crisisActionTypes';
import {
  processCrisisEndOfDay,
  deriveCrisisStateFromGameState,
} from '@/core/crisis/crisisEngine';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { createDay1Seed } from '@/core/content/day1Seed';
import {
  applyDailyPlanEffectsToOperationSignals,
  calculateDailyPlanEffects,
} from '@/core/dailyPlanning/dailyPlanningEngine';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import type { DailyPlanningEngineInput } from '@/core/dailyPlanning/dailyPlanningTypes';
import { applyDecision } from '@/core/game/applyDecision';
import type { EndDayState } from '@/core/game/endDay';
import { hashSeed } from '@/core/game/createSeededRandom';
import {
  applyFullAccessToGameState,
  applyLimitedContinueToGameState,
  buildDevJumpPilotCompletedGameState,
  isFullMainOperationAccess,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import {
  buildMainOperationEngineInput,
  processMainOperationEndOfDay,
} from '@/core/mainOperation/mainOperationEngine';
import { buildMainOperationReportModel } from '@/core/mainOperation/mainOperationPresentation';
import {
  syncMainOperationSeasonAfterFullUnlock,
  syncMainOperationSeasonAfterLimitedContinue,
} from '@/core/mainOperation/mainOperationEngine';
import {
  generateMicroDecisionCandidates,
  applyMicroDecisionEffectsToCrisisState,
  applyMicroDecisionEffectsToOperationSignals,
  processMicroDecisionsEndOfDay,
  refreshMicroDecisionsForDay,
  resolveMicroDecisionEffects,
} from '@/core/microDecisions/microDecisionEngine';
import { createInitialMicroDecisionState, resolveMicroDecision } from '@/core/microDecisions/microDecisionState';
import {
  deriveOperationSignalsFromGameState,
  processOperationSignalsEndOfDay,
} from '@/core/operations/operationSignalEngine';
import {
  createInitialOperationSignalsState,
  refreshOperationSignalsForDay,
} from '@/core/operations/operationSignalState';
import {
  deriveOperationalResourcesFromGameState,
  processOperationalResourcesEndOfDay,
} from '@/core/operationalResources/operationalResourceEngine';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { ensurePostPilotDailyEventsForDay } from '@/core/postPilot/postPilotEventEngine';
import { getMainOperationEventDensity } from '@/core/mainOperation/mainOperationEngine';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { Neighborhood } from '@/core/models/Neighborhood';
import type { GameResources } from '@/core/models/GameResources';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { AssignmentsState } from '@/core/assignments/assignmentTypes';
import type { MicroDecisionState } from '@/core/microDecisions/microDecisionTypes';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import type { CrisisActionState } from '@/core/crisisActions/crisisActionTypes';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { AdvisorState } from '@/core/advisors/advisorTypes';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import { buildMainOperationAdvisorNote } from '@/core/mainOperation/mainOperationPresentation';

import {
  FULL_SEASON_SIM_DEFAULT_LENGTH,
  FULL_SEASON_SIM_DEFAULT_SEED,
  FULL_SEASON_SIM_FIRST_DAY,
  FORBIDDEN_SIMULATION_WORDS,
} from './fullSeasonSimulationConstants';
import {
  buildSimulationFindings,
  calculateLimitedVsFullValueScore,
  collectAggregateMetrics,
  compareSimulationRuns,
  deriveAuditHealth,
  detectCategorySpamWarnings,
} from './fullSeasonSimulationMetrics';
import {
  chooseAssignmentForProfile,
  chooseCrisisActionForProfile,
  chooseDailyPlanForProfile,
  chooseEventDecisionOptionForProfile,
  chooseMicroDecisionOptionForProfile,
  createStrategyRng,
  shouldOpenFullAccessForProfile,
} from './fullSeasonSimulationStrategies';
import type {
  FullSeasonSimulationAuditResult,
  FullSeasonSimulationDayResult,
  FullSeasonSimulationMode,
  FullSeasonSimulationRun,
  FullSeasonPlayerProfile,
  RunFullSeasonSimulationParams,
} from './fullSeasonSimulationTypes';

export type FullSeasonSimState = {
  gameState: GameState;
  neighborhoods: Neighborhood[];
  resources: GameResources;
  eventPool: EventCard[];
  decisionHistory: DecisionRecord[];
  monetization: MonetizationState;
  operationSignals: OperationSignalsState;
  dailyOperationsPlan: DailyOperationsPlanState;
  assignments: AssignmentsState;
  microDecisionState: MicroDecisionState;
  crisisState: CrisisState;
  crisisActionState: CrisisActionState;
  operationalResources: OperationalResourcesState;
  mainOperationSeason: MainOperationSeasonState;
  advisorState: AdvisorState;
  lastClosedDay: number | null;
  rng: () => number;
  seed: number;
  categoriesByDay: string[][];
};

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function profileSeed(base: number, profile: FullSeasonPlayerProfile): number {
  return hashSeed(`${base}-${profile}`);
}

function averageGoalProgress(season: MainOperationSeasonState): number {
  if (season.goals.length === 0) return 0;
  return (
    season.goals.reduce((s, g) => s + g.progress, 0) / season.goals.length
  );
}

const RESOURCE_STATUS_PRESSURE: Record<string, number> = {
  stable: 22,
  watch: 48,
  strained: 72,
  critical: 92,
};

function measureResourcePressure(state: OperationalResourcesState): {
  average: number;
  highest: number;
} {
  const scores: number[] = [];
  for (const g of Object.values(state.personnelGroups)) {
    scores.push(RESOURCE_STATUS_PRESSURE[g.status] ?? 40);
  }
  for (const g of Object.values(state.vehicleGroups)) {
    scores.push(RESOURCE_STATUS_PRESSURE[g.status] ?? 40);
  }
  for (const n of Object.values(state.containerNetworksByDistrictId)) {
    scores.push(RESOURCE_STATUS_PRESSURE[n.status] ?? 40);
  }
  if (scores.length === 0) return { average: 0, highest: 0 };
  const highest = Math.max(...scores);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return { average, highest };
}

function countReportLines(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationSeasonState,
  operationalResources: OperationalResourcesState,
): number {
  try {
    const report = buildMainOperationReportModel(
      gameState,
      monetization,
      mainOperationSeason,
    );
    const resourceLines = 3;
    const criticalGroups = Object.values(operationalResources.personnelGroups).filter(
      (g) => g.status === 'critical' || g.status === 'strained',
    ).length;
    return report.lines.length + resourceLines + criticalGroups;
  } catch {
    return 0;
  }
}

function countAdvisorLines(
  gameState: GameState,
  monetization: MonetizationState,
  mainOperationSeason: MainOperationSeasonState,
  advisorState: AdvisorState,
  microCount: number,
): number {
  let count = 0;
  const note = buildMainOperationAdvisorNote(
    gameState,
    monetization,
    mainOperationSeason,
    undefined,
    advisorState,
  );
  if (note) count += 1;
  if (advisorState.lastMissedSignal && !advisorState.lastMissedSignal.acknowledged) {
    count += 1;
  }
  count += microCount > 0 ? 1 : 0;
  return count;
}

function textHasForbiddenWords(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN_SIMULATION_WORDS.some((w) => {
    const re = new RegExp(`\\b${w}\\b`, 'i');
    return re.test(lower);
  });
}

function collectForbiddenFromState(sim: FullSeasonSimState): string[] {
  const parts: string[] = [];
  for (const e of sim.gameState.events) {
    parts.push(e.title, e.description);
    for (const d of e.decisions) {
      parts.push(d.title, d.description ?? '');
    }
  }
  return parts.filter((p) => textHasForbiddenWords(p));
}

export function buildSimulationInitialGameState(
  profile: FullSeasonPlayerProfile,
  mode: FullSeasonSimulationMode,
  seed = FULL_SEASON_SIM_DEFAULT_SEED,
): FullSeasonSimState {
  const bundle = createDay1Seed();
  let gameState = buildDevJumpPilotCompletedGameState(bundle.gameState);
  gameState = {
    ...gameState,
    city: { ...gameState.city, day: 7 },
    pilot: { ...gameState.pilot, currentPilotDay: 7 },
  };

  let monetization = createInitialMonetizationState();
  const effectiveMode: FullSeasonSimulationMode =
    profile === 'limited_player' ? 'limited' : mode;

  if (effectiveMode === 'full' && shouldOpenFullAccessForProfile(profile)) {
    monetization = mockPurchaseMainOperationPack(monetization, 8);
    gameState = applyFullAccessToGameState(gameState);
    if (gameState.pilot.postPilotOperation) {
      gameState = {
        ...gameState,
        pilot: {
          ...gameState.pilot,
          postPilotOperation: {
            ...gameState.pilot.postPilotOperation,
            postPilotDailyEventSet: undefined,
            operationDay: gameState.city.day,
          },
        },
      };
    }
  } else {
    monetization = selectLimitedContinue(monetization, 8);
    gameState = applyLimitedContinueToGameState(gameState);
    if (gameState.pilot.postPilotOperation) {
      gameState = {
        ...gameState,
        pilot: {
          ...gameState.pilot,
          postPilotOperation: {
            ...gameState.pilot.postPilotOperation,
            postPilotDailyEventSet: undefined,
            operationDay: gameState.city.day,
          },
        },
      };
    }
  }

  const day = gameState.city.day;
  let mainOperationSeason =
    effectiveMode === 'full'
      ? syncMainOperationSeasonAfterFullUnlock(gameState, monetization)
      : syncMainOperationSeasonAfterLimitedContinue(day);

  let crisisState = createInitialCrisisState();
  crisisState = {
    ...crisisState,
    cityCrisisScore: profile === 'crisis_heavy_player' ? 50 : 22,
    riskLevel: profile === 'crisis_heavy_player' ? 'elevated' : 'watch',
  };

  let operationalResources = createInitialOperationalResourcesState(day);
  if (profile === 'low_resource_player') {
    operationalResources = cloneJson(operationalResources);
    for (const g of Object.values(operationalResources.personnelGroups)) {
      g.workloadScore = Math.min(100, g.workloadScore + 18);
      g.fatigueScore = Math.min(100, g.fatigueScore + 12);
    }
  }

  let operationSignals = createInitialOperationSignalsState(day);
  if (profile === 'crisis_heavy_player') {
    operationSignals = {
      ...operationSignals,
      vehicles: { ...operationSignals.vehicles, score: 50, status: 'watch' },
      containers: { ...operationSignals.containers, score: 48, status: 'watch' },
      districts: { ...operationSignals.districts, score: 48, status: 'watch' },
      overall: { ...operationSignals.overall, score: 46, status: 'watch' },
    };
  }

  const authorityState = createInitialAuthorityState(day);
  return {
    gameState: {
      ...gameState,
      pilot: {
        ...gameState.pilot,
        authorityState,
        badgeState: createInitialBadgeState(day),
      },
      events: [],
      solvedEvents: [],
    },
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: [],
    decisionHistory: [],
    monetization,
    operationSignals,
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisState,
    crisisActionState: createInitialCrisisActionState(),
    operationalResources,
    mainOperationSeason,
    advisorState: createInitialAdvisorState(day),
    lastClosedDay: null,
    rng: createStrategyRng(profileSeed(seed, profile)),
    seed: profileSeed(seed, profile),
    categoriesByDay: [],
  };
}

function buildEngineInput(sim: FullSeasonSimState) {
  return buildMainOperationEngineInput({
    gameState: sim.gameState,
    monetization: sim.monetization,
    mainOperationSeason: sim.mainOperationSeason,
    operationSignals: sim.operationSignals,
    assignments: sim.assignments,
  });
}

function assignmentInput(sim: FullSeasonSimState): AssignmentEngineInput {
  const full = isFullMainOperationAccess(sim.gameState, sim.monetization);
  return {
    gameState: sim.gameState,
    operationSignals: sim.operationSignals,
    dailyOperationsPlan: sim.dailyOperationsPlan,
    assignments: sim.assignments,
    postPilotLightPhase: !full,
    isDay1Tutorial: false,
  };
}

function dailyPlanInput(sim: FullSeasonSimState): DailyPlanningEngineInput {
  const full = isFullMainOperationAccess(sim.gameState, sim.monetization);
  return {
    gameState: sim.gameState,
    operationSignals: sim.operationSignals,
    postPilotLightPhase: !full,
    isDay1Tutorial: false,
  };
}

function microInput(sim: FullSeasonSimState) {
  return {
    gameState: sim.gameState,
    monetization: sim.monetization,
    operationSignals: sim.operationSignals,
    crisisState: sim.crisisState,
    assignments: sim.assignments,
    advisorState: sim.advisorState,
    microDecisionState: sim.microDecisionState,
    mainOperationSeason: sim.mainOperationSeason,
    activeEvents: sim.gameState.events,
    day: sim.gameState.city.day,
    dailyOperationsPlan: sim.dailyOperationsPlan,
  };
}

function crisisActionInput(sim: FullSeasonSimState): CrisisActionEngineInput {
  return {
    gameState: sim.gameState,
    monetization: sim.monetization,
    crisisState: sim.crisisState,
    crisisActionState: sim.crisisActionState,
    operationSignals: sim.operationSignals,
    assignments: sim.assignments,
    mainOperationSeason: sim.mainOperationSeason,
    advisorState: sim.advisorState,
  };
}

function operationalInput(sim: FullSeasonSimState) {
  return {
    gameState: sim.gameState,
    monetization: sim.monetization,
    operationSignals: sim.operationSignals,
    dailyOperationsPlan: sim.dailyOperationsPlan,
    assignments: sim.assignments,
    microDecisionState: sim.microDecisionState,
    crisisActionState: sim.crisisActionState,
    operationalResources: sim.operationalResources,
  };
}

export function collectDayResult(
  simBefore: FullSeasonSimState,
  simIntraday: FullSeasonSimState,
  simAfterEod: FullSeasonSimState,
  profile: FullSeasonPlayerProfile,
  mode: FullSeasonSimulationMode,
  extraWarnings: string[] = [],
  metrics?: { generatedEventCount?: number },
): FullSeasonSimulationDayResult {
  const day = simBefore.gameState.city.day;
  const pressure = measureResourcePressure(simAfterEod.operationalResources);
  const resolvedToday = simIntraday.decisionHistory.filter((r) => r.day === day).length;
  const microToday = Object.values(simIntraday.microDecisionState.decisionsById).filter(
    (d) => d.day === day,
  );
  const resolvedMicro = microToday.filter((d) => d.status === 'resolved').length;

  return {
    day,
    mode,
    playerProfile: profile,
    eventCount: metrics?.generatedEventCount ?? simIntraday.gameState.events.length,
    resolvedEventCount: resolvedToday,
    microDecisionCount: microToday.length,
    resolvedMicroDecisionCount: resolvedMicro,
    crisisIncidentActive:
      simIntraday.crisisState.activeIncident?.status === 'active' ||
      simIntraday.crisisState.activeIncident?.status === 'forming' ||
      simAfterEod.crisisState.activeIncident?.status === 'active' ||
      simAfterEod.crisisState.activeIncident?.status === 'forming',
    crisisIncidentTriggered: simAfterEod.crisisState.lastIncidentDay === day,
    crisisActionSelected:
      Object.values(simIntraday.crisisActionState.actionsById).some(
        (a) => a.day === day && a.status === 'selected',
      ) ||
      Object.values(simAfterEod.crisisActionState.actionsById).some(
        (a) => a.day === day && a.status === 'selected',
      ),
    operationSignalsOverall: simIntraday.operationSignals.overall.score,
    resourcePressureAverage: pressure.average,
    highestResourcePressure: pressure.highest,
    seasonGoalAverageProgress: averageGoalProgress(simAfterEod.mainOperationSeason),
    reportLineCount: countReportLines(
      simIntraday.gameState,
      simIntraday.monetization,
      simAfterEod.mainOperationSeason,
      simIntraday.operationalResources,
    ),
    advisorLineCount: countAdvisorLines(
      simIntraday.gameState,
      simIntraday.monetization,
      simAfterEod.mainOperationSeason,
      simIntraday.advisorState,
      microToday.length,
    ),
    duplicateEventCount: 0,
    warnings: [...extraWarnings],
  };
}

export function simulateDailyPlanningStep(
  sim: FullSeasonSimState,
  profile: FullSeasonPlayerProfile,
): FullSeasonSimState {
  const plan = chooseDailyPlanForProfile(dailyPlanInput(sim), profile, sim.rng);
  const effects = calculateDailyPlanEffects(dailyPlanInput(sim), plan);
  const operationSignals = applyDailyPlanEffectsToOperationSignals(
    sim.operationSignals,
    effects,
  );
  return { ...sim, dailyOperationsPlan: plan, operationSignals };
}

export function simulateEventResolutionStep(
  sim: FullSeasonSimState,
  profile: FullSeasonPlayerProfile,
): FullSeasonSimState {
  let next = { ...sim };
  const day = next.gameState.city.day;
  const events = [...next.gameState.events];

  for (const event of events) {
    let assignments = next.assignments;
    const defaultAssignment = buildDefaultAssignmentForEvent(assignmentInput(next), event);
    assignments = {
      ...assignments,
      assignmentsByEventId: {
        ...assignments.assignmentsByEventId,
        [event.id]: defaultAssignment,
      },
    };
    const assignIn = assignmentInput({ ...next, assignments });
    const patch = chooseAssignmentForProfile(assignIn, event, profile, next.rng);
    const compat = calculateAssignmentCompatibility(assignIn, event, patch);
    assignments = confirmEventAssignment(assignments, event.id, patch, day);
    assignments = upsertEventAssignment(assignments, {
      ...assignments.assignmentsByEventId[event.id]!,
      compatibilityLabel: getCompatibilityLabel(compat.score),
      compatibilityScore: compat.score,
    });
    const confirmed = assignments.assignmentsByEventId[event.id]!;
    const assignEffects = calculateAssignmentEffects(
      assignmentInput({ ...next, assignments }),
      event,
      confirmed,
    );
    let operationSignals = applyAssignmentEffectsToOperationSignals(
      next.operationSignals,
      assignEffects,
    );
    next = { ...next, assignments, operationSignals };

    const decision = chooseEventDecisionOptionForProfile(
      event,
      profile,
      next.gameState.city.budget,
      next.rng,
    );
    if (!decision) continue;

    const engineState: EndDayState = {
      ...next.gameState,
      neighborhoods: next.neighborhoods,
      resources: next.resources,
      eventPool: next.eventPool,
      decisionHistory: next.decisionHistory,
      snapshots: [],
    };
    const result = applyDecision({
      state: engineState,
      eventId: event.id,
      decisionId: decision.id,
    });

    next = {
      ...next,
      gameState: {
        ...result.nextState,
        pilot: next.gameState.pilot,
      },
      decisionHistory: [...next.decisionHistory, result.decisionRecord],
      neighborhoods: result.nextState.neighborhoods ?? next.neighborhoods,
      resources: result.nextState.resources ?? next.resources,
      eventPool: next.eventPool,
    };
  }

  next.gameState = {
    ...next.gameState,
    events: [],
    solvedEvents: [
      ...next.gameState.solvedEvents,
      ...events.map((e) => ({ id: e.id, title: e.title, xpEarned: 0 })),
    ],
    featuredEventId: '',
  };

  return next;
}

export function simulateMicroDecisionStep(
  sim: FullSeasonSimState,
  profile: FullSeasonPlayerProfile,
): FullSeasonSimState {
  let next = { ...sim };
  let microDecisionState = refreshMicroDecisionsForDay(microInput(next));
  next = { ...next, microDecisionState };

  const candidates = generateMicroDecisionCandidates(microInput(next));
  for (const decision of candidates) {
    const optionId = chooseMicroDecisionOptionForProfile(
      next.gameState,
      decision,
      profile,
      next.rng,
    );
    if (!optionId) continue;
    microDecisionState = resolveMicroDecision(
      microDecisionState,
      decision.id,
      optionId,
      next.gameState.city.day,
    );
    const resolved = microDecisionState.decisionsById[decision.id];
    const option = decision.options.find((o) => o.id === optionId);
    if (resolved && option) {
      const effects = resolveMicroDecisionEffects(microInput(next), decision, option);
      next = {
        ...next,
        microDecisionState,
        operationSignals: applyMicroDecisionEffectsToOperationSignals(
          next.operationSignals,
          effects,
        ),
        crisisState: applyMicroDecisionEffectsToCrisisState(next.crisisState, effects),
      };
    } else {
      next = { ...next, microDecisionState };
    }
  }
  return next;
}

export function simulateCrisisActionStep(
  sim: FullSeasonSimState,
  profile: FullSeasonPlayerProfile,
): FullSeasonSimState {
  let next = { ...sim };
  let crisisActionState = refreshCrisisActionsForDay(crisisActionInput(next));
  const active = getActiveCrisisAction(crisisActionState);
  if (active?.status === 'available') {
    const actionType = chooseCrisisActionForProfile(
      crisisActionInput({ ...next, crisisActionState }),
      profile,
      next.rng,
    );
    crisisActionState = selectCrisisActionByType(
      crisisActionState,
      crisisActionInput({ ...next, crisisActionState }),
      actionType,
    );
  }
  const selected = Object.values(crisisActionState.actionsById).find(
    (a) => a.day === next.gameState.city.day && a.status === 'selected',
  );
  if (selected) {
    next = {
      ...next,
      crisisActionState,
      crisisState: applyCrisisActionEffectsToCrisisState(
        next.crisisState,
        selected.effects,
      ),
      operationSignals: applyCrisisActionEffectsToOperationSignals(
        next.operationSignals,
        selected.effects,
      ),
    };
  } else {
    next = { ...next, crisisActionState };
  }
  return next;
}

export function simulateEndOfDayStep(
  sim: FullSeasonSimState,
  dayEvents: EventCard[] = [],
): FullSeasonSimState {
  const closingDay = sim.gameState.city.day;
  if (sim.lastClosedDay === closingDay) {
    return sim;
  }

  let next = { ...sim };
  const assignmentEod = processAssignmentsEndOfDay({
    assignments: next.assignments,
    closingDay,
    engineInput: assignmentInput(next),
    events: dayEvents,
  });
  next = { ...next, assignments: assignmentEod.state };

  const engineIn = buildEngineInput(next);

  next.operationSignals = processOperationSignalsEndOfDay({
    gameState: next.gameState,
    operationSignals: next.operationSignals,
    decisionHistory: next.decisionHistory,
    isDay1Tutorial: false,
  });

  const microEod = processMicroDecisionsEndOfDay(microInput(next), closingDay);
  next = {
    ...next,
    microDecisionState: microEod.microDecisionState,
    operationSignals: microEod.operationSignals,
    crisisState: microEod.crisisState,
  };

  next.crisisState = processCrisisEndOfDay(
    {
      gameState: next.gameState,
      monetization: next.monetization,
      crisisState: next.crisisState,
      operationSignals: next.operationSignals,
      assignments: next.assignments,
      dailyOperationsPlan: next.dailyOperationsPlan,
      mainOperationSeason: next.mainOperationSeason,
      operationalResources: next.operationalResources,
    },
    closingDay,
  );

  next.operationalResources = processOperationalResourcesEndOfDay(
    operationalInput(next),
    closingDay,
  );

  next.mainOperationSeason = processMainOperationEndOfDay(
    {
      ...engineIn,
      operationSignals: next.operationSignals,
      assignments: next.assignments,
      crisisState: next.crisisState,
      operationalResources: next.operationalResources,
    },
    closingDay,
  );

  next.crisisState = deriveCrisisStateFromGameState({
    gameState: next.gameState,
    monetization: next.monetization,
    crisisState: next.crisisState,
    operationSignals: next.operationSignals,
    assignments: next.assignments,
    dailyOperationsPlan: next.dailyOperationsPlan,
    mainOperationSeason: next.mainOperationSeason,
    operationalResources: next.operationalResources,
  });

  next.operationSignals = deriveOperationSignalsFromGameState({
    gameState: next.gameState,
    operationSignals: next.operationSignals,
  });

  next.operationalResources = deriveOperationalResourcesFromGameState(operationalInput(next));

  const nextDay = closingDay + 1;
  next = {
    ...next,
    gameState: {
      ...next.gameState,
      city: { ...next.gameState.city, day: nextDay },
      events: [],
      featuredEventId: '',
    },
    operationSignals: refreshOperationSignalsForDay(
      next.operationSignals,
      nextDay,
    ),
    dailyOperationsPlan: createInitialDailyOperationsPlan(nextDay),
    lastClosedDay: closingDay,
  };

  return next;
}

export function simulateOneDay(
  sim: FullSeasonSimState,
  profile: FullSeasonPlayerProfile,
  mode: FullSeasonSimulationMode,
): { nextState: FullSeasonSimState; dayResult: FullSeasonSimulationDayResult } {
  const day = sim.gameState.city.day;
  const warnings: string[] = [];

  const eventGen = ensurePostPilotDailyEventsForDay({
    day,
    gameState: sim.gameState,
    postPilotOperation: sim.gameState.pilot.postPilotOperation!,
    authorityState: sim.gameState.pilot.authorityState,
    badgeState: sim.gameState.pilot.badgeState,
    mainOperationContext: {
      monetization: sim.monetization,
      mainOperationSeason: sim.mainOperationSeason,
      operationSignals: sim.operationSignals,
      assignments: sim.assignments,
      crisisState: sim.crisisState,
    },
  });

  const eventIds = eventGen.events.map((e) => e.id);
  const duplicateEventCount = eventIds.length - new Set(eventIds).size;
  if (duplicateEventCount > 0) {
    warnings.push(`Duplicate event ids on day ${day}`);
  }

  const categories = eventGen.events.map(
    (e) => e.category.split('/')[0]?.trim().toLowerCase() ?? 'unknown',
  );
  const categoriesByDay = [...sim.categoriesByDay, categories];

  const dailySet = eventGen.postPilotOperation?.postPilotDailyEventSet;
  let working: FullSeasonSimState = {
    ...sim,
    gameState: {
      ...sim.gameState,
      events: eventGen.events,
      featuredEventId: eventGen.featuredEventId ?? sim.gameState.featuredEventId,
      pilot: {
        ...sim.gameState.pilot,
        postPilotOperation: {
          ...(eventGen.postPilotOperation ?? sim.gameState.pilot.postPilotOperation),
          operationDay: day,
        },
      },
    },
    eventPool: eventGen.eventPool,
    categoriesByDay,
  };

  working = simulateDailyPlanningStep(working, profile);
  working = simulateEventResolutionStep(working, profile);
  working = simulateMicroDecisionStep(working, profile);
  if (mode === 'full') {
    working = {
      ...working,
      crisisState: deriveCrisisStateFromGameState({
        gameState: working.gameState,
        monetization: working.monetization,
        crisisState: working.crisisState,
        operationSignals: working.operationSignals,
        assignments: working.assignments,
        dailyOperationsPlan: working.dailyOperationsPlan,
        mainOperationSeason: working.mainOperationSeason,
        operationalResources: working.operationalResources,
      }),
    };
    working = simulateCrisisActionStep(working, profile);
  }

  const dayStart = sim;
  const beforeEod = { ...working };
  working = simulateEndOfDayStep(working, eventGen.events);

  const generatedEventCount =
    dailySet?.catalog.length ??
    dailySet?.allEventIds.length ??
    eventGen.events.length;

  const dayResult = collectDayResult(dayStart, beforeEod, working, profile, mode, warnings, {
    generatedEventCount,
  });
  dayResult.duplicateEventCount = duplicateEventCount;

  return { nextState: working, dayResult };
}

export function runFullSeasonSimulation(
  params: RunFullSeasonSimulationParams,
): FullSeasonSimulationRun {
  const length = params.length ?? FULL_SEASON_SIM_DEFAULT_LENGTH;
  const mode: FullSeasonSimulationMode =
    params.profile === 'limited_player' ? 'limited' : params.mode;
  const seed = params.seed ?? FULL_SEASON_SIM_DEFAULT_SEED;

  let sim = buildSimulationInitialGameState(params.profile, mode, seed);
  if (sim.gameState.city.day < FULL_SEASON_SIM_FIRST_DAY) {
    sim = {
      ...sim,
      gameState: {
        ...sim.gameState,
        city: { ...sim.gameState.city, day: FULL_SEASON_SIM_FIRST_DAY },
      },
      operationSignals: createInitialOperationSignalsState(FULL_SEASON_SIM_FIRST_DAY),
      dailyOperationsPlan: createInitialDailyOperationsPlan(FULL_SEASON_SIM_FIRST_DAY),
    };
  }

  const dayResults: FullSeasonSimulationDayResult[] = [];

  for (let i = 0; i < length; i += 1) {
    const { nextState, dayResult } = simulateOneDay(sim, params.profile, mode);
    sim = nextState;
    dayResults.push(dayResult);

    const forbidden = collectForbiddenFromState(sim);
    if (forbidden.length > 0) {
      dayResult.warnings.push('Forbidden copy detected in generated content');
    }
  }

  const aggregate = collectAggregateMetrics(params.profile, mode, dayResults);
  aggregate.warnings.push(
    ...detectCategorySpamWarnings(dayResults, sim.categoriesByDay),
  );
  if (mode === 'full') {
    const density = getMainOperationEventDensity(sim.gameState, sim.monetization);
    if (density.maxDailyEvents < 2) {
      aggregate.warnings.push('Full event density cap unexpectedly low');
    }
  }

  return {
    id: `sim-${params.profile}-${mode}-${length}-seed${seed}`,
    length: length as 14 | 21,
    mode,
    playerProfile: params.profile,
    dayResults,
    aggregate,
  };
}

/** Opsiyonel 21 günlük simülasyon — suite dışında tek profil için. */
export function runExtendedSeasonSimulation(
  profile: FullSeasonPlayerProfile = 'balanced_player',
  seed = FULL_SEASON_SIM_DEFAULT_SEED,
): FullSeasonSimulationRun {
  return runFullSeasonSimulation({
    profile,
    mode: profile === 'limited_player' ? 'limited' : 'full',
    length: 21,
    seed,
  });
}

export function testEndOfDayIdempotency(sim: FullSeasonSimState): boolean {
  const base = buildSimulationInitialGameState('balanced_player', 'full');
  const closingDay = FULL_SEASON_SIM_FIRST_DAY;
  const probe = simulateDailyPlanningStep(
    {
      ...base,
      gameState: { ...base.gameState, city: { ...base.gameState.city, day: closingDay } },
      operationSignals: createInitialOperationSignalsState(closingDay),
    },
    'balanced_player',
  );
  const input = operationalInput(probe);
  const once = processOperationalResourcesEndOfDay(input, closingDay);
  const twice = processOperationalResourcesEndOfDay(
    { ...input, operationalResources: once },
    closingDay,
  );
  if (once.lastProcessedDay !== closingDay || twice.lastProcessedDay !== closingDay) {
    return false;
  }
  const pOnce = once.personnelGroups.field_team?.workloadScore ?? 0;
  const pTwice = twice.personnelGroups.field_team?.workloadScore ?? 0;
  return pOnce === pTwice && once.dailySummary?.day === twice.dailySummary?.day;
}

export function runFullSeasonSimulationSuite(
  seed = FULL_SEASON_SIM_DEFAULT_SEED,
): FullSeasonSimulationAuditResult {
  const profiles: Array<{ profile: FullSeasonPlayerProfile; mode: FullSeasonSimulationMode }> = [
    { profile: 'strong_player', mode: 'full' },
    { profile: 'weak_player', mode: 'full' },
    { profile: 'balanced_player', mode: 'full' },
    { profile: 'random_player', mode: 'full' },
    { profile: 'crisis_heavy_player', mode: 'full' },
    { profile: 'low_resource_player', mode: 'full' },
    { profile: 'limited_player', mode: 'limited' },
  ];

  const runs = profiles.map(({ profile, mode }) =>
    runFullSeasonSimulation({ profile, mode, seed }),
  );

  const balancedFull = runs.find((r) => r.playerProfile === 'balanced_player')!;
  const limitedRun = runs.find((r) => r.playerProfile === 'limited_player')!;
  balancedFull.aggregate.limitedVsFullValueScore = calculateLimitedVsFullValueScore(
    limitedRun,
    balancedFull,
  );

  const comparison = compareSimulationRuns(runs);
  const findings = buildSimulationFindings(runs, comparison);
  const health = deriveAuditHealth(findings);

  const passCount = findings.filter((f) => f.severity === 'pass').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  const failCount = findings.filter((f) => f.severity === 'fail').length;

  return {
    health: failCount > 0 ? 'FAIL' : health,
    runs,
    comparison,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}
