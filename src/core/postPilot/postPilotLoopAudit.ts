import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { calculateDailyAuthorityTrustGain } from '@/core/authority/authorityEngine';
import { buildAuthorityDailyGainInput } from '@/core/authority/authoritySelectors';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { processDailyBadgeEvaluation } from '@/core/badges/badgeEngine';
import { buildDailyBadgeEvaluationInput } from '@/core/badges/badgeSelectors';
import { createDay1Seed } from '@/core/content/day1Seed';
import { shouldClearPilotActiveEvents } from '@/core/game/clearActiveEventsForGameState';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { endDay } from '@/core/game/endDay';
import { refreshPostPilotEventsFromGameState } from '@/core/game/refreshPostPilotEventsFromGameState';
import type { GameState } from '@/core/models/GameState';
import type { GameMetrics } from '@/core/models/GameMetrics';
import type { DailyReport } from '@/core/models/DailyReport';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import type { DailyXpReport } from '@/core/xp/xpReport';

import {
  MAX_POST_PILOT_ACTIVE_EVENTS,
  POST_PILOT_AUDIT_AUTHORITY_GAIN_WARN_3D,
  POST_PILOT_AUDIT_BADGE_COUNT_WARN_3D,
  POST_PILOT_FIRST_OPERATION_DAY,
} from './postPilotEventConstants';
import {
  applyPostPilotEventGenerationToGameState,
  collectPostPilotEventStrings,
  ensurePostPilotDailyEventsForDay,
  postPilotEventTextContainsForbiddenWords,
} from './postPilotEventEngine';
import { applyDerivedScopesToPostPilotState } from './postPilotOperationEngine';
import {
  buildPostPilotAgendaLines,
  buildPostPilotAgendaReadyLine,
  buildPostPilotScopeStatusLabel,
  collectPostPilotPresentationStrings,
} from './postPilotOperationPresentation';
import { normalizePostPilotOperationState } from './postPilotOperationSeed';
import type { PostPilotOperationState } from './postPilotOperationTypes';

export type PostPilotLoopAuditHealth = 'PASS' | 'WARN' | 'FAIL';

export type PostPilotLoopAuditResult = {
  simulatedDays: number;
  dailyEventCounts: number[];
  duplicateEventCount: number;
  maxActiveEventsExceeded: boolean;
  authorityTrustGainTotal: number;
  earnedBadgeCount: number;
  reportCrashCount: number;
  forbiddenWordCount: number;
  warnings: string[];
  health: PostPilotLoopAuditHealth;
};

export type RunPostPilotLoopAuditOptions = {
  /** Simüle edilecek post-pilot gün sayısı (varsayılan 3). */
  simulatedDays?: number;
};

function metricsFromCity(city: GameState['city']): GameMetrics {
  return {
    publicSatisfaction: city.publicSatisfaction,
    staffMorale: city.morale,
    budget: city.budget,
  };
}

function authorityForAudit() {
  return { ...createInitialAuthorityState(7), authorityTrust: 420 };
}

export function buildPostPilotLightGameState(day: number): GameState {
  const postPilot = applyDerivedScopesToPostPilotState(
    {
      phase: 'main_operation_light',
      scopes: {
        istasyon: 'agenda',
        yesilvadi: 'preview',
        main_operation: 'agenda',
      },
      operationDay: day,
      lastUpdatedDay: day,
      lightOperationStartedAt: new Date().toISOString(),
    },
    {
      postPilotOperation: {
        phase: 'main_operation_light',
        scopes: {
          istasyon: 'agenda',
          yesilvadi: 'preview',
          main_operation: 'agenda',
        },
      },
      pilotStatus: 'completed',
      authorityState: authorityForAudit(),
    },
  );

  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    events: [],
    solvedEvents: [],
    featuredEventId: '',
    pilot: {
      ...createDefaultPilotState(),
      status: 'completed',
      currentPilotDay: 7,
      selectedDistrictId: 'central',
      authorityState: authorityForAudit(),
      badgeState: createInitialBadgeState(7),
      postPilotOperation: postPilot,
      completedEventIds: [],
    },
  };
}

