import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import { mapEventToContentCategory } from '@/core/events/eventVariationEngine';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import {
  buildCompactDecisionImpactSummary,
  buildDecisionShortTradeoff,
  buildEventDetailHeaderChips,
  buildPrimaryDecisionImpacts,
  formatDecisionPriorityFitLabel,
  getDecisionOptionVariantConfig,
  getDecisionPriorityFit,
  getDecisionRiskLevel,
  getDecisionStrategyLabel,
  getDecisionStrategyTone,
  getUnavailableDecisionReason,
} from '@/features/events/utils/decisionTradeoffPresentation';
import {
  buildDecisionOptionCardPresentation,
  buildEventDetailDecisionListItems,
  buildQuickDecisionCardItems,
  isDecisionSelectable,
} from '@/features/events/utils/decisionOptionCardIntegration';
import type { ResolvedQuickAction } from '@/features/events/utils/eventDetailDecisionUtils';

export type VerifyDecisionTradeoffUiOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(checks: string[], label: string, condition: boolean): void {
  checks.push(condition ? `✓ ${label}` : `✗ ${label}`);
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

function event(partial: Partial<EventCard> & Pick<EventCard, 'id' | 'title'>): EventCard {
  return {
    category: 'waste',
    riskLevel: 'medium',
    district: 'Merkez',
    description: 'Test',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    ...partial,
  };
}

const LONG_TR =
  'Çok uzun Türkçe karar başlığı ve açıklama metni mobil ekranda taşmamalı diye kısaltılmalıdır';

export function verifyDecisionTradeoffUiScenario(): VerifyDecisionTradeoffUiOutcome {
  const checks: string[] = [];

  const archetypes: Array<{
    label: string;
    decision: EventDecision;
    expected: string;
  }> = [
    {
      label: 'fast dispatch',
      decision: decision({
        id: 'd1',
        title: 'Hızlı',
        contentStrategyLabel: 'Hızlı çözüm',
        decisionStyle: 'fast',
      }),
      expected: 'Hızlı Müdahale',
    },
    {
      label: 'balanced',
      decision: decision({
        id: 'd2',
        title: 'Denge',
        contentStrategyLabel: 'Dengeli plan',
      }),
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

  for (const item of archetypes) {
    assert(
      checks,
      `archetype ${item.label} strategy label`,
      getDecisionStrategyLabel(item.decision) === item.expected,
    );
  }

  const unknown = decision({ id: 'unk', title: 'Bilinmeyen', style: 'cautious' });
  assert(
    checks,
    'unknown decision fallback strategy',
    getDecisionStrategyLabel(unknown) === 'Dengeli Plan',
  );

  assert(
    checks,
    'daily priority yokken priority fit null',
    getDecisionPriorityFit(decision({ id: 'p0', title: 'T' }), undefined) === null,
  );
  assert(
    checks,
    'daily priority yokken chip label null',
    formatDecisionPriorityFitLabel(null) === null,
  );

  const commPublic = decision({
    id: 'comm',
    title: 'Açıklama',
    contentStrategyLabel: 'Sosyal rahatlama',
    contentPriorityHint: 'Sosyal rahatlama',
    decisionStyle: 'communication',
  });
  assert(
    checks,
    'public_relief + communication supports',
    getDecisionPriorityFit(commPublic, 'public_relief') === 'supports',
  );

  const reroute = decision({
    id: 'route',
    title: 'Rota',
    contentPriorityHint: 'Operasyonel kazanım',
  });
  assert(
    checks,
    'operation_stability + reroute supports',
    getDecisionPriorityFit(reroute, 'operation_stability') === 'supports',
  );

  const dispatch = decision({
    id: 'disp',
    title: 'Ekip',
    contentPriorityHint: 'Önceliği destekler',
    decisionStyle: 'fast',
  });
  assert(
    checks,
    'operation_stability + dispatch supports',
    getDecisionPriorityFit(dispatch, 'operation_stability') === 'supports',
  );

  const monitor = decision({
    id: 'mon',
    title: 'İzle',
    contentStrategyLabel: 'Kaynak korur',
    contentPriorityHint: 'Önceliği destekler',
    decisionStyle: 'planned',
  });
  assert(
    checks,
    'resource_protection + monitor supports',
    getDecisionPriorityFit(monitor, 'resource_protection') === 'supports',
  );

  const fastResource = decision({
    id: 'fast_r',
    title: 'Hızlı',
    contentPriorityHint: 'Kaynak baskısı',
    decisionStyle: 'fast',
  });
  assert(
    checks,
    'resource_protection + fast dispatch resource_pressure',
    getDecisionPriorityFit(fastResource, 'resource_protection') === 'resource_pressure',
  );

  const permanent = decision({
    id: 'perm',
    title: 'Yatırım',
    decisionStyle: 'permanent',
    costs: { budget: 12000 },
    effects: { publicSatisfaction: 5, budget: -12000, morale: 0, risk: -2, xp: 10 },
  });
  const permEvent = event({
    id: 'e_perm',
    title: 'Kalıcı düzenleme',
    category: 'infrastructure',
    eventType: 'permanent_solution',
  });
  const permTradeoff = buildDecisionShortTradeoff(permanent, permEvent);
  assert(
    checks,
    'permanent_solution bütçe tradeoff',
    permTradeoff.includes('bütçe') || permTradeoff.includes('Bütçe'),
  );

  const sampleDecisions = [
    decision({ id: 's1', title: 'A', decisionStyle: 'fast' }),
    decision({ id: 's2', title: 'B', contentShortTradeoff: 'Kısa metin' }),
    decision({ id: 's3', title: 'C', style: 'risky', decisionStyle: 'risk' }),
  ];
  const sampleEvent = event({ id: 'e1', title: 'Olay', category: 'waste', eventType: 'waste' });
  for (const d of sampleDecisions) {
    const t = buildDecisionShortTradeoff(d, sampleEvent);
    assert(checks, `tradeoff boş değil (${d.id})`, t.length > 0);
  }

  const longTradeoff = buildDecisionShortTradeoff(
    decision({
      id: 'long',
      title: 'L',
      contentShortTradeoff: `${'A'.repeat(120)} uzun metin sonu`,
    }),
    sampleEvent,
  );
  assert(checks, 'tradeoff truncate 95 char', longTradeoff.length <= 95);

  const impacts = buildPrimaryDecisionImpacts({
    event: event({
      id: 'e_soc',
      title: 'Sosyal',
      category: 'social',
      eventType: 'social_media',
    }),
    decision: decision({ id: 'soc_d', title: 'Yayın', decisionStyle: 'communication' }),
    dailyPriorityKey: 'public_relief',
    personnelPreview: {
      estimatedFatigueGain: 8,
      estimatedMoraleDelta: -2,
      estimatedSuccessLevel: 'low',
      riskLevel: 'high',
      shortText: 'Yorgunluk artar',
      riskText: 'Yüksek yorgunluk',
      available: true,
      decisionLine: 'Yorgunluk +8',
      decisionRiskLine: 'Yorgunluk +8',
      mistakeRiskLevel: 'high',
      competencyText: null,
      decisionMistakeLine: 'Hata riski yüksek',
    },
    vehiclePreview: {
      available: true,
      action: 'dispatch_collection',
      workloadDelta: 2,
      fuelDelta: 1,
      conditionDelta: 0,
      maintenanceDelta: 1,
      breakdownRiskDelta: 0.1,
      shouldShow: true,
      shortText: 'Rota yükü',
      riskText: 'Bakım riski',
      riskLevel: 'medium',
    },
  });
  const primary = impacts.slice(0, 2);
  assert(checks, 'primary impacts en fazla 2 slice', primary.length <= 2);
  assert(
    checks,
    'high risk impact primary listte',
    primary.some((i) => i.tone === 'risk' || i.tone === 'warning'),
  );
  const extra = buildCompactDecisionImpactSummary(impacts);
  assert(
    checks,
    'compact summary +N etki',
    impacts.length > 2 ? extra != null && extra.includes('+') : extra === null,
  );

  const affordability: DecisionAffordabilityCheck = {
    canAfford: false,
    cost: 5000,
    formattedCost: '5.000',
    formattedMissingSource: '2.000 Kaynak',
    currentSource: 3000,
    missingSource: 2000,
  };
  assert(
    checks,
    'disabled unavailable reason',
    getUnavailableDecisionReason(affordability) === 'Kaynak yetersiz',
  );

  const minimalEvent = event({ id: 'min', title: 'Min' });
  const minimalDecision = decision({ id: 'md', title: 'Karar' });
  assert(
    checks,
    'missing personnel preview crash yok',
    buildPrimaryDecisionImpacts({
      event: minimalEvent,
      decision: minimalDecision,
      personnelPreview: null,
      vehiclePreview: undefined,
    }).length >= 0,
  );
  assert(
    checks,
    'missing vehicle preview crash yok',
    getDecisionRiskLevel(minimalDecision, {
      event: minimalEvent,
      vehiclePreview: null,
    }) != null,
  );
  assert(
    checks,
    'missing container context crash yok',
    buildPrimaryDecisionImpacts({ event: minimalEvent, decision: minimalDecision }).length >= 0,
  );
  assert(
    checks,
    'missing social preview crash yok',
    buildPrimaryDecisionImpacts({
      event: event({ id: 'e2', title: 'Genel', category: 'general' }),
      decision: minimalDecision,
    }).length >= 0,
  );
  assert(
    checks,
    'butterfly/carry-over meta yok crash yok',
    buildDecisionShortTradeoff(minimalDecision, minimalEvent).length > 0,
  );

  const longLabel = getDecisionStrategyLabel(
    decision({ id: 'lt', title: LONG_TR, contentStrategyLabel: LONG_TR }),
  );
  assert(checks, 'long Turkish strategy label string', typeof longLabel === 'string');

  const headerNoPriority = buildEventDetailHeaderChips({
    event: minimalEvent,
    neighborhoodLabel: 'Kadıköy',
    dailyPriorityKey: undefined,
  });
  assert(checks, 'header chips priority yokken crash yok', headerNoPriority.length <= 3);

  const headerWithPriority = buildEventDetailHeaderChips({
    event: minimalEvent,
    neighborhoodLabel: 'Kadıköy',
    dailyPriorityKey: 'public_relief' as DailyPriorityKey,
    rhythmLabel: 'Gün 2',
  });
  assert(checks, 'header chips max 3', headerWithPriority.length <= 3);

  assert(
    checks,
    'waste_container category map',
    mapEventToContentCategory(
      event({ id: 'wc', title: 'Atık', category: 'waste', eventType: 'waste' }),
    ) === 'waste_container',
  );

  const tone = getDecisionStrategyTone(
    decision({ id: 't1', title: 'X', decisionStyle: 'fast' }),
  );
  assert(checks, 'strategy tone fast action', tone === 'action');

  const fullConfig = getDecisionOptionVariantConfig('full');
  const compactConfig = getDecisionOptionVariantConfig('compact');
  const quickConfig = getDecisionOptionVariantConfig('quick');
  assert(checks, 'full variant max 2 impacts', fullConfig.maxPrimaryImpacts === 2);
  assert(checks, 'compact variant max 1 impact', compactConfig.maxPrimaryImpacts === 1);
  assert(checks, 'quick variant no priority chip', quickConfig.showPriorityChip === false);
  assert(checks, 'compact variant no detail impact', compactConfig.showDetailImpact === false);

  const integrationEvent = event({
    id: 'e_int',
    title: 'Entegrasyon',
    decisions: [
      decision({ id: 'd_a', title: 'A', decisionStyle: 'fast' }),
      decision({ id: 'd_b', title: 'B', decisionStyle: 'communication' }),
      decision({ id: 'd_c', title: 'C', decisionStyle: 'planned' }),
    ],
  });
  const quickActions: ResolvedQuickAction[] = [
    {
      kind: 'assign',
      title: 'Gönder',
      subtext: 'Ekip',
      icon: 'navigate-outline',
      decision: integrationEvent.decisions[0]!,
    },
    {
      kind: 'communicate',
      title: 'İletişim',
      subtext: 'Açıkla',
      icon: 'chatbubble-outline',
      decision: integrationEvent.decisions[1]!,
    },
  ];
  const quickItems = buildQuickDecisionCardItems(integrationEvent, quickActions);
  assert(checks, 'quick card items üretilir', quickItems.length === 2);
  assert(
    checks,
    'onSelect decision id korunur',
    quickItems[0]!.decisionId === 'd_a' && quickItems[1]!.decisionId === 'd_b',
  );

  const listItems = buildEventDetailDecisionListItems(integrationEvent, {
    excludeDecisionIds: ['d_a', 'd_b'],
  });
  assert(checks, 'event detail list exclude quick', listItems.length === 1);
  assert(checks, 'event detail list kalan karar', listItems[0]!.decisionId === 'd_c');

  const disabledAffordability: DecisionAffordabilityCheck = {
    canAfford: false,
    cost: 100,
    formattedCost: '100',
    formattedMissingSource: '50 Kaynak',
    currentSource: 50,
    missingSource: 50,
  };
  assert(checks, 'disabled decision seçilemez', !isDecisionSelectable(disabledAffordability));
  assert(checks, 'free decision seçilebilir', isDecisionSelectable(undefined));

  assert(
    checks,
    'contentStrategyLabel missing fallback',
    getDecisionStrategyLabel(decision({ id: 'fb', title: 'T' })) === 'Dengeli Plan',
  );
  assert(
    checks,
    'shortTradeoff missing fallback',
    buildDecisionShortTradeoff(decision({ id: 'fb2', title: 'T' }), minimalEvent).length > 0,
  );
  assert(
    checks,
    'dailyPriority missing priority chip data',
    formatDecisionPriorityFitLabel(getDecisionPriorityFit(decision({ id: 'p', title: 'T' }), undefined)) ===
      null,
  );

  for (const variant of ['full', 'compact', 'quick'] as const) {
    const pres = buildDecisionOptionCardPresentation({
      event: minimalEvent,
      decision: minimalDecision,
      variant,
    });
    assert(
      checks,
      `${variant} variant presentation crash yok`,
      pres.strategyLabel.length > 0 && pres.tradeoff.length > 0,
    );
    if (variant === 'quick') {
      assert(
        checks,
        'quick variant priority chip gizli',
        pres.showPriorityChip === false,
      );
      assert(checks, 'quick variant max 1 impact', pres.primaryImpacts.length <= 1);
    }
    if (variant === 'full') {
      assert(checks, 'full variant detail impact path', typeof pres.showDetail === 'boolean');
    }
  }

  const screenListItems = buildEventDetailDecisionListItems(integrationEvent, {
    excludeDecisionIds: quickItems.map((i) => i.decisionId),
    affordabilityByDecisionId: { d_c: disabledAffordability },
  });
  assert(
    checks,
    'event detail screen required list items',
    screenListItems.length === 1 && screenListItems[0]!.decisionId === 'd_c',
  );
  assert(
    checks,
    'event detail screen affordability bağlı',
    screenListItems[0]!.affordability === disabledAffordability,
  );

  const longTitlePres = buildDecisionOptionCardPresentation({
    event: minimalEvent,
    decision: decision({
      id: 'long_t',
      title: LONG_TR,
      contentShortTradeoff: `${'B'.repeat(120)} son`,
    }),
    variant: 'quick',
  });
  assert(
    checks,
    'long title/tradeoff presentation safe',
    longTitlePres.tradeoff.length <= 95 && longTitlePres.strategyLabel.length > 0,
  );

  assert(
    checks,
    'applyDecision decision id referansları geçerli',
    integrationEvent.decisions.every(
      (d) => typeof d.id === 'string' && integrationEvent.decisions.some((x) => x.id === d.id),
    ),
  );

  const ok = checks.every((c) => c.startsWith('✓'));
  return { ok, checks };
}
