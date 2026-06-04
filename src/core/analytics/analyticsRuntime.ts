import {
  deriveMonetizationStateFromGameState,
  getPostPilotAccessMode,
} from '@/core/monetization/monetizationEngine';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';

import { buildAnalyticsPayload } from './analyticsSchema';
import { trackAnalyticsEvent } from './analyticsTracker';
import type {
  AnalyticsAccessMode,
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsEventPayloadBase,
  AnalyticsPayloadValue,
  AnalyticsSurface,
} from './analyticsTypes';

export type AnalyticsTrackBase = Omit<
  AnalyticsEventPayloadBase,
  'eventName' | 'schemaVersion'
> &
  Record<string, AnalyticsPayloadValue>;

const runtimeGuardKeys = new Set<string>();

export function trackCreviaEvent(
  eventName: AnalyticsEventName,
  base: AnalyticsTrackBase,
  extra: Record<string, AnalyticsPayloadValue> = {},
): void {
  const payload = buildAnalyticsPayload(eventName, base, extra);
  trackAnalyticsEvent(payload);
}

export function trackOncePerRuntime(
  key: string,
  eventName: AnalyticsEventName,
  base: AnalyticsTrackBase | undefined,
  extra: Record<string, AnalyticsPayloadValue> = {},
): void {
  if (!base) {
    return;
  }
  if (runtimeGuardKeys.has(key)) {
    return;
  }
  runtimeGuardKeys.add(key);
  trackCreviaEvent(eventName, base, extra);
}

function trackOptionalNewSystemsEvent(
  guardKey: string,
  eventName: AnalyticsEventName,
  payload: AnalyticsTrackBase | undefined,
): void {
  if (!payload) return;
  trackOncePerRuntime(guardKey, eventName, payload);
}

export function trackHubOpenEndedCardViewed(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'hub_open_ended_card_viewed', payload);
}

export function trackMapDistrictIntelligenceViewed(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'map_district_intelligence_viewed', payload);
}

export function trackActiveRoutePreviewViewed(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'active_route_preview_viewed', payload);
}

export function trackResultSystemsEchoViewed(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'result_systems_echo_viewed', payload);
}

export function trackReportSystemsCardViewed(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'report_systems_card_viewed', payload);
}

export function trackProfileCareerShowcaseViewed(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'profile_career_showcase_viewed', payload);
}

export function trackContentPackQualitySummary(
  guardKey: string,
  payload: AnalyticsTrackBase | undefined,
): void {
  trackOptionalNewSystemsEvent(guardKey, 'content_pack_quality_audit_summary', payload);
}

export function clearAnalyticsRuntimeGuardsForTesting(): void {
  runtimeGuardKeys.clear();
}

export function getAnalyticsRuntimeGuardKeysForTesting(): string[] {
  return [...runtimeGuardKeys];
}

export function getAnalyticsDayFields(gameState: GameState): {
  day?: number;
  pilotDay?: number;
  seasonDay?: number;
} {
  const day = Math.max(gameState.city.day, 1);
  const pilotDay = gameState.pilot.currentPilotDay ?? undefined;
  const seasonDay = gameState.pilot.postPilotOperation?.operationDay;
  return {
    day,
    ...(typeof pilotDay === 'number' && pilotDay > 0 ? { pilotDay } : {}),
    ...(typeof seasonDay === 'number' && seasonDay > 0 ? { seasonDay } : {}),
  };
}

export function getAnalyticsAccessModeFromGameState(
  gameState: GameState,
  monetization: MonetizationState,
): AnalyticsAccessMode {
  const phase = gameState.pilot.postPilotOperation?.phase;
  if (phase === 'main_operation_full') {
    return 'main_operation_full';
  }
  const mode = getPostPilotAccessMode(gameState, monetization);
  if (mode === 'full') return 'post_pilot_full';
  if (mode === 'limited' || mode === 'offer') return 'post_pilot_limited';
  return 'pilot';
}

export function buildCommonAnalyticsBase(
  gameState: GameState,
  surface: AnalyticsSurface,
  monetization?: MonetizationState,
): AnalyticsTrackBase {
  const monet =
    monetization ?? deriveMonetizationStateFromGameState(gameState);
  const days = getAnalyticsDayFields(gameState);
  const day = days.day ?? 1;
  return {
    ...days,
    surface,
    accessMode: getAnalyticsAccessModeFromGameState(gameState, monet),
    isFirstSession: day <= 1,
  };
}

export function hasAnalyticsRuntimeGuard(key: string): boolean {
  return runtimeGuardKeys.has(key);
}
