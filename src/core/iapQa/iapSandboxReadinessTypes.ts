import type { IapSandboxQaAuditResult, IapSandboxQaFinding } from './iapSandboxQaTypes';

export type CreviaIapSandboxReadinessMode = 'pre_sdk' | 'launch_candidate' | 'sandbox_smoke';

export type CreviaIapSandboxReadinessHealth = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type CreviaIapSandboxPlatformStatus = {
  platform: 'ios' | 'android';
  productId: string;
  storeSetupComplete: boolean;
  sandboxTesterReady: boolean;
  nativeCapabilityReady: boolean;
  devBuildInstalled: boolean;
  status: 'pending' | 'partial' | 'ready';
  notes: string[];
};

export type CreviaRevenueCatConfigStatus = {
  sdkDependencyPresent: boolean;
  singleAdapterImportPoint: boolean;
  iosApiKeyEnvDocumented: boolean;
  androidApiKeyEnvDocumented: boolean;
  iosApiKeyConfigured: boolean;
  androidApiKeyConfigured: boolean;
  entitlementId: string;
  offeringId: string;
  packageProductId: string;
  runtimeMode: 'disabled' | 'mock' | 'revenuecat';
  productionFailSafe: boolean;
  devMockSafe: boolean;
};

export type CreviaStoreProductStatus = {
  iosProductId: string;
  androidProductId: string;
  documentedInCode: boolean;
  storeDashboardCreated: boolean;
  pricingFinalized: boolean;
  revenueCatMapped: boolean;
};

export type CreviaIapSandboxChecklistItem = {
  id: string;
  category: string;
  title: string;
  automatic: boolean;
  requiredForSandbox: boolean;
  requiredForLaunch: boolean;
  status: 'pass' | 'warn' | 'fail' | 'blocker' | 'pending';
  message: string;
};

export type CreviaIapSandboxBlocker = {
  id: string;
  severity: 'blocker' | 'warn';
  title: string;
  message: string;
  recommendation: string;
  appliesInMode: CreviaIapSandboxReadinessMode[];
};

export type CreviaSandboxSmokeTestCase = {
  id: string;
  title: string;
  platform: 'ios' | 'android' | 'both' | 'dev';
  prerequisites: string[];
  steps: string[];
  expectedResult: string;
  logHints: string[];
  automated: boolean;
  status: 'pending' | 'pass' | 'warn';
};

export type CreviaSandboxSmokeTestPlan = {
  version: string;
  minimumCaseCount: number;
  cases: CreviaSandboxSmokeTestCase[];
  manualCompletionRequired: boolean;
};

export type CreviaIapSandboxReadinessResult = {
  health: CreviaIapSandboxReadinessHealth;
  mode: CreviaIapSandboxReadinessMode;
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  blockerCount: number;
  revenueCat: CreviaRevenueCatConfigStatus;
  storeProducts: CreviaStoreProductStatus;
  platformStatus: CreviaIapSandboxPlatformStatus[];
  checklist: CreviaIapSandboxChecklistItem[];
  blockers: CreviaIapSandboxBlocker[];
  smokeTestPlan: CreviaSandboxSmokeTestPlan;
  sandboxQa: IapSandboxQaAuditResult;
  findings: IapSandboxQaFinding[];
  nextSteps: string[];
  docsPaths: {
    integration: string;
    sandboxQa: string;
    smokeTest: string;
  };
};
