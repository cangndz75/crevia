import type {
  ManualLaunchDeviceTestEvidenceCase,
  ManualLaunchEasBuildChecklistItem,
  ManualLaunchEvidenceLogEntry,
  ManualLaunchEvidenceSummary,
} from './manualLaunchEvidenceTypes';
import type { ManualLaunchRoundOneAuditResult } from './manualLaunchTestRounds';

export type ManualLaunchOverallStatus =
  | 'ready_for_internal_device_test'
  | 'blocked_for_public_launch'
  | 'ready_for_release_candidate'
  | 'blocked';

export type ManualLaunchCodeHealthStatus = 'PASS' | 'WARN' | 'FAIL';

export type ManualLaunchReadinessStatus = 'READY' | 'WARN' | 'BLOCKED';

export type ManualLaunchBlockerCategory =
  | 'iap'
  | 'store'
  | 'privacy'
  | 'crash'
  | 'analytics'
  | 'device_test'
  | 'performance'
  | 'metadata';

export type ManualLaunchBlockerStatus =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'blocked'
  | 'not_applicable';

export type ManualLaunchBlockerOwner =
  | 'manual'
  | 'dashboard'
  | 'code'
  | 'store_console'
  | 'legal';

export type { ManualLaunchEvidenceType } from './manualLaunchEvidenceTypes';
import type { ManualLaunchEvidenceType } from './manualLaunchEvidenceTypes';

export type ManualLaunchEvidenceStatus = 'missing' | 'attached' | 'verified' | 'rejected';

export type ManualLaunchBlockerGroupId =
  | 'iap_revenuecat'
  | 'store_metadata_screenshots'
  | 'privacy_data_safety'
  | 'crash_sentry'
  | 'analytics_dashboard'
  | 'device_test'
  | 'performance_device_smoke';

export type ManualLaunchBlocker = {
  id: string;
  title: string;
  category: ManualLaunchBlockerCategory;
  status: ManualLaunchBlockerStatus;
  owner: ManualLaunchBlockerOwner;
  blocksInternalDeviceTest: boolean;
  blocksPublicLaunch: boolean;
  verificationMethod: string;
  evidenceRequired: ManualLaunchEvidenceType[];
  nextAction: string;
  relatedVerifyCommand?: string;
  docsLinkLabel?: string;
  canBeDoneInCode: boolean;
  fakePassRisk: boolean;
};

export type ManualLaunchBlockerGroup = {
  id: ManualLaunchBlockerGroupId;
  title: string;
  category: ManualLaunchBlockerCategory;
  blockers: ManualLaunchBlocker[];
  pendingCount: number;
  doneCount: number;
  publicLaunchBlocked: boolean;
  internalTestBlocked: boolean;
};

export type ManualLaunchDeviceTestPlatform = 'ios' | 'android' | 'both';

export type ManualLaunchDeviceTestBuildType =
  | 'development'
  | 'internal'
  | 'production_preview';

export type ManualLaunchDeviceTestCase = {
  id: string;
  title: string;
  platform: ManualLaunchDeviceTestPlatform;
  buildType: ManualLaunchDeviceTestBuildType;
  precondition: string;
  steps: string[];
  expectedResult: string;
  evidenceRequired: ManualLaunchEvidenceType[];
  passCriteria: string;
  relatedSystems: string[];
  blockerIfFails?: string;
};

export type ManualLaunchEvidenceRecord = {
  blockerOrTestId: string;
  evidenceType: ManualLaunchEvidenceType;
  evidenceStatus: ManualLaunchEvidenceStatus;
  evidenceLocation?: string;
  verifiedBy?: string;
  verifiedAt?: string;
};

export type ManualLaunchVerificationMatrixRow = {
  id: string;
  label: string;
  codeHealth: ManualLaunchCodeHealthStatus;
  manualStatus: ManualLaunchReadinessStatus;
  relatedVerifyCommand?: string;
  note: string;
};

export type ManualLaunchTrackerResult = {
  overallStatus: ManualLaunchOverallStatus;
  codeHealthStatus: ManualLaunchCodeHealthStatus;
  manualReadinessStatus: ManualLaunchReadinessStatus;
  internalDeviceTestDecision: string;
  publicLaunchDecision: string;
  blockerGroups: ManualLaunchBlockerGroup[];
  blockers: ManualLaunchBlocker[];
  deviceTestMatrix: ManualLaunchDeviceTestCase[];
  evidenceRecords: ManualLaunchEvidenceRecord[];
  evidenceLog: ManualLaunchEvidenceLogEntry[];
  easBuildChecklist: ManualLaunchEasBuildChecklistItem[];
  deviceTestEvidence: ManualLaunchDeviceTestEvidenceCase[];
  evidenceSummary: ManualLaunchEvidenceSummary;
  nextActions: string[];
  verificationMatrix: ManualLaunchVerificationMatrixRow[];
  nonGoalsConfirmed: string[];
  pendingPublicLaunchBlockers: number;
  pendingInternalTestBlockers: number;
  fakePassGuardActive: boolean;
  roundOne: ManualLaunchRoundOneAuditResult;
  roundOneStatus: ManualLaunchRoundOneAuditResult['roundOneStatus'];
  roundOneMissingEvidence: number;
  roundOneHighestPriorityMissing: string[];
  roundOneCanStart: boolean;
  roundOneCanComplete: boolean;
  roundOneNextManualAction: string;
  docsPath: string;
};

export type RunManualLaunchTrackerAuditOptions = {
  mode?: 'internal_device_test' | 'launch_candidate' | 'soft_launch_candidate';
};
