export type PerformanceRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PerformanceAuditSurface =
  | 'hub'
  | 'report'
  | 'map'
  | 'event_flow'
  | 'profile'
  | 'social'
  | 'leaderboard';

export type PerformanceAuditFinding = {
  id: string;
  surface: PerformanceAuditSurface;
  componentName: string;
  riskLevel: PerformanceRiskLevel;
  message: string;
  recommendation: string;
  status: 'pass' | 'warn' | 'fail';
};

export type SelectorAuditResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: PerformanceAuditFinding[];
};

export type SelectorAuditTarget = {
  surface: PerformanceAuditSurface;
  componentName: string;
  paths: string[];
};
