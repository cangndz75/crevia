import type { RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';

export const AUTHORITY_GAMEPLAY_BENEFIT_KINDS = [
  'map_layer_detail',
  'district_context_detail',
  'resource_pressure_detail',
  'assignment_fit_reason',
  'route_support_reason',
  'portfolio_extra_signal_visibility',
  'portfolio_cost_explanation',
  'portfolio_defer_reason',
  'tomorrow_priority_reason',
  'ece_analysis_depth',
  'operation_tradeoff_hint',
  'decision_consequence_explanation',
  'district_memory_trace_detail',
  'city_archive_reading',
  'authority_title_prestige',
  'badge_showcase_unlock',
  'locked_teaser',
] as const;

export type AuthorityGameplayBenefitKind = (typeof AUTHORITY_GAMEPLAY_BENEFIT_KINDS)[number];

export const AUTHORITY_GAMEPLAY_BENEFIT_DOMAINS = [
  'map',
  'district',
  'resource',
  'assignment',
  'portfolio',
  'tomorrow',
  'advisor',
  'operation',
  'report',
  'memory',
  'profile',
  'achievement',
] as const;

export type AuthorityGameplayBenefitDomain = (typeof AUTHORITY_GAMEPLAY_BENEFIT_DOMAINS)[number];

export const AUTHORITY_GAMEPLAY_BENEFIT_VISIBILITIES = [
  'hidden',
  'teaser',
  'summary',
  'detailed',
] as const;

export type AuthorityGameplayBenefitVisibility =
  (typeof AUTHORITY_GAMEPLAY_BENEFIT_VISIBILITIES)[number];

export type AuthorityGameplayBenefitTone = 'neutral' | 'positive' | 'strategic' | 'locked';

export type AuthorityGameplayBenefit = {
  id: string;
  kind: AuthorityGameplayBenefitKind;
  domain: AuthorityGameplayBenefitDomain;
  requiredPermissionId?: RankPermissionId;
  requiredRankId?: string;
  title: string;
  shortLine: string;
  unlockedLine: string;
  lockedLine?: string;
  visibility: AuthorityGameplayBenefitVisibility;
  isUnlocked: boolean;
  isActionable: boolean;
  sourceIds: string[];
  sourceKinds: string[];
  priority: number;
  tone: AuthorityGameplayBenefitTone;
};

export type AuthorityGameplayExpansionSummary = {
  rankId?: string;
  rankLabel: string;
  title: string;
  summaryLine: string;
  unlockedBenefits: AuthorityGameplayBenefit[];
  teaserBenefits: AuthorityGameplayBenefit[];
  primaryBenefit?: AuthorityGameplayBenefit;
  nextBenefit?: AuthorityGameplayBenefit;
  eceAuthorityLine?: string;
  mapAuthorityLine?: string;
  portfolioAuthorityLine?: string;
  profileAuthorityLine?: string;
  sourceIds: string[];
};

export type AuthorityGameplayExpansionInput = {
  rankId?: string;
  permissionIds?: string[];
  nextRankPermissionIds?: string[];
  day?: number;
  authorityState?: unknown;
  districtPersonalityAvailable?: boolean;
  mapBindingAvailable?: boolean;
  portfolioAvailable?: boolean;
  advisorLevel?: number;
  sourceIds?: string[];
};

export type AuthorityGameplayBenefitCardModel = {
  id: string;
  title: string;
  line: string;
  badgeLabel: string;
  tone: AuthorityGameplayBenefitTone;
  isUnlocked: boolean;
  accessibilityLabel: string;
};

export type AuthorityGameplaySummaryCardModel = {
  id: string;
  title: string;
  summaryLine: string;
  primaryBenefitLine?: string;
  nextBenefitLine?: string;
  benefits: AuthorityGameplayBenefitCardModel[];
  accessibilityLabel: string;
};

export type BenefitCatalogTemplate = {
  kind: AuthorityGameplayBenefitKind;
  domain: AuthorityGameplayBenefitDomain;
  title: string;
  shortLine: string;
  unlockedLine: string;
  lockedLine: string;
  priority: number;
  tone: AuthorityGameplayBenefitTone;
  requiresPortfolio?: boolean;
  requiresMap?: boolean;
  requiresDistrict?: boolean;
  strategicWeight?: number;
};
