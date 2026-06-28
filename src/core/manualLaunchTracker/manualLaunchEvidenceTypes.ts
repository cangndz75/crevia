export type ManualLaunchEvidenceType =
  | 'screenshot'
  | 'screen_recording'
  | 'dashboard_event'
  | 'store_console'
  | 'purchase_log'
  | 'manual_note'
  | 'url'
  | 'build_log';

export type ManualLaunchEvidenceStatusExtended =
  | 'missing'
  | 'attached'
  | 'verified'
  | 'rejected';

export type ManualLaunchEvidencePlatform =
  | 'ios'
  | 'android'
  | 'both'
  | 'dashboard'
  | 'store_console';

export type ManualLaunchEvidenceResult =
  | 'pass'
  | 'fail'
  | 'blocked'
  | 'skipped'
  | 'pending';

export type ManualLaunchEvidenceLogEntry = {
  evidenceId: string;
  blockerId?: string;
  testCaseId?: string;
  evidenceType: ManualLaunchEvidenceType;
  status: ManualLaunchEvidenceStatusExtended;
  evidenceLocation?: string;
  evidenceSummary?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  platform: ManualLaunchEvidencePlatform;
  buildProfile?: string;
  appVersion?: string;
  buildNumber?: string;
  deviceName?: string;
  osVersion?: string;
  testDate?: string;
  tester?: string;
  result?: ManualLaunchEvidenceResult;
  notes?: string;
  fakePassGuard: true;
};

export type ManualLaunchEasBuildChecklistItem = {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'blocked';
  evidenceRequired: (ManualLaunchEvidenceType | 'build_log')[];
  nextAction: string;
  blocksInternalDeviceTest: boolean;
};

export type ManualLaunchDeviceTestEvidenceCase = {
  testCaseId: string;
  title: string;
  status: 'pending' | 'done' | 'blocked';
  evidenceStatus: ManualLaunchEvidenceStatusExtended;
  passCriteria: string;
  expectedResult: string;
  blocksInternalDeviceTest: boolean;
  blocksPublicLaunch: boolean;
  evidenceRequired: (ManualLaunchEvidenceType | 'build_log')[];
  linkedBlockerIds: string[];
};

export type ManualLaunchEvidenceSummary = {
  totalEvidenceRequired: number;
  missingEvidence: number;
  attachedEvidence: number;
  verifiedEvidence: number;
  rejectedEvidence: number;
  internalDeviceEvidenceStatus: 'READY' | 'WARN' | 'BLOCKED';
  publicLaunchEvidenceStatus: 'READY' | 'WARN' | 'BLOCKED';
  highestPriorityMissingEvidence: string[];
  fakePassGuardActive: boolean;
};

export type ManualLaunchEvidenceAuditResult = {
  evidenceLog: ManualLaunchEvidenceLogEntry[];
  easBuildChecklist: ManualLaunchEasBuildChecklistItem[];
  deviceTestEvidence: ManualLaunchDeviceTestEvidenceCase[];
  summary: ManualLaunchEvidenceSummary;
  blockerCloseRulesEnforced: boolean;
};
