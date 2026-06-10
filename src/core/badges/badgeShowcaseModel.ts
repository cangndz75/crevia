import { BADGE_DEFINITIONS, BADGE_BY_ID } from './badgeConstants';
import {
  BADGE_SHOWCASE_CATEGORY_ORDER,
  BADGE_SHOWCASE_CATEGORY_SUBTITLES,
  BADGE_SHOWCASE_EMPTY_STATE,
  BADGE_SHOWCASE_HUB_CTA,
  buildShowcaseCategoryLabel,
  buildShowcaseDetailBody,
  buildShowcaseEarnedReason,
  buildShowcaseHeadline,
  buildShowcaseInProgressHint,
  buildShowcaseLockedHint,
  buildShowcasePrestigeBandLabel,
  buildShowcasePrestigeLabel,
  buildShowcaseStatePillLabel,
  buildShowcaseStyleSignal,
  buildShowcaseSubline,
  buildShowcaseSystemTag,
  compareBadgeRarityDesc,
  mapBadgeCategoryToShowcaseCategory,
} from './badgeShowcasePresentation';
import { getIconForBadgeCategory } from '@/core/presentation/creviaIconPresentation';
import { createInitialBadgeState, normalizeBadgeState } from './badgeSeed';
import type { BadgeHistoryEntry, BadgeId, BadgeRarity, BadgeState } from './badgeTypes';
import type {
  BadgeShowcaseCategory,
  BadgeShowcaseCategoryBlock,
  BadgeShowcaseCompactSummary,
  BadgeShowcaseItem,
  BadgeShowcaseState,
  BadgeShowcaseSummary,
} from './badgeShowcaseTypes';

const DEFAULT_DAY = 1;
const MAX_FEATURED = 4;
const MAX_NEAR_UNLOCK = 3;
const MAX_CATEGORY_PREVIEW = 4;

const RARITY_WEIGHT: Record<BadgeRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
};

function resolveBadgeState(badgeId: BadgeId, badgeState: BadgeState): BadgeShowcaseState {
  if (badgeState.earnedBadgeIds.includes(badgeId)) {
    return 'earned';
  }
  const progress = badgeState.badgeProgress[badgeId];
  if (progress && progress.current > 0 && !progress.completed) {
    return 'in_progress';
  }
  return 'locked';
}

function resolveProgressRatio(
  state: BadgeShowcaseState,
  badgeId: BadgeId,
  badgeState: BadgeState,
): number | undefined {
  if (state === 'earned') {
    return 1;
  }
  const progress = badgeState.badgeProgress[badgeId];
  if (!progress || progress.target <= 0) {
    return state === 'locked' ? 0 : undefined;
  }
  return Math.min(1, Math.max(0, progress.current / progress.target));
}

function resolveProgressLabel(
  state: BadgeShowcaseState,
  badgeId: BadgeId,
  badgeState: BadgeState,
): string | undefined {
  if (state === 'earned') {
    return undefined;
  }
  const progress = badgeState.badgeProgress[badgeId];
  if (!progress || progress.current <= 0) {
    return undefined;
  }
  return `${progress.current}/${progress.target}`;
}

function findEarnedHistoryEntry(
  badgeId: BadgeId,
  history: BadgeHistoryEntry[],
): BadgeHistoryEntry | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry?.badgeId === badgeId) {
      return entry;
    }
  }
  return undefined;
}

function buildShowcaseItem(
  badgeId: BadgeId,
  badgeState: BadgeState,
): BadgeShowcaseItem {
  const definition = BADGE_BY_ID[badgeId];
  const state = resolveBadgeState(badgeId, badgeState);
  const category = mapBadgeCategoryToShowcaseCategory(badgeId, definition.category);
  const progressRatio = resolveProgressRatio(state, badgeId, badgeState);
  const progressLabel = resolveProgressLabel(state, badgeId, badgeState);
  const historyEntry = findEarnedHistoryEntry(badgeId, badgeState.history);
  const earnedReason =
    state === 'earned'
      ? buildShowcaseEarnedReason(badgeId, historyEntry?.source)
      : undefined;
  const unlockHint =
    state === 'locked'
      ? buildShowcaseLockedHint(badgeId, category)
      : state === 'in_progress'
        ? buildShowcaseInProgressHint(badgeId)
        : undefined;
  const styleSignal = buildShowcaseStyleSignal(category);
  const detailBody = buildShowcaseDetailBody(
    state,
    definition.description,
    earnedReason,
    unlockHint,
    progressLabel,
  );

  return {
    id: badgeId,
    title: definition.title,
    description: definition.description,
    state,
    category,
    rarity: definition.rarity,
    progressRatio,
    progressLabel,
    unlockHint,
    earnedReason,
    styleSignal,
    detailTitle: definition.title,
    detailBody,
    ctaLabel: state === 'locked' ? undefined : state === 'in_progress' ? 'Hedefe odaklan' : undefined,
    iconKey: getIconForBadgeCategory(definition.category).key,
    statePillLabel: buildShowcaseStatePillLabel(state),
    categoryLabel: buildShowcaseCategoryLabel(category),
    prestigeBandLabel: buildShowcasePrestigeBandLabel(definition.rarity),
    systemTag: buildShowcaseSystemTag(category),
  };
}

