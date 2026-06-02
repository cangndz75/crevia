export type {
  OpenEndedProgressionCopyModel,
  OpenEndedProgressionGuardResult,
  OperationBenchmarkWindow,
  OperationCareerPhase,
  OperationReviewKind,
  ProgressionUnlockAxis,
} from './openEndedProgressionTypes';

export {
  EARLY_OPERATION_BENCHMARK_DAYS,
  FORBIDDEN_PLAYER_FACING_SEASON_END_TERMS,
  LONG_RUN_BENCHMARK_DAYS,
  OPEN_ENDED_OPERATION_IS_TERMINAL,
  OPEN_ENDED_OPERATION_PHASES,
  OPEN_ENDED_PROGRESSION_UNLOCK_AXES,
  OPERATION_BENCHMARK_WINDOWS,
  PERIODIC_REVIEW_COPY_TERMS,
  PILOT_TRAINING_DAYS,
  TECHNICAL_ALLOWED_BENCHMARK_TERMS,
} from './openEndedProgressionConstants';

export {
  buildNextProgressionPreview,
  buildOpenEndedProgressionSummary,
  buildOperationCareerPhaseLabel,
  buildPeriodicReviewCopy,
  containsForbiddenSeasonEndCopy,
  normalizeLegacySeasonEndLabel,
} from './openEndedProgressionPresentation';
