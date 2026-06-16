import type { OperationPortfolioItemKind } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';
import type { RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';

export const AUTHORITY_GAMEPLAY_EFFECT_KINDS = [
  'reveal_more_context',
  'reduce_uncertainty',
  'improve_priority_score',
  'soften_defer_risk',
  'unlock_inspection',
  'improve_recommendation_confidence',
  'expose_district_reason',
  'show_future_pressure',
  'improve_planning_order',
] as const;

export type AuthorityGameplayEffectKind = (typeof AUTHORITY_GAMEPLAY_EFFECT_KINDS)[number];

export const AUTHORITY_GAMEPLAY_EFFECT_DOMAINS = [
  'daily_capacity',
  'portfolio_priority',
  'defer_risk',
  'map_visibility',
  'map_actionability',
  'operation_planning',
  'district_insight',
  'advisor_confidence',
  'report_clarity',
] as const;

export type AuthorityGameplayEffectDomain = (typeof AUTHORITY_GAMEPLAY_EFFECT_DOMAINS)[number];

export const AUTHORITY_GAMEPLAY_EFFECT_STRENGTHS = ['low', 'medium', 'high'] as const;

export type AuthorityGameplayEffectStrength = (typeof AUTHORITY_GAMEPLAY_EFFECT_STRENGTHS)[number];

export const AUTHORITY_GAMEPLAY_AFFECTED_SURFACES = [
  'portfolio',
  'map',
  'plan',
  'report',
  'center',
  'advisor',
  'defer',
] as const;

export type AuthorityGameplayAffectedSurface = (typeof AUTHORITY_GAMEPLAY_AFFECTED_SURFACES)[number];

export type AuthorityGameplayEffectDefinition = {
  id: string;
  domain: AuthorityGameplayEffectDomain;
  requiredPermissionId: RankPermissionId;
  effectKind: AuthorityGameplayEffectKind;
  effectStrength: AuthorityGameplayEffectStrength;
  explanationLine: string;
  affectedSurfaces: AuthorityGameplayAffectedSurface[];
  portfolioKinds?: OperationPortfolioItemKind[];
  priorityBonus?: number;
};

export type AuthorityGameplayEffectSnapshot = {
  day: number;
  mode: 'legacy' | 'active';
  permissionIds: string[];
  rankId?: string;
  effects: AuthorityGameplayEffectDefinition[];
  portfolioPriorityBonusByKind: Partial<Record<OperationPortfolioItemKind, number>>;
  mapInspectabilityBoost: boolean;
  mapExplanationBoost: boolean;
  deferMitigationAvailable: boolean;
  planningAuthorityLine?: string;
  advisorAuthorityLine?: string;
  mapAuthorityLine?: string;
  portfolioAuthorityLine?: string;
  sourceIds: string[];
};

export type BuildAuthorityGameplayEffectSnapshotInput = {
  day?: number;
  permissionIds?: string[];
  rankId?: string;
};
