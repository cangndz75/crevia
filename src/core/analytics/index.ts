export type {
  AnalyticsAccessMode,
  AnalyticsAuditFinding,
  AnalyticsAuditResult,
  AnalyticsEventDefinition,
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsEventPayloadBase,
  AnalyticsFunnelDefinition,
  AnalyticsFunnelId,
  AnalyticsPayloadValue,
  AnalyticsSurface,
  AnalyticsValidationResult,
} from './analyticsTypes';

export {
  ALL_ANALYTICS_EVENT_NAMES,
  ALLOWED_GENERIC_PAYLOAD_KEYS,
  ANALYTICS_SCHEMA_VERSION,
  BASE_REQUIRED_PAYLOAD_KEYS,
  FORBIDDEN_ANALYTICS_PAYLOAD_KEYS,
  FREE_TEXT_LIKE_PAYLOAD_KEY_SUFFIXES,
} from './analyticsConstants';

export {
  ANALYTICS_EVENT_DEFINITIONS,
  buildAnalyticsPayload,
  getAnalyticsEventDefinition,
  sanitizeAnalyticsPayload,
  validateAnalyticsEventDefinitions,
  validateAnalyticsEventPayload,
} from './analyticsSchema';

export {
  ANALYTICS_FUNNEL_DEFINITIONS,
  getAnalyticsFunnelDefinition,
  getEventsForFunnel,
  validateAnalyticsFunnels,
} from './analyticsFunnels';

export {
  assertNoForbiddenPayloadKeys,
  findForbiddenAnalyticsKeys,
  hasFreeTextLikePayload,
  isAnalyticsPayloadPrivacySafe,
  validateAnalyticsPrivacy,
} from './analyticsPrivacy';

export {
  clearTrackedAnalyticsEventsForTesting,
  createAnalyticsEvent,
  getTrackedAnalyticsEventsForTesting,
  setAnalyticsEnabledForTesting,
  trackAnalyticsEvent,
} from './analyticsTracker';

export {
  buildAnalyticsEventTableMarkdown,
  buildAnalyticsFunnelMarkdown,
  buildAnalyticsSchemaConsoleReport,
  formatAnalyticsFinding,
  groupAnalyticsEventsByFunnel,
} from './analyticsPresentation';

export {
  verifyAnalyticsScenario,
  type VerifyAnalyticsOutcome,
} from './verifyAnalyticsScenario';

export {
  trackCreviaEvent,
  trackOncePerRuntime,
  clearAnalyticsRuntimeGuardsForTesting,
  getAnalyticsRuntimeGuardKeysForTesting,
  buildCommonAnalyticsBase,
  getAnalyticsAccessModeFromGameState,
  getAnalyticsDayFields,
  hasAnalyticsRuntimeGuard,
  type AnalyticsTrackBase,
} from './analyticsRuntime';

export {
  sanitizeAnalyticsId,
  sanitizeAnalyticsEventType,
  getAssignmentFitBand,
  getAssignmentFitBandFromLabel,
  getResourceStatusBand,
  getCrisisRiskBand,
  getResultBandFromSummaryTone,
  getRatingBandFromSeasonRating,
  buildDecisionAnalyticsPayload,
  buildAssignmentAnalyticsPayload,
  buildResourceAnalyticsPayload,
  buildCrisisAnalyticsPayload,
  buildSeasonEndAnalyticsPayload,
  buildEventResultAnalyticsPayload,
  resolveAssignmentForEventPayload,
  scoreToResourceStatusBand,
  getAnalyticsAccessMode,
} from './analyticsPayloadBuilders';

export {
  verifyAnalyticsRuntimeScenario,
  type VerifyAnalyticsRuntimeOutcome,
} from './verifyAnalyticsRuntimeScenario';
