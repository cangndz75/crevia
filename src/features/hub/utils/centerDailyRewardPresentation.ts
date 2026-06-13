import { selectPrimaryDailyGoal } from '@/core/dailyGoals/dailyGoalSelectors';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { GameState } from '@/core/models/GameState';

import type { CenterHomeVisibilityState } from './centerHomePresentation';

/** Gerçek claim persist bağlanana kadar CTA devre dışı kalır. */
export const DAILY_REWARD_CLAIM_PERSIST_ENABLED = false;

export const DAILY_REWARD_ROUTE_LENGTH = 5;
export const DAILY_REWARD_ROUTE_MIN_DAYS = 3;
export const DAILY_REWARD_ROUTE_MAX_DAYS = 7;

export type CenterDailyRewardClaimState =
  | 'available'
  | 'claimed'
  | 'locked'
  | 'unavailable';

export type CenterDailyRewardDayState = 'done' | 'today' | 'locked' | 'missed';

export type CenterDailyRewardItemTone =
  | 'gold'
  | 'green'
  | 'teal'
  | 'purple'
  | 'neutral';

export type CenterDailyRewardItem = {
  id: string;
  label: string;
  valueText?: string;
  iconKey: string;
  tone: CenterDailyRewardItemTone;
};

export type CenterDailyRewardDay = {
  dayIndex: number;
  label: string;
  state: CenterDailyRewardDayState;
  rewardText: string;
  rewardIconKey: string;
  isBigReward?: boolean;
};

export type CenterDailyReward = {
  visibility: CenterHomeVisibilityState;
  title: string;
  subtitle?: string;
  streakLabel: string;
  today: CenterDailyRewardDay;
  days: CenterDailyRewardDay[];
  primaryReward?: CenterDailyRewardItem;
  nextBigReward?: CenterDailyRewardItem;
  claimState: CenterDailyRewardClaimState;
  ctaLabel?: string;
  ctaEnabled: boolean;
  helperText?: string;
  accessibilityLabel: string;
  /** Motion hook: claimState === 'available' iken hafif pulse için. */
  pulseAvailable: boolean;
  /** Header bildirimi ve streak chip uyumu için. */
  claimedToday: boolean;
};

export type BuildCenterDailyRewardInput = {
  gameState: GameState;
  day: number;
  dailyGoalState?: DailyGoalState | null;
};

type RouteRewardTemplate = {
  rewardText: string;
  iconKey: string;
  tone: CenterDailyRewardItemTone;
  isBigReward?: boolean;
};

const ROUTE_REWARD_TEMPLATES: RouteRewardTemplate[] = [
  { rewardText: 'Başlangıç ödülü', iconKey: 'gift-outline', tone: 'teal' },
  { rewardText: '+60 XP', iconKey: 'flash-outline', tone: 'teal' },
  { rewardText: '+80 Yetki', iconKey: 'shield-checkmark-outline', tone: 'gold' },
  { rewardText: 'Ek kaynak', iconKey: 'cube-outline', tone: 'green' },
  {
    rewardText: 'Rozet ilerlemesi',
    iconKey: 'ribbon-outline',
    tone: 'purple',
    isBigReward: true,
  },
];

function clampRouteDay(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(DAILY_REWARD_ROUTE_LENGTH, Math.max(1, Math.round(value)));
}

function resolveActiveRouteDay(streakDays: number): number {
  return clampRouteDay(streakDays + 1);
}

function resolveClaimedToday(
  input: BuildCenterDailyRewardInput,
  activeRouteDay: number,
): boolean {
  const primaryGoal = selectPrimaryDailyGoal(input.dailyGoalState);
  if (primaryGoal?.isCompleted) {
    return true;
  }

  const { day } = input;
  const streakDays = input.gameState.player?.streakDays ?? 0;
  return streakDays >= day && day > 1 && streakDays >= activeRouteDay - 1;
}

function buildDayRewardTemplate(dayIndex: number): RouteRewardTemplate {
  const index = clampRouteDay(dayIndex) - 1;
  return ROUTE_REWARD_TEMPLATES[index] ?? ROUTE_REWARD_TEMPLATES[0]!;
}

