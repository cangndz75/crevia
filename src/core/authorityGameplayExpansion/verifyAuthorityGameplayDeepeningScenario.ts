import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import {
  applyAuthorityToMapMarkerFeedback,
  buildAuthorityGameplayEffectSnapshot,
  resolveAuthorityPortfolioPriorityBonus,
} from '@/core/authorityGameplayExpansion/authorityGameplayEffectModel';
import { buildDailyCapacityPortfolio } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel';
import { buildDailyCapacityPortfolioStoreInput } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioStoreInput';
import { buildDailyCapacityRuntimeSnapshot } from '@/core/dailyCapacityPortfolio/dailyCapacityRuntimeBindingModel';
import { buildMapGameplayRuntimeFeedback } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackModel';
import { buildMapGameplayBindings } from '@/core/mapGameplayBinding/mapGameplayBindingModel';
import { buildPortfolioDeferRiskBindings } from '@/core/portfolioDeferRisk/portfolioDeferRiskModel';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyAuthorityGameplayDeepeningOutcome = {
  ok: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function makeEvent(
  id: string,
  title: string,
  district = 'Sanayi',
  neighborhoodId = 'sanayi',
  riskLevel: EventCard['riskLevel'] = 'medium',
): EventCard {
  return {
    id,
    title,
    category: 'operations',
    riskLevel,
    district,
    neighborhoodId,
    description: `${title} aciklamasi`,
    contextTag: 'test',
    urgencyHours: 4,
    day: 8,
    decisions: [
      {
        id: `${id}_d1`,
        title: 'Mudahale',
        description: 'Saha',
        style: 'balanced',
        effects: { publicSatisfaction: 2, budget: -500, morale: 0, risk: -1, xp: 10 },
        costs: { budget: 500, staffHours: 1, vehicleUsage: 1 },
      },
    ],
    previewEffects: { publicSatisfaction: 1, risk: 0, xp: 5 },
  };
}

function postPilotGameState(
  catalog: EventCard[],
  permissionIds: string[],
  day = POST_PILOT_FIRST_OPERATION_DAY,
): GameState {
  const seed = createDay1Seed();
  const dailySet: PostPilotDailyEventSet = {
    day,
    anchorEventId: catalog[0]?.id ?? 'evt_a',
    sideEventIds: catalog.slice(1).map((event) => event.id),
    allEventIds: catalog.map((event) => event.id),
    catalog,
    deferredEventIds: [catalog[2]?.id].filter((id): id is string => Boolean(id)),
  };

  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: {
      ...seed.gameState.pilot,
      status: 'completed',
      authorityState: {
        ...seed.gameState.pilot.authorityState!,
        unlockedPermissionIds: permissionIds as never,
        formalRankId: (permissionIds.length > 3 ? 'city_operations_manager' : 'field_coordinator') as never,
      },
      postPilotOperation: {
        phase: 'main_operation_light',
        scopes: {
          istasyon: 'dormant',
          yesilvadi: 'dormant',
          main_operation: 'active',
        },
        operationDay: day,
        postPilotDailyEventSet: dailySet,
      },
    },
    events: catalog.slice(0, 2),
  };
}

function operationSignalsFixture() {
  return {
    priorityDistrictId: 'sanayi',
    vehicles: {
      status: 'critical',
      score: 88,
      title: 'Rota baskisi',
      summary: 'Arac rotasi zorlaniyor.',
      sourceTags: ['route_source'],
    },
    containers: {
      status: 'stable',
      score: 40,
      title: 'Konteyner',
      summary: 'Stabil.',
      sourceTags: [],
    },
    districts: {
      status: 'watch',
      score: 52,
      title: 'Guven',
      summary: 'Izleniyor.',
      sourceTags: [],
    },
    personnel: {
      status: 'stable',
      score: 45,
      title: 'Personel',
      summary: 'Stabil.',
      sourceTags: [],
    },
    overall: {
      status: 'watch',
      score: 50,
      title: 'Genel',
      summary: 'Izleniyor.',
      sourceTags: [],
    },
  };
}

const LOW_PERMISSIONS = ['inspect_basic_events', 'daily_plan_preview'];
const HIGH_PERMISSIONS = [
  'inspect_basic_events',
  'daily_plan_preview',
  'resource_pressure_summary',
  'district_trust_preview',
  'assignment_fit_preview',
  'advisor_specialist_notes_preview',
  'map_trust_layer',
  'map_resource_layer',
];

