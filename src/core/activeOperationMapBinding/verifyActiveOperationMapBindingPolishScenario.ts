import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import {
  buildActiveOperationMapBinding,
  buildPolishedActiveOperationMapCard,
  ctaLabelForPortfolioStatus,
  resolveActiveOperationIdentity,
  resolveOperationActionPresentation,
} from '@/core/activeOperationMapBinding';
import { buildDailyCapacityRuntimeSnapshot } from '@/core/dailyCapacityPortfolio/dailyCapacityRuntimeBindingModel';
import { buildMapGameplayBindings } from '@/core/mapGameplayBinding/mapGameplayBindingModel';
import { buildMapGameplayRuntimeFeedback } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackModel';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyActiveOperationMapBindingPolishOutcome = {
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
): EventCard {
  return {
    id,
    title,
    category: 'operations',
    riskLevel: 'medium',
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

function postPilotGameState(catalog: EventCard[], permissionIds: string[]): GameState {
  const seed = createDay1Seed();
  const dailySet: PostPilotDailyEventSet = {
    day: POST_PILOT_FIRST_OPERATION_DAY,
    anchorEventId: catalog[0].id,
    sideEventIds: catalog.slice(1).map((event) => event.id),
    allEventIds: catalog.map((event) => event.id),
    catalog,
    deferredEventIds: [catalog[2]?.id].filter((id): id is string => Boolean(id)),
  };

  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: POST_PILOT_FIRST_OPERATION_DAY },
    pilot: {
      ...seed.gameState.pilot,
      status: 'completed',
      authorityState: {
        ...seed.gameState.pilot.authorityState!,
        unlockedPermissionIds: permissionIds as never,
      },
      postPilotOperation: {
        phase: 'main_operation_light',
        scopes: {
          istasyon: 'dormant',
          yesilvadi: 'dormant',
          main_operation: 'active',
        },
        operationDay: POST_PILOT_FIRST_OPERATION_DAY,
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
      title: 'Rota',
      summary: 'Baski',
      sourceTags: ['route_source'],
    },
    containers: { status: 'stable', score: 40, title: 'K', summary: 'S', sourceTags: [] },
    districts: { status: 'watch', score: 52, title: 'G', summary: 'I', sourceTags: [] },
    personnel: { status: 'stable', score: 45, title: 'P', summary: 'S', sourceTags: [] },
    overall: { status: 'watch', score: 50, title: 'G', summary: 'I', sourceTags: [] },
  };
}

const HIGH_PERMISSIONS = [
  'inspect_basic_events',
  'resource_pressure_summary',
  'assignment_fit_preview',
  'advisor_specialist_notes_preview',
  'map_trust_layer',
];

export function verifyActiveOperationMapBindingPolishScenario(): VerifyActiveOperationMapBindingPolishOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION_FOR_VERIFY, 'SAVE_VERSION unchanged', `v${SAVE_VERSION}`));
  record(
    assert(
      checks,
      readRepo('src/core/activeOperationMapBinding/operationActionPresentation.ts').includes(
        'resolveOperationActionPresentation',
      ),
      'shared operation action helper exists',
      'helper missing',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/screens/MapScreen.tsx').includes('buildPolishedActiveOperationMapCard'),
      'MapScreen uses polished card',
      'MapScreen not wired',
    ),
  );

  const day1Binding = buildActiveOperationMapBinding({
    day: 1,
    activeEvent: makeEvent('evt_day1', 'Day1'),
    eventDetailRoute: '/events/evt_day1',
  });
  const day1Card = buildPolishedActiveOperationMapCard({
    day: 1,
    binding: day1Binding,
  });
  record(assert(checks, day1Card?.ctaLabel != null, 'Day 1 card fallback', 'day1 broken'));

  const catalog = [
    makeEvent('evt_high', 'Yuksek', 'Sanayi', 'sanayi'),
    makeEvent('evt_mid', 'Orta', 'Cumhuriyet', 'cumhuriyet'),
    makeEvent('evt_low', 'Dusuk', 'Merkez', 'merkez'),
  ];
  const gameState = postPilotGameState(catalog, HIGH_PERMISSIONS);
  const signals = operationSignalsFixture();
  const primary = catalog[0];
  const deferredId = catalog[2].id;

  const runtimeSnapshot = buildDailyCapacityRuntimeSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState,
    operationSignals: signals as never,
  });
  const mapBindings = buildMapGameplayBindings({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeEventIds: [primary.id],
    activeOperationContext: primary,
    operationSignals: signals as never,
  });
  const binding = buildActiveOperationMapBinding({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeEvent: primary,
    eventDetailRoute: `/events/${primary.id}`,
  });
  const feedback = buildMapGameplayRuntimeFeedback({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState,
    snapshot: runtimeSnapshot,
    mapGameplayBindings: mapBindings,
    activeOperationBinding: binding,
    deferredEventIds: [deferredId],
    explicitActiveEventId: primary.id,
    authorityEffectSnapshot: runtimeSnapshot.authorityEffectSnapshot,
  });

  const identity = resolveActiveOperationIdentity({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    explicitEventId: primary.id,
    binding,
    runtimeFeedback: feedback,
    deferredEventIds: [deferredId],
  });
  record(assert(checks, identity?.source === 'explicit_active', 'explicit active wins identity', identity?.source ?? 'none'));
  record(
    assert(
      checks,
      (identity?.priority ?? 0) >= (feedback.markers.find((m) => m.status === 'today_focus')?.priority ?? 0),
      'explicit active priority boost',
      `identity=${identity?.priority}`,
    ),
  );

  const polishedCard = buildPolishedActiveOperationMapCard({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    binding,
    runtimeFeedback: feedback,
    authorityEffectSnapshot: runtimeSnapshot.authorityEffectSnapshot,
    deferredEventIds: [deferredId],
    explicitEventId: primary.id,
    mitigationLine: runtimeSnapshot.portfolioDeferRisk.primaryBinding?.mitigationLine,
  });
  const marker = feedback.markers.find((entry) => entry.eventId === primary.id);
  record(
    assert(
      checks,
      polishedCard != null && marker != null && polishedCard.ctaLabel === marker.ctaLabel,
      'card and marker share CTA',
      `${polishedCard?.ctaLabel} vs ${marker?.ctaLabel}`,
    ),
  );

  const deferredMarker = feedback.markers.find((entry) => entry.eventId === deferredId);
  record(
    assert(
      checks,
      deferredMarker != null && !deferredMarker.isStartable && deferredMarker.isInspectable,
      'deferred visible not startable',
      `startable=${deferredMarker?.isStartable}`,
    ),
  );
  record(
    assert(
      checks,
      deferredMarker != null && !deferredMarker.ctaLabel.toLowerCase().includes('planla'),
      'deferred no direct start CTA',
      deferredMarker?.ctaLabel ?? 'missing',
    ),
  );

  const blockedPresentation = resolveOperationActionPresentation({
    status: 'blocked_by_capacity',
  });
  record(
    assert(
      checks,
      !blockedPresentation.isStartable &&
        (blockedPresentation.ctaLabel === 'Kapasiteyi kontrol et' ||
          blockedPresentation.ctaLabel === 'Erteleme etkisini gor'),
      'blocked_by_capacity CTA',
      blockedPresentation.ctaLabel,
    ),
  );

  const completedBinding = buildActiveOperationMapBinding({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeEvent: primary,
    assignment: {
      eventId: primary.id,
      day: POST_PILOT_FIRST_OPERATION_DAY,
      status: 'processed',
      source: 'player',
      personnelType: 'balanced_team',
      vehicleType: 'standard_truck',
      approachType: 'balanced_response',
      compatibilityScore: 80,
      compatibilityLabel: 'Dengeli uyum',
      effects: [],
    },
    resultRouteAvailable: true,
  });
  const completedCard = buildPolishedActiveOperationMapCard({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    binding: completedBinding,
    runtimeFeedback: feedback,
    explicitEventId: primary.id,
  });
  record(
    assert(
      checks,
      completedCard?.ctaLabel === 'Sonucu gor' || completedCard?.ctaLabel === 'Rapora git',
      'completed CTA',
      completedCard?.ctaLabel ?? 'missing',
    ),
  );

  const lockedPresentation = resolveOperationActionPresentation({ status: 'locked' });
  record(
    assert(
      checks,
      lockedPresentation.ctaLabel === 'Yetki gerekli' && !lockedPresentation.isStartable,
      'locked CTA',
      lockedPresentation.ctaLabel,
    ),
  );

  record(
    assert(
      checks,
      Boolean(polishedCard?.decisionLine?.includes('Yetki avantaji')),
      'authority line on polished card',
      polishedCard?.decisionLine ?? 'missing',
    ),
  );

  record(
    assert(
      checks,
      ctaLabelForPortfolioStatus('recommended') === 'Onceliklendir',
      'recommended CTA deterministic',
      'cta drift',
    ),
  );

  const deferredIdentity = resolveActiveOperationIdentity({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    explicitEventId: deferredId,
    binding: buildActiveOperationMapBinding({ day: POST_PILOT_FIRST_OPERATION_DAY, activeEvent: catalog[2] }),
    runtimeFeedback: feedback,
    deferredEventIds: [deferredId],
  });
  record(
    assert(
      checks,
      deferredIdentity?.isBlockedByCapacity === true && deferredIdentity.isStartable === false,
      'deferred identity blocked',
      `startable=${deferredIdentity?.isStartable}`,
    ),
  );

  return { ok, checks };
}
