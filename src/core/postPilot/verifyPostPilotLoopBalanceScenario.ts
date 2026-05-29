import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { calculateDailyAuthorityTrustGain } from '@/core/authority/authorityEngine';
import { buildAuthorityDailyGainInput } from '@/core/authority/authoritySelectors';
import { processDailyBadgeEvaluation } from '@/core/badges/badgeEngine';
import { buildDailyBadgeEvaluationInput } from '@/core/badges/badgeSelectors';
import { createDay1Seed } from '@/core/content/day1Seed';
import { refreshPilotEventsFromGameState } from '@/core/game/refreshPilotEventsFromGameState';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import type { GameState } from '@/core/models/GameState';

import { MAX_POST_PILOT_ACTIVE_EVENTS, POST_PILOT_FIRST_OPERATION_DAY } from './postPilotEventConstants';
import {
  applyPostPilotEventGenerationToGameState,
  collectPostPilotEventStrings,
  ensurePostPilotDailyEventsForDay,
  isPostPilotLightEventLoopEligible,
  postPilotEventTextContainsForbiddenWords,
} from './postPilotEventEngine';
import {
  buildPostPilotLightGameState,
  postPilotLightEventsProtectedFromClearGuard,
  runPostPilotLoopAudit,
  simulateStartLightMainOperation,
} from './postPilotLoopAudit';
import {
  createInitialPostPilotOperationState,
  normalizePostPilotOperationState,
} from './postPilotOperationSeed';
import type { PostPilotOperationState } from './postPilotOperationTypes';
import {
  collectPostPilotPresentationStrings,
  postPilotPresentationContainsForbiddenWords,
} from './postPilotOperationPresentation';

export type VerifyPostPilotLoopBalanceOutcome = {
  ok: boolean;
  checks: string[];
  audit: ReturnType<typeof runPostPilotLoopAudit>;
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

function completedIdleState(): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    pilot: {
      ...createDefaultPilotState(),
      status: 'completed',
      currentPilotDay: 7,
      authorityState: createInitialAuthorityState(7),
      badgeState: createInitialBadgeState(7),
      postPilotOperation: createInitialPostPilotOperationState({
        pilotStatus: 'completed',
        currentPilotDay: 7,
      }),
    },
  };
}

