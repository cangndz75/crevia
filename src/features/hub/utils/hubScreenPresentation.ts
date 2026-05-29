import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import { shouldShowPostPilotAgendaBanner } from '@/core/postPilot/postPilotOperationEngine';
import { buildPostPilotAgendaBannerModel } from '@/core/postPilot/postPilotOperationUxPresentation';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';
import { isPostPilotLightEventLoopEligible } from '@/core/postPilot/postPilotEventEngine';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import { buildHubAuthorityChipSummaryFromPilot } from './hubAuthorityModel';
import { HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT } from '../hubUiPresentation';

export const HUB_UI_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'yetkin yetersiz',
  'premium',
  'satın al',
  'paywall',
  'full mode',
  'tam ana operasyon açıldı',
] as const;

export const HUB_UI_LAYOUT_GUARDS = {
  chipNumberOfLines: 1,
  titleNumberOfLines: 2,
  subtitleNumberOfLines: 2,
  quickActionTitleLines: 1,
  quickActionTeaserLines: 1,
  eventTitleNumberOfLines: 2,
  usesFlexShrink: true,
  usesMinWidthZero: true,
  quickActionMaxVisibleTextLines: 2,
  quickActionCompactMaxHeight: HUB_QUICK_ACTION_COMPACT_CARD_MAX_HEIGHT,
} as const;

export type HubFocusMode =
  | 'day1_tutorial'
  | 'post_pilot_agenda'
  | 'critical_event'
  | 'daily_focus'
  | 'pilot_preview';

export type HubFooterCtaKind = 'end_day' | 'continue_operation' | 'view_report' | 'none';

export type HubScreenLayoutModel = {
  focusMode: HubFocusMode;
  contextChip: string | null;
  showOperationContextStrip: boolean;
  showPostPilotAgendaInFocus: boolean;
  showCriticalEventInFocus: boolean;
  showCompactTaskTracking: boolean;
  showTaskTrackingAsFocus: boolean;
  showPilotPreviewStrip: boolean;
  showAuthorityChip: boolean;
  showRewardsJourney: boolean;
  showPilotReportBanner: boolean;
  pilotReportBannerCompact: boolean;
  hideStandalonePostPilotBanner: boolean;
  primaryFooterCta: HubFooterCtaKind;
  secondaryFooterCta: HubFooterCtaKind;
  agendaPrimaryCtaLabel: string | null;
  moreEventsCount: number;
};

export type BuildHubScreenLayoutInput = {
  gameState: GameState;
  tutorialActive: boolean;
  isDay1Layout: boolean;
  activeEventCount: number;
  postPilotOperation?: unknown;
};

function resolveOperationContextChip(gameState: GameState): string | null {
  if (isPostPilotLightEventLoopEligible(gameState)) {
    const postPilot = normalizePostPilotOperationState(
      gameState.pilot.postPilotOperation,
      {
        pilotStatus: gameState.pilot.status,
        currentPilotDay: gameState.pilot.currentPilotDay,
      },
    );
    const day =
      postPilot.operationDay ??
      (gameState.city.day >= POST_PILOT_FIRST_OPERATION_DAY
        ? gameState.city.day
        : POST_PILOT_FIRST_OPERATION_DAY);
    return `Gün ${day} · Hafif operasyon`;
  }

  if (gameState.pilot.status === 'active') {
    return `Gün ${gameState.city.day} · Pilot operasyon`;
  }

  if (gameState.pilot.status === 'completed') {
    return `Gün ${gameState.city.day} · Pilot sonrası`;
  }

  return `Gün ${gameState.city.day}`;
}

export function resolveHubFocusMode(input: BuildHubScreenLayoutInput): HubFocusMode {
  const { gameState, tutorialActive, isDay1Layout, activeEventCount } = input;

  if (tutorialActive || isDay1Layout) {
    return 'day1_tutorial';
  }

  const postPilot = normalizePostPilotOperationState(
    input.postPilotOperation ?? gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );

  if (
    shouldShowPostPilotAgendaBanner(gameState.pilot.status, postPilot) &&
    postPilot.phase === 'main_operation_light'
  ) {
    return 'post_pilot_agenda';
  }

  if (gameState.pilot.status === 'active' && activeEventCount > 0) {
    return 'critical_event';
  }

  if (
    gameState.pilot.status === 'completed' &&
    (postPilot.phase === 'pilot_complete_idle' || postPilot.phase === 'preview_seen')
  ) {
    return 'pilot_preview';
  }

  return 'daily_focus';
}

