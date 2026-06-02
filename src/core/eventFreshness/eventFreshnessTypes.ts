import type { CreviaContentPackItem } from '@/core/contentProduction/contentProductionTypes';
import type { CreviaEventSelectionCandidate, CreviaEventSelectionResult } from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventVariantKind, CreviaResolvedEventVariant } from '@/core/eventVariants/eventVariantTypes';

export type CreviaEventFreshnessHealthStatus = 'fresh' | 'watch' | 'strained' | 'blocked';

export type CreviaEventFreshnessDecisionStatus =
  | 'allow'
  | 'warn_repeat'
  | 'warn_similarity'
  | 'soft_penalty'
  | 'strong_penalty'
  | 'block_duplicate'
  | 'block_echo_repeat'
  | 'fallback_needed';

export type CreviaEventExposureRecord = {
  day: number;
  familyId?: string;
  districtIds?: string[];
  domains?: string[];
  variantKind?: CreviaEventVariantKind | string;
  echoSignature?: string;
  titleCopySignature?: string;
  operationEraId?: string;
  eventKind?: string;
  title?: string;
  copySummary?: string;
};

export type CreviaEventFreshnessContext = {
  currentDay: number;
  candidate?: CreviaEventSelectionCandidate;
  candidateItem?: CreviaContentPackItem;
  selectionResult?: CreviaEventSelectionResult;
  resolvedVariant?: CreviaResolvedEventVariant;
  recentExposureRecords?: CreviaEventExposureRecord[];
  activeDailyEventIds?: string[];
  recentFamilyIds?: string[];
  recentDistrictIds?: string[];
  recentDomainIds?: string[];
  recentVariantKinds?: string[];
  recentEchoSignatures?: string[];
  recentTitleCopySignatures?: string[];
  crisisRiskBand?: 'low' | 'medium' | 'high' | 'critical';
  isTutorialDay?: boolean;
  isHeavyCandidate?: boolean;
};

export type CreviaEventFreshnessSignature = {
  family?: string;
  district?: string;
  domain?: string;
  variant?: string;
  echo?: string;
  titleCopy?: string;
  composite?: string;
};

export type CreviaEventFreshnessPenalty = {
  familyRepeat: number;
  districtRepeat: number;
  domainRepeat: number;
  variantRepeat: number;
  echoRepeat: number;
  titleCopySimilarity: number;
  tutorialHeavy: number;
  duplicateGuard: number;
  total: number;
};

export type CreviaEventFreshnessScore = {
  baseScore: number;
  freshnessPenalty: number;
  adjustedScore: number;
  healthStatus: CreviaEventFreshnessHealthStatus;
};

export type CreviaEventFreshnessDecision = {
  status: CreviaEventFreshnessDecisionStatus;
  reasonLine: string;
  isBlocked: boolean;
  allowsCriticalOverride: boolean;
};

export type CreviaEventFreshnessGuardResult = {
  context: CreviaEventFreshnessContext;
  signatures: CreviaEventFreshnessSignature;
  penalties: CreviaEventFreshnessPenalty;
  score: CreviaEventFreshnessScore;
  decision: CreviaEventFreshnessDecision;
};

export type CreviaEventFreshnessReportModel = {
  title: string;
  summaryLine: string;
  healthStatus: CreviaEventFreshnessHealthStatus;
  decisionLabel: string;
  penaltyRows: string[];
  candidateReasonLines: string[];
  warnings: string[];
};

export type CreviaEventFreshnessAwareSelectionResult = {
  original: CreviaEventSelectionResult;
  guardedCandidates: Array<CreviaEventSelectionCandidate & { freshnessPenalty: number; freshnessDecision: CreviaEventFreshnessDecisionStatus }>;
  rankedCandidates: CreviaEventSelectionCandidate[];
  guardResults: CreviaEventFreshnessGuardResult[];
  topDecision: CreviaEventFreshnessDecision;
  fallbackNeeded: boolean;
};

export type CreviaEventFreshnessRecommendation = {
  summaryLine: string;
  guardResult?: CreviaEventFreshnessGuardResult;
  selectionResult?: CreviaEventFreshnessAwareSelectionResult;
  isRuntimeHintOnly: boolean;
};
