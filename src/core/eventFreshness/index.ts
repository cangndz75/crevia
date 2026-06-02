export type {
  CreviaEventExposureRecord,
  CreviaEventFreshnessAwareSelectionResult,
  CreviaEventFreshnessContext,
  CreviaEventFreshnessDecision,
  CreviaEventFreshnessDecisionStatus,
  CreviaEventFreshnessGuardResult,
  CreviaEventFreshnessHealthStatus,
  CreviaEventFreshnessPenalty,
  CreviaEventFreshnessRecommendation,
  CreviaEventFreshnessReportModel,
  CreviaEventFreshnessScore,
  CreviaEventFreshnessSignature,
} from './eventFreshnessTypes';

export {
  EVENT_FRESHNESS_DECISION_LABELS,
  EVENT_FRESHNESS_FORBIDDEN_COPY_TERMS,
  EVENT_FRESHNESS_HEALTH_LABELS,
  EVENT_FRESHNESS_PENALTIES,
  EVENT_FRESHNESS_SCORE_RANGE,
  EVENT_FRESHNESS_THRESHOLDS,
  EVENT_FRESHNESS_TUTORIAL_MAX_DAY,
} from './eventFreshnessConstants';

export {
  buildCompositeFreshnessSignature,
  buildCompositeFreshnessSignatureFromItem,
  buildDistrictSignature,
  buildDomainSignature,
  buildEchoSignature,
  buildEventFamilySignature,
  buildTitleCopySignature,
  buildVariantSignature,
  compareTitleCopySignatures,
  normalizeFreshnessText,
  signaturesEqual,
  turkishNormalizationIsCaseInsensitive,
} from './eventFreshnessSignature';

export {
  applyFreshnessGuardToSelectionResult,
  applyFreshnessToSelectionCandidates,
  buildEventFreshnessContext,
  buildFreshnessAwareCandidateRanking,
  buildFreshnessAwareEventRecommendation,
  buildFreshnessAwareSelectionResult,
  buildFreshnessGuardForDay,
  buildFreshnessGuardForDistrict,
  calculateDistrictRepeatPenalty,
  calculateDomainRepeatPenalty,
  calculateEchoRepeatPenalty,
  calculateFamilyRepeatPenalty,
  calculateTitleCopySimilarityPenalty,
  calculateVariantRepeatPenalty,
  evaluateEventFreshness,
  rankCandidatesByFreshness,
  shouldBlockCandidateForFreshness,
} from './eventFreshnessGuard';

export {
  buildFreshnessCandidateReasonLine,
  buildFreshnessDebugReportForSelection,
  buildFreshnessDebugSummary,
  buildFreshnessDecisionLabel,
  buildFreshnessHealthLabel,
  buildFreshnessPenaltyRows,
  buildFreshnessReportModel,
  buildFreshnessSelectionSummaryLine,
  buildFreshnessWarningLine,
} from './eventFreshnessPresentation';

export { verifyEventFreshnessScenario } from './verifyEventFreshnessScenario';
export type { VerifyEventFreshnessOutcome } from './verifyEventFreshnessScenario';
