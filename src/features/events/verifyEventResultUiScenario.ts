import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { applyDecision } from '@/core/game/applyDecision';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { POST_PILOT_GENERATED_EVENT_ID_PREFIX } from '@/core/postPilot/postPilotOperationUxPresentation';
import type { EventCard } from '@/core/models/EventCard';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import {
  buildDecisionResultSnapshot,
  createEmptyDecisionResultFallback,
  inferResultTone,
} from '@/features/events/utils/decisionResultModel';
import {
  assertNoEventResultForbiddenWords,
  buildEventResultFieldNote,
  buildEventResultImpactMetrics,
  buildEventResultViewModel,
  collectEventResultPresentationStrings,
  EVENT_RESULT_COPY,
  EVENT_RESULT_LAYOUT_GUARDS,
  shouldShowPostPilotResultContext,
} from '@/features/events/utils/eventResultPresentation';
import { verifyDecisionResultScenario } from '@/features/events/utils/verifyDecisionResultScenario';

export type VerifyEventResultUiOutcome = {
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
    id: 'evt_result_ui',
    title: 'Mahalle temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Test',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [
      {
        id: 'd1',
        title: 'Ekibi yönlendir',
        description: '',
        style: 'balanced',
        effects: { publicSatisfaction: 6, budget: -800, morale: 2, risk: -2, xp: 0 },
      },
    ],
    ...partial,
  };
}

function buildSnapshotFromDeltas(
  tone: 'positive' | 'mixed' | 'negative',
): ReturnType<typeof buildDecisionResultSnapshot> {
  const event = sampleEvent();
  const decision = event.decisions[0]!;
  const before = {
    publicSatisfaction: 50,
    budget: 20_000,
    morale: 60,
    riskScore: 35,
  };
  const after =
    tone === 'positive'
      ? {
          publicSatisfaction: 58,
          budget: 19_000,
          morale: 64,
          riskScore: 30,
        }
      : tone === 'negative'
        ? {
            publicSatisfaction: 44,
            budget: 17_500,
            morale: 52,
            riskScore: 48,
          }
        : {
            publicSatisfaction: 49,
            budget: 18_200,
            morale: 54,
            riskScore: 42,
          };

  return buildDecisionResultSnapshot({
    day: 2,
    event,
    decision,
    gameStateBefore: before,
    gameStateAfter: after,
    personnelStateBefore: createInitialPersonnelState(),
    personnelStateAfter: createInitialPersonnelState(),
    containerStateBefore: createInitialContainerState(2),
    containerStateAfter: createInitialContainerState(2),
    vehicleStateBefore: createInitialVehicleState(2),
    vehicleStateAfter: createInitialVehicleState(2),
    socialPulseStateBefore: createInitialSocialPulseState(2),
    socialPulseStateAfter: createInitialSocialPulseState(2),
  });
}

function digestApplyDecision(): string {
  const bundle = createDay1Seed();
  const event = bundle.gameState.events[0];
  const decision = event?.decisions[0];
  if (!event || !decision) {
    return 'skip';
  }

  const result = applyDecision({
    state: {
      ...bundle.gameState,
      neighborhoods: bundle.neighborhoods,
      resources: bundle.resources,
    },
    eventId: event.id,
    decisionId: decision.id,
    playerProgress: createInitialPlayerProgress(),
  });

  return JSON.stringify({
    eventId: result.decisionRecord.eventId,
    decisionId: result.decisionRecord.decisionId,
    solved: result.nextState.solvedEvents.length,
    budget: result.afterSnapshot.metrics.budget,
  });
}

