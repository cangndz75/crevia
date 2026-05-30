export type QualitySeverity = 'low' | 'medium' | 'high';

export type QualityAuditHealth = 'PASS' | 'WARN' | 'FAIL';

export type QualityWarning = {
  id: string;
  severity: QualitySeverity;
  area: string;
  message: string;
  recommendation: string;
};

export type QualityAuditSummary = {
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  recommendedNextSteps: string[];
};

export type QualityAuditResult = {
  health: QualityAuditHealth;
  architectureWarnings: QualityWarning[];
  performanceWarnings: QualityWarning[];
  forbiddenImportWarnings: QualityWarning[];
  renderRiskWarnings: QualityWarning[];
  summary: QualityAuditSummary;
};

export type StoreActionAuditNote = {
  action: string;
  domainCount: number;
  domains: string[];
  risk: QualitySeverity;
  note: string;
  recommendedFutureRefactor: string;
};

export type DomainBoundaryNote = {
  domain: string;
  readsFrom: string[];
  risk: QualitySeverity;
  note: string;
};

export type ImportScanResult = {
  productionCoreToFeaturesCount: number;
  verifyCoreToFeaturesCount: number;
  presentationImportsUi: boolean;
  postPilotUxImportsUi: boolean;
  samples: string[];
};

export type ScreenPerformanceNote = {
  screen: string;
  componentCountEstimate: number;
  conditionalRenderDensity: QualitySeverity;
  listGridDensity: QualitySeverity;
  animationUsage: QualitySeverity;
  risk: QualitySeverity;
  recommendation: string;
};

export type UiGuardScanResult = {
  componentId: string;
  path: string;
  hasNumberOfLines: boolean;
  hasFlexShrink: boolean;
  hasMinWidth: boolean;
  ok: boolean;
};
