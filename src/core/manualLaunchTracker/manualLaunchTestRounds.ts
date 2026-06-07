import type { ManualLaunchDeviceTestPlatform } from './manualLaunchTrackerTypes';
import type { ManualLaunchEvidenceType } from './manualLaunchEvidenceTypes';

export type ManualLaunchTestRoundStatus =
  | 'pending'
  | 'in_progress'
  | 'partially_verified'
  | 'verified'
  | 'blocked'
  | 'ready_to_execute';

export type ManualLaunchTestRoundScopeId =
  | 'build_readiness'
  | 'day1_first_session'
  | 'day8_pack_origin'
  | 'resume_smoke'
  | 'ui_density'
  | 'sentry_conditional';

export type ManualLaunchTestRoundScope = {
  id: ManualLaunchTestRoundScopeId;
  title: string;
  description: string;
  testCaseIds: string[];
};

export type ManualLaunchTestRound = {
  roundId: string;
  title: string;
  purpose: string;
  status: ManualLaunchTestRoundStatus;
  includedTestCaseIds: string[];
  requiredEvidenceIds: string[];
  optionalEvidenceIds: string[];
  platformCoverage: ManualLaunchDeviceTestPlatform[];
  highestPriorityMissing: string[];
  canPassWithoutEvidence: false;
  fakePassGuard: true;
};

export type ManualLaunchRoundOneTestCase = {
  testCaseId: string;
  title: string;
  scopeId: ManualLaunchTestRoundScopeId;
  platform: ManualLaunchDeviceTestPlatform;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  evidenceRequired: ManualLaunchEvidenceType[];
  passCriteria: string[];
  failCriteria: string[];
  relatedSystems: string[];
  blocksInternalDeviceTest: boolean;
  blocksPublicLaunch: boolean;
  linkedLegacyTestId?: string;
  linkedBlockerIds?: string[];
  /** Sentry-only: skip until DSN/env ready */
  conditionalOnEnvReady?: boolean;
  status: 'pending' | 'done' | 'blocked' | 'skipped';
  evidenceStatus: 'missing' | 'attached' | 'verified' | 'rejected';
};

/** Manual evidence attach payload — docs/template only; not persisted in game save. */
export type ManualLaunchEvidenceAttachRecord = {
  evidenceId: string;
  testCaseId: string;
  blockerId?: string;
  platform: 'ios' | 'android';
  buildProfile?: string;
  appVersion?: string;
  buildNumber?: string;
  evidenceType: ManualLaunchEvidenceType;
  evidenceLocation: string;
  evidenceSummary: string;
  testerNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  status: 'attached' | 'verified';
  fakePassGuard: true;
};

export type ManualLaunchRoundOneAuditResult = {
  round: ManualLaunchTestRound;
  scopes: ManualLaunchTestRoundScope[];
  testCases: ManualLaunchRoundOneTestCase[];
  totalRoundOneTests: number;
  pendingTests: number;
  attachedEvidence: number;
  verifiedEvidence: number;
  blockedTests: number;
  skippedTests: number;
  canProceedInternalDeviceTest: boolean;
  internalDeviceTestExecutionStatus: 'ready_to_execute' | 'blocked' | 'completed';
  canProceedPublicLaunch: false;
  missingCriticalEvidence: string[];
  fakePassGuardViolations: number;
  roundOneStatus: ManualLaunchTestRoundStatus;
  roundOneMissingEvidence: number;
  roundOneHighestPriorityMissing: string[];
  roundOneCanStart: boolean;
  roundOneCanComplete: boolean;
  nextManualAction: string;
  docsPath: string;
};
