import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type EventDomainUiFocus =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'pilot_learning'
  | 'pilot_final'
  | 'generic_operation';

export type EventDomainUiSurface =
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'result'
  | 'report_preview';

export type EventDomainPriorityLevel = 'primary' | 'secondary' | 'muted';

export type EventDomainFocusMetricTone = 'teal' | 'mint' | 'amber' | 'coral' | 'neutral';

export type EventDomainFocusMetric = {
  id: string;
  label: string;
  valueLabel: string;
  tone: EventDomainFocusMetricTone;
  iconKey: string;
  priority: EventDomainPriorityLevel;
};

export type EventDomainFocusModel = {
  focus: EventDomainUiFocus;
  title: string;
  shortTitle: string;
  summary: string;
  primaryLabel: string;
  secondaryLabel?: string;
  tone: EventDomainFocusMetricTone;
  iconKey: string;
  emphasisTags: string[];
  focusMetrics: EventDomainFocusMetric[];
  advisorEchoLine?: string;
  socialEchoLine?: string;
  reportEchoLine?: string;
  showOnDay1: boolean;
  maxVisibleLines: number;
};

export type EventDomainSurfacePriority = {
  surface: EventDomainUiSurface;
  focus: EventDomainUiFocus;
  primarySections: string[];
  secondarySections: string[];
  mutedSections: string[];
};

export type EventDomainPresentationEventLike = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  eventType?: string;
  contentCategory?: string;
  domain?: string;
  neighborhoodId?: string;
  filterTags?: string[];
  tags?: string[];
  contextTag?: string;
};

export type BuildEventDomainFocusArgs = {
  event: EventDomainPresentationEventLike | null | undefined;
  day: number;
  districtId?: MapDistrictId;
  surface?: EventDomainUiSurface;
  assignmentLike?: { compatibilityLabel?: string; approachType?: string } | null;
  microDecisionLike?: { title?: string } | null;
  resultLike?: {
    publicSatisfactionDelta?: number;
    riskDelta?: number;
    successLabel?: string;
    tone?: string;
  } | null;
  includeEcho?: boolean;
};
