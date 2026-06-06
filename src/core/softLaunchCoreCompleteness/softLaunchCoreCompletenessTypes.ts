export type SoftLaunchCoreAreaStatus = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKER';

export type SoftLaunchCoreSeverity = 'low' | 'medium' | 'high' | 'blocker';

export type SoftLaunchCoreTiming =
  | 'pre_soft_launch'
  | 'post_soft_launch'
  | 'v1_1'
  | 'v2';

export type SoftLaunchCoreCategory =
  | 'first_session'
  | 'pilot_loop'
  | 'main_operation'
  | 'decision_impact'
  | 'retention'
  | 'echo_binding'
  | 'city_memory'
  | 'district_meaning'
  | 'content_visibility'
  | 'map_feedback'
  | 'player_identity'
  | 'summary_readiness'
  | 'continuity'
  | 'performance'
  | 'launch_blockers';

export type SoftLaunchCoreAuditArea = {
  id: string;
  title: string;
  category: SoftLaunchCoreCategory;
  status: SoftLaunchCoreAreaStatus;
  severity: SoftLaunchCoreSeverity;
  summary: string;
  evidence: string[];
  playerRisk: string;
  recommendedAction: string;
  recommendedTiming: SoftLaunchCoreTiming;
  isImplementationRequiredBeforeSoftLaunch: boolean;
  relatedSystems: string[];
  suggestedPromptName: string;
};

export type SoftLaunchCoreOverallHealth = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type SoftLaunchCoreDecision =
  | 'ready_for_soft_launch_core'
  | 'needs_completion_pass'
  | 'blocked_for_launch_candidate';

export type SoftLaunchCorePassPriority = 'must' | 'should' | 'optional';

export type SoftLaunchCorePreLaunchPass = {
  name: string;
  priority: SoftLaunchCorePassPriority;
  reason: string;
  suggestedPromptName: string;
};

export type SoftLaunchCoreResult = {
  overallHealth: SoftLaunchCoreOverallHealth;
  softLaunchCoreDecision: SoftLaunchCoreDecision;
  internalDeviceTestDecision: 'proceed_internal_test' | 'needs_fix_first';
  mandatoryPreSoftLaunchPasses: SoftLaunchCorePreLaunchPass[];
  recommendedNextPrompts: string[];
  deferredV11Systems: string[];
  deferredV2Systems: string[];
  launchBlockers: string[];
  nonGoalsConfirmed: string[];
  auditAreas: SoftLaunchCoreAuditArea[];
  netDecision: string[];
};
