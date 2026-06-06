export type {
  OperationEraAuditResult,
  OperationEraCandidate,
  OperationEraChipModel,
  OperationEraContentHook,
  OperationEraContentWeightHints,
  OperationEraContext,
  OperationEraDefinition,
  OperationEraEventFamilySignal,
  OperationEraFocusDomain,
  OperationEraId,
  OperationEraNonTerminalGuardResult,
  OperationEraPresentationModel,
  OperationEraCadence,
  OperationEraStatus,
  OperationEraTone,
  OperationEraUnlockAxis,
} from './operationEraTypes';

export {
  OPERATION_ERA_CADENCE_LABELS,
  OPERATION_ERA_CADENCES,
  OPERATION_ERA_CONTENT_HOOK_LABELS,
  OPERATION_ERA_CONTENT_HOOKS,
  OPERATION_ERA_FOCUS_DOMAIN_LABELS,
  OPERATION_ERA_FOCUS_DOMAINS,
  OPERATION_ERA_FORBIDDEN_COPY_TERMS,
  OPERATION_ERA_IS_TERMINAL_GAME_STATE,
  OPERATION_ERA_MAX_VISIBLE_CANDIDATES,
  OPERATION_ERA_MAX_VISIBLE_CHIPS,
  OPERATION_ERA_MIN_DAY_VISIBILITY,
  OPERATION_ERA_PILOT_MAX_DAY,
  OPERATION_ERA_PLAYER_COPY_RULES,
  OPERATION_ERA_REQUIRED_PERMISSION_IDS,
  OPERATION_ERA_SAFE_FALLBACK_SCORE,
  OPERATION_ERA_SCORE_RANGE,
  OPERATION_ERA_STATUS_LABELS,
  OPERATION_ERA_STATUSES,
} from './operationEraConstants';

export { OPERATION_ERA_CATALOG, getOperationEraCatalogEntry } from './operationEraCatalog';

export {
  assertOperationEraIsNonTerminal,
  buildOperationEraCandidate,
  buildOperationEraCandidates,
  buildOperationEraFallbackCandidate,
  calculateOperationEraReadinessScore,
  calculateOperationEraRelevanceScore,
  clampOperationEraScore,
  getOperationEraContentWeightHints,
  getOperationEraDefinition,
  getOperationEraDefinitions,
  getOperationEraDefinitionsByContentHook,
  getOperationEraDefinitionsByFocusDomain,
  getRecommendedOperationEras,
  resolveOperationEraStatus,
  shouldShowOperationEraPreview,
} from './operationEraModel';

export type {
  CreviaOperationEraPreviewCardModel,
  CreviaOperationEraPreviewContext,
  CreviaOperationEraPreviewEligibility,
  CreviaOperationEraPreviewHealthStatus,
  CreviaOperationEraPreviewKind,
  CreviaOperationEraPreviewLine,
  CreviaOperationEraPreviewStatus,
  CreviaOperationEraPreviewVisibility,
  CreviaOperationEraRuntimePreviewModel,
  CreviaOperationEraScoredPreviewCandidate,
} from './operationEraRuntimePreviewTypes';

export {
  OPERATION_ERA_CONTENT_PACK_IDS,
  OPERATION_ERA_RUNTIME_PREVIEW_COMPACT_COPY_MAX,
  OPERATION_ERA_RUNTIME_PREVIEW_DEFINITIONS,
  OPERATION_ERA_RUNTIME_PREVIEW_FORBIDDEN_COPY_TERMS,
  OPERATION_ERA_RUNTIME_PREVIEW_KINDS,
  OPERATION_ERA_RUNTIME_PREVIEW_MIN_DAY,
  OPERATION_ERA_RUNTIME_PREVIEW_MOBILE_COPY_MAX,
  OPERATION_ERA_RUNTIME_PREVIEW_PANIC_TERMS,
  OPERATION_ERA_RUNTIME_PREVIEW_PILOT_MAX_DAY,
  OPERATION_ERA_RUNTIME_PREVIEW_SCORE_WEIGHTS,
  getOperationEraRuntimePreviewDefinition,
} from './operationEraRuntimePreviewConstants';

export {
  buildOperationEraEligibility,
  buildOperationEraFallbackPreview,
  buildOperationEraPreviewContext,
  buildOperationEraPreviewDebugRows,
  buildOperationEraRuntimePreviewModel,
  resolveOperationEraPreviewKind,
  scoreOperationEraPreviewCandidate,
  type BuildOperationEraRuntimePreviewInput,
} from './operationEraRuntimePreviewModel';

export {
  buildOperationEraAdvisorLine,
  buildOperationEraAnalyticsHint,
  buildOperationEraCompactChip,
  buildOperationEraHubLine,
  buildOperationEraMapLine,
  buildOperationEraPreviewCardModel,
  buildOperationEraProfileLine,
  buildOperationEraReportLine,
  buildOperationEraSelectionContextHint,
  buildOperationEraStoryChainBias,
  buildOperationEraVariantBias,
  operationEraRuntimePreviewCopyContainsForbiddenTerms,
  operationEraRuntimePreviewCopyContainsPanicTerms,
  shouldSuppressOperationEraPreviewForSurface,
  validateOperationEraRuntimePreviewCopy,
} from './operationEraRuntimePreviewPresentation';

export {
  verifyOperationEraRuntimePreviewScenario,
  type VerifyOperationEraRuntimePreviewOutcome,
} from './verifyOperationEraRuntimePreviewScenario';

export type {
  CreviaOperationEraExpansionOption,
  CreviaOperationEraExpansionRecommendation,
  CreviaOperationEraExpansionRisk,
  CreviaOperationEraMigrationRisk,
  CreviaOperationEraRuntimeExpansionHealthStatus,
  CreviaOperationEraRuntimeExpansionReviewResult,
  CreviaOperationEraRuntimeExpansionSoftLaunchFindings,
  CreviaOperationEraRuntimeReadinessArea,
  CreviaOperationEraSaveImpact,
  CreviaOperationEraTelemetryQuestion,
  RunOperationEraRuntimeExpansionReviewOptions,
} from './operationEraRuntimeExpansionReviewTypes';

export {
  OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
  buildOperationEraRuntimeExpansionSoftLaunchFindings,
  runOperationEraRuntimeExpansionReviewAudit,
} from './operationEraRuntimeExpansionReviewAudit';

export {
  buildOperationEraExpansionOptionsTable,
  buildOperationEraExpansionRiskTable,
  buildOperationEraRuntimeExpansionConsoleSummary,
  buildOperationEraRuntimeExpansionReviewMarkdown,
  buildOperationEraTelemetryQuestionList,
  buildOperationEraV11BacklogTable,
} from './operationEraRuntimeExpansionReviewPresentation';

export {
  verifyOperationEraRuntimeExpansionReviewScenario,
  type VerifyOperationEraRuntimeExpansionReviewOutcome,
} from './verifyOperationEraRuntimeExpansionReviewScenario';

export {
  buildOperationEraCadenceLabel,
  buildOperationEraCompactLine,
  buildOperationEraEmptyState,
  buildOperationEraFocusChips,
  buildOperationEraHookChips,
  buildOperationEraNonTerminalDisclaimer,
  buildOperationEraPresentationModel,
  buildOperationEraRecommendationLine,
  buildOperationEraReviewLine,
  buildOperationEraStatusLabel,
  buildOperationEraSummaryLine,
  buildOperationEraUnlockLine,
  collectOperationEraPlayerFacingCopy,
  operationEraCopyContainsForbiddenTerms,
} from './operationEraPresentation';
