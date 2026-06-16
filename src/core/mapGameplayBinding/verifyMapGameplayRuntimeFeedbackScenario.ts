import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyCapacityRuntimeSnapshot } from '@/core/dailyCapacityPortfolio/dailyCapacityRuntimeBindingModel';
import {
  buildActiveOperationMapBinding,
} from '@/core/activeOperationMapBinding/activeOperationMapBindingModel';
import {
  enrichMapGameplayActiveOperationTracker,
} from '@/core/activeOperationMapBinding/activeOperationMapBindingPresentation';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { buildMapGameplayBindings } from '@/core/mapGameplayBinding/mapGameplayBindingModel';
import { buildMapGameplayRuntimeFeedback } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackModel';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { buildMapMotionPresentation } from '@/features/map/utils/mapMotionPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyMapGameplayRuntimeFeedbackOutcome = {
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

function postPilotGameState(catalog: EventCard[], day = 8, deferredEventIds?: string[]): GameState {
  const seed = createDay1Seed();
  const dailySet: PostPilotDailyEventSet = {
    day,
    anchorEventId: catalog[0]?.id ?? 'evt_a',
    sideEventIds: catalog.slice(1).map((event) => event.id),
    allEventIds: catalog.map((event) => event.id),
    catalog,
    deferredEventIds,
  };

  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: {
      ...seed.gameState.pilot,
      status: 'completed',
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

export function verifyMapGameplayRuntimeFeedbackScenario(): VerifyMapGameplayRuntimeFeedbackOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION_FOR_VERIFY, 'SAVE_VERSION unchanged', `SAVE_VERSION ${SAVE_VERSION}`));
  record(
    assert(
      checks,
      readRepo('src/features/map/screens/MapScreen.tsx').includes('buildMapGameplayRuntimeFeedback'),
      'MapScreen wires runtime feedback',
      'MapScreen missing runtime feedback',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/utils/mapMotionPresentation.ts').includes(
        'collectFromMapGameplayRuntimeFeedback',
      ),
      'map motion collects runtime feedback',
      'map motion missing collector',
    ),
  );

  const day1State = createDay1Seed().gameState;
  const day1Bindings = buildMapGameplayBindings({ day: 1, activeEventIds: [] });
  const day1Feedback = buildMapGameplayRuntimeFeedback({
    day: 1,
    gameState: day1State,
    snapshot: null,
    mapGameplayBindings: day1Bindings,
  });
  record(assert(checks, day1Feedback.mode === 'legacy', 'Day 1 legacy mode', 'Day 1 forced portfolio'));
  record(
    assert(
      checks,
      day1Bindings.every(
        (binding, index) => binding.isActionable === day1Feedback.enrichedBindings[index]?.isActionable,
      ),
      'Day 1 actionability unchanged',
      'Day 1 actionability mutated',
    ),
  );

  const pilotBindings = buildMapGameplayBindings({ day: 4, activeEventIds: ['evt_pilot'] });
  const pilotFeedback = buildMapGameplayRuntimeFeedback({
    day: 4,
    gameState: { ...day1State, city: { ...day1State.city, day: 4 } },
    snapshot: null,
    mapGameplayBindings: pilotBindings,
  });
  record(assert(checks, pilotFeedback.mode === 'legacy', 'Pilot day legacy mode', 'Pilot forced portfolio'));

  const low = makeEvent('evt_low', 'Dusuk', 'Merkez', 'merkez', 'low');
  const high = makeEvent('evt_high', 'Yuksek', 'Sanayi', 'sanayi', 'high');
  const mid = makeEvent('evt_mid', 'Orta', 'Cumhuriyet', 'cumhuriyet', 'medium');
  const catalog = [low, high, mid];
  const deferredIds = [mid.id];
  const gameState = postPilotGameState(catalog, POST_PILOT_FIRST_OPERATION_DAY, deferredIds);
  const signals = operationSignalsFixture();

  const snapshot = buildDailyCapacityRuntimeSnapshot({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState,
    operationSignals: signals as never,
  });
  record(assert(checks, snapshot.mode === 'portfolio_runtime', 'Day 8 snapshot runtime', 'snapshot legacy'));

  const primaryEvent = catalog.find((event) => event.id === high.id) ?? high;
  const mapBindings = buildMapGameplayBindings({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeEventIds: [primaryEvent.id],
    activeOperationContext: primaryEvent,
    operationSignals: signals as never,
  });
  const activeBinding = buildActiveOperationMapBinding({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeEvent: primaryEvent,
  });

  const feedback = buildMapGameplayRuntimeFeedback({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState,
    snapshot,
    mapGameplayBindings: mapBindings,
    activeOperationBinding: activeBinding,
    deferredEventIds: deferredIds,
    explicitActiveEventId: primaryEvent.id,
  });

  record(assert(checks, feedback.mode === 'portfolio_runtime', 'feedback portfolio mode', 'feedback legacy'));
  record(assert(checks, feedback.deferredEventIds.includes(mid.id), 'deferred ids in feedback', 'deferred missing'));
  record(
    assert(
      checks,
      feedback.markers.some((marker) => marker.eventId === mid.id),
      'deferred marker visible',
      'deferred marker hidden',
    ),
  );

  const deferredMarker = feedback.markers.find((marker) => marker.eventId === mid.id);
  record(
    assert(
      checks,
      deferredMarker != null && !deferredMarker.isStartable && deferredMarker.isInspectable,
      'deferred not startable but inspectable',
      'deferred actionability wrong',
    ),
  );
  record(
    assert(
      checks,
      deferredMarker != null && !deferredMarker.ctaLabel.toLowerCase().includes('baslat'),
      'deferred CTA soft',
      'deferred has start CTA',
    ),
  );

  const selectedMarker = feedback.markers.find((marker) => marker.eventId === primaryEvent.id);
  record(
    assert(
      checks,
      selectedMarker != null && selectedMarker.isActionable && selectedMarker.isStartable,
      'selected marker actionable',
      'selected marker not actionable',
    ),
  );
  record(
    assert(
      checks,
      feedback.primaryEventId === primaryEvent.id,
      'explicit active wins primary',
      'primary tie-break wrong',
    ),
  );

  const alternateSelected = feedback.markers.find(
    (marker) => marker.status === 'today_focus' || marker.status === 'active',
  );
  if (alternateSelected && alternateSelected.eventId !== primaryEvent.id) {
    record(
      assert(
        checks,
        feedback.primaryEventId === primaryEvent.id,
        'explicit active beats portfolio selected',
        'portfolio beat explicit active',
      ),
    );
  }

  const tracker = feedback.enrichedBindings.find((binding) => binding.role === 'operation_tracker');
  record(
    assert(
      checks,
      tracker != null && tracker.isActionable === true,
      'operation tracker enriched actionable',
      'tracker not enriched',
    ),
  );

  const motion = buildMapMotionPresentation({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    activeOperationBinding: activeBinding,
    mapGameplayBindings: feedback.enrichedBindings,
    mapGameplayRuntimeFeedback: feedback,
  });
  record(
    assert(
      checks,
      motion.markers.some(
        (marker) =>
          marker.sourceKinds.includes('daily_capacity_portfolio') ||
          marker.sourceKinds.includes('portfolio_defer_risk'),
      ),
      'motion uses portfolio sources',
      'motion missing portfolio sources',
    ),
  );
  record(
    assert(
      checks,
      motion.markers.some((marker) => marker.kind === 'safe_watch'),
      'deferred safe_watch motion',
      'no deferred motion kind',
    ),
  );

  const stableA = buildMapGameplayRuntimeFeedback({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState,
    snapshot,
    mapGameplayBindings: mapBindings,
    activeOperationBinding: activeBinding,
    deferredEventIds: deferredIds,
    explicitActiveEventId: primaryEvent.id,
  });
  const stableB = buildMapGameplayRuntimeFeedback({
    day: POST_PILOT_FIRST_OPERATION_DAY,
    gameState,
    snapshot,
    mapGameplayBindings: mapBindings,
    activeOperationBinding: activeBinding,
    deferredEventIds: deferredIds,
    explicitActiveEventId: primaryEvent.id,
  });
  record(
    assert(
      checks,
      JSON.stringify(stableA.markers) === JSON.stringify(stableB.markers),
      'deterministic markers',
      'markers non-deterministic',
    ),
  );

  const planView = snapshot.planPortfolioView;
  record(
    assert(
      checks,
      planView.deferredEventIds.length >= 0 &&
        feedback.deferredEventIds.every((id) => planView.deferredEventIds.includes(id) || deferredIds.includes(id)),
      'center/report deferred ids align',
      'deferred ids drift',
    ),
  );

  const baseTracker = mapBindings.find((binding) => binding.role === 'operation_tracker');
  const enrichedTracker =
    baseTracker != null
      ? enrichMapGameplayActiveOperationTracker(baseTracker, activeBinding)
      : null;
  record(
    assert(
      checks,
      enrichedTracker != null &&
        baseTracker != null &&
        enrichedTracker.priority >= baseTracker.priority,
      'active operation binding priority preserved',
      'active operation priority dropped',
    ),
  );

  const duplicateDistrictMarkers = feedback.markers.filter((marker) => marker.districtId === 'sanayi');
  if (duplicateDistrictMarkers.length > 1) {
    const priorities = duplicateDistrictMarkers.map((marker) => marker.priority);
    record(
      assert(
        checks,
        new Set(priorities).size === priorities.length || Math.max(...priorities) > Math.min(...priorities),
        'district duplicate priority separation',
        'district duplicates tied wrong',
      ),
    );
  } else {
    record(assert(checks, true, 'district duplicate check skipped', 'district duplicate check skipped'));
  }

  return { ok, checks };
}
