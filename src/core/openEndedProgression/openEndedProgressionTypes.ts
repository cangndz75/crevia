export type OperationCareerPhase =
  | 'pilot_training'
  | 'light_main_operation'
  | 'district_responsibility'
  | 'crisis_recovery_management'
  | 'citywide_operations'
  | 'long_term_career';

export type OperationReviewKind =
  | 'daily_report'
  | 'periodic_operation_review'
  | 'rank_promotion_review'
  | 'operation_era_review'
  | 'milestone_review';

export type ProgressionUnlockAxis =
  | 'xp'
  | 'authority'
  | 'rank'
  | 'resource_stability'
  | 'district_trust'
  | 'crisis_control'
  | 'operation_era';

export type OperationBenchmarkWindow = {
  id: string;
  label: string;
  days: number;
  isPlayerFacingFinal: boolean;
  purpose: string;
};

export type OpenEndedProgressionCopyModel = {
  title: string;
  subtitle: string;
  continuationLine: string;
  ctaLabel: string;
  helperText?: string;
};

export type OpenEndedProgressionGuardResult = {
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string[];
};
