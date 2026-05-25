/**
 * Gün 1 MVP — store + karar döngüsü smoke test (Node).
 * Çalıştır: npx tsx scripts/smoke-game-loop.ts
 */

// Node ortamında AsyncStorage çalışmaz — persist middleware setItem/getItem
// hatası almamak için in-memory mock.
const storage = new Map<string, string>();
(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => storage.set(k, v),
    removeItem: (k: string) => storage.delete(k),
  },
};

import { createDay1Seed, DAY1_ROLE } from '../src/core/content/day1Seed';
import { DAY1_EVENT_POOL } from '../src/core/content/day1SeedPool';
import { applyDecision } from '../src/core/game/applyDecision';
import { endDay } from '../src/core/game/endDay';
import type { EndDayState } from '../src/core/game/endDay';
import { MAX_SNAPSHOTS } from '../src/store/gamePersist';
import { useGameStore } from '../src/store/useGameStore';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function toEngine(bundle: ReturnType<typeof createDay1Seed>): EndDayState {
  return {
    ...bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: bundle.decisionHistory,
    snapshots: bundle.snapshots,
  };
}

function runEngineSmoke(): void {
  const seed = createDay1Seed();
  let state = toEngine(seed);

  assert(state.city.day === 1, 'Gün 1 başlamalı');
  assert(state.events.length === 3, '3 aktif olay olmalı');
  assert(state.player.role === DAY1_ROLE, 'Rol doğru olmalı');
  assert(seed.neighborhoods.length === 5, '5 mahalle olmalı');
  assert(seed.eventPool.length >= 8, 'En az 8 event havuzu olmalı');

  for (const active of state.events) {
    assert(
      active.decisions.length >= 3,
      `${active.id} en az 3 karar içermeli`,
    );
  }

  const eventId = state.events[0]!.id;
  const decisionId = state.events[0]!.decisions[0]!.id;
  const xpBefore = state.player.xp;
  const satBefore = state.city.publicSatisfaction;

  const decisionResult = applyDecision({ state, eventId, decisionId });
  const priorHistory = state.decisionHistory ?? [];
  const priorSnapshots = state.snapshots ?? [];
  state = {
    ...decisionResult.nextState,
    decisionHistory: [...priorHistory, decisionResult.decisionRecord],
    snapshots: [
      ...priorSnapshots,
      decisionResult.beforeSnapshot,
      decisionResult.afterSnapshot,
    ],
  };

  assert(state.events.length === 2, 'Karar sonrası 2 aktif olay kalmalı');
  assert(state.solvedEvents.length === 1, '1 çözülen olay olmalı');
  assert(state.player.xp > xpBefore, 'XP artmalı');
  assert(
    state.city.publicSatisfaction !== satBefore,
    'Metrikler değişmeli',
  );
  assert((state.decisionHistory?.length ?? 0) === 1, 'DecisionRecord oluşmalı');

  const day1 = state.city.day;
  const end1 = endDay(state);
  state = end1.nextState;
  assert(end1.dailyReport.day === day1, 'Rapor biten günü göstermeli');
  assert(
    (end1.dailyReport.summaryLines?.length ?? 0) > 0,
    'Rapor özeti dinamik olmalı',
  );
  assert(state.city.day === day1 + 1, 'Gün bir artmalı');

  const reportDay = end1.dailyReport.day;
  const decisionsOnReportDay = (state.decisionHistory ?? []).filter(
    (r) => r.day === reportDay,
  );
  assert(decisionsOnReportDay.length === 1, 'Raporda gün kararları görünmeli');
}

function runStoreDoubleEndDaySmoke(): void {
  useGameStore.getState().initializeDay1();
  const dayBefore = useGameStore.getState().gameState.city.day;
  assert(dayBefore === 1, 'Store gün 1 ile başlamalı');

  useGameStore.getState().endCurrentDay();
  const dayAfterFirst = useGameStore.getState().gameState.city.day;
  assert(dayAfterFirst === 2, 'İlk Günü Bitir günü 2 yapmalı');

  useGameStore.getState().endCurrentDay();
  const dayAfterSecond = useGameStore.getState().gameState.city.day;
  assert(
    dayAfterSecond === 2,
    'Aynı günde ikinci Günü Bitir günü 3 yapmamalı',
  );

  const report = useGameStore.getState().lastDailyReport;
  assert(report?.day === 1, 'Rapor gün 1 için kalmalı');
}

function runXpGainSmoke(): void {
  useGameStore.getState().initializeDay1();
  const xpBefore = useGameStore.getState().gameState.player.xp;

  const events = useGameStore.getState().gameState.events;
  if (events.length > 0 && events[0]!.decisions.length > 0) {
    useGameStore.getState().applyDecision(
      events[0]!.id,
      events[0]!.decisions[0]!.id,
    );
  }
  const xpAfter = useGameStore.getState().gameState.player.xp;
  assert(xpAfter > xpBefore, 'Karar sonrası XP artmalı');
}

function runEndDayAdvancesSmoke(): void {
  useGameStore.getState().initializeDay1();
  const dayBefore = useGameStore.getState().gameState.city.day;

  useGameStore.getState().endCurrentDay();
  const dayAfter = useGameStore.getState().gameState.city.day;
  assert(dayAfter === dayBefore + 1, 'endDay sonrası gün artmalı');
}

function runResetGameSmoke(): void {
  useGameStore.getState().initializeDay1();
  useGameStore.getState().endCurrentDay();

  const dayBefore = useGameStore.getState().gameState.city.day;
  assert(dayBefore === 2, 'endDay sonrası gün 2 olmalı');

  useGameStore.getState().resetGame();
  const dayAfter = useGameStore.getState().gameState.city.day;
  const xpAfter = useGameStore.getState().gameState.player.xp;
  assert(dayAfter === 1, 'resetGame gün 1e döndürmeli');
  assert(xpAfter === 0, 'resetGame XP sıfırlamalı');
}

function runSnapshotLimitSmoke(): void {
  useGameStore.getState().initializeDay1();

  const fakeSnapshot = {
    day: 1,
    timestamp: Date.now(),
    city: useGameStore.getState().gameState.city,
    player: {
      xp: useGameStore.getState().gameState.player.xp,
      level: useGameStore.getState().gameState.player.level,
    },
    metrics: {
      publicSatisfaction: 50,
      budget: 75000,
      staffMorale: 65,
    },
    label: 'test',
  };

  const bigSnapshots = Array.from({ length: 150 }, (_, i) => ({
    ...fakeSnapshot,
    timestamp: Date.now() + i,
    label: `snap-${i}`,
  }));

  useGameStore.setState({ snapshots: bigSnapshots as never });

  useGameStore.getState().endCurrentDay();
  const count = useGameStore.getState().snapshots.length;
  assert(
    count <= MAX_SNAPSHOTS,
    `Snapshot limiti aşılmamalı: ${count} > ${MAX_SNAPSHOTS}`,
  );
}

function run(): void {
  runEngineSmoke();
  runStoreDoubleEndDaySmoke();
  runXpGainSmoke();
  runEndDayAdvancesSmoke();
  runResetGameSmoke();
  runSnapshotLimitSmoke();
  assert(DAY1_EVENT_POOL.length === 8, 'Event havuzu 8 olmalı');
  console.log('OK: smoke-game-loop passed');
}

run();
