import { buildAuthorityPermissionPreviewCompactSummary } from '@/core/authority/authorityPermissionPreviewModel';
import { buildAuthorityRankLabel } from '@/core/authority/authorityPresentation';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import { formatSourceAmount } from '@/core/economy/economyFormatter';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import { buildHubSocialPulseModel } from '@/features/social/utils/socialHubModel';

export const CENTER_HEADER_MAX_RESOURCE_CHIPS = 3;

export type CenterHeaderResourceChipId =
  | 'budget'
  | 'population'
  | 'authority'
  | 'satisfaction'
  | 'gem'
  | 'streak'
  | 'day'
  | 'onboarding'
  | 'advisor_ready'
  | 'custom';

export type CenterHeaderResourceChipTone =
  | 'gold'
  | 'green'
  | 'teal'
  | 'purple'
  | 'neutral'
  | 'warning';

export type CenterHeaderResourceChip = {
  id: CenterHeaderResourceChipId;
  label: string;
  valueText: string;
  deltaText?: string;
  tone: CenterHeaderResourceChipTone;
  iconKey: string;
  isPrimary?: boolean;
  isEstimated?: boolean;
  sourceLabel?: string;
};

export type CenterHeaderNotificationTone = 'info' | 'success' | 'warning' | 'urgent';

export type CenterHeaderNotification = {
  id: string;
  label: string;
  tone: CenterHeaderNotificationTone;
  targetRoute?: '/events' | '/reports' | '/profile';
  iconOnly?: boolean;
};

export type CenterHeaderSummary = {
  title: string;
  subtitle: string;
  cityName: string;
  displayCityName: string;
  playerName: string;
  playerRoleLabel: string;
  crestLabel?: string;
  levelLabel?: string;
  resourceChips: CenterHeaderResourceChip[];
  notification: CenterHeaderNotification;
  accessibilityLabel: string;
};

export type BuildCenterHeaderSummaryInput = {
  gameState: GameState;
  day: number;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  operationSignals?: OperationSignalsState | null;
  dailyRewardClaimedToday?: boolean;
  dailyRewardVisible?: boolean;
  economySource?: number;
  budgetDeltaLabel?: string | null;
  playerLevel?: number;
  selectedDistrictName?: string;
};

function truncateDisplayText(text: string, maxLength = 22): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(1, maxLength - 1))}…`;
}

function formatCompactTrust(trust: number): string {
  const value = Math.max(0, Math.round(trust));
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')}K`;
  }
  return value.toLocaleString('tr-TR');
}

function resolveCityName(input: BuildCenterHeaderSummaryInput): string {
  const cityName = input.gameState.city.name?.trim();
  if (cityName) return cityName;
  const district = input.selectedDistrictName?.trim();
  if (district) return district;
  return 'Crevia';
}

function resolvePlayerRoleLabel(gameState: GameState): string {
  const authorityState = normalizeAuthorityState(
    gameState.pilot.authorityState,
    gameState.pilot.currentPilotDay,
  );
  const rankLabel = buildAuthorityRankLabel(authorityState.formalRankId);
  if (rankLabel) return rankLabel;
  const role = gameState.player.role?.trim();
  if (role) return role;
  return 'Saha Koordinatörü';
}

function buildDayOneResourceChips(): CenterHeaderResourceChip[] {
  return [
    {
      id: 'day',
      label: 'Gün',
      valueText: 'Gün 1',
      tone: 'teal',
      iconKey: 'calendar-outline',
      sourceLabel: 'city.day',
    },
    {
      id: 'onboarding',
      label: 'Durum',
      valueText: 'Başlangıç',
      tone: 'gold',
      iconKey: 'flag-outline',
      sourceLabel: 'day1.onboarding',
    },
    {
      id: 'advisor_ready',
      label: 'Durum',
      valueText: 'Hazır',
      tone: 'green',
      iconKey: 'bulb-outline',
      sourceLabel: 'day1.advisor',
    },
  ];
}

