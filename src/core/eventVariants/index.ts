export type {
  CreviaEventVariantBadgeModel,
  CreviaEventVariantContext,
  CreviaEventVariantCopySet,
  CreviaEventVariantDefinition,
  CreviaEventVariantKind,
  CreviaEventVariantResolutionReason,
  CreviaEventVariantSafetyStatus,
  CreviaEventVariantSurface,
  CreviaEventVariantTone,
  CreviaResolvedEventVariant,
  CreviaVariantAwareEchoContext,
} from './eventVariantTypes';

export {
  EVENT_VARIANT_DEFINITIONS,
  EVENT_VARIANT_FORBIDDEN_COPY_TERMS,
  EVENT_VARIANT_KINDS,
  EVENT_VARIANT_MOBILE_MAX_COPY_LENGTH,
  EVENT_VARIANT_PANIC_TERMS,
  EVENT_VARIANT_SURFACES,
  EVENT_VARIANT_TUTORIAL_MAX_DAY,
  getEventVariantDefinition,
} from './eventVariantConstants';

export {
  buildEventVariantCopySet,
  buildEventVariantSurfaceCopy,
  clampEventVariantCopy,
  eventVariantCopyContainsForbiddenTerms,
  eventVariantCopyContainsPanicTerms,
  eventVariantCopyIsGenericSpam,
  validateEventVariantSurfaceCopy,
} from './eventVariantCopy';

export {
  buildEventVariantContextFromEvent,
  buildSafeEventVariantFallback,
  buildVariantAwareEchoContext,
  mergeVariantLineWithExistingEcho,
  resolveDeterministicVariantForContext,
  resolveEventVariantForContext,
  resolveEventVariantFromSelectionResult,
  shouldApplyVariantToSurface,
  shouldSuppressVariantEchoDuplicate,
  validateResolvedEventVariant,
} from './eventVariantResolver';

export {
  buildEventVariantAdvisorLine,
  buildEventVariantBadgeModel,
  buildEventVariantDebugRows,
  buildEventVariantEchoBundle,
  buildEventVariantMapHint,
  buildEventVariantReportLine,
  buildEventVariantSurfaceLine,
  buildEventVariantTomorrowPreview,
  listEventVariantKindLabels,
} from './eventVariantPresentation';

export { verifyEventVariantScenario } from './verifyEventVariantScenario';
export type { VerifyEventVariantOutcome } from './verifyEventVariantScenario';
