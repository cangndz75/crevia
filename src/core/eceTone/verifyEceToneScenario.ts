import {
  buildDispatchEceLine,
  buildEceMemorySnapshot,
  buildFieldEceLine,
  buildHubEceLine,
  buildInspectEceLine,
  buildPlanEceLine,
  buildReportEceReflection,
  buildResultEceLine,
  isDuplicateEceLine,
} from './eceTonePresentation';
import type { EventCard } from '@/core/models/EventCard';

export type VerifyEceToneOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function sampleEvent(): EventCard {
  return {
    id: 'evt_ece_tone',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Mahallede biriken atık şikayetleri artıyor.',
    contextTag: 'test',
    urgencyHours: 4,
    day: 5,
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
  };
}

export function verifyEceToneScenario(): VerifyEceToneOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();
  const memoryContext = { day: 5, event, socialPressure: true };
  const memory = buildEceMemorySnapshot(memoryContext);

  const inspect = buildInspectEceLine({
    memory,
    context: { ...memoryContext, evidenceSufficient: false },
    seed: `${event.id}:inspect`,
  });
  const planNone = buildPlanEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:plan:none`,
    selectedPlanId: null,
  });
  const planRapid = buildPlanEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:plan:rapid`,
    selectedPlanId: 'rapid_response',
  });
  const planBalanced = buildPlanEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:plan:balanced`,
    selectedPlanId: 'balanced_plan',
  });
  const dispatch = buildDispatchEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:dispatch`,
    readinessRisky: true,
  });
  const field = buildFieldEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:field`,
  });
  const result = buildResultEceLine({
    memory,
    context: memoryContext,
    seed: `${event.id}:result`,
    outcomeTone: 'mixed',
  });

  for (const [label, line] of [
    ['inspect', inspect],
    ['planNone', planNone],
    ['planRapid', planRapid],
    ['planBalanced', planBalanced],
    ['dispatch', dispatch],
    ['field', field],
    ['result', result],
  ] as const) {
    assert(checks, line.message.trim().length > 0, `${label} message not empty`);
    assert(checks, line.toneLabel.trim().length > 0, `${label} toneLabel not empty`);
  }

  assert(checks, planRapid.message !== planBalanced.message, 'plan strategies differ');
  assert(checks, inspect.message !== planRapid.message, 'inspect differs from plan');
  assert(checks, dispatch.message !== planRapid.message, 'dispatch differs from plan');
  assert(checks, result.message !== planRapid.message, 'result differs from plan');

  const inspectAgain = buildInspectEceLine({
    memory,
    context: { ...memoryContext, evidenceSufficient: false },
    seed: `${event.id}:inspect`,
  });
  assert(checks, inspectAgain.message === inspect.message, 'deterministic inspect output');

  const hubLine = buildHubEceLine({
    memory: { ...memory, recentOutcomeTone: 'mixed' },
    context: memoryContext,
    seed: `${event.id}:hub`,
    avoidLines: ['Sosyal echo satırı'],
  });
  assert(checks, Boolean(hubLine?.trim()), 'hub line produced');

  const hubDup = buildHubEceLine({
    memory: { ...memory, recentOutcomeTone: 'mixed' },
    context: memoryContext,
    seed: `${event.id}:hub`,
    avoidLines: hubLine ? [hubLine] : [],
  });
  assert(checks, hubDup === undefined || !isDuplicateEceLine(hubDup, hubLine ? [hubLine] : []), 'hub dedupe');

  const report = buildReportEceReflection({
    memory,
    context: memoryContext,
    seed: `${event.id}:report`,
  });
  assert(checks, Boolean(report?.trim()), 'report reflection produced');

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? `: ${check.detail}` : ''}`),
  };
}
