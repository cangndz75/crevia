import type { CityJournalHubPresentation } from '@/core/cityJournal';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { HubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesTypes';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { selectHubQuickActionCards } from '@/core/hubQuickActions';
import type { HubQuickActionState } from '@/core/hubQuickActions/hubQuickActionTypes';
import type { MainOperationFeelHubPresentation } from '@/core/mainOperationFeel/mainOperationFeelTypes';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import {
  buildCenterActiveTarget,
  type CenterActiveTarget,
} from './centerActiveTargetPresentation';
import {
  buildCenterHeaderSummary,
  type CenterHeaderSummary,
} from './centerHeaderPresentation';
import {
  buildCenterCitySummary,
  type CenterCitySummary,
} from './centerCitySummaryPresentation';
import {
  buildCenterDailyReward,
  type CenterDailyReward,
} from './centerDailyRewardPresentation';
import {
  buildCenterAdvisorSuggestion,
  centerAdvisorDedupeText,
  type CenterAdvisorSuggestion,
} from './centerAdvisorPresentation';
import {
  buildCenterOperationFocus,
  type CenterOperationFocus,
} from './centerOperationFocusPresentation';

export type CenterHomeHeaderSummary = CenterHeaderSummary;
export type CenterHomeCitySummary = CenterCitySummary;

export const CENTER_HOME_MODULE_ORDER = [
  'header',
  'citySummary',
  'dailyReward',
  'activeTarget',
  'advisorSuggestion',
  'operationFocus',
  'operationSignals',
  'quickActions',
  'recommendedPlan',
  'continuationCards',
] as const;

export type CenterHomeModuleKey = (typeof CENTER_HOME_MODULE_ORDER)[number];

export type CenterHomeVisibilityState =
  | 'visible'
  | 'hidden'
  | 'locked'
  | 'empty'
  | 'completed';

export type { CenterDailyReward as CenterHomeDailyReward } from './centerDailyRewardPresentation';

export type { CenterActiveTarget as CenterHomeActiveTarget } from './centerActiveTargetPresentation';

export type { CenterAdvisorSuggestion as CenterHomeAdvisorSuggestion } from './centerAdvisorPresentation';

export type {
  CenterOperationFocus as CenterHomeOperationFocus,
  CenterOperationFocusItem as CenterHomeOperationFocusItem,
} from './centerOperationFocusPresentation';

export type CenterHomeOperationSignal = {
  id: string;
  title: string;
  body: string;
  impactLevel: string;
  impactTone: 'high' | 'medium' | 'low';
  icon: 'trending-up' | 'flash' | 'alert-circle';
};

export type CenterHomeOperationSignals = {
  visibility: CenterHomeVisibilityState;
  signals: CenterHomeOperationSignal[];
  emptyLabel: string | null;
  showViewAll: boolean;
};

export type CenterHomeQuickAction = {
  id: string;
  title: string;
  caption: string;
  icon: string;
  iconTone: 'teal' | 'gold' | 'green';
  route: '/events';
  locked: boolean;
};

export type CenterHomeQuickActions = {
  visibility: CenterHomeVisibilityState;
  layout: 'grid-2x2' | 'horizontal-scroll';
  actions: CenterHomeQuickAction[];
};

export type CenterHomeRecommendedPlan = {
  visibility: CenterHomeVisibilityState;
  title: string;
  body: string;
  impactLabel: string | null;
  durationLabel: string | null;
  rewardLabel: string | null;
  ctaLabel: string;
  route: '/events';
  lockedTeaser: string | null;
};

export type CenterHomeContinuationCard = {
  id: string;
  kind: 'last_event' | 'upcoming_unlock' | 'report_preview';
  title: string;
  body: string;
  route: '/events' | '/reports' | '/profile';
};

export type CenterHomeContinuationCards = {
  visibility: CenterHomeVisibilityState;
  cards: CenterHomeContinuationCard[];
};

export type CenterHomeVisibilityFlags = Record<
  CenterHomeModuleKey,
  CenterHomeVisibilityState
>;

export type CenterHomePresentation = {
  moduleOrder: readonly CenterHomeModuleKey[];
  visibilityFlags: CenterHomeVisibilityFlags;
  headerSummary: CenterHomeHeaderSummary;
  citySummary: CenterHomeCitySummary;
  dailyReward: CenterDailyReward;
  activeTarget: CenterActiveTarget;
  advisorSuggestion: CenterAdvisorSuggestion;
  operationFocus: CenterOperationFocus;
  operationSignals: CenterHomeOperationSignals;
  quickActions: CenterHomeQuickActions;
  recommendedPlan: CenterHomeRecommendedPlan;
  continuationCards: CenterHomeContinuationCards;
};

export type BuildCenterHomePresentationInput = {
  gameState: GameState;
  monetization?: MonetizationState;
  dailyGoalState?: DailyGoalState | null;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubQuickActionState?: HubQuickActionState | null;
  mainOperationFeelPresentation?: MainOperationFeelHubPresentation | null;
  hubEceContextLine?: string | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubImpactExplanationLine?: string | null;
  hubCityJournal?: CityJournalHubPresentation | null;
  hubDistrictReportLine?: string | null;
  hubStoryChainLine?: string | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  cardVisibility?: HubCardVisibilityModel;
  economySource?: number;
  budgetDeltaLabel?: string | null;
  playerLevel?: number;
  selectedDistrictName?: string;
};

const QUICK_ACTION_CATALOG: Omit<CenterHomeQuickAction, 'locked'>[] = [
  {
    id: 'line_upgrade',
    title: 'Hat Yükselt',
    caption: 'Kapasiteyi artır.',
    icon: 'bus-outline',
    iconTone: 'teal',
    route: '/events',
  },
  {
    id: 'green_investment',
    title: 'Çevre Yatırımı',
    caption: 'Yeşil alanı büyüt.',
    icon: 'leaf-outline',
    iconTone: 'green',
    route: '/events',
  },
  {
    id: 'energy_support',
    title: 'Enerji Desteği',
    caption: 'Üretimi hızlandır.',
    icon: 'flash-outline',
    iconTone: 'gold',
    route: '/events',
  },
  {
    id: 'personnel_assign',
    title: 'Personel Atama',
    caption: 'Ekipleri yönet.',
    icon: 'people-outline',
    iconTone: 'teal',
    route: '/events',
  },
  {
    id: 'supply_buy',
    title: 'Malzeme Al',
    caption: 'Kaynak satın al.',
    icon: 'cart-outline',
    iconTone: 'gold',
    route: '/events',
  },
  {
    id: 'building_repair',
    title: 'Bina Onar',
    caption: 'Yapıları iyileştir.',
    icon: 'hammer-outline',
    iconTone: 'teal',
    route: '/events',
  },
];

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function resolveDay(gameState: GameState): number {
  if (gameState.pilot.status === 'active') {
    return gameState.pilot.currentPilotDay ?? gameState.city.day;
  }
  return gameState.city.day;
}

function buildHeaderSummary(
  input: BuildCenterHomePresentationInput,
  day: number,
  dailyReward: CenterDailyReward,
): CenterHomeHeaderSummary {
  return buildCenterHeaderSummary({
    gameState: input.gameState,
    day,
    socialPulseState: input.socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    operationSignals: input.operationSignals,
    dailyRewardClaimedToday: dailyReward.claimedToday,
    dailyRewardVisible: dailyReward.visibility !== 'hidden',
    economySource: input.economySource,
    budgetDeltaLabel: input.budgetDeltaLabel,
    playerLevel: input.playerLevel,
    selectedDistrictName: input.selectedDistrictName,
  });
}

function buildDailyReward(
  input: BuildCenterHomePresentationInput,
  day: number,
): CenterDailyReward {
  return buildCenterDailyReward({
    gameState: input.gameState,
    day,
    dailyGoalState: input.dailyGoalState,
  });
}

function buildActiveTarget(
  input: BuildCenterHomePresentationInput,
  day: number,
  dailyRewardHelperText?: string | null,
): CenterActiveTarget {
  return buildCenterActiveTarget({
    gameState: input.gameState,
    day,
    dailyGoalState: input.dailyGoalState,
    mainOperationFeelPresentation: input.mainOperationFeelPresentation,
    operationSignals: input.operationSignals,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubEceContextLine: input.hubEceContextLine,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    dailyRewardHelperText,
    cardVisibility: input.cardVisibility,
  });
}

function buildAdvisorSuggestion(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  dailyReward: CenterDailyReward,
  citySummary: CenterCitySummary,
  recommendedPlanBody: string,
  visibility: HubCardVisibilityModel,
): CenterAdvisorSuggestion {
  return buildCenterAdvisorSuggestion({
    gameState: input.gameState,
    day,
    activeTarget,
    dailyReward,
    citySummary,
    operationSignals: input.operationSignals,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubEceContextLine: input.hubEceContextLine,
    hubImpactExplanationLine: input.hubImpactExplanationLine,
    mainOperationFeelPresentation: input.mainOperationFeelPresentation,
    socialPulseState: input.socialPulseState,
    cardVisibility: visibility,
    recommendedPlanBody,
  });
}

function buildOperationFocus(
  input: BuildCenterHomePresentationInput,
  day: number,
  activeTarget: CenterActiveTarget,
  advisorSuggestion: CenterAdvisorSuggestion,
  citySummary: CenterCitySummary,
  operationSignalLabels: string[],
): CenterOperationFocus {
  return buildCenterOperationFocus({
    gameState: input.gameState,
    day,
    activeTarget,
    advisorSuggestion,
    citySummary,
    operationSignals: input.operationSignals,
    socialPulseState: input.socialPulseState,
    mainOperationFeelPresentation: input.mainOperationFeelPresentation,
    operationSignalLabels,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
  });
}

function mapImpactTone(
  risk?: TomorrowRiskModel | null,
): 'high' | 'medium' | 'low' {
  if (!risk) return 'medium';
  if (risk.priority === 'high') return 'high';
  if (risk.priority === 'low') return 'low';
  return 'medium';
}

function buildOperationSignalsSection(
  input: BuildCenterHomePresentationInput,
  visibility: HubCardVisibilityModel,
): CenterHomeOperationSignals {
  if (visibility.showOperationSignals === 'hidden') {
    return {
      visibility: 'hidden',
      signals: [],
      emptyLabel: null,
      showViewAll: false,
    };
  }

  const signals: CenterHomeOperationSignal[] = [];
  const tomorrow = input.hubTomorrowRisk;
  const impact = input.hubImpactExplanationLine;

  if (tomorrow?.mainLine?.trim()) {
    signals.push({
      id: 'tomorrow-risk',
      title: tomorrow.title?.trim() || 'Yükselen Talep',
      body: tomorrow.mainLine.trim(),
      impactLevel:
        mapImpactTone(tomorrow) === 'high'
          ? 'YÜKSEK'
          : mapImpactTone(tomorrow) === 'low'
            ? 'DÜŞÜK'
            : 'ORTA',
      impactTone: mapImpactTone(tomorrow),
      icon: 'trending-up',
    });
  }

  if (
    impact?.trim() &&
    !linesAreDuplicate(impact, tomorrow?.mainLine) &&
    signals.length < 3
  ) {
    signals.push({
      id: 'city-echo',
      title: 'Şehir Yankısı',
      body: impact.trim(),
      impactLevel: 'ORTA',
      impactTone: 'medium',
      icon: 'flash',
    });
  }

  const maxSignals = visibility.showOperationSignals === 'compact' ? 2 : 3;
  const trimmed = signals.slice(0, maxSignals);

  if (trimmed.length === 0) {
    return {
      visibility: 'empty',
      signals: [],
      emptyLabel: 'Bugün kritik sinyal yok',
      showViewAll: false,
    };
  }

  return {
    visibility: 'visible',
    signals: trimmed,
    emptyLabel: null,
    showViewAll: signals.length > maxSignals,
  };
}

function buildQuickActionsSection(
  input: BuildCenterHomePresentationInput,
  day: number,
  visibility: HubCardVisibilityModel,
): CenterHomeQuickActions {
  if (day <= 1 || visibility.showQuickActions === 'compact') {
    const preview = QUICK_ACTION_CATALOG.slice(0, 4).map((action) => ({
      ...action,
      locked: day <= 1,
    }));
    return {
      visibility: day <= 1 ? 'locked' : 'visible',
      layout: 'grid-2x2',
      actions: preview,
    };
  }

  const hubCards = input.hubQuickActionState
    ? selectHubQuickActionCards({
        hubQuickActionState: input.hubQuickActionState,
        currentDay: day,
        day1Disabled: day <= 1,
      })
    : [];

  const catalogActions = QUICK_ACTION_CATALOG.map((action, index) => ({
    ...action,
    locked: day <= 1,
    caption:
      hubCards[index]?.helperLine?.trim() ||
      hubCards[index]?.subtitle?.trim() ||
      action.caption,
  }));

  const maxVisible = visibility.showQuickActions === 'normal' ? 4 : 4;

  return {
    visibility: 'visible',
    layout: 'grid-2x2',
    actions: catalogActions.slice(0, maxVisible),
  };
}

function buildRecommendedPlan(
  input: BuildCenterHomePresentationInput,
  advisorCommentary: string,
  visibility: HubCardVisibilityModel,
): CenterHomeRecommendedPlan {
  const journal = input.hubCityJournal;
  const body =
    journal?.primaryLine?.trim() ||
    input.hubDistrictReportLine?.trim() ||
    input.hubStoryChainLine?.trim() ||
    input.hubVehicleMaintenanceLine?.trim() ||
    input.hubTeamSpecializationLine?.trim() ||
    'Bugünkü operasyon planının özeti burada görünür.';

  const dedupedBody = linesAreDuplicate(body, advisorCommentary)
    ? journal?.secondaryLine?.trim() ||
      input.hubDistrictReportLine?.trim() ||
      'Günün planı operasyon merkezinde hazır.'
    : body;

  const planVisibility =
    visibility.showDailyPlan === 'hidden'
      ? 'hidden'
      : visibility.showDailyPlan === 'compact' && !journal?.primaryLine
        ? 'locked'
        : 'visible';

  return {
    visibility: planVisibility,
    title: journal?.title?.trim() || 'Bugünkü Plan',
    body: dedupedBody,
    impactLabel: null,
    durationLabel: null,
    rewardLabel: null,
    ctaLabel: 'Planı Onayla',
    route: '/events',
    lockedTeaser:
      planVisibility === 'locked' ? 'Gün 2’den itibaren günlük plan özeti açılır.' : null,
  };
}

function buildContinuationCards(
  input: BuildCenterHomePresentationInput,
  day: number,
): CenterHomeContinuationCards {
  const cards: CenterHomeContinuationCard[] = [];

  if (input.hubStoryChainLine?.trim()) {
    cards.push({
      id: 'story-chain',
      kind: 'last_event',
      title: 'Son olay',
      body: input.hubStoryChainLine.trim(),
      route: '/events',
    });
  }

  if (input.hubDistrictReportLine?.trim() && cards.length < 2) {
    cards.push({
      id: 'district-report',
      kind: 'report_preview',
      title: 'Kısa rapor',
      body: input.hubDistrictReportLine.trim(),
      route: '/reports',
    });
  }

  const maintenanceOrTeam =
    input.hubVehicleMaintenanceLine?.trim() ||
    input.hubTeamSpecializationLine?.trim();
  if (maintenanceOrTeam && cards.length < 3) {
    cards.push({
      id: 'upcoming-system',
      kind: 'upcoming_unlock',
      title: 'Yaklaşan açılım',
      body: maintenanceOrTeam,
      route: '/events',
    });
  }

  if (day <= 1 || cards.length === 0) {
    return {
      visibility: cards.length > 0 ? 'visible' : 'hidden',
      cards: cards.slice(0, 2),
    };
  }

  return {
    visibility: 'visible',
    cards: cards.slice(0, 3),
  };
}

function buildVisibilityFlags(
  sections: Omit<CenterHomePresentation, 'moduleOrder' | 'visibilityFlags'>,
  day: number,
): CenterHomeVisibilityFlags {
  return {
    header: 'visible',
    citySummary: 'visible',
    dailyReward: sections.dailyReward.visibility,
    activeTarget: sections.activeTarget.visibility,
    advisorSuggestion: sections.advisorSuggestion.visibility,
    operationFocus: sections.operationFocus.visibility,
    operationSignals: sections.operationSignals.visibility,
    quickActions: sections.quickActions.visibility,
    recommendedPlan: sections.recommendedPlan.visibility,
    continuationCards: sections.continuationCards.visibility,
  };
}

export function buildCenterHomePresentation(
  input: BuildCenterHomePresentationInput,
): CenterHomePresentation {
  const day = resolveDay(input.gameState);
  const visibility =
    input.cardVisibility ??
    buildHubCardVisibilityModel(input.gameState, input.monetization);

  const dailyReward = buildDailyReward(input, day);
  const activeTarget = buildActiveTarget(input, day, dailyReward.helperText);
  const headerSummary = buildHeaderSummary(input, day, dailyReward);

  const citySummaryForAdvisor = buildCenterCitySummary({
    gameState: input.gameState,
    day,
    socialPulseState: input.socialPulseState,
    operationSignals: input.operationSignals,
    dailyGoalState: input.dailyGoalState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    activeTargetTitle: activeTarget.title,
    headerSummary,
  });

  const recommendedPlan = buildRecommendedPlan(
    input,
    input.hubEceContextLine ?? '',
    visibility,
  );
  const advisorSuggestion = buildAdvisorSuggestion(
    input,
    day,
    activeTarget,
    dailyReward,
    citySummaryForAdvisor,
    recommendedPlan.body,
    visibility,
  );
  const recommendedPlanFinal = buildRecommendedPlan(
    input,
    centerAdvisorDedupeText(advisorSuggestion),
    visibility,
  );

  const operationSignals = buildOperationSignalsSection(input, visibility);
  const operationSignalLabels = operationSignals.signals.map((signal) => signal.title);

  const sections = {
    headerSummary,
    citySummary: buildCenterCitySummary({
      gameState: input.gameState,
      day,
      socialPulseState: input.socialPulseState,
      operationSignals: input.operationSignals,
      dailyGoalState: input.dailyGoalState,
      hubTomorrowRisk: input.hubTomorrowRisk,
      activeTargetTitle: activeTarget.title,
      advisorCommentary: centerAdvisorDedupeText(advisorSuggestion),
      headerSummary,
    }),
    dailyReward,
    activeTarget,
    advisorSuggestion,
    operationFocus: buildOperationFocus(
      input,
      day,
      activeTarget,
      advisorSuggestion,
      citySummaryForAdvisor,
      operationSignalLabels,
    ),
    operationSignals,
    quickActions: buildQuickActionsSection(input, day, visibility),
    recommendedPlan: recommendedPlanFinal,
    continuationCards: buildContinuationCards(input, day),
  };

  return {
    moduleOrder: CENTER_HOME_MODULE_ORDER,
    visibilityFlags: buildVisibilityFlags(sections, day),
    ...sections,
  };
}

export function centerHomeHasDuplicateModuleKeys(
  presentation: CenterHomePresentation,
): boolean {
  const keys = new Set(presentation.moduleOrder);
  return keys.size !== presentation.moduleOrder.length;
}

export function centerHomeAdvisorAndPlanShareText(
  presentation: CenterHomePresentation,
): boolean {
  return linesAreDuplicate(
    presentation.advisorSuggestion.recommendation,
    presentation.recommendedPlan.body,
  );
}
