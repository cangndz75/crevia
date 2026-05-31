import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { deriveCrisisActionAccessMode } from '@/core/crisisActions/crisisActionEngine';
import { createInitialCrisisActionState } from '@/core/crisisActions/crisisActionState';
import { createInitialAdvisorState } from '@/core/advisors/advisorState';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import { runDayPipelineAudit } from '@/core/dayPipeline/dayPipelineAudit';
import type { DayPipelineContext } from '@/core/dayPipeline/dayPipelineTypes';
import { deriveMicroDecisionAccessMode } from '@/core/microDecisions/microDecisionEngine';
import { createInitialMicroDecisionState } from '@/core/microDecisions/microDecisionState';
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
import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { getMainOperationEventDensity } from '@/core/mainOperation/mainOperationEngine';
import {
  buildHubCardVisibilityModel,
  buildFirstTenMinutesReportGuard,
  resolveFirstTenMinutesDay,
  shouldHideAdvancedSystemForFirstTenMinutes,
  shouldUseFirstTenMinutesAdvisorShortMode,
  shouldUseFirstTenMinutesAssignmentSimpleMode,
  getFirstTenMinutesPrimaryCtaLabel,
} from '@/core/onboarding/firstTenMinutesPresentation';
import {
  buildOperationalResourceEngineInputFromStore,
  buildOperationalResourceHubModel,
  buildOperationalResourceReportModel,
  buildOperationalResourceAdvisorLine,
} from '@/core/operationalResources/operationalResourcePresentation';
import {
  buildOperationalResourceDetailSheetModel,
  canShowOperationalResourceDetailCta,
} from '@/core/operationalResources/operationalResourceDetailPresentation';
import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { getInteractionContractsForComponent } from '@/core/quality/interactionContracts/interactionContractRegistry';
import { runInteractionContractAudit } from '@/core/quality/interactionContracts/interactionContractAudit';
import {
  buildMapResourcePresentationBundle,
  mergeMapPanelCrisisAndResourceLines,
} from '@/features/map/utils/mapResourcePresentation';
import { buildMapNeighborhoodStripItems } from '@/features/map/utils/mapUiPresentation';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';

import {
  PLAYER_FLOW_AUDIT_SCENARIO_META,
  PLAYER_FLOW_CHECK_DEFINITIONS,
  PLAYER_FLOW_FORBIDDEN_WORDS,
  PLAYER_FLOW_MANUAL_CHECKLIST_ITEMS,
  PLAYER_FLOW_STAGE_LABELS,
  PLAYER_FLOW_SURFACE_LABELS,
  REQUIRED_PLAYER_FLOW_STAGES,
} from './playerFlowAuditConstants';
import type {
  PlayerFlowAuditResult,
  PlayerFlowAuditScenario,
  PlayerFlowCheck,
  PlayerFlowCheckDefinition,
  PlayerFlowCheckStatus,
  PlayerFlowManualChecklist,
  PlayerFlowStage,
} from './playerFlowAuditTypes';

type EvalResult = {
  status: PlayerFlowCheckStatus;
  notes?: string;
};

type PlayerFlowEvaluationContext = {
  day1Gs: GameState;
  day2Gs: GameState;
  day3Gs: GameState;
  day7Gs: GameState;
  day8LimitedGs: GameState;
  day8FullGs: GameState;
  monetizationDay8Limited: MonetizationState;
  monetizationDay8Full: MonetizationState;
  operationalResourcesDay10: ReturnType<typeof createInitialOperationalResourcesState>;
};

function pilotGs(day: number): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: {
      ...seed.gameState.pilot,
      status: 'active',
      currentPilotDay: day,
    },
  };
}

function buildEvaluationContext(): PlayerFlowEvaluationContext {
  const day8Base = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  day8Base.city.day = 8;
  day8Base.pilot.status = 'completed';

  const monetizationDay8Full = mockPurchaseMainOperationPack(
    createInitialMonetizationState(),
    8,
  );
  const monetizationDay8Limited = selectLimitedContinue(
    createInitialMonetizationState(),
    8,
  );

  return {
    day1Gs: pilotGs(1),
    day2Gs: pilotGs(2),
    day3Gs: pilotGs(3),
    day7Gs: {
      ...pilotGs(7),
      pilot: { ...pilotGs(7).pilot, status: 'active', currentPilotDay: 7 },
    },
    day8LimitedGs: applyLimitedContinueToGameState(day8Base),
    day8FullGs: day8Base,
    monetizationDay8Limited,
    monetizationDay8Full,
    operationalResourcesDay10: createInitialOperationalResourcesState(10),
  };
}