function selectFeaturedBadges(
  allItems: BadgeShowcaseItem[],
  badgeState: BadgeState,
): BadgeShowcaseItem[] {
  const selected: BadgeShowcaseItem[] = [];
  const seen = new Set<BadgeId>();

  const add = (item: BadgeShowcaseItem | undefined) => {
    if (!item || selected.length >= MAX_FEATURED || seen.has(item.id)) {
      return;
    }
    seen.add(item.id);
    selected.push(item);
  };

  const byId = new Map(allItems.map((item) => [item.id, item]));

  for (const badgeId of badgeState.recentlyEarnedBadgeIds) {
    add(byId.get(badgeId));
  }

  const earned = allItems
    .filter((item) => item.state === 'earned')
    .sort((a, b) => compareBadgeRarityDesc(a.rarity, b.rarity));
  for (const item of earned) {
    add(item);
  }

  const inProgress = allItems
    .filter((item) => item.state === 'in_progress')
    .sort((a, b) => (b.progressRatio ?? 0) - (a.progressRatio ?? 0));
  for (const item of inProgress) {
    add(item);
  }

  for (const item of allItems) {
    add(item);
  }

  return selected;
}

function selectNearUnlockBadges(allItems: BadgeShowcaseItem[]): BadgeShowcaseItem[] {
  return allItems
    .filter((item) => item.state === 'in_progress')
    .sort((a, b) => (b.progressRatio ?? 0) - (a.progressRatio ?? 0))
    .slice(0, MAX_NEAR_UNLOCK);
}

function buildCategoryBlocks(allItems: BadgeShowcaseItem[]): BadgeShowcaseCategoryBlock[] {
  return BADGE_SHOWCASE_CATEGORY_ORDER.map((category) => {
    const items = allItems.filter((item) => item.category === category);
    const earnedCount = items.filter((item) => item.state === 'earned').length;
    return {
      category,
      title: buildShowcaseCategoryLabel(category),
      subtitle: BADGE_SHOWCASE_CATEGORY_SUBTITLES[category],
      earnedCount,
      totalCount: items.length,
      items,
      previewItems: items.slice(0, MAX_CATEGORY_PREVIEW),
    };
  }).filter((block) => block.totalCount > 0);
}

function resolveHighestEarnedRarity(allItems: BadgeShowcaseItem[]): BadgeRarity | null {
  const earned = allItems.filter((item) => item.state === 'earned');
  if (earned.length === 0) {
    return null;
  }
  return earned.reduce<BadgeRarity>(
    (best, item) => (RARITY_WEIGHT[item.rarity] > RARITY_WEIGHT[best] ? item.rarity : best),
    'common',
  );
}

export function buildBadgeShowcaseSummary(
  badgeStateInput: unknown,
  day: number = DEFAULT_DAY,
): BadgeShowcaseSummary {
  const safeDay = Math.max(1, day);
  const badgeState = normalizeBadgeState(
    badgeStateInput ?? createInitialBadgeState(safeDay),
    safeDay,
  );

  const allItems = BADGE_DEFINITIONS.map((definition) =>
    buildShowcaseItem(definition.id, badgeState),
  );

  const earnedCount = allItems.filter((item) => item.state === 'earned').length;
  const inProgressCount = allItems.filter((item) => item.state === 'in_progress').length;
  const lockedCount = allItems.filter((item) => item.state === 'locked').length;
  const totalCount = allItems.length;
  const completionRatio = totalCount > 0 ? earnedCount / totalCount : 0;
  const highestRarity = resolveHighestEarnedRarity(allItems);

  const featuredBadges = selectFeaturedBadges(allItems, badgeState);
  const nearUnlockBadges = selectNearUnlockBadges(allItems);
  const categories = buildCategoryBlocks(allItems);

  return {
    earnedCount,
    totalCount,
    inProgressCount,
    lockedCount,
    completionRatio,
    headline: buildShowcaseHeadline(earnedCount, completionRatio),
    subline: buildShowcaseSubline(earnedCount),
    prestigeLabel: buildShowcasePrestigeLabel(earnedCount, highestRarity),
    featuredBadges,
    nearUnlockBadges,
    categories,
    allItems,
    emptyState: {
      visible: earnedCount === 0,
      title: BADGE_SHOWCASE_EMPTY_STATE.title,
      body: BADGE_SHOWCASE_EMPTY_STATE.body,
      ctaLabel: BADGE_SHOWCASE_EMPTY_STATE.ctaLabel,
    },
    countLabel: `${earnedCount} / ${totalCount}`,
    progressPercentLabel: `%${Math.round(completionRatio * 100)}`,
  };
}

export function buildBadgeShowcaseCompactSummary(
  badgeStateInput: unknown,
  day: number = DEFAULT_DAY,
): BadgeShowcaseCompactSummary {
  const summary = buildBadgeShowcaseSummary(badgeStateInput, day);
  const nearUnlock = summary.nearUnlockBadges[0];

  const visible =
    summary.earnedCount > 0 ||
    summary.inProgressCount > 0 ||
    nearUnlock != null;

  return {
    visible,
    countLabel: `Rozetler: ${summary.countLabel}`,
    nearUnlockTitle: nearUnlock ? `Yakında: ${nearUnlock.title}` : undefined,
    ctaLabel: BADGE_SHOWCASE_HUB_CTA,
    headline: summary.headline,
  };
}

/** Verify helper — tek rozet item üretir. */
export function buildBadgeShowcaseItemForId(
  badgeId: BadgeId,
  badgeStateInput: unknown,
  day: number = DEFAULT_DAY,
): BadgeShowcaseItem {
  const badgeState = normalizeBadgeState(
    badgeStateInput ?? createInitialBadgeState(day),
    day,
  );
  return buildShowcaseItem(badgeId, badgeState);
}
