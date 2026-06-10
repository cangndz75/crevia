import { calculateAuthorityProgress } from './authorityEngine';
import { createInitialAuthorityState, normalizeAuthorityState } from './authoritySeed';
import type { AuthorityState } from './authorityTypes';
import {
  AUTHORITY_PERMISSION_CATEGORY_ORDER,
  AUTHORITY_PERMISSION_CATEGORY_SUBTITLES,
  AUTHORITY_PERMISSION_PREVIEW_EMPTY,
  AUTHORITY_PERMISSION_PREVIEW_HUB_LINE_PREFIX,
  AUTHORITY_PERMISSION_PREVIEW_PROFILE_CTA,
  buildAuthorityPermissionCategoryLabel,
  buildAuthorityPermissionDetailBody,
  buildAuthorityPermissionPlayerBenefit,
  buildAuthorityPermissionPreviewHeadline,
  buildAuthorityPermissionPreviewSubline,
  buildAuthorityPermissionPrestigeLabel,
  buildAuthorityPermissionPromotionHint,
  buildAuthorityPermissionReasonLabel,
  buildAuthorityPermissionStatePill,
  buildAuthorityPermissionSystemTag,
  buildAuthorityPermissionUnlockRankTitle,
  mapRankPermissionToShowcaseCategory,
  resolveAuthorityPermissionImportance,
} from './authorityPermissionPreviewPresentation';
import {
  getCurrentRankPermissionBundle,
  getRankPermissionDefinition,
  resolveRankKeyFromAuthorityState,
} from '@/core/rankPermissions/rankPermissionMatrix';
import type { RankPermissionStatus, RankPermissionUiItem } from '@/core/rankPermissions/rankPermissionTypes';
import type {
  AuthorityPermissionPreviewCategoryBlock,
  AuthorityPermissionPreviewCompactSummary,
  AuthorityPermissionPreviewItem,
  AuthorityPermissionPreviewState,
  AuthorityPermissionPreviewSummary,
} from './authorityPermissionPreviewTypes';

const DEFAULT_DAY = 1;
const MAX_ACTIVE_PREVIEW = 6;
const MAX_NEXT_PREVIEW = 4;
const MAX_FUTURE_PREVIEW = 6;
const MAX_CATEGORY_PREVIEW = 3;

function mapRankStatusToPreviewState(status: RankPermissionStatus): AuthorityPermissionPreviewState {
  if (status === 'unlocked' || status === 'current') {
    return 'active';
  }
  if (status === 'next') {
    return 'next';
  }
  return 'locked';
}

function buildPreviewItemFromUiItem(item: RankPermissionUiItem): AuthorityPermissionPreviewItem {
  const definition = getRankPermissionDefinition(item.id);
  const state = mapRankStatusToPreviewState(item.status);
  const category = mapRankPermissionToShowcaseCategory(
    item.id,
    definition?.category ?? item.category,
  );
  const unlockRankTitle = buildAuthorityPermissionUnlockRankTitle(item.id);
  const playerBenefit = buildAuthorityPermissionPlayerBenefit(item.id, state);
  const title = definition?.title ?? item.title;
  const description = definition?.description ?? item.description;

  return {
    id: item.id,
    title,
    description,
    category,
    state,
    importance: resolveAuthorityPermissionImportance(
      definition?.playerFacingPriority ?? 99,
    ),
    unlockRankTitle: state === 'active' ? undefined : unlockRankTitle,
    reasonLabel: buildAuthorityPermissionReasonLabel(state),
    playerBenefit,
    detailTitle: title,
    detailBody: buildAuthorityPermissionDetailBody(
      state,
      description,
      playerBenefit,
      unlockRankTitle,
    ),
    ctaLabel: state === 'next' ? 'Terfiye odaklan' : undefined,
    statePillLabel: buildAuthorityPermissionStatePill(state),
    categoryLabel: buildAuthorityPermissionCategoryLabel(category),
    systemTag: buildAuthorityPermissionSystemTag(category),
    iconKey: definition?.iconKey ?? item.iconKey,
  };
}

function sortByImportance(
  a: AuthorityPermissionPreviewItem,
  b: AuthorityPermissionPreviewItem,
): number {
  const weight = { major: 0, standard: 1, minor: 2 };
  return weight[a.importance] - weight[b.importance];
}

function buildCategoryBlocks(
  allItems: AuthorityPermissionPreviewItem[],
): AuthorityPermissionPreviewCategoryBlock[] {
  return AUTHORITY_PERMISSION_CATEGORY_ORDER.map((category) => {
    const items = allItems.filter((item) => item.category === category);
    const activeCount = items.filter((item) => item.state === 'active').length;
    return {
      category,
      title: buildAuthorityPermissionCategoryLabel(category),
      subtitle: AUTHORITY_PERMISSION_CATEGORY_SUBTITLES[category],
      activeCount,
      totalCount: items.length,
      items,
      previewItems: items.slice(0, MAX_CATEGORY_PREVIEW),
    };
  }).filter((block) => block.totalCount > 0);
}

