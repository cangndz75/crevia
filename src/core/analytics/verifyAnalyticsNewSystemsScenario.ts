import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildActiveRouteAnalyticsPayload,
  buildContentPackQualityAnalyticsPayload,
  buildHubOpenEndedAnalyticsPayload,
  buildMapDistrictIntelligenceAnalyticsPayload,
  buildProfileCareerShowcaseAnalyticsPayload,
  buildReportSystemsAnalyticsPayload,
  buildResultSystemsEchoAnalyticsPayload,
} from './analyticsPayloadBuilders';
import { isAnalyticsPayloadPrivacySafe } from './analyticsPrivacy';
import {
  buildAnalyticsPayload,
  ANALYTICS_EVENT_DEFINITIONS,
  validateAnalyticsEventPayload,
} from './analyticsSchema';
import {
  clearAnalyticsRuntimeGuardsForTesting,
  getAnalyticsRuntimeGuardKeysForTesting,
  type AnalyticsTrackBase,
  trackContentPackQualitySummary,
  trackHubOpenEndedCardViewed,
} from './analyticsRuntime';
import {
  clearTrackedAnalyticsEventsForTesting,
  getTrackedAnalyticsEventsForTesting,
  setAnalyticsEnabledForTesting,
} from './analyticsTracker';
import {
  buildAnalyticsNewSystemsDebugRows,
  summarizeNewSystemsAnalyticsCoverage,
  validateNewSystemsAnalyticsPayload,
} from './analyticsPresentation';
import type { AnalyticsEventName, AnalyticsEventPayload } from './analyticsTypes';

const NEW_SYSTEMS_EVENTS: AnalyticsEventName[] = [
  'hub_open_ended_card_viewed',
  'hub_open_ended_focus_line_viewed',
  'hub_next_unlock_summary_viewed',
  'hub_district_runtime_summary_viewed',
  'map_district_intelligence_viewed',
  'map_district_trust_line_viewed',
  'map_district_memory_line_viewed',
  'map_district_operation_hint_viewed',
  'map_active_route_hint_viewed',
  'active_route_preview_viewed',
  'active_route_phase_viewed',
  'active_route_resource_warning_viewed',
  'result_systems_echo_viewed',
  'result_variant_echo_viewed',
  'result_route_echo_viewed',
  'result_district_memory_echo_viewed',
  'result_tomorrow_echo_viewed',
  'report_systems_card_viewed',
  'report_systems_line_viewed',
  'report_tomorrow_carryover_line_viewed',
  'report_district_operation_hint_viewed',
  'profile_career_showcase_viewed',
  'profile_next_unlock_viewed',
  'profile_permission_chip_viewed',
  'profile_district_achievement_viewed',
  'content_pack_available_for_selection',
  'content_pack_quality_audit_summary',
  'district_pack_one_loaded',
];

export type VerifyAnalyticsNewSystemsOutcome = {
  ok: boolean;
  checks: string[];
  consoleReport: string;
};

