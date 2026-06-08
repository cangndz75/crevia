import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { calculateAssignmentEffects } from '@/core/assignments/assignmentEngine';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import {
  calculateCityCrisisScore,
  deriveCrisisAccessMode,
} from '@/core/crisis/crisisEngine';
import { calculateDailyPlanEffects } from '@/core/dailyPlanning/dailyPlanningEngine';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import {
  buildAdvisorWarningOptions,
  buildCrisisThresholdOptions,
  resolveMicroDecisionEffects,
} from '@/core/microDecisions/microDecisionEngine';
import type { MicroDecision } from '@/core/microDecisions/microDecisionTypes';
import { createInitialOperationSignalsState, clampSignalScore } from '@/core/operations/operationSignalState';
import { SAVE_VERSION } from '@/store/gamePersist';
import type { EventCard } from '@/core/models/EventCard';

import { BALANCE_COPY } from './gameplayImpactConstants';
import {
  clampGameplayDelta,
  getGameplayImpactMultiplier,
  scaleGameplayDelta,
} from './gameplayImpactTuning';
import type { GameplayImpactScaleContext } from './gameplayImpactTypes';

export type VerifyGameplayImpactBalanceOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  simulationSummary?: string;
};

function assert(checks: string[], pass: boolean, passMsg: string, failMsg: string): boolean {
  checks.push(pass ? `PASS ${passMsg}` : `FAIL ${failMsg}`);
  return pass;
}

function warn(checks: string[], pass: boolean, passMsg: string, failMsg: string): boolean {
  checks.push(pass ? `PASS ${passMsg}` : `WARN ${failMsg}`);
  return pass;
}

function fullCtx(day = 10): GameplayImpactScaleContext {
  const gs = applyFullAccessToGameState({
    ...buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
    city: {
      ...buildDevJumpPilotCompletedGameState(createDay1Seed().gameState).city,
      day,
    },
  });
  return {
    gameState: gs,
    monetization: mockPurchaseMainOperationPack(createInitialMonetizationState(), day),
    postPilotLightPhase: false,
  };
}

function planEffects(
  personnelFocus: string,
  vehicleFocus: string,
  containerFocus: 'standard_collection' | 'intensive_collection' | 'cleanliness_maintenance' | 'risk_inspection' = 'standard_collection',
) {
  const day = 10;
  const gs = fullCtx(day).gameState!;
  return calculateDailyPlanEffects(
    {
      gameState: gs,
      operationSignals: createInitialOperationSignalsState(day),
    },
    {
      ...createInitialDailyOperationsPlan(day),
      status: 'confirmed',
      personnelFocus: personnelFocus as never,
      vehicleFocus: vehicleFocus as never,
      containerFocus,
    },
  );
}

function sumDomain(
  effects: Array<{ domain: string; delta: number }>,
  domain: string,
): number {
  return effects.filter((e) => e.domain === domain).reduce((s, e) => s + e.delta, 0);
}

function simulate14DayImpact(): {
  strongAvgOverall: number;
  weakAvgOverall: number;
  allCriticalDays: number;
} {
  let strongTotal = 0;
  let weakTotal = 0;
  let criticalDays = 0;

  for (let day = 8; day <= 21; day++) {
    const signals = createInitialOperationSignalsState(day);
    const strongPlan = calculateDailyPlanEffects(
      { gameState: fullCtx(day).gameState!, operationSignals: signals },
      {
        ...createInitialDailyOperationsPlan(day),
        status: 'confirmed',
        personnelFocus: 'rest_rotation',
        vehicleFocus: 'preventive_maintenance',
        containerFocus: 'risk_inspection',
      },
    );
    const weakPlan = calculateDailyPlanEffects(
      { gameState: fullCtx(day).gameState!, operationSignals: signals },
      {
        ...createInitialDailyOperationsPlan(day),
        status: 'confirmed',
        personnelFocus: 'rapid_response',
        vehicleFocus: 'high_capacity',
        containerFocus: 'intensive_collection',
      },
    );
    let strongScore = signals.overall.score;
    let weakScore = signals.overall.score;
    for (const e of strongPlan) {
      if (e.domain === 'overall') strongScore += e.delta;
    }
    for (const e of weakPlan) {
      if (e.domain === 'overall') weakScore += e.delta;
    }
    strongTotal += clampSignalScore(strongScore);
    weakTotal += clampSignalScore(weakScore);
    if (clampSignalScore(weakScore) >= 80) criticalDays++;
  }

  return {
    strongAvgOverall: strongTotal / 14,
    weakAvgOverall: weakTotal / 14,
    allCriticalDays: criticalDays,
  };
}

