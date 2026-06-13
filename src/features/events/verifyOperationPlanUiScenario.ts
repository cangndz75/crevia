import type { EventCard } from '@/core/models/EventCard';
import { OPERATION_WORKFLOW_STEPS } from '@/features/events/utils/eventWorkflowPresentation';

import {
  auditEventPlanPhasePresentation,
  buildEventPlanPhasePresentation,
  planPresentationTextContainsForbiddenPatterns,
  resolveRecommendedPlanStrategyId,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';

export type VerifyOperationPlanUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEvent(partial?: Partial<EventCard>): EventCard {
  return {
    id: 'evt_plan_ui',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Mahallede biriken atık şikayetleri artıyor.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: -3, risk: 1, xp: 0 },
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

function sampleLowDataEvent(): EventCard {
  return sampleEvent({
    id: 'evt_plan_low',
    title: 'Genel operasyon',
    riskLevel: 'low',
    district: '',
    description: '',
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [
      {
        id: 'd_basic',
        title: 'Standart müdahale',
        description: 'Temel operasyon',
        style: 'balanced',
        effects: { publicSatisfaction: 1, budget: 0, morale: 0, risk: 0, xp: 0 },
      },
    ],
  });
}

export function verifyOperationPlanUiScenario(): VerifyOperationPlanUiOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();
  const lowData = sampleLowDataEvent();

  const defaultModel = buildEventPlanPhasePresentation({ event, day: 2 });
  const day1Model = buildEventPlanPhasePresentation({
    event,
    day: 1,
    isDay1LearningEvent: true,
  });
  const lowDataModel = buildEventPlanPhasePresentation({ event: lowData, day: 2 });
  const rapidModel = buildEventPlanPhasePresentation({
    event,
    selectedStrategyId: 'rapid_response',
    day: 2,
  });

  for (const [label, model] of [
    ['default', defaultModel],
    ['day1', day1Model],
    ['lowData', lowDataModel],
    ['rapid', rapidModel],
  ] as const) {
    const issues = auditEventPlanPhasePresentation(model);
    assert(checks, issues.length === 0, `${label} presentation audit clean`, issues.join('; '));
  }

  assert(checks, defaultModel.title.length > 0, 'title not empty');
  assert(checks, defaultModel.accessibilityLabel.length > 0, 'accessibilityLabel not empty');
  assert(checks, defaultModel.inspectSummary.length <= 3, 'inspectSummary max 3');
  assert(
    checks,
    defaultModel.strategies.length >= 2 && defaultModel.strategies.length <= 3,
    'strategies count 2-3',
  );

  const ids = new Set(defaultModel.strategies.map((s) => s.id));
  assert(checks, ids.size === defaultModel.strategies.length, 'strategy id unique');

  const recommendedCount = defaultModel.strategies.filter((s) => s.isRecommended).length;
  assert(checks, recommendedCount === 1, 'exactly one recommended strategy');

  assert(
    checks,
    defaultModel.strategies.every((s) => s.tradeoffs.length > 0),
    'tradeoffs not empty',
  );
  assert(
    checks,
    defaultModel.impactPreview.impacts.length <= 4,
    'expectedImpact max 4 in preview',
  );

  const forbiddenBlob = [
    ...defaultModel.strategies.flatMap((s) => s.tradeoffs.map((t) => t.valueText)),
    defaultModel.impactPreview.summary,
  ].join(' ');
  assert(
    checks,
    !planPresentationTextContainsForbiddenPatterns(forbiddenBlob),
    'no fake percent language',
  );

  const lowDataUrgent = lowDataModel.inspectSummary.some((item) => item.tone === 'urgent');
  assert(checks, !lowDataUrgent, 'low data no fake urgent summary');

  assert(
    checks,
    day1Model.recommendedStrategyId === 'balanced_plan',
    'Day 1 recommended balanced_plan',
  );

  assert(
    checks,
    day1Model.primaryCta.actionKey === 'go_to_dispatch' && day1Model.primaryCta.enabled,
    'CTA go_to_dispatch enabled',
  );

  assert(
    checks,
    defaultModel.strategies.some((s) => s.id === defaultModel.selectedStrategyId),
    'selectedStrategyId in strategies',
  );

  assert(
    checks,
    OPERATION_WORKFLOW_STEPS.some((s) => s.id === 'plan' && s.label === 'Planla'),
    'workflow plan step unchanged',
  );

  const criticalRapid = resolveRecommendedPlanStrategyId(
    sampleEvent({ riskLevel: 'critical', decisions: sampleEvent().decisions }),
    { day: 5 },
  );
  assert(
    checks,
    criticalRapid === 'rapid_response' || criticalRapid === 'balanced_plan',
    'critical risk resolves safe recommendation',
  );

  let crash = false;
  try {
    buildEventPlanPhasePresentation({ event: lowData });
  } catch {
    crash = true;
  }
  assert(checks, !crash, 'low data presentation does not throw');

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