export function verifyPostPilotLoopBalanceScenario(): VerifyPostPilotLoopBalanceOutcome {
  const checks: string[] = [];
  let ok = true;

  const audit = runPostPilotLoopAudit({ simulatedDays: 3 });

  ok =
    assert(
      checks,
      audit.health === 'PASS' || audit.health === 'WARN',
      '3 günlük post-pilot simülasyon PASS/WARN',
      `health=${audit.health} warnings=${audit.warnings.join('; ')}`,
    ) && ok;

  ok =
    assert(
      checks,
      audit.dailyEventCounts.every(
        (c) => c >= 1 && c <= MAX_POST_PILOT_ACTIVE_EVENTS,
      ),
      'her gün event count 1-2 aralığında',
      audit.dailyEventCounts.join(','),
    ) && ok;

  ok =
    assert(
      checks,
      audit.duplicateEventCount === 0,
      'duplicate event id oluşmaz',
      String(audit.duplicateEventCount),
    ) && ok;

  ok =
    assert(
      checks,
      !audit.maxActiveEventsExceeded,
      'maxActiveEventsExceeded false',
    ) && ok;

  ok =
    assert(
      checks,
      audit.reportCrashCount === 0,
      'post-pilot report crash olmaz',
      String(audit.reportCrashCount),
    ) && ok;

  ok =
    assert(
      checks,
      audit.forbiddenWordCount === 0,
      'yasaklı kelime taraması temiz',
      String(audit.forbiddenWordCount),
    ) && ok;

  const lightGs = buildPostPilotLightGameState(POST_PILOT_FIRST_OPERATION_DAY);
  const gen = ensurePostPilotDailyEventsForDay({
    gameState: lightGs,
    postPilotOperation: lightGs.pilot.postPilotOperation!,
    day: POST_PILOT_FIRST_OPERATION_DAY,
  });
  const applied = applyPostPilotEventGenerationToGameState(lightGs, gen);

  ok =
    assert(
      checks,
      gen.featuredEventId != null &&
        applied.events.some((e) => e.id === gen.featuredEventId),
      'featuredEventId active eventlerden biri',
    ) && ok;

  ok =
    assert(
      checks,
      gen.events.every(
        (event) =>
          event.decisions.length >= 2 &&
          event.decisions.every(
            (d) =>
              typeof d.decisionStyle === 'string' &&
              d.effects != null &&
              typeof d.title === 'string',
          ),
      ),
      'decision workflow shape uyumlu',
    ) && ok;

  ok =
    assert(
      checks,
      postPilotLightEventsProtectedFromClearGuard(applied),
      'shouldClearPilotActiveEvents post-pilot light events silmez',
    ) && ok;

  const previewSeen: PostPilotOperationState = {
    ...createInitialPostPilotOperationState({
      pilotStatus: 'completed',
      currentPilotDay: 7,
    }),
    phase: 'preview_seen',
  };
  ok =
    assert(
      checks,
      !ensurePostPilotDailyEventsForDay({
        gameState: completedIdleState(),
        postPilotOperation: previewSeen,
        day: POST_PILOT_FIRST_OPERATION_DAY,
      }).generated,
      'preview_seen iken event üretilmez',
    ) && ok;

  const day1 = createDay1Seed();
  ok =
    assert(
      checks,
      !ensurePostPilotDailyEventsForDay({
        gameState: day1.gameState,
        postPilotOperation: normalizePostPilotOperationState(
          day1.gameState.pilot.postPilotOperation,
          { pilotStatus: 'active', currentPilotDay: 1 },
        ),
        day: POST_PILOT_FIRST_OPERATION_DAY,
      }).generated,
      'pilot active iken event üretilmez',
    ) && ok;

  const idleRefresh = refreshPilotEventsFromGameState(completedIdleState(), [
    {
      id: 'stale',
      title: 'x',
      category: 'x',
      riskLevel: 'low',
      district: 'x',
      description: 'x',
      contextTag: 'x',
      urgencyHours: 1,
      decisions: [],
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
  ]);
  ok =
    assert(
      checks,
      idleRefresh.eventPool.length === 0 && idleRefresh.gameState.events.length === 0,
      'Day 7 completePilot sonrası idle event üretmez',
    ) && ok;

  let previewGs = completedIdleState();
  const firstStart = simulateStartLightMainOperation(previewGs);
  ok =
    assert(
      checks,
      firstStart.gameState.events.length >= 1 &&
        isPostPilotLightEventLoopEligible(firstStart.gameState),
      'startLightMainOperation ilk post-pilot eventleri üretir',
      `events=${firstStart.gameState.events.length}`,
    ) && ok;

  const secondStart = simulateStartLightMainOperation(firstStart.gameState);
  ok =
    assert(
      checks,
      secondStart.gameState.events.length === firstStart.gameState.events.length,
      'startLightMainOperation ikinci çağrı duplicate üretmez',
    ) && ok;

  previewGs = firstStart.gameState;
  const opDay = previewGs.pilot.postPilotOperation?.operationDay;
  ok =
    assert(
      checks,
      opDay === previewGs.city.day && (opDay ?? 0) >= POST_PILOT_FIRST_OPERATION_DAY,
      'operationDay/city.day tutarlı',
      `op=${opDay} city=${previewGs.city.day}`,
    ) && ok;

  const metrics = {
    publicSatisfaction: previewGs.city.publicSatisfaction,
    staffMorale: previewGs.city.morale,
    budget: previewGs.city.budget,
  };
  let reportOk = true;
  try {
    buildEndOfDayReportViewModel({
      report: {
        day: POST_PILOT_FIRST_OPERATION_DAY,
        title: 'Test',
        stats: [],
        rewardTitle: '',
        rewardDescription: '',
      },
      metrics,
      dailyXpReport: { day: POST_PILOT_FIRST_OPERATION_DAY, totalXp: 0, categories: [] },
      postPilotLightDay: true,
    });
  } catch {
    reportOk = false;
  }
  ok = assert(checks, reportOk, 'post-pilot report view model crash olmaz') && ok;

  const authorityGain = calculateDailyAuthorityTrustGain(
    buildAuthorityDailyGainInput({
      day: POST_PILOT_FIRST_OPERATION_DAY,
      dailyEventSet: null,
      decisionHistory: [],
      activeEvents: previewGs.events,
      dailyGoalState: null,
      metricsBefore: metrics,
      metricsAfter: metrics,
      socialPulseStateBefore: null,
      socialPulseStateAfter: null,
      butterflyHookState: previewGs.pilot.butterflyHookState,
    }),
    previewGs.pilot.authorityState ?? createInitialAuthorityState(7),
  );
  ok =
    assert(
      checks,
      Number.isFinite(authorityGain.netGain),
      'authority daily snapshot post-pilot güvenli',
    ) && ok;

  const badgeResult = processDailyBadgeEvaluation({
    badgeState: previewGs.pilot.badgeState,
    day: POST_PILOT_FIRST_OPERATION_DAY,
    input: buildDailyBadgeEvaluationInput({
      day: POST_PILOT_FIRST_OPERATION_DAY,
      decisionHistory: [],
      activeEvents: previewGs.events,
      eventPool: firstStart.eventPool,
      dailyEventSet: null,
      dailyGoalState: null,
      metricsBefore: metrics,
      metricsAfter: metrics,
      socialPulseStateBefore: null,
      socialPulseStateAfter: null,
      butterflyHookState: previewGs.pilot.butterflyHookState,
      containerState: null,
      vehicleState: null,
      personnelState: null,
      hubQuickActionState: null,
      authorityDailyGain: authorityGain,
    }),
  });
  ok =
    assert(
      checks,
      badgeResult.snapshot.earnedBadgeIds.length <= 3,
      'badge evaluation tek günde spam üretmez',
      String(badgeResult.snapshot.earnedBadgeIds.length),
    ) && ok;

  const ux = verifyFullUxFlowScenario();
  ok =
    assert(
      checks,
      ux.ok,
      'existing verify:full-ux-flow bozulmaz',
      ux.checks.filter((c) => c.startsWith('✗')).join('; '),
    ) && ok;

  const fullLoop = runFullLoopAnalysis();
  ok =
    assert(
      checks,
      fullLoop.scenarios.every((s) => s.crashes === 0),
      'existing full-loop simülasyonu crash üretmez',
      fullLoop.scenarios
        .filter((s) => s.crashes > 0)
        .map((s) => s.scenario)
        .join(', '),
    ) && ok;

  const presentationStrings = collectPostPilotPresentationStrings(
    previewGs.pilot.postPilotOperation,
    { pilotStatus: 'completed', currentPilotDay: 7 },
    previewGs.pilot.authorityState,
  );
  const eventStrings = collectPostPilotEventStrings(previewGs.events);
  const forbidden = [...presentationStrings, ...eventStrings].flatMap((line) => [
    ...postPilotPresentationContainsForbiddenWords(line),
    ...postPilotEventTextContainsForbiddenWords(line),
  ]);
  ok =
    assert(
      checks,
      forbidden.length === 0,
      'genişletilmiş yasaklı kelime taraması temiz',
      forbidden.join(', '),
    ) && ok;

  if (audit.health === 'FAIL') {
    ok = false;
  }

  return { ok, checks, audit };
}
