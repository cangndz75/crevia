export type {
  ContentVarietySurface,
  CopyPoolSnapshot,
  CopyQualityIssue,
  SelectDeterministicCopyVariantInput,
} from './contentVarietyQualityTypes';

export {
  ACCUSATORY_DOMINANT_PATTERNS,
  PRESENTATION_ONLY_SELECTED_PATTERN,
  SHAME_LANGUAGE_PATTERNS,
  SURFACE_MAX_LENGTH,
  TECHNICAL_ENUM_PATTERN,
  auditCopyLines,
  buildCopyVariantKey,
  detectAccusatoryDominantLanguage,
  detectPresentationOnlySelectedLanguage,
  detectRepeatedOpeningPhrases,
  detectRepeatedPhrases,
  detectShameLanguage,
  detectTechnicalEnumLeak,
  detectTooLongMobileCopy,
  mergeCopyPools,
  normalizeCopyForDuplicateCheck,
  pickSurfaceCopy,
  selectDeterministicCopyVariant,
} from './contentVarietyQualityModel';

export { verifyContentVarietyQualityScenario } from './verifyContentVarietyQualityScenario';
