import { BADGE_DEFINITIONS, BADGE_BY_ID } from '@/core/badges/badgeConstants';
import {
  buildBadgeCategoryLabel,
  buildBadgeDescription,
  buildBadgeTitle,
} from '@/core/badges/badgePresentation';
import { createInitialBadgeState, normalizeBadgeState } from '@/core/badges/badgeSeed';
import type {
  BadgeCategory,
  BadgeId,
  BadgeRarity,
  BadgeState,
} from '@/core/badges/badgeTypes';

export type ProfileBadgeIconKey =
  | 'navigate'
  | 'heart'
  | 'wallet'
  | 'people'
  | 'shield'
  | 'ribbon'
  | 'checkmark-circle'
  | 'flag';

export type ProfileBadgeShowcaseItem = {
  id: BadgeId | string;
  title: string;
  description: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  iconKey: ProfileBadgeIconKey;
  earned: boolean;
  progressLabel?: string;
};

export type ProfileBadgeShowcaseLatest = {
  title: string;
  rarityLabel: string;
  categoryLabel: string;
};

export type ProfileBadgeShowcaseSummary = {
  earnedCount: number;
  totalCount: number;
  earnedCountLabel: string;
  completionPercent: number;
  latestBadge?: ProfileBadgeShowcaseLatest;
  showcaseItems: ProfileBadgeShowcaseItem[];
};

const MAX_SHOWCASE_ITEMS = 6;
const DEFAULT_DAY = 1;

const PROFILE_RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Yaygın',
  uncommon: 'Seçkin',
  rare: 'Nadir',
  epic: 'Destansı',
};

const CATEGORY_ICON: Record<BadgeCategory, ProfileBadgeIconKey> = {
  operations: 'navigate',
  publicTrust: 'heart',
  resources: 'wallet',
  personnel: 'people',
  crisis: 'shield',
  authority: 'ribbon',
  consistency: 'checkmark-circle',
  pilot: 'flag',
};

function isBadgeId(val: unknown): val is BadgeId {
  return typeof val === 'string' && val in BADGE_BY_ID;
}

function buildProfileBadgeRarityLabel(rarity: BadgeRarity): string {
  return PROFILE_RARITY_LABELS[rarity] ?? 'Yaygın';
}

function resolveIconKey(category: BadgeCategory): ProfileBadgeIconKey {
  return CATEGORY_ICON[category] ?? 'navigate';
}

function resolveProgressLabel(
  badgeId: BadgeId,
  earned: boolean,
  badgeState: BadgeState,
): string | undefined {
  if (earned) {
    return undefined;
  }
  const progress = badgeState.badgeProgress[badgeId];
  if (!progress || progress.current <= 0 || progress.completed) {
    return undefined;
  }
  return `${progress.current}/${progress.target}`;
}

function buildShowcaseItem(
  badgeId: BadgeId,
  badgeState: BadgeState,
): ProfileBadgeShowcaseItem {
  const definition = BADGE_BY_ID[badgeId];
  const earned = badgeState.earnedBadgeIds.includes(badgeId);
  return {
    id: badgeId,
    title: definition.title,
    description: definition.description,
    rarity: definition.rarity,
    category: definition.category,
    iconKey: resolveIconKey(definition.category),
    earned,
    progressLabel: resolveProgressLabel(badgeId, earned, badgeState),
  };
}

function buildUnknownShowcaseItem(badgeId: string): ProfileBadgeShowcaseItem {
  return {
    id: badgeId,
    title: buildBadgeTitle(badgeId),
    description: buildBadgeDescription(badgeId),
    rarity: 'common',
    category: 'operations',
    iconKey: 'navigate',
    earned: false,
  };
}

function selectShowcaseBadgeIds(badgeState: BadgeState): BadgeId[] {
  const selected: BadgeId[] = [];
  const seen = new Set<BadgeId>();

  const add = (badgeId: unknown) => {
    if (selected.length >= MAX_SHOWCASE_ITEMS) return;
    if (!isBadgeId(badgeId) || seen.has(badgeId)) return;
    seen.add(badgeId);
    selected.push(badgeId);
  };

  for (const badgeId of badgeState.recentlyEarnedBadgeIds) {
    add(badgeId);
  }

  for (const badgeId of badgeState.earnedBadgeIds) {
    add(badgeId);
  }

  for (const badgeId of BADGE_DEFINITIONS.map((badge) => badge.id)) {
    if (badgeState.earnedBadgeIds.includes(badgeId)) continue;
    const progress = badgeState.badgeProgress[badgeId];
    if (progress && progress.current > 0 && !progress.completed) {
      add(badgeId);
    }
  }

  for (const badgeId of BADGE_DEFINITIONS.map((badge) => badge.id)) {
    add(badgeId);
  }

  return selected;
}

function resolveLatestBadge(
  badgeState: BadgeState,
): ProfileBadgeShowcaseLatest | undefined {
  for (let index = badgeState.recentlyEarnedBadgeIds.length - 1; index >= 0; index -= 1) {
    const badgeId = badgeState.recentlyEarnedBadgeIds[index];
    if (!isBadgeId(badgeId)) continue;
    const definition = BADGE_BY_ID[badgeId];
    return {
      title: definition.title,
      rarityLabel: buildProfileBadgeRarityLabel(definition.rarity),
      categoryLabel: buildBadgeCategoryLabel(definition.category),
    };
  }
  return undefined;
}

export function buildProfileBadgeShowcaseSummary(
  badgeStateInput: unknown,
  day: number = DEFAULT_DAY,
): ProfileBadgeShowcaseSummary {
  const safeDay = Math.max(1, day);
  const badgeState = normalizeBadgeState(
    badgeStateInput ?? createInitialBadgeState(safeDay),
    safeDay,
  );

  const totalCount = BADGE_DEFINITIONS.length;
  const earnedCount = badgeState.earnedBadgeIds.length;
  const completionPercent =
    totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const showcaseIds = selectShowcaseBadgeIds(badgeState);
  const showcaseItems = showcaseIds.map((badgeId) =>
    buildShowcaseItem(badgeId, badgeState),
  );

  return {
    earnedCount,
    totalCount,
    earnedCountLabel: `${earnedCount} / ${totalCount} rozet`,
    completionPercent,
    latestBadge: resolveLatestBadge(badgeState),
    showcaseItems,
  };
}

/** Verify helper — unknown badge id için güvenli item üretir. */
export function buildProfileBadgeShowcaseItemForId(
  badgeId: string,
  badgeStateInput: unknown,
  day: number = DEFAULT_DAY,
): ProfileBadgeShowcaseItem {
  const badgeState = normalizeBadgeState(
    badgeStateInput ?? createInitialBadgeState(day),
    day,
  );
  if (isBadgeId(badgeId)) {
    return buildShowcaseItem(badgeId, badgeState);
  }
  return buildUnknownShowcaseItem(badgeId);
}
