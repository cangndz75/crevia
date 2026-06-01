import type { MapPresenceMarkerStatus } from './mapPresenceTypes';

export type MapBeforeAfterDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'generic_operation';

export type MapBeforeAfterOutcome =
  | 'improved'
  | 'partially_improved'
  | 'unchanged'
  | 'worsened'
  | 'carried_over'
  | 'prevented'
  | 'unknown';

export type MapBeforeAfterTone = 'positive' | 'mixed' | 'warning' | 'strategic' | 'muted';

export type MapBeforeAfterSurface = 'result' | 'map_panel' | 'report' | 'debug';

export type MapBeforeAfterStateLabel =
  | 'beforePressure'
  | 'afterResolved'
  | 'afterReduced'
  | 'afterCarryOver'
  | 'afterFatigue'
  | 'afterRiskWatch'
  | 'afterPrevented';

export type MapBeforeAfterImpactModel = {
  id: string;
  domain: MapBeforeAfterDomain;
  outcome: MapBeforeAfterOutcome;
  tone: MapBeforeAfterTone;
  title: string;
  beforeLabel: string;
  afterLabel: string;
  summary: string;
  primaryTag: string;
  secondaryTag?: string;
  iconKey: string;
  visible: boolean;
  maxLines: number;
  debugReason?: string;
};

export type MapBeforeAfterMarkerStatusUpdate = {
  markerId?: string;
  domain: MapBeforeAfterDomain;
  beforeStatus: string;
  afterStatus: MapPresenceMarkerStatus;
};

export type MapBeforeAfterInput = {
  day: number;
  activeEvent?: {
    id?: string;
    title?: string;
    contentCategory?: string;
    neighborhoodId?: string;
    resolved?: boolean;
  } | null;
  eventResult?: {
    summaryText?: string;
    summaryTitle?: string;
    resultTone?: string;
    neighborhoodName?: string;
    eventId?: string;
  } | null;
  eventDomainFocus?: { focus?: string; reportEchoLine?: string; summary?: string } | null;
  mapPresence?: { domain?: string } | null;
  resourceFatigue?: { domain?: string; state?: string } | null;
  carryOverMemory?: { domain?: string; summary?: string; resolved?: boolean } | null;
  reportTomorrowPreview?: { domain?: string; summary?: string; visible?: boolean } | null;
  socialEcho?: { mention?: string; domain?: string } | null;
  operationSignals?: { dominantDomain?: string } | null;
  crisisState?: { active?: boolean } | null;
  surface?: MapBeforeAfterSurface;
  hasRealPostPilotData?: boolean;
};

export type MapBeforeAfterSummary = {
  impact?: MapBeforeAfterImpactModel;
  panelLine?: string;
  markerStatusUpdates: MapBeforeAfterMarkerStatusUpdate[];
  warnings: string[];
};

export const MAP_BEFORE_AFTER_DOMAINS: MapBeforeAfterDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];

export const MAP_BEFORE_AFTER_OUTCOMES: MapBeforeAfterOutcome[] = [
  'improved',
  'partially_improved',
  'unchanged',
  'worsened',
  'carried_over',
  'prevented',
  'unknown',
];
