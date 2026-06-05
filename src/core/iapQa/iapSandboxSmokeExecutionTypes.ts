export type CreviaIapSandboxSmokeTestStatus =
  | 'not_started'
  | 'pending_manual'
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'skipped'
  | 'not_applicable';

export type CreviaIapSandboxSmokeDecision =
  | 'ready_to_run_manual_smoke'
  | 'blocked_missing_store_setup'
  | 'blocked_missing_revenuecat_keys'
  | 'blocked_manual_results_missing'
  | 'failed_smoke_test'
  | 'passed_sandbox_smoke';

export type CreviaIapSandboxSmokeHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaIapSandboxSmokePlatform = 'ios' | 'android' | 'both' | 'dev';

export type CreviaIapSandboxSmokeTestCase = {
  id: string;
  title: string;
  platform: CreviaIapSandboxSmokePlatform;
  requiredSetup: string[];
  steps: string[];
  expectedResult: string;
  manualObservationFields: string[];
  blockerIfFails: boolean;
  relatedVerifyScript: string;
  countsForSandboxPass: boolean;
  automatedOnly: boolean;
};

export type CreviaIapSandboxSmokeObservation = {
  caseId: string;
  platform: 'ios' | 'android';
  device: string;
  buildProfile: string;
  status: CreviaIapSandboxSmokeTestStatus;
  observedResult: string;
  logs: string;
  notes: string;
  screenshotPath: string;
  videoPath: string;
  severity: 'blocker' | 'high' | 'medium' | 'low';
  completed: boolean;
};

export type CreviaIapSandboxSmokeBlocker = {
  id: string;
  platform: 'ios' | 'android' | 'both';
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaIapSandboxSmokePlatformResult = {
  platform: 'ios' | 'android';
  status: CreviaIapSandboxSmokeTestStatus;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
  sandboxCaseCount: number;
  manualResultsLogged: boolean;
};

export type CreviaIapSandboxSmokeExecutionPlan = {
  version: string;
  docsPath: string;
  readinessDocsPath: string;
  minimumCaseCount: number;
  cases: CreviaIapSandboxSmokeTestCase[];
  entitlementId: string;
  offeringId: string;
  iosProductId: string;
  androidProductId: string;
};

export type CreviaIapSandboxSmokeExecutionResult = {
  health: CreviaIapSandboxSmokeHealthStatus;
  decision: CreviaIapSandboxSmokeDecision;
  plan: CreviaIapSandboxSmokeExecutionPlan;
  caseStatuses: Array<{
    caseId: string;
    iosStatus: CreviaIapSandboxSmokeTestStatus;
    androidStatus: CreviaIapSandboxSmokeTestStatus;
    overallStatus: CreviaIapSandboxSmokeTestStatus;
  }>;
  platformResults: CreviaIapSandboxSmokePlatformResult[];
  blockers: CreviaIapSandboxSmokeBlocker[];
  observations: CreviaIapSandboxSmokeObservation[];
  revenueCatKeysConfigured: boolean;
  storeSetupAssumedPending: boolean;
  sandboxSmokePassed: boolean;
  devMockOnlyPassed: boolean;
  manualResultsPresent: boolean;
  nextActions: string[];
};
