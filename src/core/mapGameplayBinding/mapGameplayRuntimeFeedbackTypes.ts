import type { MapGameplaySupportedDecision } from './mapGameplayBindingTypes';

export const MAP_MARKER_PORTFOLIO_STATUSES = [
  'active',
  'today_focus',
  'recommended',
  'deferred',
  'blocked_by_capacity',
  'watch',
  'completed',
  'locked',
] as const;

export type MapMarkerPortfolioStatus = (typeof MAP_MARKER_PORTFOLIO_STATUSES)[number];

export type MapGameplayRuntimeMarkerFeedback = {
  id: string;
  eventId?: string;
  districtId?: string;
  districtName?: string;
  status: MapMarkerPortfolioStatus;
  priority: number;
  tone: 'neutral' | 'positive' | 'warning' | 'locked';
  isActionable: boolean;
  isInspectable: boolean;
  isStartable: boolean;
  supportedDecision: MapGameplaySupportedDecision;
  ctaLabel: string;
  explanationLine: string;
  riskLine?: string;
  deferLine?: string;
  badgeLabel: string;
  sourceIds: string[];
};

export type MapGameplayRuntimeFeedbackResult = {
  mode: 'legacy' | 'portfolio_runtime';
  markers: MapGameplayRuntimeMarkerFeedback[];
  primaryMarkerId?: string;
  primaryEventId?: string;
  deferredEventIds: string[];
  enrichedBindings: import('./mapGameplayBindingTypes').MapGameplayBinding[];
  sourceIds: string[];
};