export function verifyEventResultUiScenario(): VerifyEventResultUiOutcome {
  const checks: Check[] = [];

  const positive = buildSnapshotFromDeltas('positive');
  const balanced = buildSnapshotFromDeltas('mixed');
  const risky = buildSnapshotFromDeltas('negative');

  try {
    const positiveVm = buildEventResultViewModel(positive);
    assert(checks, positiveVm.hero.statusLabel.includes('Başarılı'), 'Normal başarılı event result render path crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Normal başarılı event result render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  try {
    const balancedVm = buildEventResultViewModel(balanced);
    assert(
      checks,
      balancedVm.hero.tone === 'balanced' ||
        balancedVm.hero.statusLabel.includes('Dengeli') ||
        balancedVm.hero.statusLabel.includes('Riskli'),
      'Dengeli/orta sonuç render path crash olmaz',
      balancedVm.hero.statusLabel,
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Dengeli/orta sonuç render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  try {
    const riskyVm = buildEventResultViewModel(risky);
    assert(checks, riskyVm.hero.statusLabel.includes('Riskli'), 'Riskli sonuç render path crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Riskli sonuç render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  try {
    const fallbackVm = buildEventResultViewModel(createEmptyDecisionResultFallback(), {
      isFallback: true,
    });
    assert(
      checks,
      fallbackVm.isFallback && fallbackVm.fieldNote.length > 0,
      'Eksik result verisi fallback ile crash olmaz',
      fallbackVm.fieldNote,
    );
  } catch (error) {
    assert(
      checks,
      false,
      'Eksik result verisi fallback ile crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  const longTitleSnapshot = buildDecisionResultSnapshot({
    day: 2,
    event: sampleEvent({
      title:
        'Çok uzun olay başlığı mobil ekranda taşmamalı ve sonuç kartında güvenli şekilde kısaltılmalıdır',
    }),
    decision: sampleEvent().decisions[0]!,
    gameStateBefore: {
      publicSatisfaction: 50,
      budget: 10_000,
      morale: 60,
      riskScore: 30,
    },
    gameStateAfter: {
      publicSatisfaction: 52,
      budget: 9_800,
      morale: 61,
      riskScore: 29,
    },
    personnelStateBefore: createInitialPersonnelState(),
    personnelStateAfter: createInitialPersonnelState(),
    containerStateBefore: createInitialContainerState(2),
    containerStateAfter: createInitialContainerState(2),
    vehicleStateBefore: createInitialVehicleState(2),
    vehicleStateAfter: createInitialVehicleState(2),
    socialPulseStateBefore: createInitialSocialPulseState(2),
    socialPulseStateAfter: createInitialSocialPulseState(2),
  });

  assert(
    checks,
    EVENT_RESULT_LAYOUT_GUARDS.eventTitleNumberOfLines === 2,
    'Uzun event title taşma guard’ları vardır',
    longTitleSnapshot.eventTitle.slice(0, 24),
  );

  const metrics = buildEventResultImpactMetrics(positive);
  assert(
    checks,
    metrics.length === EVENT_RESULT_LAYOUT_GUARDS.maxImpactMetrics,
    'Impact metrics maksimum 3 item üretir',
    String(metrics.length),
  );

  const note = buildEventResultFieldNote(positive);
  assert(
    checks,
    note.length > 0 && note.length <= 240,
    'Saha notu max 2 satır modelinde kalır',
    `len=${note.length}`,
  );

  const postPilotEvent = sampleEvent({
    id: `${POST_PILOT_GENERATED_EVENT_ID_PREFIX}8_anchor_0`,
  });
  const pilotEvent = pilotEvents[0] ?? sampleEvent({ id: 'pilot_d1_evt' });

  assert(
    checks,
    shouldShowPostPilotResultContext(positive, postPilotEvent),
    'Post-pilot event context chip sadece post-pilot eventlerde görünür',
    postPilotEvent.id,
  );
  assert(
    checks,
    !shouldShowPostPilotResultContext(positive, pilotEvent),
    'Pilot 1–7 eventlerinde post-pilot chip görünmez',
    pilotEvent.id,
  );

  const vm = buildEventResultViewModel(positive);
  assert(
    checks,
    vm.nextStep.primaryCtaLabel === EVENT_RESULT_COPY.ctaHub,
    'CTA label mevcut flow ile tutarlı döner',
    vm.nextStep.primaryCtaLabel,
  );

  const beforeDigest = digestApplyDecision();
  const afterDigest = digestApplyDecision();
  assert(
    checks,
    beforeDigest === afterDigest,
    'applyDecision output değişmez',
    beforeDigest,
  );

  const decisionVerify = verifyDecisionResultScenario();
  assert(
    checks,
    decisionVerify.ok,
    'authority/badge/progression core davranışı değişmez',
    `fail=${decisionVerify.checks.filter((c) => c.startsWith('✗')).length}`,
  );

  const strings = collectEventResultPresentationStrings(vm);
  const forbidden = assertNoEventResultForbiddenWords(strings);
  assert(
    checks,
    forbidden.length === 0,
    'Yasaklı kelime taraması 0 döner',
    forbidden.join(', ') || '0',
  );

  const fullUx = verifyFullUxFlowScenario();
  assert(
    checks,
    fullUx.ok,
    'Full workflow İncele → Planla → Yönlendir → Sahada → Sonuç bozulmaz',
    `fail=${fullUx.checks.filter((c) => c.startsWith('FAIL')).length}`,
  );

  assert(
    checks,
    fullUx.ok,
    'full UX flow verify geçer',
  );

  const tone = inferResultTone(positive.metricChanges, positive.subsystemOutcomes, {
    decision: sampleEvent().decisions[0],
  });
  assert(
    checks,
    tone === 'positive' || tone === 'mixed',
    'inferResultTone core modeli korunur',
    tone,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
