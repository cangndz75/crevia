export {
  REPORT_STRATEGIC_COMPACT_INSIGHT_MAX,
  buildReportStrategicInsightCandidates,
  selectVisibleReportStrategicInsights,
  shouldShowReportMemoryTraceInsight,
  shouldShowReportSocialEchoInsight,
  type ReportStrategicInsightKey,
} from './reportCompactInsightPresentation';
export {
  PRESENTATION_NEAR_DUPLICATE_PREFIX_MIN,
  SURFACE_PRIORITY,
  buildAvoidLines,
  buildCanonicalMessageKey,
  dedupePresentationMessages,
  isNearDuplicateMessage,
  isSameMessage,
  lineDuplicatesAvoidLines,
  normalizePresentationText,
  pickSurfacePriorityWinner,
  selectBoundedPresentationLines,
  type PresentationDedupeResult,
  type PresentationMessageCandidate,
  type PresentationSurface,
} from './presentationDedupe';