function buildStandardResourceChips(
  input: BuildCenterHeaderSummaryInput,
  day: number,
): CenterHeaderResourceChip[] {
  const chips: CenterHeaderResourceChip[] = [];
  const budgetAmount =
    typeof input.economySource === 'number'
      ? input.economySource
      : input.gameState.city.budget;

  chips.push({
    id: 'budget',
    label: 'Kaynak',
    valueText: formatSourceAmount(budgetAmount),
    deltaText: input.budgetDeltaLabel?.trim() || undefined,
    tone: 'gold',
    iconKey: 'cash-outline',
    isPrimary: true,
    isEstimated: typeof input.economySource !== 'number',
    sourceLabel:
      typeof input.economySource === 'number' ? 'economy.currentSource' : 'city.budget',
  });

  const social = input.socialPulseState
    ? buildHubSocialPulseModel(input.socialPulseState, day)
    : null;
  const satisfactionScore = social?.score ?? input.gameState.city.publicSatisfaction;
  const satisfactionRounded = Math.round(satisfactionScore);

  chips.push({
    id: 'satisfaction',
    label: 'Mutluluk',
    valueText: `%${satisfactionRounded}`,
    tone:
      satisfactionRounded >= 70
        ? 'green'
        : satisfactionRounded >= 45
          ? 'teal'
          : 'warning',
    iconKey: 'happy-outline',
    isEstimated: !input.socialPulseState,
    sourceLabel: social ? 'socialPulse.score' : 'city.publicSatisfaction',
  });

  const streakDays = input.gameState.player.streakDays;
  const authorityState = normalizeAuthorityState(
    input.gameState.pilot.authorityState,
    input.gameState.pilot.currentPilotDay,
  );

  if (input.dailyRewardVisible && streakDays >= 0) {
    const rewardDay = Math.min(Math.max(streakDays + 1, 1), 5);
    chips.push({
      id: 'streak',
      label: 'Seri',
      valueText: `${rewardDay}. gün`,
      tone: 'purple',
      iconKey: 'flame-outline',
      sourceLabel: 'player.streakDays',
    });
  } else {
    chips.push({
      id: 'authority',
      label: 'Yetki',
      valueText: formatCompactTrust(authorityState.authorityTrust),
      tone: 'teal',
      iconKey: 'shield-checkmark-outline',
      sourceLabel: 'authority.authorityTrust',
    });
  }

  return chips.slice(0, CENTER_HEADER_MAX_RESOURCE_CHIPS);
}

function buildFallbackResourceChips(day: number): CenterHeaderResourceChip[] {
  return [
    {
      id: 'custom',
      label: 'Merkez',
      valueText: 'Aktif',
      tone: 'teal',
      iconKey: 'home-outline',
      sourceLabel: 'fallback.hub',
    },
    {
      id: 'day',
      label: 'Gün',
      valueText: String(Math.max(1, day)),
      tone: 'gold',
      iconKey: 'calendar-outline',
      sourceLabel: 'fallback.day',
    },
  ];
}

export function buildCenterHeaderResourceChips(
  input: BuildCenterHeaderSummaryInput,
): CenterHeaderResourceChip[] {
  const day = input.day;
  if (day <= 1) {
    return buildDayOneResourceChips();
  }

  const chips = buildStandardResourceChips(input, day).filter(
    (chip) => chip.valueText.trim().length > 0,
  );

  if (chips.length >= 2) {
    return chips.slice(0, CENTER_HEADER_MAX_RESOURCE_CHIPS);
  }

  return buildFallbackResourceChips(day).slice(0, CENTER_HEADER_MAX_RESOURCE_CHIPS);
}

