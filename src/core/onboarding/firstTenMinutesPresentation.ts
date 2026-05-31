import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  DAY1_GUIDANCE_COPY,
  DAY2_GUIDANCE_COPY,
  DAY3_GUIDANCE_COPY,
  GUIDANCE_BY_STAGE,
  SURFACE_CTA_LABELS,
} from './firstTenMinutesConstants';
import type {
  FirstTenMinutesGameContext,
  FirstTenMinutesGuidanceModel,
  FirstTenMinutesReportGuard,
  FirstTenMinutesStage,
  FirstTenMinutesSurface,
  FirstTenMinutesSystemKey,
  FirstTenMinutesSurfaceRule,
  FirstTenMinutesVisibility,
  HubCardVisibilityModel,
} from './firstTenMinutesTypes';

export function resolveFirstTenMinutesDay(gameState: GameState): number {
  if (gameState.pilot.status === 'active') {
    return gameState.pilot.currentPilotDay ?? gameState.city.day;
  }
  return gameState.city.day;
}

export function getFirstTenMinutesStage(
  ctx: FirstTenMinutesGameContext,
): FirstTenMinutesStage {
  const day = resolveFirstTenMinutesDay(ctx.gameState);
  if (day <= 1) {
    if (ctx.hasDailyReportForDay) return 'day1_report';
    if (ctx.hasDecisionToday) return 'day1_result';
    return 'day1_entry';
  }
  if (day === 2) return 'day2_reinforcement';
  if (day === 3) return 'day3_unlock_hint';
  return 'normal';
}

function buildSurfaceRules(stage: FirstTenMinutesStage): FirstTenMinutesSurfaceRule[] {
  const day1Hub: FirstTenMinutesSurfaceRule = {
    surface: 'hub',
    visibility: 'featured',
    reason: 'Day 1 hub focuses on advisor + daily plan',
    maxPrimaryCards: 2,
    allowedCtas: ['Planı Onayla', 'Kısa Öneri Al', 'Operasyona Devam Et'],
  };
  const day1Report: FirstTenMinutesSurfaceRule = {
    surface: 'report',
    visibility: 'compact',
    reason: 'Day 1 educational report',
    maxPrimaryCards: 1,
    allowedCtas: ['Operasyon Merkezine Dön'],
  };

  if (stage.startsWith('day1')) {
    return [
      day1Hub,
      {
        surface: 'event_plan',
        visibility: 'compact',
        reason: 'Single primary CTA on event plan',
        maxPrimaryCards: 1,
        allowedCtas: ['Karar Ver'],
      },
      {
        surface: 'event_dispatch',
        visibility: 'featured',
        reason: 'Recommended assignment only',
        maxPrimaryCards: 1,
        allowedCtas: ['Önerilen Atamayı Onayla', 'Sahaya Gönder'],
      },
      {
        surface: 'event_field',
        visibility: 'compact',
        reason: 'Field step simplified',
        maxPrimaryCards: 1,
        allowedCtas: ['Sonucu Gör'],
      },
      {
        surface: 'event_result',
        visibility: 'compact',
        reason: 'Result readback',
        maxPrimaryCards: 1,
        allowedCtas: [],
      },
      day1Report,
      { surface: 'map', visibility: 'compact', reason: 'Map low profile', maxPrimaryCards: 0, allowedCtas: [] },
      { surface: 'social', visibility: 'hidden', reason: 'Social deep dive hidden', maxPrimaryCards: 1, allowedCtas: [] },
      { surface: 'profile', visibility: 'compact', reason: 'Profile low profile', maxPrimaryCards: 0, allowedCtas: [] },
    ];
  }

  if (stage === 'day2_reinforcement') {
    return [
      {
        surface: 'hub',
        visibility: 'featured',
        reason: 'Day 2 reinforcement',
        maxPrimaryCards: 3,
        allowedCtas: ['Planı Onayla', 'Operasyona Devam Et'],
      },
      {
        surface: 'report',
        visibility: 'compact',
        reason: 'Slightly richer report',
        maxPrimaryCards: 2,
        allowedCtas: ['Operasyon Merkezine Dön'],
      },
    ];
  }

  if (stage === 'day3_unlock_hint') {
    return [
      {
        surface: 'hub',
        visibility: 'normal',
        reason: 'Day 3 progressive unlock',
        maxPrimaryCards: 4,
        allowedCtas: [],
      },
    ];
  }

  return [];
}

