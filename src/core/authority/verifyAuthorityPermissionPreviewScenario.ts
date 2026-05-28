import { createInitialAuthorityState } from './authoritySeed';
import type { AuthorityPermissionId } from './authorityTypes';
import {
  buildAuthorityPermissionPreviewLine,
  buildAuthorityPermissionPreviewTone,
  selectAuthorityPermissionPreviewForDecision,
} from './authorityPermissionPreview';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import { buildDecisionOptionCardPresentation } from '@/features/events/utils/decisionOptionCardIntegration';

export type VerifyAuthorityPermissionPreviewOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function baseDecision(overrides: Partial<EventDecision> = {}): EventDecision {
  return {
    id: 'decision_test',
    title: 'Test Kararı',
    description: 'Test açıklaması',
    style: 'balanced',
    effects: {
      publicSatisfaction: 4,
      budget: -8,
      morale: 2,
      risk: -2,
      xp: 10,
    },
    ...overrides,
  };
}

function baseEvent(overrides: Partial<EventCard> = {}): EventCard {
  return {
    id: 'event_test',
    title: 'Test Olayı',
    category: 'operations',
    riskLevel: 'medium',
    district: 'merkez',
    description: 'Test olay açıklaması',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [],
    previewEffects: {
      publicSatisfaction: 0,
      risk: 0,
      xp: 0,
    },
    ...overrides,
  };
}

