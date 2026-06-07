export type SoftLaunchNormalizedStatus =
  | 'PASS'
  | 'WARN'
  | 'FAIL'
  | 'BLOCKED'
  | 'MANUAL_PENDING'
  | 'SKIPPED'
  | 'STALE_EXPECTATION';

export type SoftLaunchManualBlockerCategory =
  | 'iap'
  | 'store'
  | 'privacy'
  | 'crash'
  | 'analytics'
  | 'device_test'
  | 'metadata';

export type SoftLaunchManualBlockerOwner = 'manual' | 'code' | 'dashboard';

export type SoftLaunchManualBlockerStatus = 'pending' | 'done' | 'blocked';

export type SoftLaunchManualBlocker = {
  id: string;
  title: string;
  category: SoftLaunchManualBlockerCategory;
  status: SoftLaunchManualBlockerStatus;
  blocksPublicLaunch: boolean;
  blocksInternalDeviceTest: boolean;
  owner: SoftLaunchManualBlockerOwner;
  verificationCommand?: string;
  nextAction: string;
};

export type SoftLaunchCompletionModuleKind =
  | 'presentation'
  | 'audit'
  | 'readiness'
  | 'observability'
  | 'runtime_lite';

export type SoftLaunchCompletionModuleRegistration = {
  id: string;
  coreDir: string;
  kind: SoftLaunchCompletionModuleKind;
  freezeRisk: 'none' | 'low' | 'medium';
  allowedBeforeSoftLaunch: boolean;
  reason: string;
  saveVersionImpact: boolean;
  persistImpact: boolean;
  gameplayImpact: boolean;
};

export type SoftLaunchVerifyCommandId =
  | 'soft-launch-review'
  | 'no-new-system-freeze'
  | 'privacy-policy-readiness'
  | 'post-launch-telemetry-readiness'
  | 'analytics-runtime';

export type SoftLaunchVerifyFailureClassification = {
  command: SoftLaunchVerifyCommandId;
  normalizedStatus: SoftLaunchNormalizedStatus;
  codeHealth: 'PASS' | 'WARN' | 'FAIL';
  manualLaunchReadiness: 'READY' | 'WARN' | 'BLOCKED';
  summary: string;
  codeRegressions: string[];
  manualBlockerIds: string[];
  staleExpectationIds: string[];
  dashboardPending: string[];
  environmentPending: string[];
};

export type SoftLaunchRegressionCleanupResult = {
  health: 'PASS' | 'WARN' | 'BLOCKED';
  codeHealth: 'PASS' | 'WARN' | 'FAIL';
  manualLaunchReadiness: 'READY' | 'WARN' | 'BLOCKED';
  launchCandidateDecision: 'ready' | 'blocked';
  blockerCount: number;
  manualBlockers: SoftLaunchManualBlocker[];
  codeRegressions: string[];
  staleExpectationsFixed: string[];
  dashboardPending: string[];
  environmentPending: string[];
  commandClassifications: SoftLaunchVerifyFailureClassification[];
  completionModules: SoftLaunchCompletionModuleRegistration[];
};

export type RunSoftLaunchRegressionCleanupAuditOptions = {
  mode?: 'internal_device_test' | 'soft_launch_candidate' | 'launch_candidate';
};
