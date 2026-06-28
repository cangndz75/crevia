import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildDominantStrategyDetector } from '@/core/dominantStrategyDetector/dominantStrategyDetectorModel';
import type { DominantStrategyDetectorInput } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';
import {
  buildDecisionOptionCardPresentation,
} from '@/features/events/utils/decisionOptionCardIntegration';
import {
  auditDecisionOptionDepthPresentation,
  auditPlanOptionDepthPresentation,
  buildDecisionOptionDepthPresentation,
  buildPlanOptionDepthPresentation,
  collectDistinctArchetypePreviews,
  dedupeTradeoffCopyLines,
} from '@/features/events/utils/decisionTradeoffDepthPresentation';
import { comparePlanStrategyFit } from '@/features/events/utils/decisionContextFitModel';
import {
  buildEventPlanPhasePresentation,
} from '@/features/events/utils/eventPlanPhasePresentation';
import { DECISION_IMPACT_CHAIN } from '@/features/events/utils/operationWorkflowConsistencyPresentation';
import { getDecisionStrategyLabel } from '@/features/events/utils/decisionTradeoffPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');

const BASIC_FALLBACK_PATTERN =
  /^(Sonuç|Durum|Bilgi|Etki|Özet|\+ güven|\- kaynak)\s*$/i;

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function decision(partial: Partial<EventDecision> & Pick<EventDecision, 'id' | 'title'>): EventDecision {
  const { id, title, ...rest } = partial;
  return {
    description: '',
    style: 'balanced',
    effects: {
      publicSatisfaction: 0,
      budget: 0,
      morale: 0,
      risk: 0,
      xp: 0,
    },
    ...rest,
    id,
    title,
  };
}