/** Store startLightMainOperation ile uyumlu ilk light faz geçişi. */
export function simulateStartLightMainOperation(gameState: GameState): {
  gameState: GameState;
  eventPool: import('@/core/models/EventCard').EventCard[];
} {
  if (gameState.pilot.status !== 'completed') {
    return { gameState, eventPool: [] };
  }

  const closingDay = gameState.pilot.currentPilotDay;
  let next = normalizePostPilotOperationState(gameState.pilot.postPilotOperation, {
    pilotStatus: 'completed',
    currentPilotDay: closingDay,
  });

  if (next.phase === 'main_operation_light') {
    return { gameState, eventPool: [] };
  }

  const operationDay = Math.max(8, gameState.city.day, closingDay + 1);

  next = {
    ...next,
    phase: 'main_operation_light',
    lightOperationStartedAt: next.lightOperationStartedAt ?? new Date().toISOString(),
    lastUpdatedDay: operationDay,
    operationDay,
    postPilotDailyEventSet: undefined,
  };

  next = applyDerivedScopesToPostPilotState(next, {
    postPilotOperation: next,
    pilotStatus: 'completed',
    authorityState: gameState.pilot.authorityState,
  });

  let nextGameState: GameState = {
    ...gameState,
    city: { ...gameState.city, day: operationDay },
    pilot: { ...gameState.pilot, postPilotOperation: next },
  };

  const refresh = refreshPostPilotEventsFromGameState(nextGameState, []);
  return {
    gameState: refresh.gameState,
    eventPool: refresh.eventPool,
  };
}

function emptyXpReport(day: number): DailyXpReport {
  return { day, totalXp: 0, categories: [] };
}

function tryBuildPostPilotReportView(day: number, report: DailyReport): boolean {
  try {
    const model = buildEndOfDayReportViewModel({
      report,
      metrics: {
        publicSatisfaction: 55,
        budget: 100_000,
        staffMorale: 60,
      },
      dailyXpReport: emptyXpReport(day),
      postPilotLightDay: true,
    });
    return model.statusTitle.length > 0;
  } catch {
    return false;
  }
}

function collectUiStringsForAudit(gameState: GameState): string[] {
  const postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: 'completed',
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );

  const agenda = buildPostPilotAgendaLines(
    postPilot,
    { pilotStatus: 'completed', currentPilotDay: 7 },
    gameState.pilot.authorityState,
  );
  const ready = buildPostPilotAgendaReadyLine(postPilot, gameState.events.length);

  const mapFieldSignal =
    gameState.events.length > 0 ? 'Gündem olayı · Aktif saha sinyali' : '';

  return [
    ...collectPostPilotPresentationStrings(
      postPilot,
      { pilotStatus: 'completed', currentPilotDay: 7 },
      gameState.pilot.authorityState,
    ),
    agenda.title,
    agenda.subtitle,
    ready ?? '',
    buildPostPilotScopeStatusLabel(postPilot.scopes.istasyon),
    mapFieldSignal,
    ...collectPostPilotEventStrings(gameState.events),
  ].filter(Boolean);
}

function countForbiddenInStrings(strings: string[]): number {
  let count = 0;
  for (const text of strings) {
    count += postPilotEventTextContainsForbiddenWords(text).length;
  }
  return count;
}

function advancePostPilotDay(
  gameState: GameState,
  closingDay: number,
): { gameState: GameState; report: DailyReport | null; reportCrashed: boolean } {
  try {
    const endResult = endDay(
      {
        ...gameState,
        decisionHistory: [],
        snapshots: [],
        eventPool: [],
      },
      { skipEventSelection: true },
    );

    const report = endResult.dailyReport;
    const reportOk = tryBuildPostPilotReportView(closingDay, report);

    const nextDay = endResult.nextState.city.day;
    let postPilotOp = normalizePostPilotOperationState(
      gameState.pilot.postPilotOperation,
      {
        pilotStatus: 'completed',
        currentPilotDay: gameState.pilot.currentPilotDay,
      },
    );
    postPilotOp = {
      ...postPilotOp,
      operationDay: nextDay,
      lastUpdatedDay: nextDay,
      postPilotDailyEventSet: undefined,
    };

    const advanced: GameState = {
      ...(endResult.nextState as GameState),
      pilot: {
        ...(endResult.nextState.pilot as GameState['pilot']),
        postPilotOperation: postPilotOp,
      },
    };

    const refresh = refreshPostPilotEventsFromGameState(advanced, []);
    return {
      gameState: refresh.gameState,
      report,
      reportCrashed: !reportOk,
    };
  } catch {
    return { gameState, report: null, reportCrashed: true };
  }
}

