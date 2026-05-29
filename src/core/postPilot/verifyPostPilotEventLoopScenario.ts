import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { createDay1Seed } from '@/core/content/day1Seed';
import { ensureDailyEventsForDay } from '@/core/game/ensureDailyEventsForDay';
import { endDay } from '@/core/game/endDay';
import { refreshPilotEventsFromGameState } from '@/core/game/refreshPilotEventsFromGameState';
import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import type { GameState } from '@/core/models/GameState';

import { POST_PILOT_FIRST_OPERATION_DAY } from './postPilotEventConstants';
import {
  applyPostPilotEventGenerationToGameState,
  collectPostPilotEventStrings,
  ensurePostPilotDailyEventsForDay,
  isPostPilotLightEventLoopEligible,
  postPilotEventTextContainsForbiddenWords,
  resolvePostPilotEventScope,
  resolvePostPilotOperationDay,
} from './postPilotEventEngine';
import { applyDerivedScopesToPostPilotState } from './postPilotOperationEngine';
import {
  createInitialPostPilotOperationState,
  normalizePostPilotOperationState,
} from './postPilotOperationSeed';
import type { PostPilotOperationState } from './postPilotOperationTypes';
import { collectPostPilotPresentationStrings } from './postPilotOperationPresentation';

export type VerifyPostPilotEventLoopOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail?: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail ?? pass}`);
  return ok;
}

function authorityAgenda() {
  return {
    ...createInitialAuthorityState(7),
    authorityTrust: 400,
  };
}

function baseCompletedGameState(
  postPilot: PostPilotOperationState,
  overrides?: Partial<GameState>,
): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: {
      ...seed.gameState.city,
      day: POST_PILOT_FIRST_OPERATION_DAY,
      ...(overrides?.city ?? {}),
    },
    pilot: {
      ...createDefaultPilotState(),
      status: 'completed',
      currentPilotDay: 7,
      selectedDistrictId: 'central',
      authorityState: authorityAgenda(),
      badgeState: createInitialBadgeState(7),
      postPilotOperation: postPilot,
      completedEventIds: overrides?.pilot?.completedEventIds ?? [],
      ...(overrides?.pilot ?? {}),
    },
    events: overrides?.events ?? [],
    solvedEvents: overrides?.solvedEvents ?? [],
    ...overrides,
  };
}

function lightPostPilot(overrides?: Partial<PostPilotOperationState>): PostPilotOperationState {
  const base: PostPilotOperationState = {
    phase: 'main_operation_light',
    scopes: {
      istasyon: 'agenda',
      yesilvadi: 'preview',
      main_operation: 'agenda',
    },
    operationDay: POST_PILOT_FIRST_OPERATION_DAY,
    lastUpdatedDay: POST_PILOT_FIRST_OPERATION_DAY,
    lightOperationStartedAt: new Date().toISOString(),
    ...overrides,
  };
  return applyDerivedScopesToPostPilotState(base, {
    postPilotOperation: base,
    pilotStatus: 'completed',
    authorityState: authorityAgenda(),
  });
}

function isValidEventShape(event: {
  id: string;
  title: string;
  decisions: { id: string; title: string; effects: unknown }[];
}): boolean {
  return (
    typeof event.id === 'string' &&
    event.id.length > 0 &&
    typeof event.title === 'string' &&
    Array.isArray(event.decisions) &&
    event.decisions.length >= 2 &&
    event.decisions.every(
      (d) =>
        typeof d.id === 'string' &&
        typeof d.title === 'string' &&
        d.effects != null &&
        typeof d.effects === 'object',
    )
  );
}

export function verifyPostPilotEventLoopScenario(): VerifyPostPilotEventLoopOutcome {
  const checks: string[] = [];
  let ok = true;

  const day = POST_PILOT_FIRST_OPERATION_DAY;
  const idle = createInitialPostPilotOperationState({
    pilotStatus: 'completed',
    currentPilotDay: 7,
  });

  const day1Active = createDay1Seed();
  ok =
    assert(
      checks,
      !ensurePostPilotDailyEventsForDay({
        gameState: day1Active.gameState,
        postPilotOperation: normalizePostPilotOperationState(
          day1Active.gameState.pilot.postPilotOperation,
          { pilotStatus: 'active', currentPilotDay: 1 },
        ),
        day,
      }).generated,
      'active pilot iken ensure generated false',
    ) && ok;

  ok =
    assert(
      checks,
      !ensurePostPilotDailyEventsForDay({
        gameState: baseCompletedGameState(idle),
        postPilotOperation: idle,
        day,
      }).generated,
      'pilot_complete_idle iken generated false',
    ) && ok;

  const previewSeen: PostPilotOperationState = {
    ...idle,
    phase: 'preview_seen',
    previewSeenAt: new Date().toISOString(),
  };
  ok =
    assert(
      checks,
      !ensurePostPilotDailyEventsForDay({
        gameState: baseCompletedGameState(previewSeen),
        postPilotOperation: previewSeen,
        day,
      }).generated,
      'preview_seen iken generated false',
    ) && ok;

  const light = lightPostPilot();
  const lightGs = baseCompletedGameState(light);
  const gen1 = ensurePostPilotDailyEventsForDay({
    gameState: lightGs,
    postPilotOperation: light,
    authorityState: lightGs.pilot.authorityState,
    day,
  });

  ok =
    assert(
      checks,
      gen1.generated && gen1.events.length <= 2,
      'main_operation_light en fazla 2 event',
      `events=${gen1.events.length} reason=${gen1.reason}`,
    ) && ok;

  ok =
    assert(
      checks,
      gen1.events.every(isValidEventShape),
      'event shape karar akışı ile uyumlu',
    ) && ok;

  const gen2 = ensurePostPilotDailyEventsForDay({
    gameState: lightGs,
    postPilotOperation: gen1.postPilotOperation,
    day,
  });
  ok =
    assert(
      checks,
      !gen2.generated && gen2.events.length === gen1.events.length,
      'aynı gün ikinci ensure duplicate üretmez',
    ) && ok;

  ok =
    assert(
      checks,
      gen1.eventPool.length <= 2,
      'eventPool MAX_POST_PILOT_ACTIVE_EVENTS sınırı',
    ) && ok;

  ok =
    assert(
      checks,
      gen1.featuredEventId != null && gen1.featuredEventId.length > 0,
      'featuredEventId güvenli set',
    ) && ok;

  const scopeIstasyon = resolvePostPilotEventScope(lightGs, gen1.postPilotOperation);
  ok =
    assert(
      checks,
      scopeIstasyon.neighborhoodId === 'istasyon',
      'İstasyon agenda/active mahalle context',
      `got=${scopeIstasyon.neighborhoodId}`,
    ) && ok;

  const dormantIstasyon = lightPostPilot({
    scopes: { istasyon: 'preview', yesilvadi: 'preview', main_operation: 'preview' },
  });
  const dormantGs = baseCompletedGameState(dormantIstasyon);
  dormantGs.pilot.authorityState = createInitialAuthorityState(7);
  const scopePilot = resolvePostPilotEventScope(dormantGs, dormantIstasyon);
  ok =
    assert(
      checks,
      scopePilot.neighborhoodId === 'merkez' ||
        scopePilot.neighborhoodId === 'cumhuriyet' ||
        scopePilot.neighborhoodId === 'central',
      'İstasyon yoksa pilot bölgesi / merkez fallback',
      `got=${scopePilot.neighborhoodId}`,
    ) && ok;

  const completedId = gen1.events[0]?.id;
  if (completedId) {
    const withCompleted = {
      ...lightGs,
      pilot: {
        ...lightGs.pilot,
        completedEventIds: [completedId],
      },
      solvedEvents: [{ id: completedId, title: 'x', xpEarned: 1 }],
    };
    const regen = ensurePostPilotDailyEventsForDay({
      gameState: withCompleted,
      postPilotOperation: gen1.postPilotOperation,
      day,
    });
    ok =
      assert(
        checks,
        !regen.events.some((e) => e.id === completedId),
        'completedEventIds içindeki event active dönmez',
      ) && ok;
  }

  const applied = applyPostPilotEventGenerationToGameState(lightGs, gen1);
  const endResult = endDay(
    { ...applied, decisionHistory: [], snapshots: [], eventPool: [] },
    { skipEventSelection: true },
  );
  ok =
    assert(
      checks,
      endResult.nextState.city.day === day + 1,
      'endDay post-pilot modda crash olmaz ve gün ilerler',
    ) && ok;

  const nextDay = day + 1;
  const advancedOp: PostPilotOperationState = {
    ...gen1.postPilotOperation,
    operationDay: nextDay,
    postPilotDailyEventSet: undefined,
  };
  const nextGen = ensurePostPilotDailyEventsForDay({
    gameState: {
      ...endResult.nextState,
      pilot: { ...endResult.nextState.pilot, postPilotOperation: advancedOp },
    } as GameState,
    postPilotOperation: advancedOp,
    day: nextDay,
  });
  ok =
    assert(
      checks,
      nextGen.generated,
      'sonraki gün yeni event generation mümkün',
      nextGen.reason,
    ) && ok;

  ok =
    assert(
      checks,
      resolvePostPilotOperationDay(applied, gen1.postPilotOperation) === day,
      'operation day derivation tutarlı',
    ) && ok;

  const day1 = createDay1Seed();
  const pilotDay1 = ensurePostPilotDailyEventsForDay({
    gameState: day1.gameState,
    postPilotOperation: normalizePostPilotOperationState(
      day1.gameState.pilot.postPilotOperation,
      { pilotStatus: 'active', currentPilotDay: 1 },
    ),
    day: 8,
  });
  const pilotDay1Ensure = ensureDailyEventsForDay(day1.gameState, day1.eventPool);
  ok =
    assert(
      checks,
      !pilotDay1.generated &&
        (pilotDay1Ensure.eventPool.length > 0 || day1.gameState.events.length > 0),
      'Day 1/pilot tutorial generation bozulmadı',
      `postPilotGen=${pilotDay1.generated} events=${day1.gameState.events.length}`,
    ) && ok;

  ok =
    assert(
      checks,
      typeof canCompletePilot === 'function',
      'Day 7 completePilot flow sembolleri erişilebilir',
    ) && ok;

  const reportState = applyPostPilotEventGenerationToGameState(lightGs, gen1);
  ok =
    assert(
      checks,
      reportState.pilot.authorityState != null && reportState.pilot.badgeState != null,
      'authority/badge snapshots post-pilot state ile uyumlu',
    ) && ok;

  const forbiddenInEvents = collectPostPilotEventStrings(gen1.events).flatMap((text) =>
    postPilotEventTextContainsForbiddenWords(text),
  );
  const forbiddenInPresentation = collectPostPilotPresentationStrings(
    light,
    { pilotStatus: 'completed', currentPilotDay: 7 },
    authorityAgenda(),
  ).flatMap((text) => postPilotEventTextContainsForbiddenWords(text));

  ok =
    assert(
      checks,
      forbiddenInEvents.length === 0 && forbiddenInPresentation.length === 0,
      'yasaklı kelimeler post-pilot metinlerinde yok',
      [...forbiddenInEvents, ...forbiddenInPresentation].join(', '),
    ) && ok;

  ok =
    assert(
      checks,
      lightGs.pilot.run?.unlockState?.fullMainOperationUnlocked !== true,
      'fullMainOperationUnlocked true yapılmaz',
    ) && ok;

  const refreshLight = refreshPilotEventsFromGameState(lightGs, []);
  ok =
    assert(
      checks,
      isPostPilotLightEventLoopEligible(refreshLight.gameState),
      'refreshPilotEvents post-pilot light modda çalışır',
    ) && ok;

  const refreshCompleted = refreshPilotEventsFromGameState(
    baseCompletedGameState(idle),
    [{ id: 'stale', title: 'x', category: 'x', riskLevel: 'low', district: 'x', description: 'x', contextTag: 'x', urgencyHours: 1, decisions: [], previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 } }],
  );
  ok =
    assert(
      checks,
      refreshCompleted.eventPool.length === 0,
      'completed idle refresh havuzu temizler',
    ) && ok;

  return { ok, checks };
}
