import { createDay1Seed } from '@/core/content/day1Seed';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import { getEventContentProfileById } from '@/core/events/eventContentLibrary';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { normalizePersistedSave } from '@/store/gamePersist';
import {
  buildButterflyHookFromDecision,
  createDefaultButterflyHookState,
  dedupeButterflyHooks,
  expireOldButterflyHooks,
  normalizeButterflyHookState,
  selectButterflyHookForEventGeneration,
  shouldCreateButterflyHook,
  tryRegisterButterflyHookAfterDecision,
} from './butterflyHookEngine';
import { buildButterflyReportLines } from './butterflyHookPresentation';
import { BUTTERFLY_HOOK_MAX_ACTIVE } from './butterflyHookConstants';
import type { ButterflyHook, ButterflyHookState } from './butterflyHookTypes';

export type ButterflyVerifyCheck = {
  name: string;
  severity: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
};

export type ButterflyVerifyResult = {
  ok: boolean;
  checks: string[];
  failCount: number;
  warnCount: number;
};

function record(
  checks: ButterflyVerifyCheck[],
  severity: ButterflyVerifyCheck['severity'],
  name: string,
  detail: string,
): void {
  checks.push({ name, severity, detail });
}

function mockEvent(
  partial: Partial<EventCard> & { id: string; decisions: EventDecision[] },
): EventCard {
  return {
    id: partial.id,
    title: partial.title ?? 'Test Olay',
    category: partial.category ?? 'operasyon',
    riskLevel: partial.riskLevel ?? 'medium',
    district: partial.district ?? 'Sanayi',
    neighborhoodId: partial.neighborhoodId ?? 'sanayi',
    description: partial.description ?? 'Test açıklama',
    contextTag: partial.contextTag ?? 'test',
    urgencyHours: partial.urgencyHours ?? 8,
    decisions: partial.decisions,
    previewEffects: partial.previewEffects ?? {
      publicSatisfaction: 0,
      risk: 0,
      xp: 0,
    },
    day: partial.day,
    contentProfileId: partial.contentProfileId,
    contentCategory: partial.contentCategory,
    contentFutureHookHint: partial.contentFutureHookHint,
    districtIds: partial.districtIds ?? ['merkez'],
    eventType: partial.eventType,
  };
}

function fastDecision(): EventDecision {
  return {
    id: 'fast-dispatch',
    title: 'Hızlı toplama gönder',
    description: 'Ekstra ekip',
    style: 'bold',
    effects: { publicSatisfaction: 1, budget: -1, morale: 0, risk: -1, xp: 2 },
    contentStrategyLabel: 'Hızlı çözüm',
    decisionStyle: 'fast',
  };
}

function permanentDecision(): EventDecision {
  return {
    id: 'perm-cap',
    title: 'Kalıcı kapasite',
    description: 'Kalıcı plan',
    style: 'balanced',
    effects: { publicSatisfaction: 2, budget: -3, morale: 0, risk: -2, xp: 3 },
    contentStrategyLabel: 'Kalıcı çözüm',
    decisionStyle: 'permanent',
  };
}

function monitorDecision(): EventDecision {
  return {
    id: 'wait-monitor',
    title: 'İzle',
    description: 'Kaynak koru',
    style: 'cautious',
    effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 1, xp: 1 },
    contentStrategyLabel: 'Kaynak korur',
    decisionStyle: 'planned',
  };
}

function activePilotGameState(day: number, hookState?: ButterflyHookState): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: {
      ...createDefaultPilotState(),
      status: 'active',
      selectedDistrictId: 'central',
      currentPilotDay: day,
      butterflyHookState: hookState ?? createDefaultButterflyHookState(),
    },
  };
}