function opInput(
  gameState: GameState,
  monetization: MonetizationState,
  day: number,
  operationalResources = createInitialOperationalResourcesState(day),
) {
  return buildOperationalResourceEngineInputFromStore({
    gameState,
    monetization,
    operationSignals: createInitialOperationSignalsState(day),
    dailyOperationsPlan: createInitialDailyOperationsPlan(day),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisActionState: { actionsById: {} },
    operationalResources,
  });
}

function copyHasForbiddenWord(text: string): boolean {
  const hay = text.toLowerCase();
  if (/\bxp\b/u.test(hay)) return true;
  return ['premium', 'satın al', 'kilitli'].some((w) => hay.includes(w));
}

function buildEvaluators(
  ctx: PlayerFlowEvaluationContext,
): Record<string, (def: PlayerFlowCheckDefinition) => EvalResult> {
  const day1Hub = buildHubCardVisibilityModel(ctx.day1Gs);
  const day2Hub = buildHubCardVisibilityModel(ctx.day2Gs);
  const day3Hub = buildHubCardVisibilityModel(ctx.day3Gs);
  const day8FullHub = buildHubCardVisibilityModel(
    ctx.day8FullGs,
    ctx.monetizationDay8Full,
  );
  const day8LimitedHub = buildHubCardVisibilityModel(
    ctx.day8LimitedGs,
    ctx.monetizationDay8Limited,
  );
  const day1ReportGuard = buildFirstTenMinutesReportGuard(ctx.day1Gs);
  const interactionAudit = runInteractionContractAudit();
  const pipelineCtx: DayPipelineContext = {
    gameState: ctx.day8FullGs,
    monetization: ctx.monetizationDay8Full,
    lastClosedDay: null,
    lastDailyReport: null,
    operationSignals: createInitialOperationSignalsState(8),
    dailyOperationsPlan: createInitialDailyOperationsPlan(8),
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisActionState: createInitialCrisisActionState(),
    mainOperationSeason: createFullMainOperationSeasonState(8),
    crisisState: createInitialCrisisState(),
    advisorState: createInitialAdvisorState(8),
  };
  const pipelineAudit = runDayPipelineAudit(pipelineCtx);

  const resourceInputDay1 = opInput(ctx.day1Gs, createInitialMonetizationState(), 1);
  const resourceInputDay3 = opInput(ctx.day3Gs, createInitialMonetizationState(), 3);

  const microDay1 = deriveMicroDecisionAccessMode({
    gameState: ctx.day1Gs,
    monetization: createInitialMonetizationState(),
  });
  const microDay3 = deriveMicroDecisionAccessMode({
    gameState: ctx.day3Gs,
    monetization: createInitialMonetizationState(),
  });

  const stripCrisisVsResource = buildMapNeighborhoodStripItems({
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    gameDay: 10,
    crisisDistrictBadges: [{ districtId: 'sanayi', label: 'Kriz', tone: 'critical' }],
    crisisAccessMode: 'active',
    resourceDistrictBadges: {
      sanayi: {
        districtId: 'sanayi',
        label: 'Konteyner baskısı',
        tone: 'warning',
        iconKey: 'factory',
      },
    },
  });

  const mergedPanel = mergeMapPanelCrisisAndResourceLines({
    crisisLines: [
      {
        id: 'c1',
        title: 'Kriz',
        summary: 'Kriz satırı',
        tone: 'critical',
        iconKey: 'warning',
        affectedDistrictIds: ['sanayi'],
      },
      {
        id: 'c2',
        title: 'Kriz 2',
        summary: 'İkinci kriz',
        tone: 'warning',
        iconKey: 'warning',
        affectedDistrictIds: [],
      },
    ],
    resourceLines: [
      {
        id: 'r1',
        title: 'Kaynak',
        summary: 'Kaynak satırı',
        tone: 'warning',
        iconKey: 'factory',
        relatedDistrictIds: ['sanayi'],
      },
    ],
    maxTotal: 2,
  });

  return {
    day1_hub_max_featured: () => ({
      status: day1Hub.maxFeaturedCards <= 2 ? 'pass' : 'fail',
      notes: `maxFeaturedCards=${day1Hub.maxFeaturedCards}`,
    }),
    day1_advisor_short: () => ({
      status: shouldUseFirstTenMinutesAdvisorShortMode(ctx.day1Gs) ? 'pass' : 'fail',
    }),
    day1_daily_plan_featured: () => ({
      status: day1Hub.showDailyPlan === 'featured' ? 'pass' : 'fail',
    }),
    day1_daily_plan_edit_locked: () => ({
      status: shouldHideAdvancedSystemForFirstTenMinutes(
        ctx.day1Gs,
        'advanced_assignment_editor',
      )
        ? 'pass'
        : 'warn',
      notes: 'Day 1 plan edit policy via first-ten-minutes guard',
    }),
    day1_assignment_recommended: () => ({
      status: shouldUseFirstTenMinutesAssignmentSimpleMode(ctx.day1Gs)
        ? 'pass'
        : 'fail',
    }),
    day1_micro_hidden: () => ({
      status:
        shouldHideAdvancedSystemForFirstTenMinutes(
          ctx.day1Gs,
          'live_micro_decisions',
        ) && !day1Hub.showLiveOperations
          ? 'pass'
          : 'fail',
    }),
    day1_crisis_hidden: () => ({
      status: !day1Hub.showCrisis && !day1Hub.showCrisisActions ? 'pass' : 'fail',
    }),
    day1_main_op_hidden: () => ({
      status: !day1Hub.showMainOperationSeason ? 'pass' : 'fail',
    }),
    day1_resources_hidden: () => ({
      status: !day1Hub.showOperationalResources ? 'pass' : 'fail',
    }),
    day1_report_educational: () => ({
      status:
        day1ReportGuard.hideCrisis &&
        day1ReportGuard.hideMicroDecisions &&
        day1ReportGuard.hideMainOperation
          ? 'pass'
          : 'fail',
    }),
    day1_report_cta_hub: () => ({
      status:
        getFirstTenMinutesPrimaryCtaLabel('report', '') === 'Operasyon Merkezine Dön'
          ? 'pass'
          : 'warn',
      notes: getFirstTenMinutesPrimaryCtaLabel('report', 'fallback'),
    }),
    day2_signals_visible: () => ({
      status:
        day2Hub.showOperationSignals === 'compact' ||
        day2Hub.showOperationSignals === 'normal'
          ? 'pass'
          : 'fail',
    }),
    day2_resources_compact: () => ({
      status: day2Hub.showOperationalResources ? 'pass' : 'fail',
    }),
    day2_advisor_resource_hint: () => {
      const line = buildOperationalResourceAdvisorLine(
        resourceInputDay1,
        1,
      );
      return {
        status: line == null || line.length < 120 ? 'pass' : 'warn',
        notes: line ?? 'no line',
      };
    },
    day2_micro_still_hidden: () => ({
      status: shouldHideAdvancedSystemForFirstTenMinutes(
        ctx.day2Gs,
        'live_micro_decisions',
      )
        ? 'pass'
        : 'fail',
    }),
    day2_crisis_hidden: () => ({
      status: !day2Hub.showCrisis && !day2Hub.showCrisisActions ? 'pass' : 'fail',
    }),
    day3_micro_eligible: () => ({
      status:
        microDay3 !== 'inactive' && microDay1 === 'inactive' ? 'pass' : 'fail',
      notes: `day1=${microDay1} day3=${microDay3}`,
    }),
    day3_resource_detail_sheet: () => ({
      status: canShowOperationalResourceDetailCta(
        opInput(ctx.day2Gs, createInitialMonetizationState(), 2),
      )
        ? 'pass'
        : 'fail',
    }),
    day3_map_resource_overlay: () => {
      const bundle = buildMapResourcePresentationBundle(resourceInputDay3);
      return {
        status:
          resolveFirstTenMinutesDay(ctx.day1Gs) <= 2
            ? !bundle.visible
              ? 'pass'
              : 'fail'
            : 'pass',
        notes: `day3 visible=${bundle.visible}`,
      };
    },
    day3_hub_density: () => ({
      status: (day3Hub.maxFeaturedCards ?? 4) <= 4 ? 'pass' : 'fail',
      notes: `maxFeatured=${day3Hub.maxFeaturedCards}`,
    }),
    day7_report_completion: () => ({
      status: resolveFirstTenMinutesDay(ctx.day7Gs) === 7 ? 'pass' : 'warn',
      notes: 'Pilot completion UI verified in verify:pilot-completion',
    }),
    day7_cta_post_pilot: () => ({
      status: MONETIZATION_COPY.reportCtaOffer.includes('Ana Operasyon')
        ? 'pass'
        : 'fail',
    }),
    day7_forbidden_words: () => {
      const blob = Object.values(MONETIZATION_COPY).join(' ');
      return {
        status: !copyHasForbiddenWord(blob) ? 'pass' : 'fail',
      };
    },
    offer_contract_ctas: () => ({
      status:
        getInteractionContractsForComponent('PostPilotAccessChoiceCard').length >=
        2
          ? 'pass'
          : 'fail',
    }),
    limited_main_op_light: () => ({
      status:
        !isFullMainOperationAccess(
          ctx.day8LimitedGs,
          ctx.monetizationDay8Limited,
        ) && !day8LimitedHub.showMainOperationSeason
          ? 'pass'
          : 'warn',
      notes: 'Limited season card policy',
    }),
    limited_crisis_actions_hidden: () => ({
      status:
        deriveCrisisActionAccessMode({
          gameState: ctx.day8LimitedGs,
          monetization: ctx.monetizationDay8Limited,
          crisisState: createInitialCrisisState(),
          operationSignals: createInitialOperationSignalsState(8),
          crisisActionState: createInitialCrisisActionState(),
        }) !== 'active'
          ? 'pass'
          : 'fail',
      notes: 'Crisis action engine access not active in limited',
    }),
    limited_map_overlay_cap: () => {
      const merged = mergeMapPanelCrisisAndResourceLines({
        resourceLines: [
          {
            id: 'r',
            title: 'Kaynak',
            summary: 's',
            tone: 'warning',
            iconKey: 'factory',
            relatedDistrictIds: [],
          },
        ],
        maxTotal: 1,
      });
      return {
        status: (merged.resourceLines?.length ?? 0) <= 1 ? 'pass' : 'fail',
      };
    },
    full_season_card: () => {
      const fullAccess = isFullMainOperationAccess(
        ctx.day8FullGs,
        ctx.monetizationDay8Full,
      );
      if (!fullAccess) {
        return { status: 'fail', notes: 'Full access not granted' };
      }
      if (!day8FullHub.showMainOperationSeason) {
        return {
          status: 'warn',
          notes:
            'Hub season card hidden while access full — confirm on device playtest',
        };
      }
      return { status: 'pass' };
    },
    full_resources_visible: () => ({
      status: day8FullHub.showOperationalResources ? 'pass' : 'fail',
    }),
    full_crisis_desk_context: () => ({
      status: day8FullHub.showCrisis ? 'pass' : 'warn',
      notes: 'Crisis desk context-dependent on crisis state',
    }),
    full_event_density: () => {
      const limited = getMainOperationEventDensity(
        ctx.day8LimitedGs,
        ctx.monetizationDay8Limited,
      );
      const full = getMainOperationEventDensity(
        ctx.day8FullGs,
        ctx.monetizationDay8Full,
      );
      const fullDay9 = getMainOperationEventDensity(
        { ...ctx.day8FullGs, city: { ...ctx.day8FullGs.city, day: 9 } },
        ctx.monetizationDay8Full,
      );
      const densityExpands =
        full.maxDailyEvents > limited.maxDailyEvents ||
        fullDay9.maxDailyEvents > limited.maxDailyEvents;
      return {
        status: densityExpands ? 'pass' : 'warn',
        notes: `d8 limited=${limited.maxDailyEvents} full=${full.maxDailyEvents} fullD9=${fullDay9.maxDailyEvents}`,
      };
    },
    crisis_action_sheet: () => ({
      status:
        getInteractionContractsForComponent('CrisisActionSheet').length >= 1
          ? 'pass'
          : 'fail',
    }),
    crisis_map_priority: () => ({
      status:
        stripCrisisVsResource.find((i) => i.id === 'sanayi')?.statusLabel ===
          'Kriz' &&
        (mergedPanel.crisisLines?.length ?? 0) >= 1 &&
        (mergedPanel.resourceLines?.length ?? 0) <= 1
          ? 'pass'
          : 'fail',
    }),
    resources_hub_max_rows: () => {
      const hub = buildOperationalResourceHubModel(
        opInput(ctx.day8FullGs, ctx.monetizationDay8Full, 8),
      );
      return {
        status: hub.rows.length <= 3 ? 'pass' : 'fail',
      };
    },
    resources_detail_cta: () => ({
      status:
        getInteractionContractsForComponent('HubOperationalResourcesCard').some(
          (c) => c.expectedAction === 'modal',
        )
          ? 'pass'
          : 'fail',
    }),
    resources_sheet_tabs: () => {
      const sheet = buildOperationalResourceDetailSheetModel(
        opInput(ctx.day8FullGs, ctx.monetizationDay8Full, 8),
      );
      return {
        status:
          sheet != null && sheet.tabs.length === 3 && sheet.personnelRows.length === 3
            ? 'pass'
            : 'fail',
      };
    },
    resources_day1_safe: () => ({
      status:
        buildOperationalResourceDetailSheetModel(resourceInputDay1) == null
          ? 'pass'
          : 'fail',
    }),
    resources_report_lines: () => {
      const report = buildOperationalResourceReportModel(
        opInput(ctx.day8FullGs, ctx.monetizationDay8Full, 8),
        8,
      );
      return {
        status: report.lines.length <= 3 ? 'pass' : 'fail',
      };
    },
    cross_interaction_contracts: () => ({
      status: interactionAudit.health !== 'FAIL' ? 'pass' : 'fail',
      notes: `health=${interactionAudit.health}`,
    }),
    cross_day_pipeline: () => ({
      status: pipelineAudit.health !== 'FAIL' ? 'pass' : 'fail',
      notes: `health=${pipelineAudit.health}`,
    }),
    cross_forbidden_words: () => {
      const blob = [
        ...Object.values(MONETIZATION_COPY),
        ...PLAYER_FLOW_MANUAL_CHECKLIST_ITEMS.map((m) => m.prompt),
        ...PLAYER_FLOW_CHECK_DEFINITIONS.filter(
          (d) => !d.id.includes('forbidden'),
        ).map((d) => `${d.title} ${d.question}`),
      ].join(' ');
      return {
        status: !copyHasForbiddenWord(blob) ? 'pass' : 'fail',
      };
    },
  };
}

