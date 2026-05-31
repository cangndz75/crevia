export type SoftLaunchReadinessArea =
  | 'save_migration'
  | 'first_session'
  | 'core_gameplay_loop'
  | 'post_pilot_offer'
  | 'full_main_operation'
  | 'season_end'
  | 'monetization_iap'
  | 'analytics'
  | 'performance'
  | 'qa_playtest'
  | 'store_review_copy'
  | 'debug_tools'
  | 'release_blockers';

export type SoftLaunchReadinessSeverity = 'pass' | 'warn' | 'fail' | 'blocker';

export type SoftLaunchReadinessStatus = 'ready' | 'needs_review' | 'blocked';

export type SoftLaunchReadinessOwnerHint =
  | 'product'
  | 'engineering'
  | 'design'
  | 'qa'
  | 'monetization'
  | 'analytics';

export type SoftLaunchReadinessHealth = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type SoftLaunchReadinessAuditMode = 'pre_sdk' | 'launch_candidate';

export type SoftLaunchReleaseDecision =
  | 'Ready for SDK Integration'
  | 'Needs Manual Playtest'
  | 'Blocked'
  | 'Ready for Soft Launch Candidate';

export type SoftLaunchReadinessFinding = {
  id: string;
  area: SoftLaunchReadinessArea;
  severity: SoftLaunchReadinessSeverity;
  title: string;
  message: string;
  recommendation: string;
  ownerHint: SoftLaunchReadinessOwnerHint;
};

export type SoftLaunchReadinessAreaSummary = {
  area: SoftLaunchReadinessArea;
  status: SoftLaunchReadinessStatus;
  passCount: number;
  warnCount: number;
  failCount: number;
  blockerCount: number;
  summary: string;
};

export type SoftLaunchReadinessAuditResult = {
  health: SoftLaunchReadinessHealth;
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  blockerCount: number;
  areaSummaries: SoftLaunchReadinessAreaSummary[];
  findings: SoftLaunchReadinessFinding[];
  nextRecommendedPatch: string;
  releaseDecision: SoftLaunchReleaseDecision;
  auditMode: SoftLaunchReadinessAuditMode;
};

export type SoftLaunchReadinessChecklistItem = {
  id: string;
  area: SoftLaunchReadinessArea;
  title: string;
  passCriteria: string;
  failSignal: string;
  manual: boolean;
};

export type RunSoftLaunchReadinessAuditOptions = {
  mode?: SoftLaunchReadinessAuditMode;
};