export function buildFirstTenMinutesGuidanceModel(
  ctx: FirstTenMinutesGameContext,
): FirstTenMinutesGuidanceModel {
  const stage = getFirstTenMinutesStage(ctx);
  if (stage === 'normal') {
    return {
      stage,
      title: '',
      summary: '',
      primaryInstruction: '',
      surfaceRules: [],
      shouldShowAdvancedSystems: true,
    };
  }

  const copy = GUIDANCE_BY_STAGE[stage];
  return {
    stage,
    title: copy.title,
    summary: copy.summary,
    primaryInstruction: copy.primaryInstruction,
    secondaryNote: 'secondaryNote' in copy ? copy.secondaryNote : undefined,
    surfaceRules: buildSurfaceRules(stage),
    shouldShowAdvancedSystems: false,
  };
}

export function shouldHideAdvancedSystemForFirstTenMinutes(
  gameState: GameState,
  systemKey: FirstTenMinutesSystemKey,
  monetization?: MonetizationState,
): boolean {
  const day = resolveFirstTenMinutesDay(gameState);
  const pilotActive = gameState.pilot.status === 'active';
  const pilotDay = gameState.pilot.currentPilotDay ?? gameState.city.day;
  const cityDay = gameState.city.day;

  switch (systemKey) {
    case 'crisis_desk':
    case 'crisis_actions':
      if (pilotActive && pilotDay <= 7) return true;
      return cityDay < POST_PILOT_FIRST_OPERATION_DAY;
    case 'main_operation_season':
      if (pilotActive && pilotDay <= 7) return true;
      return day <= 2;
    case 'live_micro_decisions':
      return day <= 2;
    case 'post_pilot_preview':
      if (pilotActive && pilotDay < 7) return true;
      return day < 7 && gameState.pilot.status !== 'completed';
    case 'advanced_assignment_editor':
      return day <= 1;
    case 'advanced_operation_impacts':
      return day <= 1;
    case 'social_deep_dive':
      return day <= 1;
    case 'leaderboard':
      return day <= 2;
    case 'profile_prestige':
      return day <= 1;
    default:
      return false;
  }
}

export function getSurfaceVisibilityForFirstTenMinutes(
  ctx: FirstTenMinutesGameContext,
  surface: FirstTenMinutesSurface,
): FirstTenMinutesVisibility {
  const guidance = buildFirstTenMinutesGuidanceModel(ctx);
  const rule = guidance.surfaceRules.find((r) => r.surface === surface);
  if (rule) return rule.visibility;
  return guidance.shouldShowAdvancedSystems ? 'normal' : 'compact';
}

export function getFirstTenMinutesPrimaryCtaLabel(
  surface: FirstTenMinutesSurface,
  fallback: string,
): string {
  const key =
    surface === 'event_dispatch'
      ? 'event_dispatch_confirm'
      : surface === 'event_field'
        ? 'event_field_result'
        : surface === 'report'
          ? 'report_return_hub'
          : surface === 'hub'
            ? 'daily_plan_confirm'
            : null;
  if (key && SURFACE_CTA_LABELS[key]) {
    return SURFACE_CTA_LABELS[key];
  }
  return fallback;
}

