import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { createDay1Seed } from '@/core/content/day1Seed';
import { pilotEvents } from '@/core/content/pilotEvents';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import {
  applyDerivedScopesToPostPilotState,
  shouldShowPostPilotAgendaBanner,
} from '@/core/postPilot/postPilotOperationEngine';
import {
  applyPostPilotEventGenerationToGameState,
  ensurePostPilotDailyEventsForDay,
} from '@/core/postPilot/postPilotEventEngine';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { buildPostPilotAgendaBannerModel } from '@/core/postPilot/postPilotOperationUxPresentation';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import {
  buildHubAuthorityChipSummaryFromPilot,
  buildHubAuthorityChipSummary,
} from '@/features/hub/utils/hubAuthorityModel';
import {
  buildHubScreenLayoutModel,
  collectHubScreenPresentationStrings,
  formatHubTaskRewardLabel,
  HUB_UI_FORBIDDEN_WORDS,
  HUB_UI_LAYOUT_GUARDS,
  hubLayoutHasSinglePrimaryCta,
  hubTaskHeroStringsContainXp,
  hubUiTextContainsForbiddenWords,
  resolveHubFocusMode,
} from '@/features/hub/utils/hubScreenPresentation';
import {
  HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT,
  HUB_QUICK_ACTION_PREVIEW,
  resolveHubQuickActionsLayoutMode,
} from '@/features/hub/hubUiPresentation';
import { HUB_PREMIUM_LAYOUT } from '@/features/hub/utils/hubPremiumPresentation';
import { selectHubQuickActionCards } from '@/core/hubQuickActions';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';

export type VerifyHubUiOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function lightPostPilotGameState(events: EventCard[] = []): GameState {
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
      authorityState: createInitialAuthorityState(7),
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
      authorityState: createInitialAuthorityState(7),
      badgeState: createInitialBadgeState(7),
      postPilotOperation: postPilot,
    },
  };
}

function activePilotWithEvents(): GameState {
  const seed = createDay1Seed();
  const event = pilotEvents[0];
  if (!event) {
    return seed.gameState;
  }
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day: 3 },
    events: [{ ...event, day: 3 }],
    featuredEventId: event.id,
    pilot: {
      ...seed.gameState.pilot,
      status: 'active',
      currentPilotDay: 3,
    },
  };
}

function pilotPreviewIdleState(): GameState {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    pilot: {
      ...seed.gameState.pilot,
      status: 'completed',
      currentPilotDay: 7,
      finalResult: {
        score: 82,
        status: 'successful',
        summary: 'Pilot bölge tamamlandı.',
        completedAtDay: 7,
      },
      postPilotOperation: normalizePostPilotOperationState(
        { phase: 'preview_seen' },
        { pilotStatus: 'completed', currentPilotDay: 7 },
      ),
    },
  };
}

