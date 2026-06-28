import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { buildEndOfDayReportClosurePresentation } from '@/features/reports/presentation/closure/endOfDayReportClosurePresentation';
import {
  buildPlanOptionDepthPresentation,
  auditPlanOptionDepthPresentation,
} from '@/features/events/utils/decisionTradeoffDepthPresentation';
import type { EventPlanStrategyCard } from '@/features/events/utils/eventPlanPhasePresentation';
import type { EventCard } from '@/core/models/EventCard';
import { buildReportReplayMemoryPresentation } from '@/features/reports/presentation/memory/reportReplayMemoryPresentation';
import { buildMaintenanceEconomyResultRevealLine } from '@/core/maintenanceBacklog/maintenanceEconomySurfaceBridge';
import { SAVE_VERSION } from '@/store/gamePersist';

import { sanitizeMaintenanceEconomyFields } from './maintenanceEconomyModel';
import {
  buildMaintenanceEconomyFeelPresentation,
  maintenanceEconomyFeelHasDuplicateCopy,
  maintenanceEconomyFeelUsesBannedFallback,
} from './maintenanceEconomyFeelPresentation';
import {
  buildMaintenanceEconomyHubBridge,
  buildMaintenanceEconomyPortfolioLine,
  buildMaintenanceEconomyPlanHint,
} from './maintenanceEconomySurfaceBridge';
import { buildMaintenanceEconomyPressureSnapshot, resolveMaintenanceEconomyToneId } from './maintenanceEconomyToneModel';
import { buildMaintenanceEconomyTradeoffStrip } from './maintenanceEconomyTradeoffPresentation';
import { buildMaintenanceEconomyDeferRiskPreview } from './maintenanceEconomyDeferRiskPresentation';
import { buildMaintenanceEconomyOpportunityCostPreview } from './maintenanceEconomyOpportunityCostPresentation';
import { buildMaintenanceBacklogRuntimePresentation } from './maintenanceBacklogRuntimePresentation';
import type { MaintenanceBacklogRuntimeState, MaintenanceRuntimeItem } from './maintenanceBacklogRuntimeTypes';

type Check = { ok: boolean; name: string; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ ok, name, detail: detail || (ok ? 'ok' : 'fail') });
}

function runtimeItem(
  overrides: Partial<MaintenanceRuntimeItem> & Pick<MaintenanceRuntimeItem, 'id' | 'domain'>,
): MaintenanceRuntimeItem {
  return sanitizeMaintenanceEconomyFields({
    severity: 'attention',
    status: 'open',
    createdDay: 3,
    updatedDay: 3,
    carryOverDays: 0,
    sourceDedupeKey: `k-${overrides.id}`,
    lastReasonLabels: ['test'],
    economyStatus: 'none',
    ...overrides,
  });
}

function sampleRuntime(overrides?: Partial<MaintenanceBacklogRuntimeState>): MaintenanceBacklogRuntimeState {
  return {
    items: [],
    attentionStreaks: {},
    ...overrides,
  };
}

function sampleEvent(): EventCard {
  return {
    id: 'evt_maint_feel',
    title: 'Konteyner bakım baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Merkez',
    description: 'Mahallede bakım sinyali yükseldi.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 8,
    previewEffects: { publicSatisfaction: -4, risk: 2, xp: 0 },
    decisions: [],
  };
}

function sampleStrategy(id: EventPlanStrategyCard['id']): EventPlanStrategyCard {
  return {
    id,
    title: 'Test plan',
    description: 'Test açıklama',
    tone: 'teal',
    priority: 'normal',
    isSelected: false,
    pros: ['Hız'],
    cons: ['Kaynak'],
    costLabel: 'Orta',
    riskLabel: 'Orta',
    tradeoffs: [],
    gameplayTradeoffs: [],
    expectedImpact: [],
    sourceLabel: 'test',
    sourceIds: [],
  };
}

export function verifyMaintenanceEconomyFeelScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(28), 'SAVE_VERSION is 28', `SAVE_VERSION=${SAVE_VERSION}`);

  const pressuredRuntime = sampleRuntime({
    items: [
      runtimeItem({
        id: 'v1',
        domain: 'vehicle',
        severity: 'strained',
        status: 'carried',
        carryOverDays: 2,
        economyStatus: 'queued',
      }),
      runtimeItem({
        id: 'p1',
        domain: 'personnel',
        severity: 'critical',
        status: 'open',
        economyStatus: 'in_progress',
        estimatedDays: 1,
      }),
    ],
  });

  const day8Feel = buildMaintenanceEconomyFeelPresentation({
    day: 8,
    runtime: pressuredRuntime,
    operationsToday: 3,
  });

  assert(checks, day8Feel.title.length > 0, 'pressure model title');
  assert(checks, day8Feel.summary.length > 0, 'pressure model summary');
  assert(checks, day8Feel.chips.length >= 1 && day8Feel.chips.length <= 3, 'pressure chips bounded', String(day8Feel.chips.length));
  assert(checks, day8Feel.tradeoffStrip.visible, 'tradeoff strip visible');
  assert(checks, day8Feel.tradeoffStrip.gains.length <= 2, 'tradeoff gains bounded');
  assert(checks, day8Feel.tradeoffStrip.costs.length <= 2, 'tradeoff costs bounded');
  assert(checks, day8Feel.deferRisk.visible, 'defer risk preview day8+');
  assert(checks, Boolean(day8Feel.deferRisk.riskChip), 'defer risk chip');
  assert(checks, day8Feel.opportunityCost.visible, 'opportunity cost day8+');
  assert(checks, !maintenanceEconomyFeelUsesBannedFallback(day8Feel), 'no banned fallback copy');
  assert(checks, !maintenanceEconomyFeelHasDuplicateCopy(day8Feel), 'duplicate copy guard');

  const day1Feel = buildMaintenanceEconomyFeelPresentation({
    day: 1,
    runtime: sampleRuntime({
      items: [runtimeItem({ id: 'd1', domain: 'vehicle', severity: 'attention' })],
    }),
  });
  assert(checks, day1Feel.densityBand === 'day1', 'day1 density band');
  assert(checks, day1Feel.chips.length <= 1, 'day1 chips capped', String(day1Feel.chips.length));
  assert(checks, !day1Feel.deferRisk.visible, 'day1 defer risk hidden');
  assert(checks, !day1Feel.opportunityCost.visible, 'day1 opportunity cost hidden');
  assert(checks, day1Feel.eceDay1Line?.includes('Hazırlık kararları') === true, 'day1 ece line');

  const snapshot = buildMaintenanceEconomyPressureSnapshot(pressuredRuntime);
  const toneId = resolveMaintenanceEconomyToneId(snapshot);
  const strip = buildMaintenanceEconomyTradeoffStrip({ snapshot, toneId, densityBand: 'openEnded' });
  const defer = buildMaintenanceEconomyDeferRiskPreview({ snapshot, densityBand: 'openEnded' });
  const opp = buildMaintenanceEconomyOpportunityCostPreview({
    snapshot,
    toneId,
    operationsToday: 3,
    densityBand: 'openEnded',
  });
  assert(checks, strip.visible, 'tradeoff model standalone');
  assert(checks, defer.visible, 'defer model standalone');
  assert(checks, opp.visible, 'opportunity model standalone');

  const backlogPresentation = buildMaintenanceBacklogRuntimePresentation(pressuredRuntime, {
    readinessSnapshot: {
      overallStatus: 'strained',
      overallLabel: 'Sınırlı',
      overallTone: 'warning',
      summary: 'Hazırlık baskısı var',
      signals: [],
      blockers: [],
      warnings: [],
    },
  });
  const hubSignal = buildMaintenanceEconomyHubBridge({
    day: 8,
    runtime: pressuredRuntime,
    backlogPresentation,
  });
  assert(checks, Boolean(hubSignal?.title), 'hub bridge signal');

  const portfolioLine = buildMaintenanceEconomyPortfolioLine({
    day: 8,
    runtime: pressuredRuntime,
    operationsToday: 3,
  });
  assert(checks, Boolean(portfolioLine), 'portfolio bridge line');

  const planHint = buildMaintenanceEconomyPlanHint({
    strategyId: 'rapid_response',
    day: 8,
    runtime: pressuredRuntime,
    operationsToday: 3,
  });
  assert(checks, Boolean(planHint), 'plan phase maintenance hint');

  const planDepth = buildPlanOptionDepthPresentation({
    strategy: sampleStrategy('rapid_response'),
    event: sampleEvent(),
    day: 8,
    operationsToday: 3,
    maintenanceBacklogRuntime: pressuredRuntime,
  });
  assert(checks, auditPlanOptionDepthPresentation(planDepth).length === 0, 'plan depth audit clean');
  assert(checks, Boolean(planDepth.maintenanceEconomyHint), 'plan depth maintenance hint field');

  const day1PlanDepth = buildPlanOptionDepthPresentation({
    strategy: sampleStrategy('balanced_plan'),
    event: sampleEvent(),
    day: 1,
    isDay1LearningEvent: true,
    maintenanceBacklogRuntime: pressuredRuntime,
  });
  assert(checks, day1PlanDepth.maintenanceEconomyHint == null, 'day1 plan hint hidden');

  const closure = buildEndOfDayReportClosurePresentation({
    day: 8,
    metrics: { publicSatisfaction: 54, staffMorale: 50, budget: 62_000 },
    decisionsToday: [],
    maintenanceRiskHigh: true,
    maintenanceBacklogRuntime: pressuredRuntime,
    replayInput: { day: 8 },
  });
  assert(
    checks,
    closure.tradeoffBalance.gains.some((g) => g.label.includes('Hazırlık')) ||
      closure.tradeoffBalance.costs.some((c) => c.label.includes('Kaynak') || c.label.includes('Readiness')),
    'closure tradeoff bridge',
  );

  const memory = buildReportReplayMemoryPresentation({
    currentDay: 8,
    metrics: { publicSatisfaction: 54, staffMorale: 50, budget: 62_000 },
    snapshots: [],
    cityArchive: null,
    decisionHistory: [],
    maintenanceRiskHigh: true,
    maintenanceBacklogRuntime: pressuredRuntime,
  });
  assert(
    checks,
    memory.tradeoffHistory.costs.some((c) => c.key === 'maintenance_memory') ||
      memory.hero.summaryLine.includes('Hazırlık'),
    'memory maintenance signal',
  );

  const resultLine = buildMaintenanceEconomyResultRevealLine({
    day: 8,
    runtime: pressuredRuntime,
  });
  assert(checks, Boolean(resultLine), 'result reveal bridge line');

  const deterministicA = buildMaintenanceEconomyFeelPresentation({
    day: 8,
    runtime: pressuredRuntime,
    operationsToday: 2,
  });
  const deterministicB = buildMaintenanceEconomyFeelPresentation({
    day: 8,
    runtime: pressuredRuntime,
    operationsToday: 2,
  });
  assert(
    checks,
    JSON.stringify(deterministicA.collectStrings()) === JSON.stringify(deterministicB.collectStrings()),
    'deterministic output',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