export function buildHubCardVisibilityModel(
  gameState: GameState,
  monetization?: MonetizationState,
): HubCardVisibilityModel {
  const day = resolveFirstTenMinutesDay(gameState);
  const ctx: FirstTenMinutesGameContext = { gameState };

  if (day <= 1) {
    return {
      showFirstDayGuide: true,
      showOperationSignals: 'compact',
      showAdvisor: 'featured',
      showDailyPlan: 'featured',
      showLiveOperations: false,
      showCrisis: false,
      showCrisisActions: false,
      showMainOperationSeason: false,
      showPostPilotPreview: false,
      showQuickActions: 'compact',
      showPersonnelStrip: false,
      showRegionPulse: false,
      showOperationalResources: false,
      maxFeaturedCards: 2,
    };
  }

  if (day === 2) {
    return {
      showFirstDayGuide: false,
      showOperationSignals: 'compact',
      showAdvisor: 'featured',
      showDailyPlan: 'featured',
      showLiveOperations: false,
      showCrisis: shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'crisis_desk',
        monetization,
      )
        ? false
        : false,
      showCrisisActions: false,
      showMainOperationSeason: false,
      showPostPilotPreview: !shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'post_pilot_preview',
        monetization,
      ),
      showQuickActions: 'normal',
      showPersonnelStrip: true,
      showRegionPulse: true,
      showOperationalResources: true,
      maxFeaturedCards: 3,
    };
  }

  if (day === 3) {
    return {
      showFirstDayGuide: false,
      showOperationSignals: 'normal',
      showAdvisor: 'normal',
      showDailyPlan: 'featured',
      showLiveOperations: !shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'live_micro_decisions',
        monetization,
      ),
      showCrisis: !shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'crisis_desk',
        monetization,
      ),
      showCrisisActions: !shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'crisis_actions',
        monetization,
      ),
      showMainOperationSeason: !shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'main_operation_season',
        monetization,
      ),
      showPostPilotPreview: !shouldHideAdvancedSystemForFirstTenMinutes(
        gameState,
        'post_pilot_preview',
        monetization,
      ),
      showQuickActions: 'normal',
      showPersonnelStrip: true,
      showRegionPulse: true,
      showOperationalResources: true,
      maxFeaturedCards: 4,
    };
  }

  return {
    showFirstDayGuide: false,
    showOperationSignals: 'normal',
    showAdvisor: 'normal',
    showDailyPlan: 'normal',
    showLiveOperations: true,
    showCrisis: !shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'crisis_desk',
      monetization,
    ),
    showCrisisActions: !shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'crisis_actions',
      monetization,
    ),
    showMainOperationSeason: !shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'main_operation_season',
      monetization,
    ),
    showPostPilotPreview: !shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'post_pilot_preview',
      monetization,
    ),
    showQuickActions: 'normal',
    showPersonnelStrip: true,
    showRegionPulse: true,
    showOperationalResources: true,
    maxFeaturedCards: 6,
  };
}

export function buildFirstTenMinutesReportGuard(
  gameState: GameState,
): FirstTenMinutesReportGuard {
  const day = resolveFirstTenMinutesDay(gameState);
  const hideAdvanced = day <= 2;

  return {
    hideCrisis: shouldHideAdvancedSystemForFirstTenMinutes(gameState, 'crisis_desk'),
    hideCrisisActions: shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'crisis_actions',
    ),
    hideMainOperation: shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'main_operation_season',
    ),
    hideMicroDecisions: shouldHideAdvancedSystemForFirstTenMinutes(
      gameState,
      'live_micro_decisions',
    ),
    compactPrimaryImpact: day <= 2,
    shortAdvisor: day <= 2,
    hideMetaProgressHeavy: day <= 1,
    educationalLineCap: day <= 1 ? 3 : day === 2 ? 4 : 99,
  };
}

export function shouldUseFirstTenMinutesAdvisorShortMode(gameState: GameState): boolean {
  return resolveFirstTenMinutesDay(gameState) <= 1;
}

export function shouldUseFirstTenMinutesDailyPlanMode(gameState: GameState): boolean {
  return resolveFirstTenMinutesDay(gameState) <= 1;
}

export function shouldUseFirstTenMinutesAssignmentSimpleMode(gameState: GameState): boolean {
  return resolveFirstTenMinutesDay(gameState) <= 1;
}

export {
  DAY1_GUIDANCE_COPY,
  DAY2_GUIDANCE_COPY,
  DAY3_GUIDANCE_COPY,
  DAY1_ADVISOR_SHORT_COPY,
  DAY1_DAILY_PLAN_COPY,
  DAY1_ASSIGNMENT_COPY,
  DAY1_EVENT_PLAN_COPY,
  DAY1_REPORT_EDUCATIONAL_LINES,
  FIRST_TEN_MINUTES_FORBIDDEN_WORDS,
  FIRST_TEN_MINUTES_MAX_LINE_LENGTH,
} from './firstTenMinutesConstants';