function buildRewardItem(
  dayIndex: number,
  template: RouteRewardTemplate,
): CenterDailyRewardItem {
  return {
    id: `route-day-${dayIndex}`,
    label: template.rewardText,
    valueText: template.isBigReward ? undefined : template.rewardText,
    iconKey: template.iconKey,
    tone: template.tone,
  };
}

function buildRouteDay(
  dayIndex: number,
  activeRouteDay: number,
  claimedToday: boolean,
): CenterDailyRewardDay {
  const template = buildDayRewardTemplate(dayIndex);
  let state: CenterDailyRewardDayState = 'locked';

  if (dayIndex < activeRouteDay) {
    state = 'done';
  } else if (dayIndex === activeRouteDay) {
    state = claimedToday ? 'done' : 'today';
  }

  return {
    dayIndex,
    label: dayIndex === activeRouteDay ? 'Bugün' : `${dayIndex}. gün`,
    state,
    rewardText: template.rewardText,
    rewardIconKey: template.iconKey,
    isBigReward: template.isBigReward,
  };
}

function resolveClaimState(
  input: BuildCenterDailyRewardInput,
  activeRouteDay: number,
  claimedToday: boolean,
): CenterDailyRewardClaimState {
  const streakDays = input.gameState.player?.streakDays;
  if (streakDays === undefined || streakDays === null || !Number.isFinite(streakDays)) {
    return 'unavailable';
  }

  if (claimedToday) {
    return 'claimed';
  }

  if (input.day <= 1 && streakDays <= 0) {
    return 'locked';
  }

  if (activeRouteDay >= 1 && activeRouteDay <= DAILY_REWARD_ROUTE_LENGTH) {
    return 'available';
  }

  return 'locked';
}

function resolveHelperText(
  claimState: CenterDailyRewardClaimState,
  day: number,
  nextBigReward?: CenterDailyRewardItem,
): string | undefined {
  switch (claimState) {
    case 'available':
      return 'Bugünkü seriyi koru.';
    case 'claimed':
      return 'Bugünün ödülü alındı.';
    case 'locked':
      if (day <= 1) {
        return 'İlk hedefi tamamlayarak seriyi başlat.';
      }
      if (nextBigReward) {
        return `${DAILY_REWARD_ROUTE_LENGTH}. günde ${nextBigReward.label.toLowerCase()}.`;
      }
      return 'Yarın tekrar gel.';
    case 'unavailable':
      return 'Seri bilgisi hazırlanıyor.';
    default:
      return undefined;
  }
}

function resolveCtaLabel(claimState: CenterDailyRewardClaimState): string | undefined {
  if (claimState === 'available') {
    return 'Ödülü Al';
  }
  if (claimState === 'claimed') {
    return undefined;
  }
  return undefined;
}

function buildAccessibilityLabel(
  reward: Pick<
    CenterDailyReward,
    'title' | 'streakLabel' | 'today' | 'claimState' | 'helperText'
  >,
): string {
  const parts = [
    reward.title,
    reward.streakLabel,
    `${reward.today.label}: ${reward.today.rewardText}`,
    reward.claimState,
    reward.helperText,
  ].filter(Boolean);
  return parts.join('. ');
}

