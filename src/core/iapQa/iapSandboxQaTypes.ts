export type IapSandboxQaArea =
  | 'env_config'
  | 'revenuecat_dashboard'
  | 'app_store_connect'
  | 'play_console'
  | 'native_capabilities'
  | 'development_build'
  | 'purchase_flow'
  | 'restore_flow'
  | 'mock_flow'
  | 'analytics'
  | 'soft_launch_readiness'
  | 'release_blockers';

export type IapSandboxQaSeverity = 'pass' | 'warn' | 'fail' | 'blocker';

export type IapSandboxQaFinding = {
  id: string;
  area: IapSandboxQaArea;
  severity: IapSandboxQaSeverity;
  title: string;
  message: string;
  recommendation: string;
  manual: boolean;
};

export type IapSandboxQaChecklistItem = {
  id: string;
  area: IapSandboxQaArea;
  title: string;
  requiredForSandbox: boolean;
  requiredForProduction: boolean;
  checkType: 'automatic' | 'manual';
  passCriteria: string;
  failSignal: string;
};

export type IapSandboxQaHealth = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type IapSandboxQaAuditResult = {
  health: IapSandboxQaHealth;
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  blockerCount: number;
  findings: IapSandboxQaFinding[];
  checklist: IapSandboxQaChecklistItem[];
  nextSteps: string[];
  runtimeMode: 'disabled' | 'mock' | 'revenuecat';
};