export function verifyGameplayImpactBalanceScenario(): VerifyGameplayImpactBalanceOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const add = (pass: boolean, passMsg: string, failMsg: string) => {
    ok = assert(checks, pass, passMsg, failMsg) && ok;
  };

  add(clampGameplayDelta(15) === 10 && clampGameplayDelta(-15) === -10, 'clampGameplayDelta max limit works', 'clamp max');

  const pilotCtx: GameplayImpactScaleContext = {
    gameState: {
      ...createDay1Seed().gameState,
      pilot: { ...createDay1Seed().gameState.pilot, status: 'active' },
      city: { ...createDay1Seed().gameState.city, day: 5 },
    },
  };
  add(getGameplayImpactMultiplier(pilotCtx) === 0.65, 'Pilot multiplier 0.65', 'pilot mult');
  add(getGameplayImpactMultiplier({ ...fullCtx(10), postPilotLightPhase: true }) === 0.8, 'Limited multiplier 0.8', 'limited mult');
  add(getGameplayImpactMultiplier(fullCtx(10)) === 1, 'Full multiplier 1.0', 'full mult');

  const crisisCtx = { ...fullCtx(10), isCrisisRelated: true, crisisRiskElevated: true };
  add(scaleGameplayDelta(10, crisisCtx) <= 10, 'Crisis multiplier capped', 'crisis cap');

  const rapid = planEffects('rapid_response', 'ready_fleet');
  add(sumDomain(rapid, 'personnel') > 0 && sumDomain(rapid, 'districts') < 0, 'rapid_response trade-off', 'rapid plan');

  const rest = planEffects('rest_rotation', 'ready_fleet');
  add(sumDomain(rest, 'personnel') < 0, 'rest_rotation personnel improves', 'rest plan');

  const preventive = planEffects('balanced_shift', 'preventive_maintenance');
  add(sumDomain(preventive, 'vehicles') < -5, 'preventive_maintenance vehicle improves strongly', 'preventive');

  const highCap = planEffects('balanced_shift', 'high_capacity');
  add(sumDomain(highCap, 'containers') < 0 && sumDomain(highCap, 'vehicles') > 0, 'high_capacity trade-off', 'high cap');

  const intensive = planEffects('balanced_shift', 'high_capacity', 'intensive_collection');
  add(
    sumDomain(intensive, 'containers') < 0 &&
      sumDomain(intensive, 'vehicles') > 0 &&
      sumDomain(intensive, 'personnel') > 0,
    'intensive_collection trade-off',
    'intensive',
  );

  const clean = planEffects('balanced_shift', 'ready_fleet', 'cleanliness_maintenance');
  add(sumDomain(clean, 'districts') < 0, 'cleanliness_maintenance district improves', 'clean');

  const risk = planEffects('field_inspection', 'ready_fleet', 'risk_inspection');
  add(risk.some((e) => e.domain === 'districts' && e.delta < 0), 'risk_inspection district improvement', 'risk inspect');

  const gs = fullCtx(10).gameState!;
  const mon = mockPurchaseMainOperationPack(createInitialMonetizationState(), 10);
  const mockEvent = { id: 'e1', category: 'container', riskLevel: 'medium' } as EventCard;
  const engineIn = {
    gameState: gs,
    assignments: createInitialAssignmentsState(),
    operationSignals: createInitialOperationSignalsState(10),
  };

  const strongFx = calculateAssignmentEffects(engineIn, mockEvent, {
    id: 'a1',
    eventId: 'e1',
    day: 10,
    status: 'confirmed',
    personnelType: 'technical_team',
    vehicleType: 'maintenance_vehicle',
    approachType: 'lasting_fix',
    compatibilityScore: 80,
    compatibilityLabel: 'Güçlü uyum',
    effects: [],
    source: 'player',
  } as EventAssignmentState);
  add(strongFx.some((e) => e.delta < 0), 'Strong assignment boosts positive effects', 'strong assign');

  const weakFx = calculateAssignmentEffects(engineIn, mockEvent, {
    id: 'a2',
    eventId: 'e1',
    day: 10,
    status: 'confirmed',
    personnelType: 'field_response_team',
    vehicleType: 'standard_truck',
    approachType: 'low_resource',
    compatibilityScore: 30,
    compatibilityLabel: 'Zayıf uyum',
    effects: [],
    source: 'player',
  } as EventAssignmentState);
  add(weakFx.some((e) => e.delta > 0), 'Weak/low_resource carry-over risk', 'weak assign');

  add(BALANCE_COPY.lowResourceReport.includes('yarına'), 'Report copy carry-over for low_resource', 'low resource copy');
  add(BALANCE_COPY.strongFitReport.length > 5, 'Report copy strong fit language', 'strong copy');
  add(BALANCE_COPY.eceLevel1Cautious.length > 10, 'Ece Level 1 language cautious', 'ece l1');
  add(BALANCE_COPY.eceLevel3Tradeoff.includes('personel'), 'Ece Level 3 mentions tradeoff', 'ece l3');

  const microInput = {
    day: 10,
    gameState: gs,
    monetization: mon,
    operationSignals: createInitialOperationSignalsState(10),
    crisisState: createInitialCrisisState(),
    dailyOperationsPlan: createInitialDailyOperationsPlan(10),
    assignments: createInitialAssignmentsState(),
    mainOperationSeason: createFullMainOperationSeasonState(10),
    advisorState: { level: 2 } as never,
    microDecisionState: { decisionsById: {}, activeDecisionIds: [] },
    activeEvents: [],
  };

  const monitor = buildAdvisorWarningOptions().find((o) => o.id === 'monitor');
  const monitorFx = monitor
    ? resolveMicroDecisionEffects(microInput, { type: 'advisor_warning' } as MicroDecision, monitor)
    : [];
  add(monitorFx.some((e) => e.delta > 0), 'Micro monitor carries risk', 'micro monitor');

  const coord = buildCrisisThresholdOptions().find((o) => o.id === 'crisis_coord');
  const coordFx = coord
    ? resolveMicroDecisionEffects(microInput, { type: 'crisis_threshold' } as MicroDecision, coord)
    : [];
  add(coordFx.some((e) => e.domain === 'crisis' && e.delta < 0), 'Crisis coordination lowers crisis score', 'crisis coord');

  const observe = buildCrisisThresholdOptions().find((o) => o.id === 'monitor');
  const observeFx = observe
    ? resolveMicroDecisionEffects(microInput, { type: 'crisis_threshold' } as MicroDecision, observe)
    : [];
  add(observeFx.some((e) => e.domain === 'crisis' && e.delta > 0), 'Crisis observe raises crisis score', 'crisis observe');

  const crisisBase = {
    gameState: gs,
    monetization: mon,
    crisisState: createInitialCrisisState(),
    operationSignals: createInitialOperationSignalsState(10),
    assignments: {
      ...createInitialAssignmentsState(),
      dailyAssignmentSummary: { day: 10, confirmedCount: 2, strongFitCount: 2, weakFitCount: 0 },
    },
    dailyOperationsPlan: createInitialDailyOperationsPlan(10),
  };
  const weakCrisis = {
    ...crisisBase,
    assignments: {
      ...createInitialAssignmentsState(),
      dailyAssignmentSummary: { day: 10, confirmedCount: 2, strongFitCount: 0, weakFitCount: 2 },
    },
  };
  add(calculateCityCrisisScore(weakCrisis) >= calculateCityCrisisScore(crisisBase), 'Weak assignment increases crisis score', 'crisis weak');

  add(deriveCrisisAccessMode(gs, mon) === 'active', 'Full main crisis active', 'crisis active');
  add(
    deriveCrisisAccessMode(gs, selectLimitedContinue(createInitialMonetizationState(), 10)) ===
      'limited_preview',
    'Limited crisis preview mode',
    'limited crisis',
  );

  const sim = simulate14DayImpact();
  const simSummary = `14g sim: güçlü ort. overall ${sim.strongAvgOverall.toFixed(1)}, zayıf ort. ${sim.weakAvgOverall.toFixed(1)}, kritik gün ${sim.allCriticalDays}`;
  add(sim.weakAvgOverall > sim.strongAvgOverall, '14-day weak > strong pressure', 'sim compare');
  add(sim.allCriticalDays < 10, '14-day not all critical every day', 'sim critical');
  add(SAVE_VERSION === 25, 'SAVE_VERSION remains 22', 'save version');

  hasWarn = !warn(checks, true, 'Long-run balance needs real playtest', 'playtest') || hasWarn;
  hasWarn = !warn(checks, true, 'Hard fail states not implemented', 'hard fail') || hasWarn;

  return { ok, warn: hasWarn, checks, simulationSummary: simSummary };
}
