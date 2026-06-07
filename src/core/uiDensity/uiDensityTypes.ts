export type UiDensityHealth = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type UiDensityRisk = 'low' | 'medium' | 'high' | 'blocker';

export type UiDensityScreenId =
  | 'hub'
  | 'decision_result'
  | 'report'
  | 'map'
  | 'social'
  | 'operational_resources'
  | 'post_pilot_offer';

export type UiDensityScreenResult = {
  screenId: UiDensityScreenId;
  title: string;
  status: UiDensityHealth;
  densityScore: number;
  largeTextRisk: UiDensityRisk;
  accessibilityRisk: UiDensityRisk;
  duplicateRisk: UiDensityRisk;
  summary: string;
  evidence: string[];
  fixesApplied: string[];
  recommendedFollowUp?: string;
};

export type UiDensityAuditResult = {
  overallHealth: UiDensityHealth;
  launchRisk: UiDensityRisk;
  screenResults: UiDensityScreenResult[];
  fixedIssues: string[];
  remainingIssues: string[];
  recommendedNextActions: string[];
  nonGoalsConfirmed: string[];
};

export type UiDensityDayMode = 'day1' | 'compact' | 'standard' | 'post_pilot_opening' | 'post_pilot_compact';

export type UiDensityPresentationHints = {
  priority: number;
  compactMode: boolean;
  shouldCollapse: boolean;
  maxVisibleLines: number;
  densityTone: 'light' | 'normal' | 'dense';
};
