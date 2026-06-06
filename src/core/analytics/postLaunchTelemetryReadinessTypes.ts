import type { AnalyticsEventName } from './analyticsTypes';

export type CreviaTelemetryReadinessHealthStatus = 'PASS' | 'WARN' | 'BLOCKED';

export type CreviaTelemetryKpiGroupId =
  | 'first_session'
  | 'day_1_funnel'
  | 'pilot_1_7_progression'
  | 'day_8_open_ended'
  | 'map_route_engagement'
  | 'result_report_engagement'
  | 'iap_monetization'
  | 'technical_quality';

export type CreviaTelemetryKpiDefinition = {
  id: string;
  groupId: CreviaTelemetryKpiGroupId;
  label: string;
  description: string;
  sourceEvent: AnalyticsEventName | 'manual_proxy' | 'placeholder';
  segmentNote?: string;
  optional?: boolean;
};

export type CreviaTelemetryFunnelDefinition = {
  id: string;
  title: string;
  description: string;
  orderedSteps: {
    stepId: string;
    label: string;
    sourceEvent: AnalyticsEventName | 'manual_proxy';
    segmentNote?: string;
  }[];
  successEvent: AnalyticsEventName | 'manual_proxy';
  dropoffNotes: string[];
};

export type CreviaTelemetryDashboardCardStatus =
  | 'ready_definition'
  | 'pending_sdk'
  | 'pending_data'
  | 'manual_only';

export type CreviaTelemetryDashboardCard = {
  id: string;
  title: string;
  questionAnswered: string;
  sourceEvents: (AnalyticsEventName | 'manual_proxy' | 'placeholder')[];
  segment: string;
  recommendedChartType: 'funnel' | 'line' | 'bar' | 'table' | 'status_badge';
  alertThresholdId?: string;
  owner: string;
  status: CreviaTelemetryDashboardCardStatus;
};

export type CreviaTelemetryEventCoverage = {
  requiredEventName: AnalyticsEventName | string;
  existsInSchema: boolean;
  payloadHasDay: boolean;
  payloadHasSurface: boolean;
  payloadHasPhase: boolean;
  payloadHasRankBand: boolean;
  payloadPrivacySafe: boolean;
  missingReason?: string;
  recommendedAction: string;
};

export type CreviaTelemetryReviewQuestion = {
  id: string;
  question: string;
  relatedKpiIds: string[];
  relatedFunnelIds: string[];
  dataSource: string;
  owner: string;
};

export type CreviaTelemetryAlertThreshold = {
  id: string;
  metricLabel: string;
  condition: string;
  thresholdValue: string;
  severity: 'investigate' | 'high_risk' | 'review';
  recommendedAction: string;
  note: string;
};

export type CreviaTelemetryReadinessBlocker = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaTelemetryReadinessWarning = {
  id: string;
  title: string;
  message: string;
  recommendation: string;
};

export type CreviaTelemetryPrivacyGuardResult = {
  passed: boolean;
  rawCopyBlocked: boolean;
  rawUserTextBlocked: boolean;
  saveDumpBlocked: boolean;
  preciseLocationBlocked: boolean;
  deviceIdPolicyAligned: boolean;
  purchasePayloadAligned: boolean;
  dashboardNoPiiRequired: boolean;
  findings: string[];
};

export type CreviaTelemetrySoftLaunchFindings = {
  postLaunchReadinessPresent: boolean;
  kpiDefinitionsPresent: boolean;
  funnelDefinitionsPresent: boolean;
  dashboardCardsPresent: boolean;
  privacyGuardPass: boolean;
  dashboardSdkPending: boolean;
};

export type CreviaPostLaunchTelemetryReadinessResult = {
  health: CreviaTelemetryReadinessHealthStatus;
  kpiGroups: CreviaTelemetryKpiGroupId[];
  kpis: CreviaTelemetryKpiDefinition[];
  funnels: CreviaTelemetryFunnelDefinition[];
  dashboardCards: CreviaTelemetryDashboardCard[];
  eventCoverage: CreviaTelemetryEventCoverage[];
  reviewQuestions: CreviaTelemetryReviewQuestion[];
  alertThresholds: CreviaTelemetryAlertThreshold[];
  privacyGuard: CreviaTelemetryPrivacyGuardResult;
  blockers: CreviaTelemetryReadinessBlocker[];
  warnings: CreviaTelemetryReadinessWarning[];
  softLaunchFindings: CreviaTelemetrySoftLaunchFindings;
  docsPath: string;
  coverageSummary: {
    totalRequiredEvents: number;
    eventsInSchema: number;
    eventsMissing: number;
    eventsPartial: number;
  };
};

export type RunPostLaunchTelemetryReadinessAuditOptions = {
  mode?: 'internal_device_test' | 'soft_launch_candidate' | 'launch_candidate';
};
