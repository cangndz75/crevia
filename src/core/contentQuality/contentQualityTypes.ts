export type EventWritingDomain =
  | 'container'
  | 'vehicle'
  | 'personnel'
  | 'social'
  | 'crisis'
  | 'route'
  | 'budget'
  | 'district_balance'
  | 'pilot_learning'
  | 'pilot_final'
  | 'post_pilot';

export type EventWritingQualityLayer =
  | 'district_context'
  | 'concrete_scene'
  | 'affected_actor'
  | 'operational_domain'
  | 'short_term_gain'
  | 'trade_off'
  | 'carry_over'
  | 'echo';

export type EventWritingQualityStatus = 'pass' | 'warn' | 'fail';

export type EventWritingSeverity = 'info' | 'warn' | 'fail' | 'blocker';

export type EventWritingAuditSource =
  | 'pilot'
  | 'post_pilot'
  | 'main_operation'
  | 'crisis'
  | 'unknown';

export type EventWritingAuditInput = {
  id: string;
  title: string;
  description: string;
  districtId?: string;
  day?: number;
  domain?: EventWritingDomain;
  options?: string[];
  tags?: string[];
  source: EventWritingAuditSource;
};

export type EventWritingAuditWarning = {
  id: string;
  severity: EventWritingSeverity;
  layer?: EventWritingQualityLayer;
  message: string;
  suggestion?: string;
};

export type EventWritingAuditResult = {
  eventId: string;
  title: string;
  source: EventWritingAuditSource;
  inferredDomain?: EventWritingDomain;
  score: number;
  status: EventWritingQualityStatus;
  missingLayers: EventWritingQualityLayer[];
  warnings: EventWritingAuditWarning[];
  strengths: string[];
  suggestedFixes: string[];
  isDay1Safe: boolean;
  isTooGeneric: boolean;
  hasConcreteScene: boolean;
  hasTradeOffLanguage: boolean;
  hasCarryOverLanguage: boolean;
};

export type EventWritingStandardDefinition = {
  layer: EventWritingQualityLayer;
  title: string;
  description: string;
  passExamples: string[];
  failExamples: string[];
  requiredForSoftLaunch: boolean;
};

export type EventWritingSummary = {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  averageScore: number;
  weakLayers: EventWritingQualityLayer[];
  strongLayers: EventWritingQualityLayer[];
  nextRecommendedContentPack: string;
};

export type EventWritingVerifyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  batchSummary?: EventWritingSummary;
};
