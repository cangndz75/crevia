import type { OperationCareerPhase } from '@/core/openEndedProgression/openEndedProgressionTypes';

export type CreviaEventVariantKind =
  | 'normal'
  | 'improved'
  | 'worsened'
  | 'carry_over'
  | 'reward'
  | 'comeback'
  | 'resource_fatigue'
  | 'district_trust'
  | 'crisis_adjacent'
  | 'operation_era';

export type CreviaEventVariantSurface =
  | 'event_card'
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'result'
  | 'report'
  | 'social'
  | 'advisor'
  | 'map'
  | 'tomorrow_preview';

export type CreviaEventVariantTone =
  | 'neutral'
  | 'encouraging'
  | 'cautious'
  | 'recovery'
  | 'reward'
  | 'contextual'
  | 'operational';

export type CreviaEventVariantSafetyStatus = 'pass' | 'watch' | 'blocked' | 'downgraded';

export type CreviaEventVariantResolutionReason =
  | 'selection_recommendation'
  | 'context_fallback'
  | 'tutorial_guard'
  | 'safety_downgrade'
  | 'safe_default';

export type CreviaEventVariantContext = {
  day?: number;
  operationCareerPhase?: OperationCareerPhase;
  districtId?: string;
  districtTrustBand?: 'fragile' | 'watch' | 'stable' | 'trusted' | 'unknown';
  crisisRiskBand?: 'low' | 'medium' | 'high' | 'critical';
  resourcePressureBand?: 'low' | 'medium' | 'high' | 'critical';
  operationEraId?: string;
  recommendedVariantKind?: CreviaEventVariantKind;
  recentVariantKinds?: string[];
  recentVariantLines?: string[];
  hasUnresolvedCarryOver?: boolean;
  eventId?: string;
  eventTitle?: string;
  eventDomain?: string;
};

export type CreviaEventVariantDefinition = {
  kind: CreviaEventVariantKind;
  label: string;
  shortLabel: string;
  tone: CreviaEventVariantTone;
  priority: number;
  allowedSurfaces: readonly CreviaEventVariantSurface[];
  forbiddenTerms: readonly string[];
  maxCopyLength: number;
  shouldAvoidPanicLanguage: boolean;
  isPositive: boolean;
  isRecovery: boolean;
  isRisky: boolean;
  isProgressionRelevant: boolean;
  defaultEchoIntent: string;
  isContextOnly: boolean;
};

export type CreviaResolvedEventVariant = {
  kind: CreviaEventVariantKind;
  definition: CreviaEventVariantDefinition;
  reason: CreviaEventVariantResolutionReason;
  safetyStatus: CreviaEventVariantSafetyStatus;
  isContextOnly: boolean;
  isPrimaryEventVariant: boolean;
  resolutionLine: string;
};

export type CreviaEventVariantCopySet = {
  kind: CreviaEventVariantKind;
  lines: Partial<Record<CreviaEventVariantSurface, string>>;
};

export type CreviaEventVariantBadgeModel = {
  kind: CreviaEventVariantKind;
  label: string;
  shortLabel: string;
  tone: CreviaEventVariantTone;
  isVisible: boolean;
};

export type CreviaVariantAwareEchoContext = {
  day: number;
  variantKind: CreviaEventVariantKind;
  surface: CreviaEventVariantSurface;
  variantLine?: string;
  existingEchoLine?: string;
  suppressDuplicate: boolean;
};
