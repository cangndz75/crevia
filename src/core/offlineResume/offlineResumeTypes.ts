export type OfflineResumeScenarioStatus = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKER';

export type OfflineResumeSeverity = 'low' | 'medium' | 'high' | 'blocker';

export type OfflineResumePhase =
  | 'day1_tutorial'
  | 'pilot_day2_7'
  | 'day7_day8_transition'
  | 'post_pilot_light'
  | 'post_pilot_full'
  | 'surface_resume'
  | 'offline_no_network'
  | 'hydration'
  | 'content_pack_recovery'
  | 'idempotency'
  | 'derived_presentation';

export type OfflineResumeScenarioResult = {
  id: string;
  title: string;
  phase: OfflineResumePhase;
  status: OfflineResumeScenarioStatus;
  severity: OfflineResumeSeverity;
  resumePoint: string;
  expectedBehavior: string;
  actualBehavior: string;
  risk: string;
  recommendedFix?: string;
  isFixedInThisPass: boolean;
  relatedSystems: string[];
};

export type OfflineResumeAuditResult = {
  overallHealth: 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';
  launchRisk: 'low' | 'medium' | 'high' | 'blocker';
  scenarioResults: OfflineResumeScenarioResult[];
  fixedIssues: string[];
  remainingKnownIssues: string[];
  releaseRecommendation: string;
  nonGoalsConfirmed: string[];
};

export type OfflineResumeAuditOptions = {
  includeReleaseBlockers?: boolean;
};
