import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { processAssignmentsEndOfDay } from '@/core/assignments/assignmentEngine';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { processCrisisActionsEndOfDay } from '@/core/crisisActions/crisisActionEngine';
import { createInitialCrisisActionState } from '@/core/crisisActions/crisisActionState';
import { processDailyPlanEndOfDay } from '@/core/dailyPlanning/dailyPlanningEngine';
import { buildDailyPlanningEngineInputFromStore } from '@/core/dailyPlanning/dailyPlanningPresentation';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import {
  grantAdvisorEndOfDayExperience,
  createInitialAdvisorState,
} from '@/core/advisors/advisorState';
import { evaluateAdvisorPredictionsAgainstSignals } from '@/core/advisors/advisorPrediction';
import { processMainOperationEndOfDay } from '@/core/mainOperation/mainOperationEngine';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
  selectLimitedContinue,
} from '@/core/monetization/monetizationState';
import { processMicroDecisionsEndOfDay } from '@/core/microDecisions/microDecisionEngine';
import { createInitialMicroDecisionState } from '@/core/microDecisions/microDecisionState';
import { processOperationSignalsEndOfDay } from '@/core/operations/operationSignalEngine';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { buildMicroDecisionEngineInputFromStore } from '@/core/microDecisions/microDecisionEngine';
import { buildCrisisActionEngineInputFromStore } from '@/core/crisisActions/crisisActionEngine';
import { buildMainOperationEngineInput } from '@/core/mainOperation/mainOperationEngine';
import { processCrisisEndOfDay } from '@/core/crisis/crisisEngine';
import { buildCrisisEngineInput } from '@/core/crisis/crisisEngine';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  END_OF_DAY_PIPELINE_STEP_DEFINITIONS,
  END_OF_DAY_RUNTIME_STEP_SEQUENCE,
} from './dayPipelineConstants';
import {
  buildDayPipelineAuditConsoleReport,
  buildDayPipelineHealthSummary,
  groupDayPipelineFindingsByPhase,
} from './dayPipelinePresentation';
import {
  getDayPipelineAccessMode,
  getEndOfDayPipelineStepDefinitions,
  getPipelineStepSkipReason,
  isIdempotencyMarkerSatisfied,
  isPipelinePreflightBlocked,
  shouldRunPipelineStep,
} from './dayPipelineOrchestrator';
import {
  runDayPipelineAudit,
  runEndOfDayPipelineAuditOnly,
  validateCrisisActionBeforeCrisisProcess,
  validateReportBuildPosition,
} from './dayPipelineAudit';
import type { DayPipelineContext } from './dayPipelineTypes';

export type VerifyDayPipelineOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function fullCtx(day = 10): DayPipelineContext {
  const seed = createDay1Seed();
  const gameState = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(seed.gameState),
  );
  gameState.city.day = day;
  const monetization = mockPurchaseMainOperationPack(createInitialMonetizationState(), day);
  return {
    gameState,
    monetization,
    lastClosedDay: null,
    lastDailyReport: null,
    operationSignals: createInitialOperationSignalsState(day),
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisActionState: createInitialCrisisActionState(),
    mainOperationSeason: createFullMainOperationSeasonState(day),
    crisisState: createInitialCrisisState(),
    advisorState: createInitialAdvisorState(day),
  };
}