function record(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function valid(eventName: AnalyticsEventName, payload: AnalyticsTrackBase | undefined): boolean {
  if (!payload) return false;
  const full = buildAnalyticsPayload(eventName, payload);
  return (
    validateAnalyticsEventPayload(full).valid &&
    isAnalyticsPayloadPrivacySafe(full) &&
    validateNewSystemsAnalyticsPayload(full)
  );
}

export function verifyAnalyticsNewSystemsScenario(): VerifyAnalyticsNewSystemsOutcome {
  const checks: string[] = [];
  let ok = true;
  const context = {
    day: 8,
    rankId: 'operations_manager',
    isPostPilot: true,
    source: 'verify_new_systems',
  };

  const hubModel = {
    visible: true,
    visibility: { mode: 'standard', maxVisibleLines: 3 },
    focusLines: [
      { id: 'line_1', kind: 'active_route', source: 'route', maxLines: 2 },
      { id: 'line_2', kind: 'district_memory', source: 'memory', maxLines: 1 },
    ],
    nextUnlockSummary: { visible: true },
    districtRuntimeSummary: { visible: true, districtId: 'merkez', kind: 'memory', source: 'district_memory' },
  } as any;
  const hiddenHubModel = { ...hubModel, visible: false } as any;
  const mapModel = {
    districtId: 'merkez',
    visible: true,
    visibility: { mode: 'standard' },
    layerFocus: 'memory',
    visibleLines: [
      { id: 'trust', kind: 'trust' },
      { id: 'memory', kind: 'memory' },
      { id: 'operation', kind: 'operation' },
    ],
  } as any;
  const activeRouteModel = {
    id: 'route_1',
    visible: true,
    phase: 'en_route',
    visibility: { mode: 'standard', showResourceWarning: true },
    steps: [{ id: 'dispatch' }, { id: 'field' }],
    resourceWarningLine: 'structured copy never emitted',
  } as any;
  const resultModel = {
    visible: true,
    visibility: { mode: 'standard' },
    lines: [{ id: 'variant', kind: 'variant' }],
    variantEcho: { visible: true, kind: 'route_pressure' },
    routeEcho: { visible: true, phase: 'completed' },
    memoryEcho: { visible: true, memoryKind: 'recent_improvement' },
    tomorrowEcho: { visible: true },
  } as any;
  const reportModel = {
    visible: true,
    visibility: { mode: 'detailed' },
    lines: [
      { id: 'route', kind: 'active_route', source: 'report', maxLines: 2 },
      { id: 'tomorrow', kind: 'tomorrow_carry_over', source: 'tomorrow', maxLines: 2 },
    ],
    tomorrowSummary: { visible: true },
    operationSummary: { visible: true },
  } as any;
  const profileModel = {
    visible: true,
    visibility: { mode: 'standard' },
    sections: [{ id: 'rank_path' }, { id: 'permissions' }],
    nextUnlockSummary: { visible: true, chips: ['structured_chip'] },
    permissionShowcase: { visible: true, chips: ['structured_chip'] },
    districtAchievementSummary: { visible: true, chips: ['structured_chip'] },
  } as any;

  for (const name of NEW_SYSTEMS_EVENTS) {
    ok =
      record(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((def) => def.name === name),
        `Schema includes ${name}`,
        `missing schema ${name}`,
      ) && ok;
  }

  ok =
    record(
      checks,
      valid('hub_open_ended_card_viewed', buildHubOpenEndedAnalyticsPayload(hubModel, context)),
      'Hub open-ended visible payload valid',
      'Hub payload invalid',
    ) && ok;
  ok =
    record(
      checks,
      buildHubOpenEndedAnalyticsPayload(hiddenHubModel, context) === undefined,
      'Hidden model skips payload',
      'Hidden model produced payload',
    ) && ok;
  ok =
    record(
      checks,
      buildHubOpenEndedAnalyticsPayload(hubModel, { ...context, day: 1 }) === undefined,
      'Day 1 systems hidden from tracking',
      'Day 1 emitted systems payload',
    ) && ok;
  ok =
    record(
      checks,
      valid(
        'map_district_intelligence_viewed',
        buildMapDistrictIntelligenceAnalyticsPayload(mapModel, context),
      ),
      'Map district intelligence districtId payload valid',
      'Map payload invalid',
    ) && ok;
  const activePayload = buildActiveRouteAnalyticsPayload(activeRouteModel, context);
  ok =
    record(
      checks,
      valid('active_route_preview_viewed', activePayload) &&
        !JSON.stringify(activePayload).toLowerCase().includes('pathfinding'),
      'Active route payload has no GPS/pathfinding claim',
      'Active route payload unsafe',
    ) && ok;
  ok =
    record(
      checks,
      valid(
        'result_variant_echo_viewed',
        buildResultSystemsEchoAnalyticsPayload(resultModel, context, {
          lineKind: 'variant',
          variantKind: 'route_pressure',
        }),
      ),
      'Result systems echo lineKind/variantKind valid',
      'Result payload invalid',
    ) && ok;
  const reportPayload = buildReportSystemsAnalyticsPayload(reportModel, context, {
    lineKind: 'tomorrow_carry_over',
    count: 2,
  });
  ok =
    record(
      checks,
      valid('report_systems_line_viewed', reportPayload) &&
        reportPayload?.count === 2 &&
        reportPayload.reportText == null,
      'Report payload sends max line count without raw text',
      'Report payload unsafe',
    ) && ok;
  const profilePayload = buildProfileCareerShowcaseAnalyticsPayload(profileModel, context, {
    lineKind: 'next_unlock',
    count: 1,
  });
  ok =
    record(
      checks,
      valid('profile_next_unlock_viewed', profilePayload) &&
        !JSON.stringify(profilePayload).toLowerCase().includes('paywall'),
      'Profile next unlock payload contains no paywall language',
      'Profile payload unsafe',
    ) && ok;
  const contentPayload = buildContentPackQualityAnalyticsPayload(context, {
    source: 'district_pack_one_authoring_quality',
    count: 1,
  });
  ok =
    record(
      checks,
      valid('content_pack_quality_audit_summary', contentPayload),
      'Content Pack 1 debug-safe quality payload valid',
      'Content payload invalid',
    ) && ok;
  ok =
    record(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.filter((def) =>
        ['content_pack_available_for_selection', 'content_pack_quality_audit_summary', 'district_pack_one_loaded'].includes(def.name),
      ).every((def) => def.surface === 'devtools' && def.enabledInProduction === false),
      'Content Pack 1 not tracked as runtime gameplay event',
      'Content pack event surface/production flag unsafe',
    ) && ok;

  setAnalyticsEnabledForTesting(true);
  clearTrackedAnalyticsEventsForTesting();
  clearAnalyticsRuntimeGuardsForTesting();
  trackHubOpenEndedCardViewed(
    'hub_open_ended_card_viewed:8:standard',
    buildHubOpenEndedAnalyticsPayload(hubModel, context),
  );
  trackHubOpenEndedCardViewed(
    'hub_open_ended_card_viewed:8:standard',
    buildHubOpenEndedAnalyticsPayload(hubModel, context),
  );
  trackContentPackQualitySummary(
    'content_pack_quality_audit_summary:district_pack_one',
    contentPayload,
  );
  const tracked = getTrackedAnalyticsEventsForTesting();
  ok =
    record(
      checks,
      tracked.filter((event) => event.eventName === 'hub_open_ended_card_viewed').length === 1 &&
        getAnalyticsRuntimeGuardKeysForTesting().includes('hub_open_ended_card_viewed:8:standard'),
      'Duplicate tracking guard prevents repeat model id fire',
      'Duplicate guard failed',
    ) && ok;
  ok =
    record(
      checks,
      tracked.every((event) => isAnalyticsPayloadPrivacySafe(event)),
      'Tracked payloads privacy-safe',
      'Tracked payload privacy failed',
    ) && ok;
  setAnalyticsEnabledForTesting(false);
  clearAnalyticsRuntimeGuardsForTesting();

  ok =
    record(
      checks,
      buildAnalyticsNewSystemsDebugRows().length >= NEW_SYSTEMS_EVENTS.length,
      'New systems debug rows cover schema',
      'Debug rows missing',
    ) && ok;
  ok =
    record(
      checks,
      summarizeNewSystemsAnalyticsCoverage().includes('structured_only'),
      'New systems coverage summary debug-safe',
      'Coverage summary missing',
    ) && ok;
  ok = record(checks, SAVE_VERSION === 23, 'SAVE_VERSION unchanged', 'SAVE_VERSION changed') && ok;

  const consoleReport = [
    '=== Analytics New Systems Scenario ===',
    `Events: ${NEW_SYSTEMS_EVENTS.length}`,
    'Content Pack 1 runtime gameplay tracking: no',
    'Runtime gameplay touched: no',
    `SAVE_VERSION: ${SAVE_VERSION}`,
    summarizeNewSystemsAnalyticsCoverage(),
  ].join('\n');

  return { ok, checks, consoleReport };
}
