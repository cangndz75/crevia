export type {
  CreviaEventSelectionCandidate,
  CreviaEventSelectionCandidateKind,
  CreviaEventSelectionContext,
  CreviaEventSelectionDebugReport,
  CreviaEventSelectionDecision,
  CreviaEventSelectionHealthStatus,
  CreviaEventSelectionRecommendation,
  CreviaEventSelectionRecommendedVariantKind,
  CreviaEventSelectionResult,
  CreviaEventSelectionSignalSnapshot,
  CreviaEventSelectionWeightBreakdown,
} from './eventSelectionTypes';

export {
  EVENT_SELECTION_CANDIDATE_KINDS,
  EVENT_SELECTION_DEBUG_MIN_CANDIDATES,
  EVENT_SELECTION_DEFAULT_PHASE,
  EVENT_SELECTION_FORBIDDEN_COPY_TERMS,
  EVENT_SELECTION_HEALTH_THRESHOLDS,
  EVENT_SELECTION_PANIC_WORDING_TERMS,
  EVENT_SELECTION_SCORE_RANGE,
  EVENT_SELECTION_TUTORIAL_MAX_DAY,
  EVENT_SELECTION_VARIANT_KINDS,
  EVENT_SELECTION_WEIGHTS,
} from './eventSelectionConstants';

export {
  buildCareerPhaseSelectionSignal,
  buildDistrictSelectionSignal,
  buildEventSelectionContextFromGameState,
  buildEventSelectionSignalSnapshot,
  buildOperationEraSelectionSignal,
  buildPlayerStyleSelectionSignal,
  buildRecentExposureSignal,
  buildResourceSelectionSignal,
  inferPressureBandFromScore,
  inferTrustBandFromScore,
} from './eventSelectionSignals';

export {
  buildEventSelectionCandidates,
  buildEventSelectionRecommendationForDay,
  buildEventSelectionRecommendationForDistrict,
  buildEventSelectionResult,
  containsEventSelectionPanicWording,
  rankEventSelectionCandidates,
  resolveRecommendedVariantKind,
  scoreEventSelectionCandidate,
  selectEventFamilyCandidate,
  buildEventSelectionDebugReport,
} from './eventFamilySelectionEngine';

export {
  buildEventSelectionDebugRows,
  buildEventSelectionFreshnessWarning,
  buildEventSelectionSummaryLine,
  buildEventSelectionVariantKindOptions,
  buildEventSelectionWeightBreakdownRows,
  buildRecommendedVariantLabel,
} from './eventSelectionPresentation';

export { verifyEventSelectionScenario } from './verifyEventSelectionScenario';
export type { VerifyEventSelectionOutcome } from './verifyEventSelectionScenario';
