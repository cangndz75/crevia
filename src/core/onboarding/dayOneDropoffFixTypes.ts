export type DayOneDropoffAuditAreaId =
  | 'hub_day1_card_count'
  | 'hub_day1_cta_clarity'
  | 'first_event_discoverability'
  | 'inspect_explanation_density'
  | 'plan_option_clarity'
  | 'dispatch_assignment_clarity'
  | 'field_micro_decision_clarity'
  | 'result_impact_clarity'
  | 'report_day1_density'
  | 'tomorrow_preview_clarity'
  | 'forbidden_early_systems_visibility'
  | 'text_overflow_guard'
  | 'scroll_fatigue_risk'
  | 'duplicate_hint_copy_risk'
  | 'safe_area_small_screen_risk';

export type DayOneDropoffAuditSeverity = 'pass' | 'warn' | 'blocker';

export type DayOneDropoffAuditFinding = {
  id: string;
  area: DayOneDropoffAuditAreaId;
  severity: DayOneDropoffAuditSeverity;
  title: string;
  message: string;
  recommendation: string;
};

export type DayOneDropoffCopyGuardResult = {
  passed: boolean;
  scannedStringCount: number;
  violations: { term: string; sample: string }[];
};

export type DayOneDropoffDensitySummary = {
  hubMaxFeaturedCards: number;
  hubSuppressedSurfaces: string[];
  resultMaxEchoLines: number;
  reportMaxSystemLines: number;
  advancedSystemsHidden: string[];
};

export type DayOneDropoffFixAuditResult = {
  health: 'PASS' | 'WARN' | 'BLOCKED';
  findings: DayOneDropoffAuditFinding[];
  copyGuard: DayOneDropoffCopyGuardResult;
  density: DayOneDropoffDensitySummary;
  fixOnlyScope: string[];
  docsPath: string;
};
