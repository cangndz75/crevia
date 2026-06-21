import { BADGE_DEFINITIONS } from '@/core/badges/badgeConstants';
import { BADGE_COLLECTION_TOTAL } from '@/features/progression/content/authoritiesDisplay';
import type { AuthorityTheme } from '@/features/progression/content/authoritiesDisplay';
import type { ProgressionIconName } from '@/core/content/progressionRoadmap';
import { buildBadgeShowcaseSummary } from '@/core/badges/badgeShowcaseModel';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';

import type {
  AuthorityGridItem,
  WeeklyUnlockItem,
} from './authoritiesScreenModel';

export const AUTHORITY_COLLECTION_THEME = {
  screenBg: '#F8F9F5',
  cardBg: '#FFFEFA',
  mintSoft: '#E8F8F5',
  mintSoftAlt: '#DFF4EF',
  gold: '#F4B51F',
  goldDark: '#E7A90E',
  goldSoft: '#F5D98A',
  tealDark: '#2D6A6A',
  purple: '#8D6AD8',
  textPrimary: '#202428',
  textSecondary: '#6F7478',
  border: 'rgba(20, 30, 30, 0.08)',
} as const;

export type CollectionHeroModel = {
  collected: number;
  total: number;
  progress: number;
  countLabel: string;
  hint: string;
};

export type BadgePreviewModel = {
  id: string;
  title: string;
  theme: AuthorityTheme;
  icon: ProgressionIconName;
  status: AuthorityGridItem['status'];
  showLock: boolean;
  showSoon: boolean;
  showActive: boolean;
};

type CollectionFallback = {
  collected: number;
  total: number;
  progress: number;
};

export function buildCollectionHeroModel(
  badgeStateInput: unknown,
  pilotDay: number,
  fallback?: CollectionFallback,
): CollectionHeroModel {
  const badgeSummary = buildProfileBadgeShowcaseSummary(badgeStateInput, pilotDay);
  const showcaseSummary = buildBadgeShowcaseSummary(badgeStateInput, pilotDay);
  const total =
    badgeSummary.totalCount > 0
      ? badgeSummary.totalCount
      : fallback?.total ?? BADGE_COLLECTION_TOTAL;
  const collected =
    badgeStateInput != null ? badgeSummary.earnedCount : fallback?.collected ?? badgeSummary.earnedCount;
  const progress =
    total > 0 ? Math.min(1, collected / total) : fallback?.progress ?? 0;
  const nearUnlock = showcaseSummary.nearUnlockBadges[0]?.title;

  return {
    collected,
    total,
    progress,
    countLabel: `${collected} / ${total} toplandı`,
    hint: nearUnlock
      ? `Yakında: ${nearUnlock}`
      : showcaseSummary.subline,
  };
}

export function buildWeeklyUnlockModels(items: WeeklyUnlockItem[]): WeeklyUnlockItem[] {
  if (items.length > 0) {
    return items;
  }

  return [
    {
      id: 'first-response',
      title: 'İlk Müdahale',
      description: 'Acil durumları hızlı yönetme yetkisi.',
      theme: 'teal',
      icon: 'medkit-outline',
      percentLabel: '%5',
      progress: 0.05,
    },
    {
      id: 'data-literacy',
      title: 'Veri Okuryazarlığı',
      description: 'Verileri yorumla, içgörü üret.',
      theme: 'purple',
      icon: 'bar-chart-outline',
      percentLabel: '%99',
      progress: 0.99,
    },
  ];
}

export function buildAuthorityBadgePreviewModels(
  gridItems: AuthorityGridItem[],
): BadgePreviewModel[] {
  return gridItems.map((item) => ({
    id: item.id,
    title: item.title,
    theme: item.theme,
    icon: item.icon,
    status: item.status,
    showLock: item.status === 'locked',
    showSoon: item.status === 'soon',
    showActive: item.status === 'active',
  }));
}

/** Verify helper — badge catalog uzunluğu fallback ile uyumlu mu */
export function resolveBadgeCatalogTotal(): number {
  return BADGE_DEFINITIONS.length > 0 ? BADGE_DEFINITIONS.length : BADGE_COLLECTION_TOTAL;
}
