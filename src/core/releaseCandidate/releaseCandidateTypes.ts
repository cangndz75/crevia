export type ReleaseCandidateOverallStatus =
  | 'ready_for_internal_device_test'
  | 'blocked_for_public_launch'
  | 'ready_for_release_candidate'
  | 'blocked';

export type ReleaseCandidateHealthStatus = 'PASS' | 'WARN' | 'FAIL';

export type ReleaseCandidateReadinessStatus = 'READY' | 'WARN' | 'BLOCKED';

export type ReleaseCandidateLaunchDecision = 'ready' | 'blocked';

export type ReleaseCandidateStoreItemStatus =
  | 'missing'
  | 'draft'
  | 'pending_console'
  | 'ready'
  | 'blocked'
  | 'done';

export type ReleaseCandidateStoreItemOwner =
  | 'manual'
  | 'store_console'
  | 'legal'
  | 'dashboard'
  | 'code'
  | 'build';

export type ReleaseCandidateStoreChecklistItem = {
  id: string;
  section: 'app_metadata' | 'visual_assets' | 'iap_metadata' | 'privacy_data_safety' | 'build_readiness';
  title: string;
  status: ReleaseCandidateStoreItemStatus;
  blocksPublicLaunch: boolean;
  evidenceRequired: string[];
  owner: ReleaseCandidateStoreItemOwner;
  nextAction: string;
};

export type ReleaseCandidateGameplayArea = {
  id: string;
  title: string;
  status: ReleaseCandidateHealthStatus;
  verifyCommand: string;
  playerValue: string;
  remainingBacklog: string;
  launchRisk: 'low' | 'medium' | 'high';
};

export type ReleaseCandidateBlockerSummary = {
  totalManualBlockers: number;
  pendingPublicLaunch: number;
  pendingInternalTest: number;
  topPublicBlockers: string[];
  topInternalBlockers: string[];
};

export type ReleaseCandidateEvidenceSummary = {
  totalEvidenceRequired: number;
  missingEvidence: number;
  attachedEvidence: number;
  verifiedEvidence: number;
  rejectedEvidence: number;
  internalDeviceEvidenceStatus: 'READY' | 'WARN' | 'BLOCKED';
  publicLaunchEvidenceStatus: 'READY' | 'WARN' | 'BLOCKED';
  highestPriorityMissingEvidence: string[];
  /** @deprecated use missingEvidence */
  missingCount: number;
  /** @deprecated use verifiedEvidence */
  verifiedCount: number;
  /** @deprecated use attachedEvidence */
  attachedCount: number;
  highestPriorityMissing: string[];
  requiredBeforeInternalTest: string[];
  requiredBeforePublicLaunch: string[];
};

export type ReleaseCandidateBoardItem = {
  id: string;
  title: string;
  column: 'now_internal_device_test' | 'before_soft_launch' | 'before_public_launch' | 'v1_1_backlog';
};

export type ReleaseCandidateRoundOneSummary = {
  roundOneStatus: string;
  roundOneMissingEvidence: number;
  roundOneHighestPriorityMissing: string[];
  roundOneCanStart: boolean;
  roundOneCanComplete: boolean;
  nextManualAction: string;
  totalRoundOneTests: number;
  pendingTests: number;
  verifiedEvidence: number;
  internalDeviceTestExecutionStatus: string;
};

export type ReleaseCandidateAuditResult = {
  overallStatus: ReleaseCandidateOverallStatus;
  codeHealth: ReleaseCandidateHealthStatus;
  gameplayReadiness: ReleaseCandidateHealthStatus;
  storeReadiness: ReleaseCandidateReadinessStatus;
  monetizationReadiness: ReleaseCandidateReadinessStatus;
  privacyReadiness: ReleaseCandidateReadinessStatus;
  crashObservabilityReadiness: ReleaseCandidateReadinessStatus;
  analyticsReadiness: ReleaseCandidateReadinessStatus;
  deviceTestReadiness: ReleaseCandidateReadinessStatus;
  publicLaunchDecision: ReleaseCandidateLaunchDecision;
  internalDeviceTestDecision: ReleaseCandidateLaunchDecision;
  blockerSummary: ReleaseCandidateBlockerSummary;
  manualBlockers: string[];
  codeRegressions: string[];
  requiredNextActions: string[];
  evidenceSummary: ReleaseCandidateEvidenceSummary;
  gameplayAreas: ReleaseCandidateGameplayArea[];
  storeChecklist: ReleaseCandidateStoreChecklistItem[];
  releaseBoard: ReleaseCandidateBoardItem[];
  nonGoalsConfirmed: string[];
  fakePassGuardActive: boolean;
  roundOne: ReleaseCandidateRoundOneSummary;
  docsPath: string;
};

export type RunReleaseCandidateAuditOptions = {
  mode?: 'internal_device_test' | 'launch_candidate' | 'soft_launch_candidate';
};
