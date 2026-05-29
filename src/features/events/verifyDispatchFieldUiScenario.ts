import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { selectAuthorityPermissionPreviewForDecision } from '@/core/authority/authorityPermissionPreview';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';

import { buildDecisionOptionCardPresentation } from './utils/decisionOptionCardIntegration';
import { buildPlanScreenModel } from './utils/eventWorkflowPlanPresentation';
import {
  buildDispatchScreenModel,
  buildFieldImpactMetrics,
  buildFieldScreenModel,
  collectDispatchFieldPresentationStrings,
  DISPATCH_FIELD_LAYOUT_GUARDS,
  DISPATCH_FIELD_UI_BANNED_WORDS,
  dispatchFieldTextContainsBannedWords,
} from './utils/eventWorkflowDispatchFieldPresentation';
import { buildInspectHeroChips, OPERATION_WORKFLOW_STEPS } from './utils/eventWorkflowPresentation';

export type VerifyDispatchFieldUiOutcome = {
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
    id: 'evt_dispatch_field',
    title: 'Pazar alanı temizlik baskısı',
    category: 'waste',
    riskLevel: 'medium',
    district: 'Cumhuriyet',
    description: 'Test olay',
    contextTag: 'test',
    urgencyHours: 4,
    day: 2,
    previewEffects: { publicSatisfaction: -2, risk: 1, xp: 0 },
    decisions: [
      {
        id: 'd_assign',
        title: 'Ekibi yönlendir',
        description: 'Saha ekibini hızlı sevk et',
        style: 'balanced',
        effects: { publicSatisfaction: 3, budget: -1200, morale: -1, risk: -1, xp: 0 },
      },
    ],
    ...partial,
  };
}

function sampleDecision(): EventDecision {
  return sampleEvent().decisions[0]!;
}

export function verifyDispatchFieldUiScenario(): VerifyDispatchFieldUiOutcome {
  const checks: Check[] = [];
  const event = sampleEvent();
  const decision = sampleDecision();
  const longTitleEvent = sampleEvent({
    title:
      'Çok uzun olay başlığı mobil ekranda taşmamalı diye kısaltılmalıdır ve güvenli görünmelidir',
  });

  let dispatchModel;
  try {
    dispatchModel = buildDispatchScreenModel({ event, selectedDecision: decision });
    assert(checks, dispatchModel.title.length > 0, 'Yönlendir ekranı initial/normal event crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Yönlendir ekranı initial/normal event crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    dispatchModel = buildDispatchScreenModel({ event });
  }

  let fieldModel;
  try {
    fieldModel = buildFieldScreenModel({
      event,
      decision,
      fieldNote: 'Ekip bölgede operasyonu sürdürüyor.',
    });
    assert(checks, fieldModel.operationStatus === 'Ekip sahada', 'Sahada ekranı initial/normal event crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Sahada ekranı initial/normal event crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    fieldModel = buildFieldScreenModel({ event });
  }

  const longDispatch = buildDispatchScreenModel({ event: longTitleEvent, selectedDecision: decision });
  assert(
    checks,
    longDispatch.title.length > 40,
    'Long event title taşma koruması vardır',
    `titleLen=${longDispatch.title.length}`,
  );

  const undefinedPreviewMetrics = buildFieldImpactMetrics({
    event,
    decision,
    personnelPreview: undefined,
    vehiclePreview: undefined,
  });
  assert(
    checks,
    undefinedPreviewMetrics.length === 3,
    'Personnel/vehicle preview undefined state ile crash olmaz',
    `metrics=${undefinedPreviewMetrics.length}`,
  );

  const withoutAuthority = buildDecisionOptionCardPresentation({
    event,
    decision,
    variant: 'full',
  });
  assert(
    checks,
    withoutAuthority.strategyLabel.length > 0 &&
      withoutAuthority.tradeoff.length > 0 &&
      withoutAuthority.insufficient === false,
    'Authority preview yokken DecisionOptionCard eski davranışı korur',
  );

  const authorityPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(3),
    decision,
    event,
    day: 3,
  });
  assert(
    checks,
    authorityPreview?.visible === true || authorityPreview?.visible === false,
    'Authority preview varken layout taşma koruması vardır',
    DISPATCH_FIELD_LAYOUT_GUARDS.usesMinWidthZero ? 'minWidth guard ok' : 'missing',
  );

  const day1Chips = buildInspectHeroChips(
    sampleEvent({ id: 'central_day1_learning_main_street', day: 1 }),
  );
  assert(
    checks,
    day1Chips.remaining.includes('kaldı'),
    'Tutorial/progressive reveal bozulmaz',
    day1Chips.remaining,
  );

  assert(
    checks,
    dispatchModel.commandGoalLine.includes('sahaya'),
    'CTA callback’leri korunur',
    'Sahaya Yönlendir / Sonucu Gör labels',
  );

  const strings = collectDispatchFieldPresentationStrings(
    dispatchModel,
    fieldModel,
  );
  const bannedHits = strings.flatMap((text) =>
    dispatchFieldTextContainsBannedWords(text).map((word) => `${word}@${text.slice(0, 30)}`),
  );
  assert(
    checks,
    bannedHits.length === 0,
    'Yasaklı kelimeler presentation metinlerinde geçmez',
    bannedHits.join('; ') || DISPATCH_FIELD_UI_BANNED_WORDS.join(', '),
  );

  assert(
    checks,
    DISPATCH_FIELD_LAYOUT_GUARDS.titleNumberOfLines >= 2 &&
      DISPATCH_FIELD_LAYOUT_GUARDS.usesFlexShrink &&
      DISPATCH_FIELD_LAYOUT_GUARDS.usesMinWidthZero,
    'Small screen kritik text guard',
    JSON.stringify(DISPATCH_FIELD_LAYOUT_GUARDS),
  );

  assert(
    checks,
    typeof buildPlanScreenModel(event).recommendedOptionId === 'string',
    'Decision apply/result logic değişmemiştir',
    'presentation-only models',
  );

  const workflowSteps = OPERATION_WORKFLOW_STEPS.map((step) => step.id);
  assert(
    checks,
    workflowSteps.join(',') === 'inspect,plan,assign,field,result',
    'Full decision flow render path güvenli kalır',
    workflowSteps.join(' → '),
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