export function buildCenterDailyReward(
  input: BuildCenterDailyRewardInput,
): CenterDailyReward {
  const { day } = input;
  const streakDays = Math.max(0, input.gameState.player?.streakDays ?? 0);
  const activeRouteDay = resolveActiveRouteDay(streakDays);
  const claimedToday = resolveClaimedToday(input, activeRouteDay);

  const days = Array.from({ length: DAILY_REWARD_ROUTE_LENGTH }, (_, index) =>
    buildRouteDay(index + 1, activeRouteDay, claimedToday),
  );

  const today = days.find((routeDay) => routeDay.state === 'today') ??
    days.find((routeDay) => routeDay.dayIndex === activeRouteDay) ?? {
      dayIndex: activeRouteDay,
      label: 'Bugün',
      state: claimedToday ? ('done' as const) : ('today' as const),
      rewardText: buildDayRewardTemplate(activeRouteDay).rewardText,
      rewardIconKey: buildDayRewardTemplate(activeRouteDay).iconKey,
    };

  const todayTemplate = buildDayRewardTemplate(today.dayIndex);
  const primaryReward = buildRewardItem(today.dayIndex, todayTemplate);

  const bigRewardDay = days.find((routeDay) => routeDay.isBigReward);
  const nextBigReward = bigRewardDay
    ? buildRewardItem(bigRewardDay.dayIndex, buildDayRewardTemplate(bigRewardDay.dayIndex))
    : undefined;

  const claimState = resolveClaimState(input, activeRouteDay, claimedToday);
  const helperText = resolveHelperText(claimState, day, nextBigReward);
  const ctaLabel = resolveCtaLabel(claimState);
  const ctaEnabled =
    claimState === 'available' && DAILY_REWARD_CLAIM_PERSIST_ENABLED;

  const isDayOneIntro = day <= 1 && streakDays <= 0;
  const title = isDayOneIntro ? 'Günlük Seri' : 'Günlük Ödül Rotası';
  const streakLabel = isDayOneIntro ? 'Gün 1' : `${activeRouteDay}/${DAILY_REWARD_ROUTE_LENGTH}`;
  const subtitle =
    claimState === 'claimed'
      ? undefined
      : claimState === 'available'
        ? today.rewardText
        : claimState === 'locked' && day <= 1
          ? 'Seri hedefle açılır'
          : bigRewardDay && bigRewardDay.dayIndex !== today.dayIndex
            ? `Sırada: ${nextBigReward?.label ?? bigRewardDay.rewardText}`
            : undefined;

  const visibility: CenterHomeVisibilityState = day >= 1 ? 'visible' : 'hidden';

  const reward: CenterDailyReward = {
    visibility,
    title,
    subtitle,
    streakLabel,
    today,
    days,
    primaryReward,
    nextBigReward,
    claimState,
    ctaLabel,
    ctaEnabled,
    helperText,
    accessibilityLabel: '',
    pulseAvailable: claimState === 'available',
    claimedToday,
  };

  reward.accessibilityLabel = buildAccessibilityLabel(reward);
  return reward;
}

const ALLOWED_CLAIM_STATES: CenterDailyRewardClaimState[] = [
  'available',
  'claimed',
  'locked',
  'unavailable',
];

const ALLOWED_DAY_STATES: CenterDailyRewardDayState[] = [
  'done',
  'today',
  'locked',
  'missed',
];

export function centerDailyRewardClaimStateValid(
  reward: CenterDailyReward,
): boolean {
  return ALLOWED_CLAIM_STATES.includes(reward.claimState);
}

export function centerDailyRewardDaysCountValid(reward: CenterDailyReward): boolean {
  return (
    reward.days.length >= DAILY_REWARD_ROUTE_MIN_DAYS &&
    reward.days.length <= DAILY_REWARD_ROUTE_MAX_DAYS
  );
}

export function centerDailyRewardDayIndexesUnique(reward: CenterDailyReward): boolean {
  const indexes = reward.days.map((routeDay) => routeDay.dayIndex);
  return new Set(indexes).size === indexes.length;
}

export function centerDailyRewardSingleTodayState(reward: CenterDailyReward): boolean {
  const todayCount = reward.days.filter((routeDay) => routeDay.state === 'today').length;
  if (todayCount === 1) return true;
  if (todayCount === 0 && reward.claimedToday) return true;
  return false;
}

export function centerDailyRewardDayStatesConsistent(reward: CenterDailyReward): boolean {
  return reward.days.every((routeDay) => ALLOWED_DAY_STATES.includes(routeDay.state));
}

export function centerDailyRewardTextsValid(reward: CenterDailyReward): boolean {
  if (!reward.title.trim()) return false;
  if (!reward.today.rewardText.trim()) return false;
  if (reward.days.some((routeDay) => !routeDay.rewardText.trim())) return false;
  if (reward.nextBigReward && !reward.nextBigReward.label.trim()) return false;
  return true;
}

export function centerDailyRewardNoFakeClaimEnabled(reward: CenterDailyReward): boolean {
  if (!DAILY_REWARD_CLAIM_PERSIST_ENABLED && reward.ctaEnabled) {
    return false;
  }
  return true;
}
