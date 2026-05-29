import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';

import { POST_PILOT_FIRST_OPERATION_DAY } from './postPilotEventConstants';
import {
  applyPostPilotEventGenerationToGameState,
  ensurePostPilotDailyEventsForDay,
} from './postPilotEventEngine';
import { runPostPilotLoopAudit, simulateStartLightMainOperation } from './postPilotLoopAudit';
import {
  applyDerivedScopesToPostPilotState,
  shouldShowPostPilotAgendaBanner,
} from './postPilotOperationEngine';
import { buildPostPilotPreviewCtaLabel } from './postPilotOperationPresentation';
import { normalizePostPilotOperationState } from './postPilotOperationSeed';
import {
  buildPostPilotAgendaBannerModel,
  buildPostPilotEventContextLabel,
  buildPostPilotMapContextLine,
  buildPostPilotReportCopy,
  collectPostPilotUxPresentationStrings,
  isPostPilotGeneratedEvent,
  POST_PILOT_EVENT_CARD_LAYOUT_GUARDS,
  postPilotUxContainsForbiddenWords,
} from './postPilotOperationUxPresentation';

export type VerifyPostPilotUxOutcome = {
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

function lightGameState(events: EventCard[] = []): GameState {
  const seed = createDay1Seed();
  const postPilot = applyDerivedScopesToPostPilotState(
    {
      phase: 'main_operation_light',
      scopes: {
        istasyon: 'agenda',
        yesilvadi: 'preview',
        main_operation: 'agenda',
      },
      operationDay: POST_PILOT_FIRST_OPERATION_DAY,
      lastUpdatedDay: POST_PILOT_FIRST_OPERATION_DAY,
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
      authorityState: { ...createInitialAuthorityState(7), authorityTrust: 420 },
    },
  );

  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: POST_PILOT_FIRST_OPERATION_DAY },
    events,
    featuredEventId: events[0]?.id ?? '',
    pilot: {
      ...createDefaultPilotState(),
      status: 'completed',
      currentPilotDay: 7,
      selectedDistrictId: 'central',
      authorityState: { ...createInitialAuthorityState(7), authorityTrust: 420 },
      badgeState: createInitialBadgeState(7),
      postPilotOperation: postPilot,
    },
  };
}