export function verifyAuthorityPermissionPreviewScenario(): VerifyAuthorityPermissionPreviewOutcome {
  const checks: string[] = [];
  let ok = true;

  const undefinedPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: undefined,
    decision: baseDecision(),
    event: baseEvent(),
    day: 2,
  });
  ok =
    assert(
      checks,
      typeof undefinedPreview.visible === 'boolean' &&
        typeof undefinedPreview.line === 'string',
      'authorityState undefined iken preview crash olmaz',
      'Undefined authorityState crash',
    ) && ok;

  const lowImpactPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(2),
    decision: baseDecision({
      id: 'monitor_only',
      title: 'Durumu izle',
      description: 'Sadece monitor takibi',
      decisionStyle: 'communication',
      effects: {
        publicSatisfaction: 1,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 2,
      },
    }),
    event: baseEvent(),
    day: 2,
  });
  ok =
    assert(
      checks,
      lowImpactPreview.visible === false,
      'basic/low impact decision için visible false',
      'Low impact preview görünür kaldı',
    ) && ok;

  const dailyUnlockedState = {
    ...createInitialAuthorityState(3),
    authorityTrust: 180,
    unlockedPermissionIds: [
      'basic_operations',
      'daily_preparation_authority',
    ] as AuthorityPermissionId[],
  };
  const dailyActivePreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: dailyUnlockedState,
    decision: baseDecision({
      id: 'route_preparation',
      title: 'Günlük rota hazırlığı',
      description: 'Saha planı ve hazırlık',
      decisionStyle: 'planned',
    }),
    event: baseEvent({ day: 3 }),
    day: 3,
  });
  ok =
    assert(
      checks,
      dailyActivePreview.visible &&
        dailyActivePreview.tone === 'active' &&
        dailyActivePreview.requiredPermissionId === 'daily_preparation_authority',
      'daily_preparation_authority unlocked ise active tone döner',
      'Daily preparation active preview hatalı',
    ) && ok;

  const dailyLockedPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(3),
    decision: baseDecision({
      id: 'field_duty_plan',
      title: 'Saha hazırlık planı',
      description: 'Günlük field duty hazırlığı',
      decisionStyle: 'planned',
    }),
    event: baseEvent(),
    day: 3,
  });
  ok =
    assert(
      checks,
      dailyLockedPreview.visible &&
        dailyLockedPreview.tone === 'locked_preview' &&
        dailyLockedPreview.requiredPermissionId === 'daily_preparation_authority',
      'daily_preparation_authority locked ama eşleşme varsa locked_preview tone döner',
      'Daily preparation locked preview hatalı',
    ) && ok;

  const watchingPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: {
      ...createInitialAuthorityState(4),
      authorityTrust: 400,
      unlockedPermissionIds: [
        'basic_operations',
        'daily_preparation_authority',
        'field_priority_note',
        'promotion_review_eligible',
      ],
    },
    decision: baseDecision({
      id: 'crisis_response',
      title: 'Kritik müdahale',
      description: 'Yüksek riskli kriz müdahalesi',
      decisionStyle: 'risk',
    }),
    event: baseEvent({
      riskLevel: 'critical',
      filterTags: ['crisis'],
    }),
    day: 4,
  });
  ok =
    assert(
      checks,
      watchingPreview.visible &&
        watchingPreview.tone === 'watching' &&
        watchingPreview.requiredPermissionId === 'promotion_review_eligible',
      'promotion_review_eligible high severity event için watching tone döner',
      'Promotion review watching preview hatalı',
    ) && ok;

  const operationsPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(5),
    decision: baseDecision({
      id: 'permanent_fix',
      title: 'Kalıcı çözüm uygula',
      description: 'permanent_solution ile kalıcı müdahale',
      decisionStyle: 'permanent',
    }),
    event: baseEvent({ category: 'permanent_solution' }),
    day: 5,
  });
  ok =
    assert(
      checks,
      operationsPreview.visible &&
        operationsPreview.requiredPermissionId === 'operations_responsible_scope',
      'operations_responsible_scope permanent_solution için preview döner',
      'Operations responsible preview hatalı',
    ) && ok;

  const districtPreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(5),
    decision: baseDecision({
      id: 'district_signal',
      title: 'Bölge sinyali koordine et',
      description: 'Multi-neighborhood district signal',
    }),
    event: baseEvent({
      districtIds: ['merkez', 'sanayi', 'yesilvadi'],
      description: 'District signal across neighborhoods',
    }),
    day: 5,
  });
  ok =
    assert(
      checks,
      districtPreview.visible &&
        districtPreview.requiredPermissionId === 'district_expansion_preview',
      'district_expansion_preview multi-neighborhood/district event için preview döner',
      'District expansion preview hatalı',
    ) && ok;

  const day1Preview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(1),
    decision: baseDecision({
      id: 'day1_plan',
      title: 'Günlük hazırlık',
      description: 'route_preparation planı',
      decisionStyle: 'planned',
    }),
    event: baseEvent({ day: 1 }),
    day: 1,
  });
  ok =
    assert(
      checks,
      day1Preview.visible === false,
      'Day 1 tutorial kararlarında preview gizli veya compact güvenli kalır',
      'Day 1 preview gizlenmedi',
    ) && ok;

  const unknownShapePreview = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(2),
    decision: { foo: 'bar' },
    event: { baz: 1 },
    day: 2,
  });
  ok =
    assert(
      checks,
      unknownShapePreview.visible === false,
      'Unknown decision shape crash üretmez',
      'Unknown decision shape crash',
    ) && ok;

  const toneLocked = buildAuthorityPermissionPreviewTone(
    'operations_responsible_scope',
    false,
  );
  const lineLocked = buildAuthorityPermissionPreviewLine(
    'operations_responsible_scope',
    toneLocked,
  );
  ok =
    assert(
      checks,
      toneLocked === 'locked_preview' &&
        lineLocked.title === 'İleri yetkide güçlenir' &&
        lineLocked.line.includes('Operasyon Sorumlusu'),
      'Preview helper satırları güvenli üretilir',
      'Preview helper hatalı',
    ) && ok;

  const beforeDecision = baseDecision({
    id: 'dispatch_team',
    title: 'Ekibi sevk et',
    description: 'dispatch saha müdahalesi',
    effects: {
      publicSatisfaction: 6,
      budget: -12,
      morale: 1,
      risk: -3,
      xp: 12,
    },
  });
  const decisionClone = { ...beforeDecision, effects: { ...beforeDecision.effects } };
  selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(3),
    decision: beforeDecision,
    event: baseEvent(),
    day: 3,
  });
  ok =
    assert(
      checks,
      decisionClone.effects.publicSatisfaction === 6 &&
        decisionClone.effects.budget === -12,
      'Preview applyDecision sonucunu değiştirmez',
      'Preview decision mutate etti',
    ) && ok;

  const cardPresentation = buildDecisionOptionCardPresentation({
    event: baseEvent(),
    decision: baseDecision({
      id: 'plain_decision',
      title: 'Standart müdahale',
      description: 'Genel operasyon',
    }),
    variant: 'full',
  });
  ok =
    assert(
      checks,
      cardPresentation.strategyLabel.length > 0 &&
        cardPresentation.tradeoff.length > 0 &&
        cardPresentation.insufficient === false,
      'DecisionOptionCard preview yokken eski render davranışını korur',
      'DecisionOptionCard presentation bozuldu',
    ) && ok;

  return { ok, checks };
}
