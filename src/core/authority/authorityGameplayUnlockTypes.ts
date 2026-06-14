import type { RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';

export type AuthorityGameplayUnlockId =
  | 'assignment_fit_preview'
  | 'district_trust_preview'
  | 'resource_pressure_summary'
  | 'tomorrow_risk_preview'
  | 'vehicle_maintenance_preview'
  | 'team_specialization_preview'
  | 'map_trust_layer'
  | 'map_resource_layer'
  | 'district_memory_trace';

export type AuthorityGameplayUnlockStatus = 'locked' | 'preview' | 'available';

export type AuthorityGameplayVisibilityLevel =
  | 'hidden'
  | 'teaser'
  | 'summary'
  | 'detailed';

export type AuthorityGameplayAffectsSurface =
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'result'
  | 'hub'
  | 'map'
  | 'profile';

export type AuthorityGameplayUnlockProfile = {
  id: AuthorityGameplayUnlockId;
  title: string;
  status: AuthorityGameplayUnlockStatus;
  requiredRankId?: string;
  requiredPermissionId?: RankPermissionId;
  visibilityLevel: AuthorityGameplayVisibilityLevel;
  affects: AuthorityGameplayAffectsSurface[];
  playerBenefitLine: string;
  lockedReason?: string;
  unlockedLine?: string;
  canSeeLine: string;
  betterDecisionLine: string;
  affectedPhaseLine: string;
  unlockConditionLine: string;
  sourceLabel: string;
  sourceIds: string[];
};

export type AuthorityGameplayPresentationContext = {
  day?: number;
  isDay1LearningEvent?: boolean;
  visibilityByUnlock: Partial<Record<AuthorityGameplayUnlockId, AuthorityGameplayVisibilityLevel>>;
  profiles: AuthorityGameplayUnlockProfile[];
};

export type BuildAuthorityGameplayPresentationContextInput = {
  authorityState?: import('@/core/authority/authorityTypes').AuthorityState | null;
  day?: number;
  isDay1LearningEvent?: boolean;
};

export const CORE_AUTHORITY_GAMEPLAY_UNLOCK_IDS: AuthorityGameplayUnlockId[] = [
  'assignment_fit_preview',
  'district_trust_preview',
  'resource_pressure_summary',
  'tomorrow_risk_preview',
];

export const AUTHORITY_GAMEPLAY_VISIBILITY_LEVELS: AuthorityGameplayVisibilityLevel[] = [
  'hidden',
  'teaser',
  'summary',
  'detailed',
];

export const AUTHORITY_GAMEPLAY_UNLOCK_STATUSES: AuthorityGameplayUnlockStatus[] = [
  'locked',
  'preview',
  'available',
];
