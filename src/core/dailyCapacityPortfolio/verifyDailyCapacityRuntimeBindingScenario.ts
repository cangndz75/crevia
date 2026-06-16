import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyCapacityPortfolio } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioModel';
import {
  applyPortfolioCapacityToPostPilotDailySet,
  buildDailyCapacityRuntimeSnapshot,
  resolveRuntimeActiveEventsFromPortfolio,
  shouldApplyPortfolioRuntimeBinding,
} from '@/core/dailyCapacityPortfolio/dailyCapacityRuntimeBindingModel';
import { buildDailyCapacityPortfolioStoreInput } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioStoreInput';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import type { PostPilotDailyEventSet } from '@/core/postPilot/postPilotEventTypes';
import { verifyDailyCapacityPortfolioScenario } from '@/core/dailyCapacityPortfolio/verifyDailyCapacityPortfolioScenario';
import { verifyPortfolioDeferRiskScenario } from '@/core/portfolioDeferRisk/verifyPortfolioDeferRiskScenario';
import { SAVE_VERSION } from '@/store/gamePersist';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDailyCapacityRuntimeBindingOutcome = {
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

function postPilotGameState(catalog: EventCard[], day = 8): GameState {
  const seed = createDay1Seed();
  const dailySet: PostPilotDailyEventSet = {
    day,
    anchorEventId: catalog[0]?.id ?? 'evt_a',
    sideEventIds: catalog.slice(1).map((event) => event.id),
    allEventIds: catalog.map((event) => event.id),
    catalog,
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

function operationSignalsHighRoute() {
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

export function verifyDailyCapacityRuntimeBindingScenario(): VerifyDailyCapacityRuntimeBindingOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION_FOR_VERIFY, 'SAVE_VERSION policy', `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/useGameStore.ts').includes('dailyCapacityPortfolioState'), 'no portfolio store field', 'portfolio store added'));
  record(assert(checks, readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('applyPortfolioCapacityToPostPilotDailySet'), 'postPilot engine wired', 'postPilot missing binding'));

  const day1State = createDay1Seed().gameState;
  record(assert(checks, !shouldApplyPortfolioRuntimeBinding(1, day1State), 'Day 1 legacy binding', 'day 1 portfolio forced'));
  record(assert(checks, shouldApplyPortfolioRuntimeBinding(8, postPilotGameState([makeEvent('evt_a', 'A'), makeEvent('evt_b', 'B')])), 'Day 8 portfolio binding', 'day 8 not bound'));

  const low = makeEvent('evt_low', 'Dusuk oncelik', 'Merkez', 'merkez', 'low');
  const high = makeEvent('evt_high', 'Yuksek oncelik', 'Sanayi', 'sanayi', 'high');
  const mid = makeEvent('evt_mid', 'Orta oncelik', 'Cumhuriyet', 'cumhuriyet', 'medium');
  const catalog = [low, high, mid];
  const gameState = postPilotGameState(catalog, 8);
  const signals = operationSignalsHighRoute();

  const portfolioInput = buildDailyCapacityPortfolioStoreInput({
    day: 8,
    gameState,
    operationSignals: signals as never,
    catalogOperationEvents: catalog,
  });
  const portfolio = buildDailyCapacityPortfolio(portfolioInput);

  const selection = resolveRuntimeActiveEventsFromPortfolio({
    catalog,
    portfolio,
    blockedIds: new Set<string>(),
    budget: gameState.city.budget,
    maxEvents: 2,
    anchorEventId: catalog[0].id,
  });

  record(assert(checks, selection.activeEventIds.length === 2, 'capacity limits active events', `active ${selection.activeEventIds.length}`));
  record(assert(checks, selection.deferredEventIds.includes('evt_low'), 'low priority deferred', `deferred ${selection.deferredEventIds.join(',')}`));
  record(assert(checks, selection.activeEventIds.includes('evt_high'), 'high priority active', 'high missing'));
  record(assert(checks, !selection.activeEventIds.includes('evt_low'), 'low not in active set', 'low leaked active'));

  const capacityApply = applyPortfolioCapacityToPostPilotDailySet({
    day: 8,
    gameState,
    dailySet: gameState.pilot.postPilotOperation!.postPilotDailyEventSet!,
    blockedIds: new Set<string>(),
    budget: gameState.city.budget,
    maxEvents: 2,
    mainOperationContext: { operationSignals: signals },
  });
  record(assert(checks, capacityApply.deferredEventIds.length > 0, 'deferred persisted on set', 'no deferred ids'));
  record(assert(checks, capacityApply.activeEvents.length <= 2, 'active events capped', 'active overflow'));

  const snapshot = buildDailyCapacityRuntimeSnapshot({
    day: 8,
    gameState,
    operationSignals: signals as never,
  });
  record(assert(checks, snapshot.mode === 'portfolio_runtime', 'runtime snapshot mode', snapshot.mode));
  record(assert(checks, snapshot.deferredOperationEventIds.length > 0 || snapshot.portfolio.deferredItems.length > 0, 'snapshot deferred ids', 'snapshot empty deferred'));
  record(assert(checks, Boolean(snapshot.planPortfolioView.capacityLabel), 'plan portfolio view', 'plan view missing'));
  record(assert(checks, snapshot.portfolioDeferRisk.bindings.length >= 0, 'defer risk readable', 'defer risk missing'));

  const mapBoosted = buildDailyCapacityPortfolio({
    ...portfolioInput,
    mapGameplayBindings: [
      {
        id: 'route_support_hint',
        role: 'route_support',
        priority: 90,
        sourceKinds: ['map_gameplay_binding'],
        sourceIds: ['map_route:sanayi'],
        isActionable: true,
      },
    ],
  });
  const mapItem = mapBoosted.items.find((item) => item.sourceKinds.includes('map_gameplay_binding'));
  record(assert(checks, (mapItem?.priority ?? 0) > 0, 'map gameplay binding affects scoring', 'map boost missing'));

  const stableA = buildDailyCapacityRuntimeSnapshot({ day: 8, gameState, operationSignals: signals as never });
  const stableB = buildDailyCapacityRuntimeSnapshot({ day: 8, gameState, operationSignals: signals as never });
  record(
    assert(
      checks,
      JSON.stringify(stableA.activeOperationEventIds) === JSON.stringify(stableB.activeOperationEventIds),
      'deterministic snapshot',
      'snapshot unstable',
    ),
  );

  record(assert(checks, verifyDailyCapacityPortfolioScenario().ok, 'portfolio verify still ok', 'portfolio verify failed'));
  record(assert(checks, verifyPortfolioDeferRiskScenario().ok, 'defer risk verify ok', 'defer risk verify failed'));
  record(assert(checks, readRepo('package.json').includes('verify:daily-capacity-runtime-binding'), 'package script', 'script missing'));

  return { ok, checks };
}