function buildCenterHeaderNotification(
  input: BuildCenterHeaderSummaryInput,
): CenterHeaderNotification {
  const { gameState, hubTomorrowRisk, operationSignals } = input;
  const authorityPreview = buildAuthorityPermissionPreviewCompactSummary({
    authorityState: gameState.pilot.authorityState,
    day: gameState.pilot.currentPilotDay,
  });

  const hasCriticalEvent = gameState.events.some(
    (event) => event.riskLevel === 'critical' || event.riskLevel === 'high',
  );

  if (
    hubTomorrowRisk?.priority === 'high' &&
    hubTomorrowRisk.shouldShowInHub !== false
  ) {
    return {
      id: 'tomorrow-risk-high',
      label: 'Yüksek risk sinyali',
      tone: 'urgent',
      targetRoute: '/events',
    };
  }

  if (hasCriticalEvent) {
    return {
      id: 'critical-operation',
      label: 'Acil operasyon',
      tone: 'urgent',
      targetRoute: '/events',
    };
  }

  if (operationSignals?.overall.status === 'critical') {
    return {
      id: 'operation-pressure',
      label: 'Operasyon baskısı',
      tone: 'urgent',
      targetRoute: '/events',
    };
  }

  if (input.dailyRewardVisible && !input.dailyRewardClaimedToday) {
    return {
      id: 'daily-reward-ready',
      label: 'Ödül hazır',
      tone: 'info',
      targetRoute: '/events',
    };
  }

  if (
    authorityPreview.visible &&
    authorityPreview.nextPermissionLine?.trim()
  ) {
    return {
      id: 'authority-preview',
      label: 'Yeni yetki yakında',
      tone: 'success',
      targetRoute: '/profile',
    };
  }

  if (gameState.player.notificationCount > 0) {
    return {
      id: 'player-notifications',
      label: `${gameState.player.notificationCount} bildirim`,
      tone: 'info',
      targetRoute: '/profile',
    };
  }

  return {
    id: 'calm-day',
    label: 'Bugün sakin',
    tone: 'info',
    iconOnly: true,
  };
}

export function buildCenterHeaderSummary(
  input: BuildCenterHeaderSummaryInput,
): CenterHeaderSummary {
  const day = input.day;
  const cityName = resolveCityName(input);
  const displayCityName = truncateDisplayText(cityName);
  const playerName = input.gameState.player.name?.trim() || 'Can';
  const playerRoleLabel = resolvePlayerRoleLabel(input.gameState);
  const levelLabel =
    typeof input.playerLevel === 'number' && input.playerLevel > 0
      ? `Sv. ${input.playerLevel}`
      : undefined;
  const resourceChips = buildCenterHeaderResourceChips(input);
  const notification = buildCenterHeaderNotification(input);

  const subtitle = day > 1 ? `Gün ${day} · Operasyon Dönemi` : 'Gün 1 · Başlangıç Dönemi';

  const accessibilityLabel = [
    'Crevia Merkez',
    playerName,
    displayCityName,
    playerRoleLabel,
    resourceChips.map((chip) => `${chip.label} ${chip.valueText}`).join(', '),
    notification.iconOnly ? undefined : notification.label,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    title: 'Crevia',
    subtitle,
    cityName,
    displayCityName,
    playerName,
    playerRoleLabel,
    crestLabel: 'Merkez',
    levelLabel,
    resourceChips,
    notification,
    accessibilityLabel,
  };
}

export function centerHeaderResourceChipIdsAreUnique(
  header: CenterHeaderSummary,
): boolean {
  const ids = header.resourceChips.map((chip) => chip.id);
  return new Set(ids).size === ids.length;
}

export function centerHeaderHasValidResourceValues(header: CenterHeaderSummary): boolean {
  return header.resourceChips.every(
    (chip) =>
      chip.valueText.trim().length > 0 &&
      chip.label.trim().length > 0 &&
      !chip.valueText.includes('undefined') &&
      !chip.valueText.includes('null'),
  );
}

export function centerHeaderChipCountWithinLimit(header: CenterHeaderSummary): boolean {
  return header.resourceChips.length <= CENTER_HEADER_MAX_RESOURCE_CHIPS;
}
