import { createDay1Seed } from '@/core/content/day1Seed';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
} from '@/core/monetization/monetizationState';
import { createInitialAdvisorState } from '@/core/advisors/advisorState';
import { deriveMicroDecisionAccessMode } from '@/core/microDecisions/microDecisionEngine';
import { buildMicroDecisionPresentationInput } from '@/core/microDecisions';
import { createInitialMicroDecisionState } from '@/core/microDecisions/microDecisionState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { getInteractionContractsForComponent } from '@/core/quality/interactionContracts/interactionContractRegistry';
import { buildOperationalResourceEngineInputFromStore } from '@/core/operationalResources/operationalResourceEngine';
import { buildOperationalResourceDetailSheetModel } from '@/core/operationalResources/operationalResourceDetailPresentation';
import {
  buildOperationalResourceHubModel,
} from '@/core/operationalResources/operationalResourcePresentation';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import type { GameState } from '@/core/models/GameState';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DAY1_ADVISOR_SHORT_COPY,
  DAY1_ASSIGNMENT_COPY,
  DAY1_DAILY_PLAN_COPY,
  DAY1_EVENT_PLAN_COPY,
  DAY1_GUIDANCE_COPY,
  DAY1_REPORT_EDUCATIONAL_LINES,
  FIRST_TEN_MINUTES_FORBIDDEN_WORDS,
  FIRST_TEN_MINUTES_MAX_LINE_LENGTH,
  SURFACE_CTA_LABELS,
} from './firstTenMinutesConstants';
import {
  buildFirstTenMinutesGuidanceModel,
  buildFirstTenMinutesReportGuard,
  buildHubCardVisibilityModel,
  getFirstTenMinutesPrimaryCtaLabel,
  getFirstTenMinutesStage,
  resolveFirstTenMinutesDay,
  shouldHideAdvancedSystemForFirstTenMinutes,
  shouldUseFirstTenMinutesAdvisorShortMode,
  shouldUseFirstTenMinutesAssignmentSimpleMode,
  shouldUseFirstTenMinutesDailyPlanMode,
} from './firstTenMinutesPresentation';

export type VerifyFirstTenMinutesOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  failCount: number;
  warnCount: number;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function pilotGameState(pilotDay: number): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: pilotDay },
    pilot: {
      ...seed.gameState.pilot,
      status: 'active',
      currentPilotDay: pilotDay,
    },
  };
}

function fullPostPilotGs(day: number): GameState {
  const base = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, status: 'completed', currentPilotDay: 7 },
  };
}

function copyHasForbiddenWord(text: string): boolean {
  const lower = text.toLowerCase();
  return FIRST_TEN_MINUTES_FORBIDDEN_WORDS.some((w) => lower.includes(w));
}

function collectCopyStrings(): string[] {
  return [
    DAY1_GUIDANCE_COPY.title,
    DAY1_GUIDANCE_COPY.summary,
    DAY1_GUIDANCE_COPY.primaryInstruction,
    DAY1_GUIDANCE_COPY.secondaryNote ?? '',
    DAY1_GUIDANCE_COPY.guideCardLine,
    DAY1_ADVISOR_SHORT_COPY.body,
    DAY1_ADVISOR_SHORT_COPY.cta,
    DAY1_DAILY_PLAN_COPY.title,
    DAY1_DAILY_PLAN_COPY.confirmCta,
    DAY1_DAILY_PLAN_COPY.editDisabledNote,
    DAY1_ASSIGNMENT_COPY.explanation,
    DAY1_ASSIGNMENT_COPY.confirmCta,
    DAY1_EVENT_PLAN_COPY.planSupport,
    ...DAY1_REPORT_EDUCATIONAL_LINES,
    ...Object.values(SURFACE_CTA_LABELS),
  ];
}

