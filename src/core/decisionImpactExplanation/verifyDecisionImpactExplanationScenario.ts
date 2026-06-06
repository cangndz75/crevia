import { createInitialOperationalResourcesState } from '@/core/operationalResources/operationalResourceState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';

import { DECISION_IMPACT_EXPLANATION_KINDS } from './decisionImpactExplanationConstants';
import {
  decisionImpactCopyContainsForbiddenTerms,
  buildDecisionImpactHubEcho,
  buildDecisionImpactReportEcho,
} from './decisionImpactExplanationPresentation';
import { buildDecisionImpactExplanation, buildDecisionImpactExplanationForHub } from './decisionImpactExplanationModel';
import type { DecisionImpactExplanationKind } from './decisionImpactExplanationTypes';

export type VerifyDecisionImpactExplanationOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], label: string, condition: boolean, detail?: string): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}${detail ? `: ${detail}` : ''}`);
}

function baseSnapshot(overrides: Partial<Parameters<typeof buildDecisionImpactExplanation>[0]['snapshot']> = {}) {
  return {
    id: 'verify-result',
    day: 4,
    eventId: 'ev_verify_route',
    eventTitle: 'Sanayi rota baskısı',
    eventType: 'route',
    neighborhoodId: 'industrial_market',
    neighborhoodName: 'Sanayi',
    decisionId: 'd_verify',
    decisionTitle: 'Hızlı müdahale planı',
    decisionTone: 'balanced' as const,
    createdAt: 1,
    summaryTitle: 'Sonuç',
    summaryText: 'Rota baskısı azaldı.',
    resultTone: 'mixed' as const,
    metricChanges: [],
    subsystemOutcomes: [],
    highlightLines: [],
    riskLines: [],
    ...overrides,
  };
}

function signals(day = 4) {
  return createInitialOperationSignalsState(day);
}

function resources(day = 4) {
  return createInitialOperationalResourcesState(day);
}

function expectKind(
  checks: string[],
  label: string,
  kind: DecisionImpactExplanationKind,
  actual: DecisionImpactExplanationKind,
) {
  assert(checks, label, actual === kind, `expected ${kind}, got ${actual}`);
}

export function verifyDecisionImpactExplanationScenario(): VerifyDecisionImpactExplanationOutcome {
  const checks: string[] = [];

  assert(checks, 'en az 12 explanation kind var', DECISION_IMPACT_EXPLANATION_KINDS.length >= 12);

  const positive = buildDecisionImpactExplanation({
    snapshot: baseSnapshot({
      eventType: 'social',
      metricChanges: [
        {
          key: 'publicSatisfaction',
          label: 'Memnuniyet',
          before: 50,
          after: 59,
          delta: 9,
          direction: 'up',
          isGood: true,
        },
        {
          key: 'budget',
          label: 'Kaynak',
          before: 1000,
          after: 800,
          delta: -200,
          direction: 'down',
          isGood: false,
        },
      ],
    }),
    operationSignals: signals(),
    resourceFatigue: resources(),
  });
  expectKind(checks, 'positive_tradeoff üretilebiliyor', 'positive_tradeoff', positive.kind);

  const risk = buildDecisionImpactExplanation({
    snapshot: baseSnapshot({
      eventType: 'operations',
      metricChanges: [
        {
          key: 'operationRisk',
          label: 'Risk',
          before: 20,
          after: 30,
          delta: 10,
          direction: 'up',
          isGood: false,
        },
      ],
    }),
  });
  expectKind(checks, 'risk_tradeoff üretilebiliyor', 'risk_tradeoff', risk.kind);

  const vehicleSignals = signals();
  vehicleSignals.vehicles.status = 'strained';
  vehicleSignals.vehicles.score = 80;
  expectKind(
    checks,
    'resource_pressure üretilebiliyor',
    'resource_pressure',
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'operations' }), operationSignals: vehicleSignals }).kind,
  );

  expectKind(
    checks,
    'district_trust_shift üretilebiliyor',
    'district_trust_shift',
    buildDecisionImpactExplanation({
      snapshot: baseSnapshot({
        eventType: 'operations',
        metricChanges: [
          {
            key: 'publicSatisfaction',
            label: 'Memnuniyet',
            delta: 5,
            direction: 'up',
            isGood: true,
          },
        ],
      }),
    }).kind,
  );

  expectKind(
    checks,
    'social_response üretilebiliyor',
    'social_response',
    buildDecisionImpactExplanation({
      snapshot: baseSnapshot({
        eventType: 'social',
        metricChanges: [
          {
            key: 'publicSatisfaction',
            label: 'Memnuniyet',
            delta: 5,
            direction: 'up',
            isGood: true,
          },
        ],
      }),
    }).kind,
  );

  expectKind(
    checks,
    'route_balance üretilebiliyor',
    'route_balance',
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'route' }) }).kind,
  );

  expectKind(
    checks,
    'container_pressure üretilebiliyor',
    'container_pressure',
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'container' }) }).kind,
  );

  expectKind(
    checks,
    'personnel_fatigue üretilebiliyor',
    'personnel_fatigue',
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'personnel' }) }).kind,
  );

  expectKind(
    checks,
    'carry_over_warning üretilebiliyor',
    'carry_over_warning',
    buildDecisionImpactExplanation({
      snapshot: baseSnapshot(),
      carryOverSummary: 'Araç yorgunluğu yarına izleme notu bıraktı.',
    }).kind,
  );

  expectKind(
    checks,
    'fallback üretilebiliyor',
    'fallback',
    buildDecisionImpactExplanation({}).kind,
  );

  const allSamples = [
    positive,
    risk,
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'route' }) }),
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'container' }) }),
    buildDecisionImpactExplanation({ snapshot: baseSnapshot({ eventType: 'personnel' }) }),
    buildDecisionImpactExplanation({}),
  ];

  for (const explanation of allSamples) {
    assert(checks, `${explanation.kind} mainLine içeriyor`, explanation.mainLine.length > 0);
    assert(checks, `${explanation.kind} mainLine çok uzun değil`, explanation.mainLine.length <= 132);
    assert(
      checks,
      `${explanation.kind} tomorrowLine opsiyonel ve kısa`,
      !explanation.tomorrowLine || explanation.tomorrowLine.length <= 96,
    );
    assert(
      checks,
      `${explanation.kind} forbidden copy yok`,
      !decisionImpactCopyContainsForbiddenTerms(`${explanation.mainLine} ${explanation.tomorrowLine ?? ''}`),
    );
  }

  const day1 = buildDecisionImpactExplanation({ snapshot: baseSnapshot({ day: 1 }) });
  assert(checks, 'Day 1 ağır sistem dili kullanmıyor', !/parametre|optimizasyon|motor/i.test(day1.mainLine));

  const day8 = buildDecisionImpactExplanation({ snapshot: baseSnapshot({ day: 8, eventType: 'route' }) });
  assert(checks, 'Day 8+ ana operasyon bağlamı destekleniyor', day8.relatedDomain === 'route');

  assert(checks, 'report echo helper var', Boolean(buildDecisionImpactReportEcho(positive)));
  assert(
    checks,
    'hub carry-over echo helper var',
    Boolean(
      buildDecisionImpactHubEcho(
        buildDecisionImpactExplanationForHub({
          day: 5,
          recentDecisions: [
            {
              id: 'd1',
              day: 4,
              eventId: 'ev1',
              eventTitle: 'Rota baskısı',
              decisionId: 'dec1',
              decisionLabel: 'Hızlı müdahale',
              neighborhoodId: 'industrial_market',
              neighborhoodName: 'Sanayi',
              appliedEffects: {},
              createdAt: new Date(0).toISOString(),
            },
          ],
        }),
      ),
    ),
  );

  const ok = checks.every((line) => line.startsWith('✓'));
  return { ok, checks };
}