function sampleEvent(partial?: Partial<EventCard>): EventCard {
  return {
    id: 'evt_tradeoff_depth',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
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

function buildRapidDominantInput(): DominantStrategyDetectorInput {
  return {
    day: 10,
    decisionRecords: Array.from({ length: 5 }, (_, index) => ({
      id: `rapid-${index}`,
      selectedDecisionKind: 'rapid_response',
      decisionLabel: 'Hızlı saha cevabı',
      districtId: `district-${index}`,
      districtName: `Mahalle ${index}`,
      domainTag: 'route',
      day: 6 + index,
      sourceIds: [`rapid-${index}`],
    })),
  };
}

export function verifyDecisionTradeoffDepthScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const event = sampleEvent();
  const criticalEvent = sampleEvent({
    riskLevel: 'critical',
    previewEffects: { publicSatisfaction: -8, risk: 4, xp: 0 },
  });
  const dominantInput = buildRapidDominantInput();

  assert(
    checks,
    assertVerifySaveVersionPolicy(readRepo('src/store/gamePersist.ts')),
    'SAVE_VERSION policy',
    `SAVE_VERSION ${SAVE_VERSION}`,
  );
  assert(checks, SAVE_VERSION === 28, 'SAVE_VERSION 28 korunuyor', String(SAVE_VERSION));

  const day8Model = buildEventPlanPhasePresentation({
    event: criticalEvent,
    day: 8,
    operationsToday: 2,
    dominantStrategyInput: dominantInput,
  });
  const day1Model = buildEventPlanPhasePresentation({
    event,
    day: 1,
    isDay1LearningEvent: true,
  });

  assert(checks, day8Model.options.options.length === 3, 'plan options count 3');
  assert(checks, day1Model.options.options.length === 3, 'day1 plan options count 3');

  for (const option of day8Model.options.options) {
    const depthIssues = auditPlanOptionDepthPresentation(option.depth);
    assert(
      checks,
      depthIssues.length === 0,
      `plan depth audit ${option.id}`,
      depthIssues.join(', ') || 'ok',
    );
    assert(
      checks,
      option.depth.benefitChip.tone === 'gain' && option.depth.costChip.tone === 'cost',
      `gain/cost chips ${option.id}`,
    );
    assert(
      checks,
      option.depth.opportunityCost.length > 20,
      `opportunity cost ${option.id}`,
      option.depth.opportunityCost.slice(0, 40),
    );
    assert(
      checks,
      !BASIC_FALLBACK_PATTERN.test(option.depth.outcomePreview),
      `no basic outcome ${option.id}`,
    );
  }

  const archetypeMap = collectDistinctArchetypePreviews(
    ['rapid_response', 'balanced_plan', 'long_term_fix'],
    {
      strategies: day8Model.strategies,
      event: criticalEvent,
      day: 8,
      operationsToday: 2,
      dominantStrategyInput: dominantInput,
    },
  );
  assert(checks, archetypeMap.size === 3, '3 plan archetypes distinct', String(archetypeMap.size));

  const previews = [...archetypeMap.values()].map((d) => d.outcomePreview);
  const uniquePreviews = new Set(previews);
  assert(checks, uniquePreviews.size === 3, 'plan outcome previews distinct');

  const rapidDepth = day8Model.options.options.find((o) => o.id === 'rapid_response')!.depth;
  const preventiveDepth = day8Model.options.options.find((o) => o.id === 'long_term_fix')!.depth;
  assert(
    checks,
    rapidDepth.outcomePreview.includes('Hızlı') || rapidDepth.outcomePreview.includes('güven'),
    'rapid result reveal terminology',
    rapidDepth.outcomePreview,
  );
  assert(
    checks,
    preventiveDepth.outcomePreview.includes('yarına') ||
      preventiveDepth.outcomePreview.includes('Yarın') ||
      preventiveDepth.outcomePreview.includes('yarın'),
    'preventive day-end terminology',
    preventiveDepth.outcomePreview,
  );
  assert(
    checks,
    rapidDepth.outcomePreview === DECISION_IMPACT_CHAIN.rapid_response.resultSummary,
    'rapid outcome chain aligned',
  );

  const day1Rapid = day1Model.options.options.find((o) => o.id === 'rapid_response')!.depth;
  assert(checks, day1Rapid.tradeoffMeter.length <= 2, 'day1 meter simplified');
  assert(checks, day1Rapid.longTermEffect === '', 'day1 long term hidden');
  assert(checks, day1Rapid.dominantStrategyWarning === null, 'day1 dominant hidden');
  assert(checks, day1Rapid.contextFitBadge === null, 'day1 context fit hidden');

  const day8Rapid = day8Model.options.options.find((o) => o.id === 'rapid_response')!.depth;
  assert(
    checks,
    day8Rapid.dominantStrategyWarning != null,
    'day8+ dominant warning visible',
    day8Rapid.dominantStrategyWarning ?? 'missing',
  );
  assert(
    checks,
    day8Rapid.portfolioConflictHint != null,
    'operation portfolio conflict signal',
    day8Rapid.portfolioConflictHint ?? 'missing',
  );

  const fitCriticalRapid = comparePlanStrategyFit(
    'rapid_response',
    'long_term_fix',
    { event: criticalEvent, operationsToday: 1 },
  );
  const fitLowPreventive = comparePlanStrategyFit(
    'long_term_fix',
    'rapid_response',
    { event: sampleEvent({ riskLevel: 'low', urgencyHours: 8 }), operationsToday: 1 },
  );
  assert(checks, fitCriticalRapid > 0, 'critical favors rapid', String(fitCriticalRapid));
  assert(checks, fitLowPreventive > 0, 'low urgency favors preventive', String(fitLowPreventive));

  const decisionArchetypes: Array<{
    label: string;
    decision: EventDecision;
    expected: string;
  }> = [
    {
      label: 'fast',
      decision: decision({ id: 'd1', title: 'Hızlı', decisionStyle: 'fast' }),
      expected: 'Hızlı Müdahale',
    },
    {
      label: 'balanced',
      decision: decision({ id: 'd2', title: 'Denge', contentStrategyLabel: 'Dengeli plan' }),
      expected: 'Dengeli Plan',
    },
    {
      label: 'social',
      decision: decision({
        id: 'd3',
        title: 'İletişim',
        contentStrategyLabel: 'Sosyal rahatlama',
        decisionStyle: 'communication',
      }),
      expected: 'İletişim',
    },
    {
      label: 'resource',
      decision: decision({
        id: 'd4',
        title: 'Kaynak',
        contentStrategyLabel: 'Kaynak korur',
        decisionStyle: 'resource_saving',
      }),
      expected: 'Kaynak Korur',
    },
    {
      label: 'permanent',
      decision: decision({
        id: 'd5',
        title: 'Kalıcı',
        contentStrategyLabel: 'Kalıcı çözüm',
        decisionStyle: 'permanent',
      }),
      expected: 'Kalıcı Çözüm',
    },
  ];

  const decisionDepths = decisionArchetypes.map((item) => {
    const depth = buildDecisionOptionDepthPresentation({
      event,
      decision: item.decision,
      day: 8,
      dominantStrategyInput: dominantInput,
    });
    return { ...item, depth };
  });

  assert(checks, decisionDepths.length === 5, '5 decision archetypes');
  const decisionOpportunity = new Set(decisionDepths.map((d) => d.depth.opportunityCost));
  assert(checks, decisionOpportunity.size === 5, '5 distinct opportunity costs');

  for (const item of decisionDepths) {
    assert(
      checks,
      getDecisionStrategyLabel(item.decision) === item.expected,
      `archetype label ${item.label}`,
    );
    assert(
      checks,
      auditDecisionOptionDepthPresentation(item.depth).length === 0,
      `decision depth audit ${item.label}`,
    );
    const card = buildDecisionOptionCardPresentation({
      event,
      decision: item.decision,
      day: 8,
      dominantStrategyInput: dominantInput,
    });
    assert(checks, card.depth.opportunityCost.length > 10, `card depth ${item.label}`);
  }

  const deduped = dedupeTradeoffCopyLines([
    decisionDepths[0]!.depth.opportunityCost,
    decisionDepths[0]!.depth.opportunityCost,
    decisionDepths[1]!.depth.opportunityCost,
  ]);
  assert(checks, deduped.length === 2, 'duplicate copy guard');

  const detector = buildDominantStrategyDetector(dominantInput);
  assert(
    checks,
    detector.pattern === 'rapid_response_overuse',
    'dominant strategy detector wired',
    detector.pattern,
  );

  assert(
    checks,
    !readRepo('src/store/gamePersist.ts').includes('SAVE_VERSION: number = 29'),
    'persist version bump yok',
  );
  assert(
    checks,
    !readRepo('src/core/game/applyDecision.ts').includes('decisionTradeoffDepth'),
    'applyDecision untouched',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