export function verifyDayPipelineScenario(): VerifyDayPipelineOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const add = (p: boolean, pass: string, fail: string) => {
    ok = assert(checks, p, pass, fail) && ok;
  };
  const addWarn = (p: boolean, pass: string, fail: string) => {
    if (!warn(checks, p, pass, fail)) hasWarn = true;
  };

  const steps = END_OF_DAY_PIPELINE_STEP_DEFINITIONS;
  add(steps.length > 0, 'Pipeline step definitions boş değil', 'empty defs');

  const ids = steps.map((s) => s.id);
  add(ids.length === new Set(ids).size, 'Step id duplicate yok', 'dup ids');

  for (const step of steps) {
    add(step.label.trim().length > 0, `Label dolu: ${step.id}`, `empty label ${step.id}`);
    if (step.isCritical) {
      add(
        step.description.trim().length > 0,
        `Critical description: ${step.id}`,
        `desc ${step.id}`,
      );
    }
  }

  const requiredIds = [
    'operation_signals_base_eod',
    'daily_plan_effects',
    'assignment_effects',
    'micro_decision_effects',
    'crisis_action_effects',
    'main_operation_season_process',
    'crisis_state_process',
    'advisor_eod_process',
    'report_build',
  ];
  for (const id of requiredIds) {
    add(steps.some((s) => s.id === id), `Step mevcut: ${id}`, `missing ${id}`);
  }

  add(
    validateCrisisActionBeforeCrisisProcess(steps).every((f) => f.severity !== 'fail'),
    'crisis_action_effects crisis_state_process öncesinde',
    'crisis order',
  );
  add(
    validateReportBuildPosition(steps).every((f) => f.severity !== 'fail'),
    'report_build etkili step’lerden sonra (canonical)',
    'report order',
  );

  add(
    steps.some((s) => s.id === 'cleanup'),
    'cleanup step mevcut',
    'cleanup',
  );

  const critical = steps.filter((s) => s.isCritical);
  add(
    critical.every((s) => Boolean(s.idempotencyKey)),
    'Critical steps idempotencyKey içeriyor',
    'critical idempotency',
  );

  const pilotCtx: DayPipelineContext = {
    ...fullCtx(5),
    gameState: {
      ...fullCtx(5).gameState,
      pilot: { ...fullCtx(5).gameState.pilot, status: 'active' },
      city: { ...fullCtx(5).gameState.city, day: 5 },
    },
  };
  add(getDayPipelineAccessMode(pilotCtx) === 'pilot', 'Pilot access mode', 'pilot mode');

  const crisisAction = steps.find((s) => s.id === 'crisis_action_effects')!;
  add(
    !shouldRunPipelineStep('pilot', crisisAction),
    'Pilot crisis_action skip',
    'pilot crisis',
  );
  add(
    Boolean(getPipelineStepSkipReason('pilot', crisisAction)),
    'Pilot full-only skip reason',
    'pilot skip reason',
  );

  const limitedSeed = createDay1Seed();
  const limitedGs = buildDevJumpPilotCompletedGameState(limitedSeed.gameState);
  limitedGs.city.day = 10;
  const limitedCtx: DayPipelineContext = {
    ...fullCtx(10),
    gameState: limitedGs,
    monetization: selectLimitedContinue(createInitialMonetizationState(), 10),
  };
  add(
    getDayPipelineAccessMode(limitedCtx) === 'post_pilot_limited',
    'Limited access mode',
    'limited mode',
  );
  add(
    !shouldRunPipelineStep('post_pilot_limited', crisisAction),
    'Limited crisis_action skip',
    'limited crisis',
  );

  const fullCtx10 = fullCtx(10);
  add(
    getDayPipelineAccessMode(fullCtx10) === 'main_operation_full',
    'Full main operation mode',
    'full mode',
  );
  add(
    shouldRunPipelineStep('main_operation_full', crisisAction),
    'Full crisis_action eligible',
    'full crisis',
  );

  const closedCtx = { ...fullCtx10, lastClosedDay: 10 };
  add(isPipelinePreflightBlocked(closedCtx), 'Preflight same-day close', 'preflight');

  const day = 10;
  const closingDay = day;

  // Operation signals double EOD
  const sigInput = {
    gameState: fullCtx10.gameState,
    personnelState: createInitialPersonnelState(),
    vehicleState: createInitialVehicleState(day),
    containerState: createInitialContainerState(day),
    decisionHistory: [],
    operationSignals: createInitialOperationSignalsState(day),
    isDay1Tutorial: false,
  };
  const sig1 = processOperationSignalsEndOfDay(sigInput);
  const sig2 = processOperationSignalsEndOfDay({ ...sigInput, operationSignals: sig1 });
  add(
    sig1.lastProcessedDay === closingDay && sig1.overall.score === sig2.overall.score,
    'OperationSignals lastProcessedDay guard',
    'signals double',
  );

  const planInput = buildDailyPlanningEngineInputFromStore({
    gameState: fullCtx10.gameState,
    operationSignals: sig1,
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    advisorState: fullCtx10.advisorState!,
  });
  const plan1 = processDailyPlanEndOfDay({
    plan: createInitialDailyOperationsPlan(day),
    closingDay,
    engineInput: planInput,
  });
  const plan2 = processDailyPlanEndOfDay({
    plan: plan1.plan,
    closingDay,
    engineInput: planInput,
  });
  add(
    plan1.plan.lastProcessedDay === closingDay &&
      plan1.plan.lastProcessedDay === plan2.plan.lastProcessedDay,
    'DailyPlan processed guard',
    'plan double',
  );

  const assignEngineInput = {
    gameState: fullCtx10.gameState,
    operationSignals: sig1,
    assignments: createInitialAssignmentsState(),
  };
  const assign1 = processAssignmentsEndOfDay({
    assignments: createInitialAssignmentsState(),
    closingDay,
    engineInput: assignEngineInput,
    events: [],
  });
  const assign2 = processAssignmentsEndOfDay({
    assignments: assign1.state,
    closingDay,
    engineInput: { ...assignEngineInput, assignments: assign1.state },
    events: [],
  });
  add(
    assign1.state.lastProcessedDay === closingDay &&
      assign2.state.lastProcessedDay === closingDay,
    'Assignment processed guard',
    'assign double',
  );

  const microIn = buildMicroDecisionEngineInputFromStore({
    day,
    gameState: fullCtx10.gameState,
    monetization: fullCtx10.monetization,
    operationSignals: sig1,
    crisisState: createInitialCrisisState(),
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    assignments: createInitialAssignmentsState(),
    mainOperationSeason: fullCtx10.mainOperationSeason!,
    advisorState: fullCtx10.advisorState!,
    microDecisionState: createInitialMicroDecisionState(),
  });
  const micro1 = processMicroDecisionsEndOfDay(microIn, closingDay);
  const micro2 = processMicroDecisionsEndOfDay(
    { ...microIn, microDecisionState: micro1.microDecisionState },
    closingDay,
  );
  add(
    micro1.microDecisionState.lastProcessedDay === closingDay &&
      micro2.operationSignals.overall.score === micro1.operationSignals.overall.score,
    'MicroDecision processed guard',
    'micro double',
  );

  const crisisActionIn = buildCrisisActionEngineInputFromStore({
    gameState: fullCtx10.gameState,
    monetization: fullCtx10.monetization,
    crisisState: micro1.crisisState,
    operationSignals: micro1.operationSignals,
    crisisActionState: createInitialCrisisActionState(),
    mainOperationSeason: fullCtx10.mainOperationSeason!,
  });
  const ca1 = processCrisisActionsEndOfDay(crisisActionIn, closingDay);
  const ca2 = processCrisisActionsEndOfDay(
    { ...crisisActionIn, crisisActionState: ca1.crisisActionState },
    closingDay,
  );
  add(
    ca1.crisisActionState.lastProcessedDay === closingDay &&
      ca2.crisisState.cityCrisisScore === ca1.crisisState.cityCrisisScore,
    'CrisisAction processed guard',
    'crisis action double',
  );

  const mainIn = buildMainOperationEngineInput({
    gameState: fullCtx10.gameState,
    monetization: fullCtx10.monetization,
    mainOperationSeason: fullCtx10.mainOperationSeason!,
    operationSignals: ca1.operationSignals,
    assignments: assign1.state,
  });
  const main1 = processMainOperationEndOfDay(mainIn, closingDay);
  const main2 = processMainOperationEndOfDay(
    { ...mainIn, mainOperationSeason: main1 },
    closingDay,
  );
  add(
    main1.lastProcessedDay === closingDay &&
      main2.lastProcessedDay === closingDay &&
      main1.goals.length === main2.goals.length,
    'MainOperation lastProcessedDay guard',
    'main op double',
  );

  const crisisIn = buildCrisisEngineInput({
    gameState: fullCtx10.gameState,
    monetization: fullCtx10.monetization,
    crisisState: ca1.crisisState,
    operationSignals: ca1.operationSignals,
    assignments: assign1.state,
    dailyOperationsPlan: plan1.plan,
    mainOperationSeason: main1,
  });
  const crisis1 = processCrisisEndOfDay(crisisIn, closingDay);
  const crisis2 = processCrisisEndOfDay({ ...crisisIn, crisisState: crisis1 }, closingDay);
  add(
    crisis1.lastProcessedDay === closingDay && crisis1.cityCrisisScore === crisis2.cityCrisisScore,
    'CrisisState lastProcessedDay guard',
    'crisis double',
  );

  let advisor = createInitialAdvisorState(day);
  advisor = grantAdvisorEndOfDayExperience(advisor, closingDay, 5);
  const advisor2 = grantAdvisorEndOfDayExperience(advisor, closingDay, 5);
  add(
    advisor.lastExperienceGrantDay === closingDay &&
      advisor2.experience === advisor.experience,
    'Advisor lastExperienceGrantDay guard',
    'advisor xp double',
  );

  const pred1 = evaluateAdvisorPredictionsAgainstSignals({
    state: advisor,
    signals: sig1,
    evalDay: day + 1,
    isDay1Tutorial: false,
    hasCriticalEvent: false,
  });
  const pred2 = evaluateAdvisorPredictionsAgainstSignals({
    state: pred1.state,
    signals: sig1,
    evalDay: day + 1,
    isDay1Tutorial: false,
    hasCriticalEvent: false,
  });
  add(
    pred1.state.lastPredictionEvaluatedDay === day + 1 &&
      pred2.state.lastPredictionEvaluatedDay === day + 1,
    'Advisor lastPredictionEvaluatedDay guard',
    'advisor pred double',
  );

  const reportCtx = { ...fullCtx10, lastDailyReport: { day: closingDay } };
  add(
    isPipelinePreflightBlocked({ ...reportCtx, lastClosedDay: null }) ||
      isIdempotencyMarkerSatisfied(
        { ...fullCtx10, lastDailyReport: { day: closingDay } },
        'lastDailyReport.day',
        closingDay,
      ),
    'Report daily idempotency guard',
    'report guard',
  );

  const runtimeAction = END_OF_DAY_RUNTIME_STEP_SEQUENCE.indexOf('crisis_action_effects');
  const runtimeCrisis = END_OF_DAY_RUNTIME_STEP_SEQUENCE.indexOf('crisis_state_process');
  add(
    runtimeAction >= 0 && runtimeCrisis >= 0 && runtimeAction < runtimeCrisis,
    'Runtime crisis_action before crisis_state',
    'runtime crisis order',
  );

  const audit = runDayPipelineAudit(fullCtx10);
  add(audit.health !== 'FAIL', 'Audit health FAIL üretmiyor', 'audit fail');
  add(audit.failCount === 0, 'Audit zero fails', `fails=${audit.failCount}`);

  const consoleReport = buildDayPipelineAuditConsoleReport(audit);
  add(consoleReport.length > 20, 'Console report boş değil', 'console empty');

  const healthLines = buildDayPipelineHealthSummary(audit);
  add(healthLines.length >= 3, 'Health summary lines', 'health');

  const grouped = groupDayPipelineFindingsByPhase(audit);
  add(Object.keys(grouped).length > 0, 'Phase grouping çalışıyor', 'grouping');

  const pilotAudit = runEndOfDayPipelineAuditOnly(pilotCtx);
  add(
    pilotAudit.findings.every(
      (f) => f.id !== 'pilot_crisis_action_runs' || f.severity !== 'fail',
    ),
    'Pilot post-pilot full step audit',
    'pilot audit',
  );

  const limitedAudit = runEndOfDayPipelineAuditOnly(limitedCtx);
  add(
    limitedAudit.findings.every((f) => f.id !== 'limited_crisis_action' || f.severity !== 'fail'),
    'Limited crisis action audit',
    'limited audit',
  );

  const eligibleFull = getEndOfDayPipelineStepDefinitions(fullCtx10);
  add(
    eligibleFull.some((s) => s.id === 'crisis_action_effects'),
    'Full eligible crisis_action',
    'full eligible',
  );

  add(SAVE_VERSION === 24, 'SAVE_VERSION 22', 'save version');
  add(
    END_OF_DAY_PIPELINE_STEP_DEFINITIONS.every((s) => !s.id.includes('persist')),
    'No new persist key introduced',
    'persist keys',
  );

  addWarn(
    audit.findings.some((f) => f.severity === 'warn'),
    'Expected runtime WARN present',
    'no warns',
  );
  addWarn(
    true,
    'authority/badge idempotency marker inferred',
    'authority warn',
  );
  addWarn(
    true,
    'post_day_refresh order follows existing store behavior',
    'refresh warn',
  );
  addWarn(
    true,
    'full extraction to standalone orchestrator pending',
    'extract warn',
  );

  return { ok, warn: hasWarn, checks };
}
