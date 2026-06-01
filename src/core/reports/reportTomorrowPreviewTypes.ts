export type ReportTomorrowPreviewDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'generic_operation';

export type ReportTomorrowPreviewTone =
  | 'calm'
  | 'positive'
  | 'warning'
  | 'strategic'
  | 'muted';

export type ReportTomorrowPreviewSource =
  | 'carry_over'
  | 'event_echo'
  | 'event_domain'
  | 'dynamic_social_echo'
  | 'daily_report'
  | 'operation_signal'
  | 'pilot_theme'
  | 'fallback';

export type ReportTomorrowPreviewVisibility =
  | 'hidden'
  | 'compact'
  | 'standard'
  | 'final_safe';

export type ReportTomorrowPreviewModel = {
  id: string;
  title: string;
  summary: string;
  detail?: string;
  domain: ReportTomorrowPreviewDomain;
  tone: ReportTomorrowPreviewTone;
  source: ReportTomorrowPreviewSource;
  visibility: ReportTomorrowPreviewVisibility;
  primaryTag: string;
  secondaryTag?: string;
  iconKey: string;
  maxLines: number;
  debugReason?: string;
};

export type ReportTomorrowPreviewInput = {
  day: number;
  currentReport?: {
    carryOverSummaryLines?: string[];
    containerSummaryLines?: string[];
    vehicleSummaryLines?: string[];
    personnelSummaryLines?: string[];
    socialSummaryLines?: string[];
  } | null;
  lastEventResult?: {
    summaryText?: string;
    summaryTitle?: string;
    resultTone?: string;
    eventId?: string;
  } | null;
  carryOverMemory?: {
    summary?: string;
    domain?: string;
    title?: string;
    visible?: boolean;
    source?: string;
  } | null;
  eventEchoBundle?: {
    tomorrowHint?: string;
  } | null;
  eventDomainFocus?: {
    reportEchoLine?: string;
    summary?: string;
    focus?: string;
    shortTitle?: string;
  } | null;
  socialEcho?: {
    mention?: string;
    domain?: string;
    visible?: boolean;
  } | null;
  operationSignals?: {
    containers?: { summary?: string; status?: string };
    vehicles?: { summary?: string; status?: string };
    personnel?: { summary?: string; status?: string };
    districts?: { summary?: string; status?: string };
    overall?: { summary?: string; status?: string };
  } | null;
  pilotTheme?: {
    reportSummary?: string;
    emphasisTags?: string[];
    domain?: string;
  } | null;
  existingLines?: string[];
};

export type ReportTomorrowPreviewSummary = {
  preview?: ReportTomorrowPreviewModel;
  warnings: string[];
  sourceOrder: ReportTomorrowPreviewSource[];
};

export const REPORT_TOMORROW_PREVIEW_DOMAINS: ReportTomorrowPreviewDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];

export const REPORT_TOMORROW_PREVIEW_SOURCES: ReportTomorrowPreviewSource[] = [
  'carry_over',
  'event_echo',
  'event_domain',
  'dynamic_social_echo',
  'daily_report',
  'operation_signal',
  'pilot_theme',
  'fallback',
];