export function verifyHubUiScenario(): VerifyHubUiOutcome {
  const checks: Check[] = [];

  const seed = createDay1Seed();
  let freshLayout;
  try {
    freshLayout = buildHubScreenLayoutModel({
      gameState: seed.gameState,
      tutorialActive: false,
      isDay1Layout: false,
      activeEventCount: seed.gameState.events.length,
    });
    assert(checks, freshLayout.focusMode.length > 0, 'Fresh state Hub render path crash olmaz');
  } catch (error) {
    assert(
      checks,
      false,
      'Fresh state Hub render path crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
    freshLayout = buildHubScreenLayoutModel({
      gameState: seed.gameState,
      tutorialActive: false,
      isDay1Layout: false,
      activeEventCount: 0,
    });
  }

  const day1Layout = buildHubScreenLayoutModel({
    gameState: seed.gameState,
    tutorialActive: true,
    isDay1Layout: true,
    activeEventCount: seed.gameState.events.length,
  });
  assert(
    checks,
    day1Layout.focusMode === 'day1_tutorial' && !day1Layout.showAuthorityChip,
    'Day 1 tutorial Hub compact kalır',
    day1Layout.focusMode,
  );

  const pilotActive = activePilotWithEvents();
  const criticalLayout = buildHubScreenLayoutModel({
    gameState: pilotActive,
    tutorialActive: false,
    isDay1Layout: false,
    activeEventCount: pilotActive.events.length,
  });
  assert(
    checks,
    criticalLayout.focusMode === 'critical_event' &&
      criticalLayout.showCriticalEventInFocus,
    'Normal pilot active + featured event ile ana odak kartı güvenli üretilir',
    criticalLayout.focusMode,
  );

  const lightBase = lightPostPilotGameState();
  const gen = ensurePostPilotDailyEventsForDay({
    gameState: lightBase,
    postPilotOperation: lightBase.pilot.postPilotOperation!,
    day: POST_PILOT_FIRST_OPERATION_DAY,
  });
  const lightWithEvents = applyPostPilotEventGenerationToGameState(lightBase, gen);
  const postPilotLayout = buildHubScreenLayoutModel({
    gameState: lightWithEvents,
    tutorialActive: false,
    isDay1Layout: false,
    activeEventCount: lightWithEvents.events.length,
    postPilotOperation: lightWithEvents.pilot.postPilotOperation,
  });
  const agendaVisible = shouldShowPostPilotAgendaBanner(
    'completed',
    lightWithEvents.pilot.postPilotOperation!,
  );
  assert(
    checks,
    postPilotLayout.focusMode === 'post_pilot_agenda' &&
      postPilotLayout.showPostPilotAgendaInFocus &&
      agendaVisible,
    'postPilot main_operation_light + active event ile PostPilotAgendaBanner visible döner',
    `focus=${postPilotLayout.focusMode} events=${lightWithEvents.events.length}`,
  );

  const previewLayout = buildHubScreenLayoutModel({
    gameState: pilotPreviewIdleState(),
    tutorialActive: false,
    isDay1Layout: false,
    activeEventCount: 0,
  });
  assert(
    checks,
    previewLayout.focusMode === 'pilot_preview' &&
      previewLayout.showPilotPreviewStrip,
    'pilot completed idle/preview_seen durumunda preview yönlendirme crash olmaz',
    previewLayout.focusMode,
  );

  let authoritySummary;
  try {
    authoritySummary = buildHubAuthorityChipSummary(undefined, 3);
    assert(
      checks,
      authoritySummary.rankLabel.length > 0,
      'HubAuthorityProgressChip undefined authorityState ile crash olmaz',
    );
  } catch (error) {
    assert(
      checks,
      false,
      'HubAuthorityProgressChip undefined authorityState ile crash olmaz',
      error instanceof Error ? error.message : 'unknown',
    );
  }

  const rewardLine = formatHubTaskRewardLabel(12);
  assert(
    checks,
    rewardLine === '+12 ilerleme' && !hubTaskHeroStringsContainXp(rewardLine),
    'HubTaskTrackingHero +XP metni üretmez',
    rewardLine,
  );

  const day2Cards = selectHubQuickActionCards({
    hubQuickActionState: createInitialHubQuickActionState(2),
    currentDay: 2,
    day1Disabled: false,
  });
  const quickMode = resolveHubQuickActionsLayoutMode(day2Cards, false);
  const previewLines =
    HUB_UI_LAYOUT_GUARDS.quickActionTitleLines +
    HUB_UI_LAYOUT_GUARDS.quickActionTeaserLines;
  assert(
    checks,
    quickMode === 'compact-rail' &&
      previewLines <= HUB_UI_LAYOUT_GUARDS.quickActionMaxVisibleTextLines,
    'Quick action modelinde max görünür text satırı korunur',
    `mode=${quickMode} lines=${previewLines}`,
  );
  assert(
    checks,
    HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT <= 96,
    'Quick action compact max height guard',
    String(HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT),
  );
  assert(
    checks,
    HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT >= HUB_PREMIUM_LAYOUT.quickActionMinHeight,
    'Quick action kart yüksekliği metin görünürlüğü için yeterli',
    String(HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT),
  );
  assert(
    checks,
    HUB_UI_LAYOUT_GUARDS.scrollBottomPaddingMin >= 96,
    'Merkez scroll alt padding tab bar çakışmasını önler',
    String(HUB_UI_LAYOUT_GUARDS.scrollBottomPaddingMin),
  );
  assert(
    checks,
    HUB_UI_LAYOUT_GUARDS.quickActionGridFlexBasis === '48%',
    'Hızlı aksiyonlar 2x2 grid flexBasis guard',
  );

  const longTitleEvent = pilotEvents[0];
  if (longTitleEvent) {
    const longTitle =
      'Çok uzun kritik olay başlığı mobil ekranda taşmamalı ve iki satırda kalmalıdır';
    assert(
      checks,
      HUB_UI_LAYOUT_GUARDS.eventTitleNumberOfLines === 2,
      'Long event title taşma guard’ları vardır',
      longTitle.slice(0, 24),
    );
  }

  assert(
    checks,
    HUB_UI_LAYOUT_GUARDS.usesFlexShrink &&
      HUB_UI_LAYOUT_GUARDS.usesMinWidthZero &&
      HUB_UI_LAYOUT_GUARDS.chipNumberOfLines === 1,
    'Chip satırlarında minWidth/flexShrink/numberOfLines guard vardır',
    JSON.stringify(HUB_UI_LAYOUT_GUARDS),
  );

  const agendaModel = buildPostPilotAgendaBannerModel({
    gameState: lightWithEvents,
    activeEvents: lightWithEvents.events,
    featuredEventId: lightWithEvents.featuredEventId,
  });
  assert(
    checks,
    hubLayoutHasSinglePrimaryCta({
      ...postPilotLayout,
      agendaPrimaryCtaLabel: agendaModel.primaryCta?.label ?? null,
    }),
    'Aynı anda iki büyük primary CTA üretilmez',
    agendaModel.primaryCta?.label ?? 'none',
  );

  const presentationStrings = [
    ...collectHubScreenPresentationStrings(postPilotLayout),
    ...Object.values(HUB_QUICK_ACTION_PREVIEW).flatMap((p) => [p.title, p.teaser]),
    formatHubTaskRewardLabel(8),
    buildHubAuthorityChipSummaryFromPilot(undefined, 2).progressLine,
    buildHubAuthorityChipSummaryFromPilot(undefined, 2).accentLine ?? '',
    agendaModel.title,
    agendaModel.subtitle,
    agendaModel.primaryCta?.label ?? '',
    agendaModel.secondaryCta.label,
  ].filter(Boolean);

  const forbiddenHits = presentationStrings.flatMap((s) =>
    hubUiTextContainsForbiddenWords(s),
  );
  assert(
    checks,
    forbiddenHits.length === 0,
    'Yasaklı kelime taraması 0 döner',
    forbiddenHits.join(', ') || '0',
  );

  const idlePostPilot = normalizePostPilotOperationState(
    { phase: 'pilot_complete_idle' },
    { pilotStatus: 'completed', currentPilotDay: 7 },
  );
  assert(
    checks,
    !shouldShowPostPilotAgendaBanner('completed', idlePostPilot),
    'PostPilotAgendaBanner main_operation_light dışında görünmez',
    idlePostPilot.phase,
  );

  assert(
    checks,
    resolveHubFocusMode({
      gameState: pilotPreviewIdleState(),
      tutorialActive: false,
      isDay1Layout: false,
      activeEventCount: 0,
    }) === 'pilot_preview',
    'Navigation callback isimleri/route hedefleri korunur (preview focus)',
  );

  const fullUx = verifyFullUxFlowScenario();
  assert(
    checks,
    fullUx.ok,
    'full UX flow verify bozulmaz',
    `failures=${fullUx.checks.filter((c) => c.startsWith('FAIL')).length}`,
  );

  assert(
    checks,
    HUB_UI_FORBIDDEN_WORDS.length >= 8,
    'Hub forbidden word list tanımlı',
    String(HUB_UI_FORBIDDEN_WORDS.length),
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