function evaluateCheck(
  def: PlayerFlowCheckDefinition,
  evaluators: Record<string, (def: PlayerFlowCheckDefinition) => EvalResult>,
): PlayerFlowCheck {
  if (def.manualOnly) {
    return {
      ...def,
      status: 'warn',
      notes: 'Real human playtest still required',
    };
  }

  const evaluator = evaluators[def.id];
  if (!evaluator) {
    return {
      ...def,
      status: 'warn',
      notes: 'Evaluator not wired; manual verification recommended',
    };
  }

  const result = evaluator(def);
  return {
    ...def,
    status: result.status,
    notes: result.notes,
  };
}

export function getPlayerFlowStageLabel(stage: PlayerFlowStage): string {
  return PLAYER_FLOW_STAGE_LABELS[stage] ?? stage;
}

export function getPlayerFlowSurfaceLabel(
  surface: import('./playerFlowAuditTypes').PlayerFlowSurface,
): string {
  return PLAYER_FLOW_SURFACE_LABELS[surface] ?? surface;
}

export function buildPlayerFlowAuditScenario(): PlayerFlowAuditScenario {
  const ctx = buildEvaluationContext();
  const evaluators = buildEvaluators(ctx);
  const checks = PLAYER_FLOW_CHECK_DEFINITIONS.map((def) =>
    evaluateCheck(def, evaluators),
  );
  const stages = [...REQUIRED_PLAYER_FLOW_STAGES];

  return {
    ...PLAYER_FLOW_AUDIT_SCENARIO_META,
    stages,
    checks,
  };
}