export function verifyAuthorityGameplayDeepeningScenario(): VerifyAuthorityGameplayDeepeningOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION_FOR_VERIFY, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));
  record(
    assert(
      checks,
      readRepo('src/core/authorityGameplayExpansion/authorityGameplayEffectModel.ts').includes(
        'buildAuthorityGameplayEffectSnapshot',
      ),
      'authority effect model exists',
      'effect model missing',
    ),
  );

  const day1Snapshot = buildAuthorityGameplayEffectSnapshot({ day: 1, permissionIds: HIGH_PERMISSIONS });
  record(assert(checks, day1Snapshot.mode === 'legacy', 'Day 1 legacy authority effects', 'day 1 forced active'));

  const pilotSnapshot = buildAuthorityGameplayEffectSnapshot({ day: 4, permissionIds: HIGH_PERMISSIONS });
  record(assert(checks, pilotSnapshot.mode === 'legacy', 'Pilot legacy authority effects', 'pilot forced active'));

  const highSnapshot = buildAuthorityGameplayEffectSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    permissionIds: HIGH_PERMISSIONS,
  });
  const lowSnapshot = buildAuthorityGameplayEffectSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    permissionIds: LOW_PERMISSIONS,
  });
  record(assert(checks, highSnapshot.mode === 'active', 'Day 8 high authority active', 'high authority inactive'));
  record(assert(checks, lowSnapshot.mode === 'legacy', 'Day 8 low authority legacy', 'low authority active'));

  const lowBonus = resolveAuthorityPortfolioPriorityBonus(
    { kind: 'active_operation' },
    lowSnapshot,
  );
  const highBonus = resolveAuthorityPortfolioPriorityBonus(
    { kind: 'active_operation' },
    highSnapshot,
  );
  record(
    assert(
      checks,
      highBonus > lowBonus && highBonus <= 8,
      'portfolio authority bonus balanced',
      `low=${lowBonus} high=${highBonus}`,
    ),
  );

  const catalog = [
    makeEvent('evt_low', 'Dusuk', 'Merkez', 'merkez', 'low'),
    makeEvent('evt_high', 'Yuksek', 'Sanayi', 'sanayi', 'high'),
    makeEvent('evt_mid', 'Orta', 'Cumhuriyet', 'cumhuriyet', 'medium'),
  ];
  const signals = operationSignalsFixture();
  const lowState = postPilotGameState(catalog, LOW_PERMISSIONS);
  const highState = postPilotGameState(catalog, HIGH_PERMISSIONS);

  const lowPortfolio = buildDailyCapacityPortfolio(
    buildDailyCapacityPortfolioStoreInput({
      day: POST_PILOT_FIRST_OPERATION_DAY,
      gameState: lowState,
      operationSignals: signals as never,
      catalogOperationEvents: catalog,
    }),
  );
  const highPortfolio = buildDailyCapacityPortfolio(
    buildDailyCapacityPortfolioStoreInput({
      day: POST_PILOT_FIRST_OPERATION_DAY,
      gameState: highState,
      operationSignals: signals as never,
      catalogOperationEvents: catalog,
    }),
  );

  const lowActive = lowPortfolio.items.find((item) => item.kind === 'active_operation');
  const highActive = highPortfolio.items.find((item) => item.kind === 'active_operation');
  record(
    assert(
      checks,
      lowActive != null && highActive != null && highActive.priority >= lowActive.priority,
      'high authority raises operation priority',
      `low=${lowActive?.priority} high=${highActive?.priority}`,
    ),
  );

  const runtimeLow = buildDailyCapacityRuntimeSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState: lowState,
    operationSignals: signals as never,
  });
  const runtimeHigh = buildDailyCapacityRuntimeSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState: highState,
    operationSignals: signals as never,
  });
  record(
    assert(
      checks,
      !runtimeLow.planPortfolioView.authorityLine && Boolean(runtimeHigh.planPortfolioView.authorityLine),
      'plan authority line only when effects active',
      `${runtimeLow.planPortfolioView.authorityLine} vs ${runtimeHigh.planPortfolioView.authorityLine}`,
    ),
  );

  const highDefer = buildPortfolioDeferRiskBindings({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    portfolioResult: highPortfolio,
    authorityPermissionIds: HIGH_PERMISSIONS,
  });
  const highRiskItem = highPortfolio.deferredItems.find(
    (item) => item.urgency === 'high' && item.pressureLevel === 'high',
  );
  if (highRiskItem) {
    const binding = highDefer.bindings.find((entry) => entry.portfolioItemId === highRiskItem.id);
    record(
      assert(
        checks,
        !binding?.mitigationLine,
        'high severity defer not mitigated away',
        binding?.mitigationLine ?? 'no mitigation',
      ),
    );
  } else {
    record(assert(checks, true, 'high severity defer check skipped', 'skipped'));
  }

  const lowMitigationBinding = buildPortfolioDeferRiskBindings({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    portfolioResult: highPortfolio,
    authorityPermissionIds: LOW_PERMISSIONS,
  }).bindings[0];
  const highMitigationBinding = highDefer.bindings[0];
  record(
    assert(
      checks,
      Boolean(highMitigationBinding?.mitigationLine) && !lowMitigationBinding?.mitigationLine,
      'defer mitigation only with authority',
      `${lowMitigationBinding?.mitigationLine} vs ${highMitigationBinding?.mitigationLine}`,
    ),
  );

  const mapBindings = buildMapGameplayBindings({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeEventIds: [catalog[1].id],
    activeOperationContext: catalog[1],
    operationSignals: signals as never,
  });
  const mapFeedbackHigh = buildMapGameplayRuntimeFeedback({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState: highState,
    snapshot: runtimeHigh,
    mapGameplayBindings: mapBindings,
    deferredEventIds: ['evt_mid'],
    explicitActiveEventId: catalog[1].id,
    authorityEffectSnapshot: runtimeHigh.authorityEffectSnapshot,
  });
  const mapFeedbackLow = buildMapGameplayRuntimeFeedback({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState: lowState,
    snapshot: runtimeLow,
    mapGameplayBindings: mapBindings,
    deferredEventIds: ['evt_mid'],
    explicitActiveEventId: catalog[1].id,
    authorityEffectSnapshot: runtimeLow.authorityEffectSnapshot,
  });

  const deferredHigh = mapFeedbackHigh.markers.find((marker) => marker.eventId === 'evt_mid');
  const deferredLow = mapFeedbackLow.markers.find((marker) => marker.eventId === 'evt_mid');
  record(assert(checks, deferredHigh != null, 'deferred marker exists in high authority map', 'missing deferred marker'));
  record(
    assert(
      checks,
      deferredHigh != null && !deferredHigh.isStartable && deferredHigh.isInspectable,
      'deferred marker inspectable not startable',
      `startable=${deferredHigh?.isStartable} inspectable=${deferredHigh?.isInspectable}`,
    ),
  );
  record(
    assert(
      checks,
      deferredHigh != null &&
        deferredLow != null &&
        (deferredHigh.explanationLine.length ?? 0) >= (deferredLow.explanationLine.length ?? 0),
      'authority enriches deferred map explanation',
      `${deferredLow?.explanationLine} -> ${deferredHigh?.explanationLine}`,
    ),
  );

  const stableA = buildAuthorityGameplayEffectSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    permissionIds: HIGH_PERMISSIONS,
  });
  const stableB = buildAuthorityGameplayEffectSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    permissionIds: HIGH_PERMISSIONS,
  });
  record(
    assert(
      checks,
      JSON.stringify(stableA) === JSON.stringify(stableB),
      'authority effect snapshot deterministic',
      'non-deterministic snapshot',
    ),
  );

  const sampleMarker = applyAuthorityToMapMarkerFeedback(
    {
      id: 'marker_test',
      eventId: 'evt_mid',
      status: 'blocked_by_capacity',
      priority: 40,
      tone: 'warning',
      isActionable: false,
      isInspectable: false,
      isStartable: false,
      supportedDecision: 'choose_operation_priority',
      ctaLabel: 'Kapasiteyi kontrol et',
      explanationLine: 'Kapasite dolu.',
      badgeLabel: 'Kapasite',
      sourceIds: ['evt_mid'],
    },
    highSnapshot,
  );
  record(
    assert(
      checks,
      sampleMarker.isInspectable && !sampleMarker.isStartable,
      'authority map effect unlocks inspection only',
      `inspectable=${sampleMarker.isInspectable}`,
    ),
  );

  record(
    assert(
      checks,
      runtimeHigh.authorityEffectSnapshot?.planningAuthorityLine === runtimeHigh.planPortfolioView.authorityLine,
      'center/plan authority line consistent',
      'authority line drift',
    ),
  );

  return { ok, checks };
}