function buildProgressLabel(authorityState: AuthorityState): {
  progressRatio: number;
  progressLabel: string;
  progressPercentLabel: string;
} {
  const progress = calculateAuthorityProgress(authorityState);
  if (!progress.nextRank) {
    return {
      progressRatio: 1,
      progressLabel: 'En üst görev seviyesi',
      progressPercentLabel: '%100',
    };
  }
  const ratio = Math.min(1, Math.max(0, progress.progressToNextPercent / 100));
  return {
    progressRatio: ratio,
    progressLabel: `${progress.nextRank.label} için ${progress.trustRemainingToNext} güven kaldı`,
    progressPercentLabel: `%${progress.progressToNextPercent}`,
  };
}

export function buildAuthorityPermissionPreviewSummary(
  input: {
    authorityState?: unknown;
    xp?: number;
    day?: number;
  } = {},
): AuthorityPermissionPreviewSummary {
  const day = Math.max(1, typeof input.day === 'number' ? input.day : DEFAULT_DAY);
  const authorityState = normalizeAuthorityState(
    input.authorityState ?? createInitialAuthorityState(day),
    day,
  );

  const bundle = getCurrentRankPermissionBundle({
    currentRankKey: resolveRankKeyFromAuthorityState(authorityState),
    authorityTrust: authorityState.authorityTrust,
    xp: input.xp,
    currentTitle: authorityState.formalRankId,
  });

  const allUiItems = [
    ...bundle.unlockedPermissions,
    ...bundle.nextPermissions,
    ...bundle.futurePermissions,
  ];
  const allItems = allUiItems.map(buildPreviewItemFromUiItem);

  const currentUnlocks = allItems
    .filter((item) => item.state === 'active')
    .sort(sortByImportance);
  const nextUnlocks = allItems.filter((item) => item.state === 'next').sort(sortByImportance);
  const futureUnlocks = allItems
    .filter((item) => item.state === 'locked')
    .sort(sortByImportance);

  const progress = buildProgressLabel(authorityState);
  const activeCount = currentUnlocks.length;
  const totalCount = allItems.length;
  const nextRankTitle = bundle.nextRank?.title;
  const nextItemTitle = nextUnlocks[0]?.title;

  return {
    currentRankId: authorityState.formalRankId,
    currentRankTitle: bundle.currentRank.title,
    currentRankSubtitle: bundle.currentRank.subtitle,
    nextRankId: bundle.nextRank?.rankKey,
    nextRankTitle,
    progressRatio: progress.progressRatio,
    progressLabel: progress.progressLabel,
    progressPercentLabel: progress.progressPercentLabel,
    headline: buildAuthorityPermissionPreviewHeadline(activeCount, nextUnlocks.length > 0),
    subline: buildAuthorityPermissionPreviewSubline(activeCount),
    prestigeLabel: buildAuthorityPermissionPrestigeLabel(
      activeCount,
      progress.progressRatio,
    ),
    currentUnlocks: currentUnlocks.slice(0, MAX_ACTIVE_PREVIEW),
    nextUnlocks: nextUnlocks.slice(0, MAX_NEXT_PREVIEW),
    futureUnlocks: futureUnlocks.slice(0, MAX_FUTURE_PREVIEW),
    categoryBlocks: buildCategoryBlocks(allItems),
    promotionHint: buildAuthorityPermissionPromotionHint(nextRankTitle, nextItemTitle),
    emptyState: {
      visible: activeCount === 0 && nextUnlocks.length === 0,
      title: AUTHORITY_PERMISSION_PREVIEW_EMPTY.title,
      body: AUTHORITY_PERMISSION_PREVIEW_EMPTY.body,
    },
    activeCountLabel: `Açık: ${activeCount} / ${totalCount}`,
    allItems,
  };
}

export function buildAuthorityPermissionPreviewCompactSummary(
  input: {
    authorityState?: unknown;
    xp?: number;
    day?: number;
  } = {},
): AuthorityPermissionPreviewCompactSummary {
  const day = Math.max(1, typeof input.day === 'number' ? input.day : DEFAULT_DAY);
  const summary = buildAuthorityPermissionPreviewSummary({ ...input, day });
  const nextItem = summary.nextUnlocks[0];

  const visible =
    day > 1 &&
    nextItem != null &&
    (summary.currentUnlocks.length > 0 || summary.nextUnlocks.length > 0);

  return {
    visible,
    activeCountLabel: summary.activeCountLabel,
    nextPermissionTitle: nextItem?.title,
    nextPermissionLine: nextItem
      ? `${AUTHORITY_PERMISSION_PREVIEW_HUB_LINE_PREFIX} ${nextItem.title}`
      : undefined,
    ctaLabel: AUTHORITY_PERMISSION_PREVIEW_PROFILE_CTA,
    headline: summary.headline,
  };
}

/** Verify helper — tek izin item üretir. */
export function buildAuthorityPermissionPreviewItemForId(
  permissionId: AuthorityPermissionPreviewItem['id'],
  input: {
    authorityState?: unknown;
    xp?: number;
    day?: number;
  } = {},
): AuthorityPermissionPreviewItem | undefined {
  const summary = buildAuthorityPermissionPreviewSummary(input);
  return summary.allItems.find((item) => item.id === permissionId);
}