export function runPostPilotLoopAudit(
  options?: RunPostPilotLoopAuditOptions,
): PostPilotLoopAuditResult {
  const simulatedDays = options?.simulatedDays ?? 3;
  const dailyEventCounts: number[] = [];
  const warnings: string[] = [];
  let duplicateEventCount = 0;
  let maxActiveEventsExceeded = false;
  let authorityTrustGainTotal = 0;
  let earnedBadgeCount = 0;
  let reportCrashCount = 0;
  let forbiddenWordCount = 0;

  let gameState = buildPostPilotLightGameState(POST_PILOT_FIRST_OPERATION_DAY - 1);
  gameState = {
    ...gameState,
    pilot: {
      ...gameState.pilot,
      status: 'completed',
      postPilotOperation: {
        ...normalizePostPilotOperationState(undefined, {
          pilotStatus: 'completed',
          currentPilotDay: 7,
        }),
        phase: 'preview_seen',
      },
    },
  };

  const started = simulateStartLightMainOperation(gameState);
  gameState = started.gameState;
  let eventPool = started.eventPool;

  const seenIdsByDay = new Map<number, Set<string>>();

  for (let offset = 0; offset < simulatedDays; offset += 1) {
    const day =
      POST_PILOT_FIRST_OPERATION_DAY + offset;
    gameState = {
      ...gameState,
      city: { ...gameState.city, day },
    };

    const postPilot = normalizePostPilotOperationState(
      gameState.pilot.postPilotOperation,
      {
        pilotStatus: 'completed',
        currentPilotDay: gameState.pilot.currentPilotDay,
      },
    );

    const gen1 = ensurePostPilotDailyEventsForDay({
      gameState,
      postPilotOperation: postPilot,
      day,
    });

    const applied1 = applyPostPilotEventGenerationToGameState(gameState, gen1);
    const gen2 = ensurePostPilotDailyEventsForDay({
      gameState: applied1,
      postPilotOperation: gen1.postPilotOperation,
      day,
    });

    if (gen2.generated) {
      duplicateEventCount += 1;
      warnings.push(`Gün ${day}: ikinci ensure generated=true`);
    }

    const dayIds = new Set<string>();
    for (const event of gen2.events) {
      if (dayIds.has(event.id)) {
        duplicateEventCount += 1;
      }
      dayIds.add(event.id);
    }
    const prevDaySet = seenIdsByDay.get(day);
    if (prevDaySet) {
      for (const id of dayIds) {
        if (prevDaySet.has(id)) {
          warnings.push(`Gün ${day}: event id önceki günle çakışıyor: ${id}`);
        }
      }
    }
    seenIdsByDay.set(day, dayIds);

    gameState = applyPostPilotEventGenerationToGameState(applied1, gen2);
    eventPool = gen2.eventPool;

    const activeCount = gameState.events.length;
    dailyEventCounts.push(activeCount);

    if (activeCount > MAX_POST_PILOT_ACTIVE_EVENTS) {
      maxActiveEventsExceeded = true;
      warnings.push(`Gün ${day}: active events ${activeCount} > ${MAX_POST_PILOT_ACTIVE_EVENTS}`);
    }

    if (
      gameState.featuredEventId &&
      !gameState.events.some((e) => e.id === gameState.featuredEventId)
    ) {
      warnings.push(`Gün ${day}: featuredEventId active listede yok`);
    }

    forbiddenWordCount += countForbiddenInStrings(collectUiStringsForAudit(gameState));

    const metricsBefore = metricsFromCity(gameState.city);
    const authorityGain = calculateDailyAuthorityTrustGain(
      buildAuthorityDailyGainInput({
        day,
        dailyEventSet: null,
        decisionHistory: [],
        activeEvents: gameState.events,
        dailyGoalState: null,
        metricsBefore,
        metricsAfter: metricsBefore,
        socialPulseStateBefore: null,
        socialPulseStateAfter: null,
        butterflyHookState: gameState.pilot.butterflyHookState,
      }),
      gameState.pilot.authorityState ?? authorityForAudit(),
    );
    authorityTrustGainTotal += authorityGain.netGain;

    const badgeResult = processDailyBadgeEvaluation({
      badgeState: gameState.pilot.badgeState,
      day,
      input: buildDailyBadgeEvaluationInput({
        day,
        decisionHistory: [],
        activeEvents: gameState.events,
        eventPool,
        dailyEventSet: null,
        dailyGoalState: null,
        metricsBefore,
        metricsAfter: metricsBefore,
        socialPulseStateBefore: null,
        socialPulseStateAfter: null,
        butterflyHookState: gameState.pilot.butterflyHookState,
        containerState: null,
        vehicleState: null,
        personnelState: null,
        hubQuickActionState: null,
        authorityDailyGain: authorityGain,
      }),
    });
    earnedBadgeCount += badgeResult.snapshot.earnedBadgeIds.length;
    gameState = {
      ...gameState,
      pilot: { ...gameState.pilot, badgeState: badgeResult.badgeState },
    };

    for (const event of gameState.events) {
      gameState = {
        ...gameState,
        solvedEvents: [
          ...gameState.solvedEvents,
          { id: event.id, title: event.title, xpEarned: 0 },
        ],
        pilot: {
          ...gameState.pilot,
          completedEventIds: [...gameState.pilot.completedEventIds, event.id],
        },
        events: [],
        featuredEventId: '',
      };
    }

    if (offset < simulatedDays - 1) {
      const advanced = advancePostPilotDay(gameState, day);
      if (advanced.reportCrashed) {
        reportCrashCount += 1;
      }
      gameState = advanced.gameState;
      eventPool = [];
    } else {
      const endOnly = endDay(
        { ...gameState, decisionHistory: [], snapshots: [], eventPool: [] },
        { skipEventSelection: true },
      );
      if (!tryBuildPostPilotReportView(day, endOnly.dailyReport)) {
        reportCrashCount += 1;
      }
    }
  }

  if (simulatedDays === 3 && earnedBadgeCount >= POST_PILOT_AUDIT_BADGE_COUNT_WARN_3D) {
    warnings.push(
      `3 günde ${earnedBadgeCount} rozet (>= ${POST_PILOT_AUDIT_BADGE_COUNT_WARN_3D})`,
    );
  }

  if (
    simulatedDays === 3 &&
    authorityTrustGainTotal > POST_PILOT_AUDIT_AUTHORITY_GAIN_WARN_3D
  ) {
    warnings.push(
      `3 günde authority +${authorityTrustGainTotal} (>${POST_PILOT_AUDIT_AUTHORITY_GAIN_WARN_3D})`,
    );
  }

  let health: PostPilotLoopAuditHealth = 'PASS';

  if (
    duplicateEventCount > 0 ||
    maxActiveEventsExceeded ||
    forbiddenWordCount > 0 ||
    reportCrashCount > 0 ||
    dailyEventCounts.some((c) => c > MAX_POST_PILOT_ACTIVE_EVENTS) ||
    dailyEventCounts.some((c) => c < 1)
  ) {
    health = 'FAIL';
  } else if (warnings.length > 0) {
    health = 'WARN';
  }

  return {
    simulatedDays,
    dailyEventCounts,
    duplicateEventCount,
    maxActiveEventsExceeded,
    authorityTrustGainTotal,
    earnedBadgeCount,
    reportCrashCount,
    forbiddenWordCount,
    warnings,
    health,
  };
}

/** Light fazda shouldClearPilotActiveEvents false dönmeli (olaylar korunur). */
export function postPilotLightEventsProtectedFromClearGuard(
  gameState: GameState,
): boolean {
  return !shouldClearPilotActiveEvents(gameState);
}