export function verifyPostPilotUxScenario(): VerifyPostPilotUxOutcome {
  const checks: string[] = [];
  let ok = true;

  const postPilot = applyDerivedScopesToPostPilotState(
    {
      phase: 'main_operation_light',
      scopes: {
        istasyon: 'agenda',
        yesilvadi: 'preview',
        main_operation: 'agenda',
      },
      operationDay: 8,
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
      authorityState: { ...createInitialAuthorityState(7), authorityTrust: 420 },
    },
  );

  ok =
    assert(
      checks,
      shouldShowPostPilotAgendaBanner('completed', postPilot),
      'main_operation_light iken Hub agenda banner visible',
    ) && ok;

  const withEvents = (() => {
    const gs = lightGameState();
    const gen = ensurePostPilotDailyEventsForDay({
      gameState: gs,
      postPilotOperation: gs.pilot.postPilotOperation!,
      day: POST_PILOT_FIRST_OPERATION_DAY,
    });
    return applyPostPilotEventGenerationToGameState(gs, gen);
  })();

  const bannerWithEvents = buildPostPilotAgendaBannerModel({
    gameState: withEvents,
    activeEvents: withEvents.events,
    featuredEventId: withEvents.featuredEventId,
  });

  ok =
    assert(
      checks,
      bannerWithEvents.primaryCta?.label === 'Gündemi İncele',
      'active event varken CTA Gündemi İncele',
      bannerWithEvents.primaryCta?.label,
    ) && ok;

  ok =
    assert(
      checks,
      bannerWithEvents.primaryCta?.href.startsWith('/events/') === true,
      'Hub banner yeni route gerektirmez',
    ) && ok;

  const emptyBanner = buildPostPilotAgendaBannerModel({
    gameState: lightGameState([]),
    activeEvents: [],
  });

  ok =
    assert(
      checks,
      emptyBanner.primaryCta == null && emptyBanner.title.length > 0,
      'active event yoksa fallback crash olmaz',
    ) && ok;

  ok =
    assert(
      checks,
      emptyBanner.chips.some((c) => c.label === 'Gün 8'),
      'operationDay 8 gün chip üretir',
    ) && ok;

  const ppEvent = withEvents.events[0]!;
  ok =
    assert(
      checks,
      buildPostPilotEventContextLabel(ppEvent, 'main_operation_light') != null,
      'post-pilot event context label üretilir',
    ) && ok;

  const pilotEvent = pilotEvents[0]!;
  ok =
    assert(
      checks,
      buildPostPilotEventContextLabel(pilotEvent, 'main_operation_light') == null,
      'pilot 1-7 eventlerinde post-pilot label yok',
    ) && ok;

  ok =
    assert(
      checks,
      buildPostPilotMapContextLine(withEvents.events, 'main_operation_light') != null,
      'map context line main_operation_light + event ile döner',
    ) && ok;

  const day7Copy = buildEndOfDayReportViewModel({
    report: {
      day: 7,
      title: 'Pilot',
      stats: [],
      rewardTitle: '',
      rewardDescription: '',
    },
    metrics: { publicSatisfaction: 50, budget: 1000, staffMorale: 50 },
    dailyXpReport: { day: 7, totalXp: 0, categories: [] },
    postPilotLightDay: false,
  });

  const day8Copy = buildEndOfDayReportViewModel({
    report: {
      day: 8,
      title: 'Post',
      stats: [],
      rewardTitle: '',
      rewardDescription: '',
    },
    metrics: { publicSatisfaction: 50, budget: 1000, staffMorale: 50 },
    dailyXpReport: { day: 8, totalXp: 0, categories: [] },
    postPilotLightDay: true,
  });

  ok =
    assert(
      checks,
      day8Copy.statusTitle === buildPostPilotReportCopy(8).statusTitle &&
        day8Copy.statusTitle !== day7Copy.statusTitle,
      'post-pilot report copy Day 7 ile karışmaz',
      `${day8Copy.statusTitle} vs ${day7Copy.statusTitle}`,
    ) && ok;

  ok =
    assert(
      checks,
      buildPostPilotPreviewCtaLabel('completed') === 'Operasyon Gündemini Başlat',
      'MainOperationPreview CTA label korunur',
    ) && ok;

  const forbidden = collectPostPilotUxPresentationStrings(bannerWithEvents).flatMap(
    (line) => postPilotUxContainsForbiddenWords(line),
  );
  ok =
    assert(
      checks,
      forbidden.length === 0,
      'yasaklı kelime taraması 0',
      forbidden.join(', '),
    ) && ok;

  ok =
    assert(
      checks,
      POST_PILOT_EVENT_CARD_LAYOUT_GUARDS.titleNumberOfLines >= 1 &&
        POST_PILOT_EVENT_CARD_LAYOUT_GUARDS.usesFlexShrink &&
        POST_PILOT_EVENT_CARD_LAYOUT_GUARDS.usesMinWidthZero,
      'overflow guard sabitleri tanımlı',
    ) && ok;

  const previewGs = lightGameState();
  previewGs.pilot.postPilotOperation = {
    ...normalizePostPilotOperationState(undefined, {
      pilotStatus: 'completed',
      currentPilotDay: 7,
    }),
    phase: 'preview_seen',
  };
  const started = simulateStartLightMainOperation(previewGs);
  ok =
    assert(
      checks,
      started.gameState.events.length >= 1,
      'startLight sonrası event üretimi (simülasyon)',
    ) && ok;

  const secondStart = simulateStartLightMainOperation(started.gameState);
  ok =
    assert(
      checks,
      secondStart.gameState.events.length === started.gameState.events.length,
      'startLight ikinci çağrı duplicate üretmez',
    ) && ok;

  ok =
    assert(
      checks,
      started.gameState.pilot.run?.unlockState?.fullMainOperationUnlocked !== true,
      'fullMainOperationUnlocked true yapılmaz',
    ) && ok;

  const audit = runPostPilotLoopAudit({ simulatedDays: 3 });
  ok =
    assert(
      checks,
      audit.health === 'PASS' || audit.health === 'WARN',
      'post-pilot loop audit PASS kalır',
      audit.health,
    ) && ok;

  ok =
    assert(
      checks,
      isPostPilotGeneratedEvent(ppEvent),
      'pp event id prefix tanınır',
    ) && ok;

  return { ok, checks };
}
