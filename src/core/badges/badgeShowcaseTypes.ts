import type { BadgeId, BadgeRarity } from './badgeTypes';

export type BadgeShowcaseState = 'earned' | 'in_progress' | 'locked';

export type BadgeShowcaseCategory =
  | 'operations'
  | 'trust'
  | 'resources'
  | 'strategy'
  | 'authority'
  | 'city_memory';

export type BadgeShowcaseRarity = BadgeRarity;

export type BadgeShowcaseItem = {
  id: BadgeId;
  title: string;
  description: string;
  state: BadgeShowcaseState;
  category: BadgeShowcaseCategory;
  rarity: BadgeShowcaseRarity;
  progressRatio?: number;
  progressLabel?: string;
  unlockHint?: string;
  earnedReason?: string;
  styleSignal?: string;
  detailTitle: string;
  detailBody: string;
  ctaLabel?: string;
  iconKey: string;
  statePillLabel: string;
  categoryLabel: string;
  prestigeBandLabel: string;
  systemTag: string;
};

export type BadgeShowcaseCategoryBlock = {
  category: BadgeShowcaseCategory;
  title: string;
  subtitle: string;
  earnedCount: number;
  totalCount: number;
  items: BadgeShowcaseItem[];
  previewItems: BadgeShowcaseItem[];
};

export type BadgeShowcaseEmptyState = {
  visible: boolean;
  title: string;
  body: string;
  ctaLabel: string;
};

export type BadgeShowcaseSummary = {
  earnedCount: number;
  totalCount: number;
  inProgressCount: number;
  lockedCount: number;
  completionRatio: number;
  headline: string;
  subline: string;
  prestigeLabel: string;
  featuredBadges: BadgeShowcaseItem[];
  nearUnlockBadges: BadgeShowcaseItem[];
  categories: BadgeShowcaseCategoryBlock[];
  allItems: BadgeShowcaseItem[];
  emptyState: BadgeShowcaseEmptyState;
  countLabel: string;
  progressPercentLabel: string;
};

export type BadgeShowcaseCompactSummary = {
  visible: boolean;
  countLabel: string;
  nearUnlockTitle?: string;
  ctaLabel: string;
  headline: string;
};
