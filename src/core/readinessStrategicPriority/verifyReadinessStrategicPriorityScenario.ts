import { createEmptyMaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import { buildMaintenanceBacklogFromReadiness } from '@/core/maintenanceBacklog/maintenanceBacklogPresentation';
import { buildOperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessModel';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';
import {
  buildReadinessPlanFitPresentation,
  buildReadinessDispatchFitPresentation,
} from '@/core/readinessStrategicPriority/readinessFitPresentation';
import {
  buildReadinessPriorityFromInput,
  readinessPriorityAvoidsBasicFallback,
  readinessPriorityHasDuplicateCopy,
} from '@/core/readinessStrategicPriority/readinessPriorityPresentation';
import {
  buildFieldReadinessSignal,
  buildHubReadinessCompact,
  buildPortfolioReadinessWarning,
  buildReportReadinessMemory,
  buildResultReadinessBridge,
} from '@/core/readinessStrategicPriority/readinessSurfaceBridge';
import {
  buildReadinessStrategicPriority,
  scorePlanStrategyReadinessFit,
} from '@/core/readinessStrategicPriority/readinessStrategicPriorityModel';
import type { EventCard } from '@/core/models/EventCard';
import {
  buildEventDispatchPhasePresentation,
} from '@/features/events/utils/eventDispatchPhasePresentation';
import {
  buildEventFieldPhasePresentation,
} from '@/features/events/utils/eventFieldPhasePresentation';
import {
  buildEventPlanPhasePresentation,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { buildPlanOptionDepthPresentation } from '@/features/events/utils/decisionTradeoffDepthPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEvent(partial?: Partial<EventCard>): EventCard {
  return {
    id: 'evt_readiness_priority',
    title: 'Konteyner hattı bakım baskısı',
    category: 'waste',
    riskLevel: 'high',
    district: 'Cumhuriyet',
    description: 'Mahallede biriken atık şikayetleri artıyor.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 8,
    previewEffects: { publicSatisfaction: -6, risk: 2, xp: 0 },
    decisions: [
      {
        id: 'd_assign',
        title: 'Ekibi yönlendir',
        description: 'Saha ekibini hızlı sevk et',
        style: 'balanced',
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
        costs: { budget: 1200, staffHours: 2 },
      },
    ],
    ...partial,
  };
}

function strainedSnapshot() {
  return buildOperationReadinessSnapshot({
    phase: 'dispatch',
    day: 10,
    assignmentStatus: 'partial',
    hasVehicle: false,
    compatibilityBand: 'low',
    compatibilityTone: 'warning',
    planStrategyId: 'rapid_response',
    publicSatisfactionPreview: -5,
    eventRiskLevel: 'high',
  });
}

function readySnapshot() {
  return buildOperationReadinessSnapshot({
    phase: 'dispatch',
    day: 10,
    assignmentStatus: 'ready',
    hasVehicle: true,
    compatibilityBand: 'high',
    planStrategyId: 'balanced_plan',
    publicSatisfactionPreview: 0,
    eventRiskLevel: 'medium',
  });
}

export function verifyReadinessStrategicPriorityScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const event = sampleEvent();

  assert(
    checks,
    assertVerifySaveVersionPolicy(readFileSync(join(REPO_ROOT, 'src/store/gamePersist.ts'), 'utf8')),
    'SAVE_VERSION policy',
    `SAVE_VERSION ${SAVE_VERSION}`,
  );

  const day1Result = buildReadinessStrategicPriority({
    day: 1,
    readinessSnapshot: readySnapshot(),
  });
  assert(checks, day1Result.densityBand === 'day1', 'day1 density band');
  assert(checks, day1Result.recovery === null, 'day1 no recovery');
  assert(checks, day1Result.memory === null, 'day1 no memory');
  assert(
    checks,
    day1Result.priority.title.includes('Hazırlık iyi seçilirse'),
    'day1 priority message',
    day1Result.priority.title,
  );

  const strainedInput = {
    day: 10,
    readinessSnapshot: strainedSnapshot(),
    maintenanceBacklog: buildMaintenanceBacklogFromReadiness(strainedSnapshot()),
    maintenanceRuntime: createEmptyMaintenanceBacklogRuntimeState(),
    planStrategyId: 'rapid_response' as const,
    eventRiskLevel: 'high',
    operationsToday: 2,
    operationTitle: event.title,
    portfolioConflict: true,
    memoryStreakDays: 2,
  };

  const strategicResult = buildReadinessStrategicPriority(strainedInput);
  assert(checks, strategicResult.densityBand === 'strategic', 'day8+ strategic band');
  assert(checks, Boolean(strategicResult.priority.title), 'single primary priority title');
  assert(checks, Boolean(strategicResult.risk.label), 'risk separated');
  assert(
    checks,
    strategicResult.recovery !== null || strategicResult.priority.domain === 'ready_positive',
    'recovery or positive path',
  );

  const repeatA = buildReadinessStrategicPriority(strainedInput);
  const repeatB = buildReadinessStrategicPriority(strainedInput);
  assert(
    checks,
    repeatA.priority.id === repeatB.priority.id && repeatA.priority.title === repeatB.priority.title,
    'deterministic priority output',
    repeatA.priority.id,
  );

  const { surface } = buildReadinessPriorityFromInput(strainedInput);
  assert(checks, surface.visibility === 'visible', 'priority surface visible');
  assert(checks, surface.chips.length >= 1 && surface.chips.length <= 3, 'bounded chips', String(surface.chips.length));
  assert(checks, !readinessPriorityHasDuplicateCopy(surface), 'duplicate copy guard');
  assert(checks, readinessPriorityAvoidsBasicFallback(surface.hero.title), 'no basic fallback title');
  assert(checks, readinessPriorityAvoidsBasicFallback('Hazırlık: %72') === false, 'rejects dry percent UI');

  const planFit = buildReadinessPlanFitPresentation(strainedInput);
  assert(checks, planFit.visibility === 'visible', 'plan fit visible day8+');
  assert(checks, Boolean(planFit.strategyFits.rapid_response), 'rapid_response fit');

  const rapidFit = scorePlanStrategyReadinessFit('rapid_response', strainedInput);
  assert(checks, rapidFit.risky || rapidFit.score < 55, 'rapid risky under strain', String(rapidFit.score));

  const planPresentation = buildEventPlanPhasePresentation({ event, day: 10, operationsToday: 2 });
  assert(checks, planPresentation.readinessPriority.visibility === 'visible', 'plan phase priority');
  assert(checks, planPresentation.readinessPriority.chips.length <= 3, 'plan phase bounded chips');

  const planDepth = buildPlanOptionDepthPresentation({
    strategy: planPresentation.strategies[0]!,
    event,
    day: 10,
    operationsToday: 2,
    maintenanceBacklogRuntime: createEmptyMaintenanceBacklogRuntimeState(),
  });
  assert(checks, planDepth.readinessFitBadge !== null, 'plan depth readiness fit badge');

  const dispatchPresentation = buildEventDispatchPhasePresentation({
    event,
    assignmentReady: true,
    hasSelectedDecision: true,
    selectedPlanStrategyId: 'rapid_response',
    day: 10,
    maintenanceBacklogRuntime: createEmptyMaintenanceBacklogRuntimeState(),
  });
  assert(checks, dispatchPresentation.readinessPriority.visibility === 'visible', 'dispatch priority');
  assert(checks, dispatchPresentation.readinessDispatchFit.visibility === 'visible', 'dispatch fit');

  const fieldPresentation = buildEventFieldPhasePresentation({
    event,
    selectedPlanStrategyId: 'rapid_response',
    day: 10,
    maintenanceBacklogRuntime: createEmptyMaintenanceBacklogRuntimeState(),
  });
  assert(checks, fieldPresentation.readinessLiveSignal.visibility === 'visible', 'field live signal');
  assert(checks, fieldPresentation.readinessLiveSignal.signal.length <= 88, 'field signal bounded');

  const resultBridge = buildResultReadinessBridge({
    ...strainedInput,
    outcomePositive: false,
  });
  assert(checks, resultBridge.visibility === 'visible', 'result bridge');
  assert(checks, resultBridge.impactLine.length > 12, 'result impact line');

  const hubCompact = buildHubReadinessCompact(strainedInput);
  assert(checks, hubCompact.visibility === 'visible', 'hub compact visible when strained');
  assert(checks, Boolean(hubCompact.pulseLine), 'hub pulse line');

  const portfolioWarning = buildPortfolioReadinessWarning(strainedInput);
  assert(checks, portfolioWarning.visibility === 'visible', 'portfolio readiness warning');

  const reportMemory = buildReportReadinessMemory({
    ...strainedInput,
    memoryStreakDays: 2,
  });
  assert(checks, reportMemory.visibility === 'visible', 'report memory');
  assert(checks, Boolean(reportMemory.closureLine), 'closure line');

  const day1PlanFit = buildReadinessPlanFitPresentation({ day: 1, readinessSnapshot: readySnapshot() });
  assert(checks, day1PlanFit.visibility === 'hidden', 'day1 hides plan fit');

  const registrySource = existsSync(join(REPO_ROOT, 'src/core/quality/gameplayGuardPass/gameplayGuardPassRegistry.ts'))
    ? readFileSync(join(REPO_ROOT, 'src/core/quality/gameplayGuardPass/gameplayGuardPassRegistry.ts'), 'utf8')
    : '';
  assert(
    checks,
    registrySource.includes('readiness_strategic_priority') || registrySource.includes('verify:readiness-strategic-priority'),
    'gameplay guard registry entry',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? `: ${c.detail}` : ''}`),
  };
}