export function buildHubScreenLayoutModel(
  input: BuildHubScreenLayoutInput,
): HubScreenLayoutModel {
  const { gameState, tutorialActive, isDay1Layout, activeEventCount } = input;
  const focusMode = resolveHubFocusMode(input);
  const contextChip = resolveOperationContextChip(gameState);

  const postPilotVisible =
    !tutorialActive &&
    shouldShowPostPilotAgendaBanner(
      gameState.pilot.status,
      normalizePostPilotOperationState(
        input.postPilotOperation ?? gameState.pilot.postPilotOperation,
        {
          pilotStatus: gameState.pilot.status,
          currentPilotDay: gameState.pilot.currentPilotDay,
        },
      ),
    );

  let agendaPrimaryCtaLabel: string | null = null;
  if (postPilotVisible && focusMode === 'post_pilot_agenda') {
    const banner = buildPostPilotAgendaBannerModel({
      gameState,
      postPilotOperation: input.postPilotOperation,
      activeEvents: gameState.events,
      featuredEventId: gameState.featuredEventId,
    });
    agendaPrimaryCtaLabel = banner.primaryCta?.label ?? null;
  }

  const showPilotReportBanner =
    gameState.pilot.status === 'completed' &&
    (focusMode === 'pilot_preview' ||
      (gameState.pilot.finalResult != null && focusMode !== 'post_pilot_agenda'));

  return {
    focusMode,
    contextChip,
    showOperationContextStrip: !isDay1Layout,
    showPostPilotAgendaInFocus: focusMode === 'post_pilot_agenda',
    showCriticalEventInFocus: focusMode === 'critical_event',
    showCompactTaskTracking:
      focusMode === 'critical_event' || focusMode === 'post_pilot_agenda',
    showTaskTrackingAsFocus: focusMode === 'daily_focus',
    showPilotPreviewStrip: focusMode === 'pilot_preview',
    showAuthorityChip: !tutorialActive && !isDay1Layout,
    showRewardsJourney:
      focusMode === 'daily_focus' || focusMode === 'critical_event',
    showPilotReportBanner,
    pilotReportBannerCompact: focusMode === 'pilot_preview',
    hideStandalonePostPilotBanner: true,
    primaryFooterCta: 'end_day',
    secondaryFooterCta: activeEventCount > 1 ? 'continue_operation' : 'none',
    agendaPrimaryCtaLabel,
    moreEventsCount: Math.max(0, activeEventCount - 1),
  };
}

export function buildHubAuthorityChipSummarySafe(
  authorityState: unknown,
  currentPilotDay: number,
) {
  return buildHubAuthorityChipSummaryFromPilot(authorityState, currentPilotDay);
}

export function hubUiTextContainsForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of HUB_UI_FORBIDDEN_WORDS) {
    if (word === 'xp') {
      if (/\bxp\b/.test(haystack)) {
        hits.push(word);
      }
      continue;
    }
    if (haystack.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

export function collectHubScreenPresentationStrings(
  layout: HubScreenLayoutModel,
  extras: string[] = [],
): string[] {
  return [
    layout.contextChip ?? '',
    layout.agendaPrimaryCtaLabel ?? '',
    'Bugünkü Operasyon Gündemi',
    'Gündemi İncele',
    'Haritayı İncele',
    'Hafif operasyon',
    'Hızlı aksiyonlar',
    'Operasyona Devam',
    'Günü Tamamla',
    'Raporu Gör',
    'Bugünkü odak',
    ...extras,
  ].filter(Boolean);
}

export function hubLayoutHasSinglePrimaryCta(layout: HubScreenLayoutModel): boolean {
  if (layout.focusMode === 'post_pilot_agenda' && layout.agendaPrimaryCtaLabel) {
    return layout.primaryFooterCta === 'end_day';
  }
  return layout.primaryFooterCta !== 'none';
}

export function isPostPilotGeneratedEventForHub(event: EventCard): boolean {
  return event.id.startsWith('pp_d');
}

/** Günlük görev ödül satırı — +XP kelimesi üretmez. */
export function formatHubTaskRewardLabel(rewardAmount: number | undefined): string {
  const amount = Math.max(0, rewardAmount ?? 0);
  if (amount <= 0) {
    return '';
  }
  return `+${amount} ilerleme`;
}

export function hubTaskHeroStringsContainXp(text: string): boolean {
  return /\bxp\b/i.test(text);
}