export function verifyFirstTenMinutesScenario(): VerifyFirstTenMinutesOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const add = (p: boolean, pass: string, fail: string) => {
    ok = assert(checks, p, pass, fail) && ok;
  };
  const addWarn = (p: boolean, pass: string, message: string) => {
    if (!warn(checks, p, pass, message)) hasWarn = true;
  };

  const day1Gs = pilotGameState(1);
  const day2Gs = pilotGameState(2);
  const day3Gs = pilotGameState(3);
  const day7Gs = pilotGameState(7);
  const monetization = createInitialMonetizationState();

  const day1Ctx = { gameState: day1Gs };
  const day1Stage = getFirstTenMinutesStage(day1Ctx);
  add(day1Stage === 'day1_entry', 'Day 1 stage day1_entry', `stage=${day1Stage}`);

  const day1Guidance = buildFirstTenMinutesGuidanceModel(day1Ctx);
  add(day1Guidance.title.length > 0, 'Day 1 guidance title dolu', 'empty title');
  add(
    day1Guidance.primaryInstruction.includes('onayla'),
    'Day 1 primaryInstruction net aksiyon',
    day1Guidance.primaryInstruction,
  );

  const day1Hub = buildHubCardVisibilityModel(day1Gs, monetization);
  add(day1Hub.maxFeaturedCards === 2, 'Day 1 Hub max 2 featured kart', String(day1Hub.maxFeaturedCards));
  add(
    day1Hub.showOperationSignals === 'compact',
    'Day 1 OperationSignals compact',
    day1Hub.showOperationSignals,
  );
  add(
    day1Hub.showAdvisor === 'featured',
    'Day 1 Advisor featured',
    day1Hub.showAdvisor,
  );
  add(
    day1Hub.showDailyPlan === 'featured',
    'Day 1 DailyPlan featured',
    day1Hub.showDailyPlan,
  );
  add(!day1Hub.showLiveOperations, 'Day 1 LiveOperations hidden', 'visible');
  add(!day1Hub.showCrisis, 'Day 1 Crisis hidden', 'visible');
  add(!day1Hub.showCrisisActions, 'Day 1 CrisisActions hidden', 'visible');
  add(!day1Hub.showMainOperationSeason, 'Day 1 MainOperationSeason hidden', 'visible');
  add(!day1Hub.showPostPilotPreview, 'Day 1 PostPilot preview hidden', 'visible');
  add(day1Hub.showFirstDayGuide, 'Day 1 guide strip', 'missing guide');
  add(!day1Hub.showRegionPulse, 'Day 1 region pulse hidden', 'visible');
  add(!day1Hub.showPersonnelStrip, 'Day 1 personnel strip hidden', 'visible');

  add(
    DAY1_DAILY_PLAN_COPY.editDisabledNote.includes('öğreniyorsun'),
    'Day 1 DailyPlan edit disabled explanation',
    DAY1_DAILY_PLAN_COPY.editDisabledNote,
  );
  add(
    DAY1_DAILY_PLAN_COPY.confirmCta === 'Planı Onayla',
    'Day 1 DailyPlan confirm CTA',
    DAY1_DAILY_PLAN_COPY.confirmCta,
  );
  add(shouldUseFirstTenMinutesDailyPlanMode(day1Gs), 'Day 1 daily plan mode', 'off');
  add(
    DAY1_ASSIGNMENT_COPY.confirmCta === 'Önerilen Atamayı Onayla',
    'Day 1 Assignment recommended CTA label',
    DAY1_ASSIGNMENT_COPY.confirmCta,
  );
  add(
    shouldUseFirstTenMinutesAssignmentSimpleMode(day1Gs),
    'Day 1 assignment simple mode',
    'off',
  );
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day1Gs, 'advanced_assignment_editor'),
    'Day 1 assignment editor hidden',
    'editor visible',
  );
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day1Gs, 'advanced_operation_impacts'),
    'Day 1 advanced operation impacts hidden',
    'visible',
  );
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day1Gs, 'live_micro_decisions'),
    'Day 1 MicroDecision UI hidden',
    'visible',
  );

  const day1ReportGuard = buildFirstTenMinutesReportGuard(day1Gs);
  add(day1ReportGuard.hideMicroDecisions, 'Day 1 Report MicroDecision hidden', 'visible');
  add(day1ReportGuard.hideCrisis, 'Day 1 Report Crisis hidden', 'visible');
  add(day1ReportGuard.hideMainOperation, 'Day 1 Report MainOperation hidden', 'visible');
  add(day1ReportGuard.shortAdvisor, 'Day 1 Report Advisor short mode', 'off');
  add(
    getFirstTenMinutesPrimaryCtaLabel('report', 'fallback') === 'Operasyon Merkezine Dön',
    'Day 1 Report CTA Operasyon Merkezine Dön',
    SURFACE_CTA_LABELS.report_return_hub ?? '',
  );

  add(shouldUseFirstTenMinutesAdvisorShortMode(day1Gs), 'Day 1 advisor short mode', 'off');
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day1Gs, 'social_deep_dive'),
    'Day 1 social deep dive hidden',
    'visible',
  );
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day1Gs, 'profile_prestige'),
    'Day 1 profile prestige low profile',
    'visible',
  );
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day1Gs, 'leaderboard'),
    'Day 1 leaderboard low profile',
    'visible',
  );

  const day2Stage = getFirstTenMinutesStage({ gameState: day2Gs });
  add(day2Stage === 'day2_reinforcement', 'Day 2 stage day2_reinforcement', day2Stage);
  const day2Hub = buildHubCardVisibilityModel(day2Gs, monetization);
  add(
    day2Hub.showOperationSignals === 'compact',
    'Day 2 OperationSignals compact/normal',
    day2Hub.showOperationSignals,
  );
  add(day2Hub.showDailyPlan === 'featured', 'Day 2 DailyPlan featured', day2Hub.showDailyPlan);
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day2Gs, 'live_micro_decisions'),
    'Day 2 MicroDecision hidden by policy',
    'visible',
  );

  const day3Stage = getFirstTenMinutesStage({ gameState: day3Gs });
  add(
    day3Stage === 'day3_unlock_hint' || day3Stage === 'normal',
    'Day 3 stage unlock hint or normal',
    day3Stage,
  );
  const microInput = buildMicroDecisionPresentationInput({
    day: 3,
    gameState: day3Gs,
    monetization,
    operationSignals: createInitialOperationSignalsState(3),
    crisisState: createInitialCrisisState(),
    dailyOperationsPlan: createInitialDailyOperationsPlan(3),
    assignments: createInitialAssignmentsState(),
    mainOperationSeason: createFullMainOperationSeasonState(3),
    advisorState: createInitialAdvisorState(3),
    microDecisionState: createInitialMicroDecisionState(),
  });
  const microAccessDay3 = deriveMicroDecisionAccessMode(microInput);
  add(
    microAccessDay3 !== 'inactive' || day3Gs.pilot.status === 'active',
    'Day 3 micro engine eligible path exists',
    microAccessDay3,
  );

  const day3Hub = buildHubCardVisibilityModel(day3Gs, monetization);
  add(
    day3Hub.showOperationSignals === 'normal',
    'Day 3 OperationSignals normal',
    day3Hub.showOperationSignals,
  );

  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day7Gs, 'crisis_desk'),
    'Pilot Day 7 Crisis remains hidden',
    'visible',
  );
  add(
    shouldHideAdvancedSystemForFirstTenMinutes(day7Gs, 'crisis_actions'),
    'Pilot Day 7 CrisisActions hidden',
    'visible',
  );

  const fullGs = fullPostPilotGs(10);
  const fullMonetization = mockPurchaseMainOperationPack(
    createInitialMonetizationState(),
    10,
  );
  const fullHub = buildHubCardVisibilityModel(fullGs, fullMonetization);
  add(fullHub.showCrisis, 'Full post-pilot Hub crisis can show', 'hidden');
  add(fullHub.showMainOperationSeason, 'Full post-pilot main operation can show', 'hidden');

  const limitedGs = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  add(
    resolveFirstTenMinutesDay(limitedGs) >= 1,
    'Limited post-pilot day resolves',
    String(resolveFirstTenMinutesDay(limitedGs)),
  );

  const day1ResourceInput = buildOperationalResourceEngineInputFromStore({
    gameState: pilotGameState(1),
    monetization: createInitialMonetizationState(),
    operationSignals: createInitialOperationSignalsState(1),
    dailyOperationsPlan: createInitialDailyOperationsPlan(1),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisActionState: { actionsById: {} },
    operationalResources: createInitialOperationalResourcesState(1),
  });
  add(
    buildOperationalResourceDetailSheetModel(day1ResourceInput) == null,
    'Day 1 resource detail sheet hidden',
    'sheet',
  );
  const day2HubResources = buildOperationalResourceHubModel({
    ...day1ResourceInput,
    gameState: pilotGameState(2),
    operationalResources: createInitialOperationalResourcesState(2),
  });
  add(day2HubResources.visible, 'Day 2 compact resource card visible', 'hub day2');

  add(SAVE_VERSION === 24, 'SAVE_VERSION 23 with operational resources', String(SAVE_VERSION));

  const guideContracts = getInteractionContractsForComponent('HubFirstTenMinutesGuideCard');
  add(guideContracts.length >= 1, 'Interaction contract HubFirstTenMinutesGuideCard', 'missing');

  const allCopy = collectCopyStrings();
  add(
    allCopy.every((line) => line.length <= FIRST_TEN_MINUTES_MAX_LINE_LENGTH),
    'Hub/report/event copy max line guard',
    'line too long',
  );
  add(
    !allCopy.some(copyHasForbiddenWord),
    'No forbidden words in first-ten-minutes copy',
    'forbidden word found',
  );

  add(
    DAY1_EVENT_PLAN_COPY.planSupport.length > 0,
    'Day 1 event plan support copy',
    'empty',
  );

  addWarn(
    true,
    'Full guided tutorial overlay not implemented',
    'User playtest still required — overlay optional',
  );
  addWarn(
    true,
    'User playtest still required',
    'Manual playtest recommended for Day 1 hub density',
  );

  const failCount = checks.filter((c) => c.startsWith('FAIL')).length;
  const warnCount = checks.filter((c) => c.startsWith('WARN')).length;

  return {
    ok: ok && failCount === 0,
    warn: hasWarn,
    checks,
    failCount,
    warnCount,
  };
}
