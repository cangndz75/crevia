import type { AnalyticsAccessMode, AnalyticsSurface } from '@/core/analytics/analyticsTypes';

import { hashSafeContentPackId } from './crashPerformancePrivacy';
import { addBreadcrumb } from './crashReporter';
import type { CrashBreadcrumbActionType, CrashContext } from './crashPerformanceTypes';

type ScreenBreadcrumbInput = {
  screenName: string;
  surface: AnalyticsSurface;
  day?: number;
  phase?: AnalyticsAccessMode | 'pilot' | 'post_pilot_light' | 'main_operation_full';
  districtId?: string;
  eventId?: string;
  eventSourceKind?: string;
  actionType: CrashBreadcrumbActionType;
};

function emitFlowBreadcrumb(input: ScreenBreadcrumbInput): void {
  const data: CrashContext = {
    screenName: input.screenName,
    surface: input.surface,
    actionType: input.actionType,
    day: input.day,
    phase: input.phase,
    districtId: input.districtId,
    eventId: input.eventId,
    eventSourceKind: input.eventSourceKind,
  };
  addBreadcrumb(input.actionType, 'game_flow', data);
}

export function breadcrumbHubScreenOpened(input: {
  day: number;
  phase?: AnalyticsAccessMode;
}): void {
  emitFlowBreadcrumb({
    screenName: 'HubScreen',
    surface: 'hub',
    day: input.day,
    phase: input.phase,
    actionType: 'screen_opened',
  });
}

export function breadcrumbDecisionResultOpened(input: {
  day: number;
  eventId?: string;
  phase?: AnalyticsAccessMode;
}): void {
  emitFlowBreadcrumb({
    screenName: 'DecisionResultScreen',
    surface: 'event_result',
    day: input.day,
    eventId: input.eventId,
    phase: input.phase,
    actionType: 'decision_result_viewed',
  });
}

export function breadcrumbEndOfDayReportOpened(input: {
  day: number;
  phase?: AnalyticsAccessMode;
}): void {
  emitFlowBreadcrumb({
    screenName: 'EndOfDayReportView',
    surface: 'report',
    day: input.day,
    phase: input.phase,
    actionType: 'report_opened',
  });
}

export function breadcrumbMapScreenOpened(input: {
  day: number;
  phase?: AnalyticsAccessMode;
}): void {
  emitFlowBreadcrumb({
    screenName: 'MapScreen',
    surface: 'map',
    day: input.day,
    phase: input.phase,
    actionType: 'screen_opened',
  });
}

export function breadcrumbMapDistrictSelected(input: {
  day: number;
  districtId: string;
}): void {
  emitFlowBreadcrumb({
    screenName: 'MapScreen',
    surface: 'map',
    day: input.day,
    districtId: input.districtId,
    actionType: 'map_selected_district',
  });
}

export function breadcrumbSocialPulseOpened(input: {
  day: number;
  phase?: AnalyticsAccessMode;
}): void {
  emitFlowBreadcrumb({
    screenName: 'SocialPulseScreen',
    surface: 'social',
    day: input.day,
    phase: input.phase,
    actionType: 'screen_opened',
  });
}

export function breadcrumbPostPilotOfferSeen(input: {
  day: number;
  phase?: AnalyticsAccessMode;
}): void {
  emitFlowBreadcrumb({
    screenName: 'PostPilotOfferScreen',
    surface: 'post_pilot_offer',
    day: input.day,
    phase: input.phase,
    actionType: 'post_pilot_offer_seen',
  });
}

export function breadcrumbMainOperationFeelShown(input: { day: number }): void {
  emitFlowBreadcrumb({
    screenName: 'HubScreen',
    surface: 'hub',
    day: input.day,
    phase: 'main_operation_full',
    actionType: 'main_operation_feel_shown',
  });
}

export function breadcrumbContentPackEventShown(input: {
  day: number;
  packId?: string;
  familyId?: string;
  eventId?: string;
}): void {
  emitFlowBreadcrumb({
    screenName: 'HubScreen',
    surface: 'hub',
    day: input.day,
    eventId: input.eventId,
    eventSourceKind: hashSafeContentPackId(input.packId ?? input.familyId),
    actionType: 'content_pack_event_shown',
  });
}

export function breadcrumbOfflineResumeWarning(input: {
  scenario: string;
  status: string;
}): void {
  addBreadcrumb('offline_resume_warning', 'system', {
    scenario: input.scenario,
    status: input.status,
    actionType: 'offline_resume_warning',
  });
}

export type IapCrashBreadcrumbStatus = 'started' | 'succeeded' | 'failed' | 'restored';

export function breadcrumbIapPurchaseStatus(input: {
  day: number;
  status: IapCrashBreadcrumbStatus;
  source: 'mock' | 'revenuecat' | 'disabled';
}): void {
  const actionType: CrashBreadcrumbActionType =
    input.status === 'started'
      ? 'iap_purchase_started'
      : input.status === 'succeeded'
        ? 'iap_purchase_succeeded'
        : input.status === 'failed'
          ? 'iap_purchase_failed'
          : 'iap_purchase_restored';

  addBreadcrumb(actionType, 'iap', {
    day: input.day,
    source: input.source,
    resultBand: input.status,
    actionType,
    surface: 'post_pilot_offer',
  });
}
