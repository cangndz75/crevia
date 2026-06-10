import type { AuthorityRankId } from './authorityTypes';
import type { RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';

export type AuthorityPermissionPreviewState = 'active' | 'next' | 'locked';

export type AuthorityPermissionCategory =
  | 'operations'
  | 'map'
  | 'districts'
  | 'resources'
  | 'advisor'
  | 'reports'
  | 'crisis'
  | 'story'
  | 'progression';

export type AuthorityPermissionImportance = 'minor' | 'standard' | 'major';

export type AuthorityPermissionPreviewItem = {
  id: RankPermissionId;
  title: string;
  description: string;
  category: AuthorityPermissionCategory;
  state: AuthorityPermissionPreviewState;
  importance: AuthorityPermissionImportance;
  unlockRankTitle?: string;
  reasonLabel: string;
  playerBenefit: string;
  detailTitle: string;
  detailBody: string;
  ctaLabel?: string;
  statePillLabel: string;
  categoryLabel: string;
  systemTag: string;
  iconKey?: string;
};

export type AuthorityPermissionPreviewCategoryBlock = {
  category: AuthorityPermissionCategory;
  title: string;
  subtitle: string;
  activeCount: number;
  totalCount: number;
  items: AuthorityPermissionPreviewItem[];
  previewItems: AuthorityPermissionPreviewItem[];
};

export type AuthorityPermissionPreviewEmptyState = {
  visible: boolean;
  title: string;
  body: string;
  ctaLabel?: string;
};

export type AuthorityPermissionPreviewSummary = {
  currentRankId: AuthorityRankId | string;
  currentRankTitle: string;
  currentRankSubtitle: string;
  nextRankId?: AuthorityRankId | string;
  nextRankTitle?: string;
  progressRatio: number;
  progressLabel: string;
  progressPercentLabel: string;
  headline: string;
  subline: string;
  prestigeLabel: string;
  currentUnlocks: AuthorityPermissionPreviewItem[];
  nextUnlocks: AuthorityPermissionPreviewItem[];
  futureUnlocks: AuthorityPermissionPreviewItem[];
  categoryBlocks: AuthorityPermissionPreviewCategoryBlock[];
  promotionHint?: string;
  emptyState: AuthorityPermissionPreviewEmptyState;
  activeCountLabel: string;
  allItems: AuthorityPermissionPreviewItem[];
};

export type AuthorityPermissionPreviewCompactSummary = {
  visible: boolean;
  activeCountLabel: string;
  nextPermissionTitle?: string;
  nextPermissionLine?: string;
  ctaLabel: string;
  headline: string;
};
