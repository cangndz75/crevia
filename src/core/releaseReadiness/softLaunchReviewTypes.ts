export type CreviaSoftLaunchReviewMode =
  | 'internal_device_test'
  | 'iap_sandbox_test'
  | 'launch_candidate'
  | 'soft_launch_candidate';

export type CreviaSoftLaunchReviewSeverity = 'pass' | 'warn' | 'blocker';

export type CreviaSoftLaunchReviewArea =
  | 'first_ten_minutes'
  | 'pilot_days_1_7'
  | 'day8_open_ended_operation'
  | 'district_runtime_systems'
  | 'route_field_resource_systems'
  | 'result_report_carryover'
  | 'content_coverage'
  | 'analytics'
  | 'iap_monetization'
  | 'performance_selectors'
  | 'save_migration_offline'
  | 'release_store_readiness';

export type CreviaSoftLaunchReadinessLevel =
  | 'ready_for_internal_device_test'
  | 'ready_for_sandbox_iap_test'
  | 'blocked_for_launch_candidate'
  | 'ready_for_soft_launch_candidate'
  | 'needs_fix_pass';

export type CreviaSoftLaunchDecision =
  | 'proceed_internal_test'
  | 'proceed_sandbox_test_only'
  | 'fix_required'
  | 'freeze_new_systems'
  | 'blocked';

export type CreviaSoftLaunchReviewFinding = {
  id: string;
  area: CreviaSoftLaunchReviewArea;
  severity: CreviaSoftLaunchReviewSeverity;
  title: string;
  message: string;
  recommendation: string;
  automatic: boolean;
};

export type CreviaSoftLaunchReviewAreaResult = {
  area: CreviaSoftLaunchReviewArea;
  label: string;
  health: 'PASS' | 'WARN' | 'BLOCKED';
  passCount: number;
  warnCount: number;
  blockerCount: number;
  summary: string;
  findings: CreviaSoftLaunchReviewFinding[];
};

export type CreviaSoftLaunchReviewBlocker = {
  id: string;
  area: CreviaSoftLaunchReviewArea;
  title: string;
  message: string;
  recommendation: string;
  appliesInModes: CreviaSoftLaunchReviewMode[];
};

export type CreviaSoftLaunchReviewWarning = {
  id: string;
  area: CreviaSoftLaunchReviewArea;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaSoftLaunchReviewRecommendation = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  action: string;
  manual: boolean;
};

export type CreviaSoftLaunchContentCoverageSummary = {
  packCount: number;
  packIds: string[];
  totalFamilies: number;
  totalVariants: number;
  duplicateWarnCount: number;
  duplicateFailCount: number;
  coverageHealth: 'PASS' | 'WARN' | 'FAIL';
};

export type CreviaSoftLaunchReviewResult = {
  mode: CreviaSoftLaunchReviewMode;
  readinessLevel: CreviaSoftLaunchReadinessLevel;
  decision: CreviaSoftLaunchDecision;
  health: 'PASS' | 'WARN' | 'BLOCKED';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  blockerCount: number;
  areaResults: CreviaSoftLaunchReviewAreaResult[];
  findings: CreviaSoftLaunchReviewFinding[];
  blockers: CreviaSoftLaunchReviewBlocker[];
  warnings: CreviaSoftLaunchReviewWarning[];
  recommendations: CreviaSoftLaunchReviewRecommendation[];
  contentCoverage: CreviaSoftLaunchContentCoverageSummary;
  noNewSystemFreezeRecommended: boolean;
  recommendedNextPrompt: string;
  manualActions: string[];
  nextActions: string[];
  docsPath: string;
};

export type RunSoftLaunchReadinessReviewOptions = {
  mode?: CreviaSoftLaunchReviewMode;
};
