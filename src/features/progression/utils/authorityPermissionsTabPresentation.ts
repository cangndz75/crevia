import { buildAuthorityPermissionPreviewSummary } from '@/core/authority/authorityPermissionPreviewModel';
import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import {
  getCurrentRankPermissionBundle,
  resolveRankKeyFromAuthorityState,
} from '@/core/rankPermissions/rankPermissionMatrix';
import type { RankPermissionStatus } from '@/core/rankPermissions/rankPermissionTypes';

export type AuthorityPermissionDisplayState = 'open' | 'ready' | 'next' | 'locked';

export type AuthorityPermissionGridItem = AuthorityPermissionPreviewItem & {
  displayState: AuthorityPermissionDisplayState;
};

export type AuthorityPermissionStatusCounts = {
  open: number;
  ready: number;
  next: number;
  locked: number;
};

export type AuthorityManagementCardModel = {
  title: string;
  description: string;
  openAuthorityValue: string;
  impactValue: string;
  nextRewardLabel: string;
};

export type AuthorityPermissionsTabViewModel = {
  gridItems: AuthorityPermissionGridItem[];
  statusCounts: AuthorityPermissionStatusCounts;
  managementCard: AuthorityManagementCardModel;
};

const DISPLAY_ORDER: Record<AuthorityPermissionDisplayState, number> = {
  open: 0,
  ready: 1,
  next: 2,
  locked: 3,
};

const DISPLAY_PILL_LABELS: Record<AuthorityPermissionDisplayState, string> = {
  open: 'Açık',
  ready: 'Hazır',
  next: 'Sıradaki',
  locked: 'Kilitli',
};

function mapRankStatusToDisplayState(status: RankPermissionStatus): AuthorityPermissionDisplayState {
  switch (status) {
    case 'unlocked':
      return 'open';
    case 'current':
      return 'ready';
    case 'next':
      return 'next';
    default:
      return 'locked';
  }
}

function sortGridItems(a: AuthorityPermissionGridItem, b: AuthorityPermissionGridItem): number {
  const stateDiff = DISPLAY_ORDER[a.displayState] - DISPLAY_ORDER[b.displayState];
  if (stateDiff !== 0) return stateDiff;
  const weight = { major: 0, standard: 1, minor: 2 };
  return weight[a.importance] - weight[b.importance];
}

export function buildAuthorityPermissionsTabViewModel(input: {
  authorityState?: unknown;
  pilotDay: number;
  totalXp?: number;
}): AuthorityPermissionsTabViewModel {
  const day = Math.max(1, input.pilotDay);
  const authorityState = normalizeAuthorityState(
    input.authorityState ?? createInitialAuthorityState(day),
    day,
  );
  const summary = buildAuthorityPermissionPreviewSummary({
    authorityState,
    day,
    xp: input.totalXp,
  });

  const bundle = getCurrentRankPermissionBundle({
    currentRankKey: resolveRankKeyFromAuthorityState(authorityState),
    authorityTrust: authorityState.authorityTrust,
    xp: input.totalXp,
    currentTitle: authorityState.formalRankId,
  });

  const allUiItems = [
    ...bundle.unlockedPermissions,
    ...bundle.nextPermissions,
    ...bundle.futurePermissions,
  ];

  const statusById = new Map(allUiItems.map((item) => [item.id, item.status]));
  const gridItems: AuthorityPermissionGridItem[] = summary.allItems.map((item) => {
    const rankStatus = statusById.get(item.id) ?? 'locked';
    const displayState = mapRankStatusToDisplayState(rankStatus);
    return {
      ...item,
      displayState,
      statePillLabel: DISPLAY_PILL_LABELS[displayState],
    };
  });

  gridItems.sort(sortGridItems);

  const statusCounts: AuthorityPermissionStatusCounts = {
    open: gridItems.filter((item) => item.displayState === 'open').length,
    ready: gridItems.filter((item) => item.displayState === 'ready').length,
    next: gridItems.filter((item) => item.displayState === 'next').length,
    locked: gridItems.filter((item) => item.displayState === 'locked').length,
  };

  const total = gridItems.length;
  const available = statusCounts.open + statusCounts.ready;
  const impactPercent = total > 0 ? Math.round((available / total) * 100) : 0;
  const nextReward =
    summary.nextUnlocks[0]?.title ??
    summary.promotionHint?.split('·')[0]?.trim() ??
    'Rozet Paketi';

  return {
    gridItems,
    statusCounts,
    managementCard: {
      title: 'Yetkilerinle şehrini yönet',
      description:
        summary.subline ||
        'Her yeni izin operasyon derinliğini artırır. Açık yetkiler sahadaki karar alanını genişletir.',
      openAuthorityValue: `${available} / ${total}`,
      impactValue: `%${impactPercent}`,
      nextRewardLabel: nextReward,
    },
  };
}