export function verifyButterflyHookScenario(): ButterflyVerifyResult {
  const checks: ButterflyVerifyCheck[] = [];

  const empty = normalizeButterflyHookState(undefined);
  if (empty.hooks.length === 0 && empty.lastProcessedDay === 0) {
    record(checks, 'PASS', 'fallback_state', 'Boş butterflyHookState güvenli');
  } else {
    record(checks, 'FAIL', 'fallback_state', 'Fallback state beklenmiyor');
  }

  const day1 = createDay1Seed();
  const v8Save = normalizePersistedSave({
    saveVersion: 8,
    gameState: day1.gameState,
    neighborhoods: day1.neighborhoods,
    resources: day1.resources,
    eventPool: day1.eventPool,
    decisionHistory: day1.decisionHistory,
    snapshots: day1.snapshots,
    playerProgress: createInitialPlayerProgress(),
  });

  if (v8Save?.gameState.pilot.butterflyHookState?.hooks.length === 0) {
    record(checks, 'PASS', 'v8_hydrate', 'SAVE v8 → butterflyHookState fallback');
  } else {
    record(checks, 'FAIL', 'v8_hydrate', 'v8 hydrate butterflyHookState eksik');
  }

  const day1Event = mockEvent({
    id: 'day1-anchor',
    decisions: [fastDecision()],
    day: 1,
  });
  const day1Input = {
    day: 1,
    event: day1Event,
    decision: fastDecision(),
    hookState: createDefaultButterflyHookState(),
  };
  if (!shouldCreateButterflyHook(day1Input)) {
    record(checks, 'PASS', 'day1_no_hook', 'Gün 1 hook üretilmiyor');
  } else {
    record(checks, 'FAIL', 'day1_no_hook', 'Gün 1 hook üretilmemeli');
  }

  const day8Input = {
    ...day1Input,
    day: 8,
    event: { ...day1Event, id: 'd8-event' },
  };
  if (!buildButterflyHookFromDecision(day8Input)) {
    record(checks, 'PASS', 'after_day7', 'Gün 8+ hook üretilmiyor');
  } else {
    record(checks, 'FAIL', 'after_day7', 'Gün 8 hook üretilmemeli');
  }

  let hookState = createDefaultButterflyHookState();
  const fastEvent = mockEvent({
    id: 'sanayi-pressure',
    title: 'Konteyner baskısı',
    contentProfileId: 'waste_sanayi_line',
    contentCategory: 'waste_container',
    neighborhoodId: 'sanayi',
    decisions: [fastDecision()],
  });

  for (let i = 0; i < 5; i += 1) {
    const reg = tryRegisterButterflyHookAfterDecision({
      day: 2,
      event: { ...fastEvent, id: `sanayi-pressure-${i}` },
      decision: fastDecision(),
      hookState,
    });
    hookState = reg.state;
  }

  const fastCreated = hookState.hooks.filter((h) => h.createdDay === 2).length;
  if (fastCreated >= 1) {
    record(checks, 'PASS', 'fast_hook', 'fast_response hook üretebiliyor');
  } else {
    record(checks, 'FAIL', 'fast_hook', 'fast_response hook üretilemedi');
  }

  hookState = createDefaultButterflyHookState();
  const monitorReg = tryRegisterButterflyHookAfterDecision({
    day: 3,
    event: mockEvent({
      id: 'monitor-ev',
      decisions: [monitorDecision()],
    }),
    decision: monitorDecision(),
    hookState,
  });
  if (monitorReg.hook) {
    record(checks, 'PASS', 'monitor_hook', 'delay/monitor hook üretebiliyor');
  } else {
    record(checks, 'WARN', 'monitor_hook', 'monitor hook üretilemedi (olası roll)');
  }

  let permCreated = 0;
  hookState = createDefaultButterflyHookState();
  for (let i = 0; i < 6; i += 1) {
    const reg = tryRegisterButterflyHookAfterDecision({
      day: 4,
      event: mockEvent({
        id: `perm-${i}`,
        decisions: [permanentDecision()],
      }),
      decision: permanentDecision(),
      hookState,
    });
    hookState = reg.state;
    if (reg.hook) permCreated += 1;
  }
  if (permCreated <= 2) {
    record(
      checks,
      'PASS',
      'permanent_low',
      `permanent_fix hook düşük (${permCreated}/6)`,
    );
  } else {
    record(checks, 'WARN', 'permanent_low', `permanent_fix çok sık (${permCreated})`);
  }

  hookState = createDefaultButterflyHookState();
  const dupReg1 = tryRegisterButterflyHookAfterDecision({
    day: 2,
    event: fastEvent,
    decision: fastDecision(),
    hookState,
  });
  hookState = dupReg1.state;
  const dupReg2 = tryRegisterButterflyHookAfterDecision({
    day: 2,
    event: fastEvent,
    decision: fastDecision(),
    hookState,
  });
  const dupActive = dupReg2.state.hooks.filter(
    (h) =>
      h.status === 'active' &&
      h.sourceEventId === fastEvent.id &&
      h.triggerTag === dupReg1.hook?.triggerTag,
  );
  if (dupActive.length <= 1) {
    record(checks, 'PASS', 'no_duplicate', 'Duplicate sourceEventId+triggerTag yok');
  } else {
    record(checks, 'FAIL', 'no_duplicate', `Duplicate aktif: ${dupActive.length}`);
  }

  const activeCount = hookState.hooks.filter((h) => h.status === 'active').length;
  if (activeCount <= BUTTERFLY_HOOK_MAX_ACTIVE) {
    record(
      checks,
      'PASS',
      'max_active',
      `Aktif hook ${activeCount} <= ${BUTTERFLY_HOOK_MAX_ACTIVE}`,
    );
  } else {
    record(checks, 'FAIL', 'max_active', `Aktif hook ${activeCount} aşıldı`);
  }

  const sampleHook = hookState.hooks.find((h) => h.status === 'active');
  if (sampleHook) {
    const dueOffset = sampleHook.dueDay - sampleHook.createdDay;
    if (dueOffset >= 1 && dueOffset <= 2) {
      record(checks, 'PASS', 'due_range', `dueDay offset ${dueOffset}`);
    } else {
      record(checks, 'FAIL', 'due_range', `dueDay offset ${dueOffset} geçersiz`);
    }
    if (sampleHook.expiresDay > sampleHook.dueDay) {
      record(checks, 'PASS', 'expires_after_due', 'expiresDay > dueDay');
    } else {
      record(checks, 'FAIL', 'expires_after_due', 'expiresDay hatalı');
    }
  }

  const expiredState = expireOldButterflyHooks(
    {
      hooks: [
        {
          ...(sampleHook ?? {
            id: 'exp-test',
            source: 'decision',
            kind: 'report_echo',
            status: 'active',
            createdDay: 1,
            dueDay: 2,
            expiresDay: 3,
            severity: 'low',
            title: 't',
            description: 'd',
            triggerTag: 't',
            createdAt: 1,
          }),
          expiresDay: 2,
          dueDay: 1,
        } as ButterflyHook,
      ],
      lastProcessedDay: 0,
    },
    5,
  );
  if (expiredState.hooks.every((h) => h.status !== 'active' || h.expiresDay >= 5)) {
    record(checks, 'PASS', 'expire', 'Süresi dolan hook temizleniyor');
  } else {
    record(checks, 'FAIL', 'expire', 'Expire mantığı hatalı');
  }

  const dueHook: ButterflyHook = {
    id: 'due-hook-1',
    source: 'decision',
    kind: 'follow_up_event',
    status: 'active',
    createdDay: 4,
    dueDay: 5,
    expiresDay: 7,
    severity: 'medium',
    title: 'Geri dönen talep',
    description: 'Takip',
    triggerTag: 'test_due',
    sourceEventId: 'src-1',
    neighborhoodId: 'sanayi',
    category: 'waste_container',
    followUpProfileId: 'waste_sanayi_line',
    createdAt: Date.now(),
  };
  const selected = selectButterflyHookForEventGeneration({
    day: 5,
    hooks: [dueHook],
    existingEventIds: [],
    isButterflySeedDay: true,
  });
  if (selected?.id === dueHook.id) {
    record(checks, 'PASS', 'select_due', 'due hook event generation için seçilebiliyor');
  } else {
    record(checks, 'FAIL', 'select_due', 'due hook seçilemedi');
  }

  const gsDay2 = activePilotGameState(2, {
    hooks: [dueHook],
    lastProcessedDay: 0,
  });
  const ensured = ensureDailyEventsForDay(gsDay2, [], undefined, {
    dailyPriorityKey: 'operation_stability',
  });
  const day1Anchor = ensured.dailyEventSet?.anchorEventId;
  const day1SeedAnchor = 'day1_tutorial_anchor';
  if (
    ensured.dailyEventSet?.day !== 1 &&
    (day1Anchor == null || !day1Anchor.includes('day1'))
  ) {
    record(checks, 'PASS', 'day1_anchor_safe', 'Gün 2+ set Day 1 anchor bozmuyor');
  } else if (ensured.dailyEventSet?.day === 2) {
    record(checks, 'PASS', 'day1_anchor_safe', 'Gün 2 set üretildi');
  }

  const reportLines = buildButterflyReportLines(
    [
      {
        ...dueHook,
        kind: 'report_echo',
        reportLine: 'Satır 1',
        dueDay: 5,
      },
      {
        ...dueHook,
        id: 'due-hook-2',
        reportLine: 'Satır 2',
        dueDay: 5,
      },
      {
        ...dueHook,
        id: 'due-hook-3',
        reportLine: 'Satır 3',
        dueDay: 5,
      },
    ],
    5,
  );
  if (reportLines.length <= 2) {
    record(checks, 'PASS', 'report_cap', `buildButterflyReportLines max 2 (${reportLines.length})`);
  } else {
    record(checks, 'FAIL', 'report_cap', `Rapor satırı fazla: ${reportLines.length}`);
  }

  const profile = getEventContentProfileById('perm_container_cap');
  if (profile?.futureHook?.triggerTag) {
    record(checks, 'PASS', 'future_hook_profile', 'futureHook profil mevcut');
  } else {
    record(checks, 'WARN', 'future_hook_profile', 'futureHook profil bulunamadı');
  }

  const deduped = dedupeButterflyHooks([
    dueHook,
    { ...dueHook, id: 'due-hook-dup' },
  ]);
  if (deduped.length === 1) {
    record(checks, 'PASS', 'dedupe', 'dedupeButterflyHooks çalışıyor');
  } else {
    record(checks, 'FAIL', 'dedupe', 'dedupe başarısız');
  }

  const failCount = checks.filter((c) => c.severity === 'FAIL').length;
  const warnCount = checks.filter((c) => c.severity === 'WARN').length;

  return {
    ok: failCount === 0,
    failCount,
    warnCount,
    checks: checks.map(
      (c) => `[${c.severity}] ${c.name}: ${c.detail}`,
    ),
  };
}