export function validatePlayerFlowChecks(checks: PlayerFlowCheck[]): PlayerFlowAuditResult {
  const passCount = checks.filter((c) => c.status === 'pass').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const criticalFailCount = checks.filter(
    (c) => c.status === 'fail' && c.riskLevel === 'critical',
  ).length;

  let health: PlayerFlowAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: checks.length,
    passCount,
    warnCount,
    failCount,
    criticalFailCount,
    findings: checks.filter((c) => c.status !== 'pass'),
  };
}

export function runPlayerFlowAudit(): PlayerFlowAuditResult {
  const scenario = buildPlayerFlowAuditScenario();
  return validatePlayerFlowChecks(scenario.checks);
}

export function runPlayerFlowAuditForStage(
  stage: PlayerFlowStage,
): PlayerFlowAuditResult {
  const scenario = buildPlayerFlowAuditScenario();
  const filtered = scenario.checks.filter((c) => c.stage === stage);
  return validatePlayerFlowChecks(filtered);
}

export function detectHighRiskPlayerFlowFindings(
  checks: PlayerFlowCheck[],
): PlayerFlowCheck[] {
  return checks
    .filter(
      (c) =>
        (c.riskLevel === 'high' || c.riskLevel === 'critical') &&
        c.status !== 'pass',
    )
    .sort((a, b) => {
      const rank = (c: PlayerFlowCheck) =>
        c.status === 'fail' ? 2 : c.status === 'warn' ? 1 : 0;
      return rank(b) - rank(a);
    });
}

export function buildManualPlayerFlowChecklist(): PlayerFlowManualChecklist {
  return {
    title: 'Crevia Manuel Oyuncu Akışı Kontrol Listesi',
    description:
      'Gerçek cihazda yeni oyuncu, strateji, hızlı mobil ve karışıklık test profilleriyle uygulanır.',
    items: PLAYER_FLOW_MANUAL_CHECKLIST_ITEMS,
  };
}
