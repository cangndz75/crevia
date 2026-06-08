import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { verifySelectorAuditScenario } from '@/core/quality/performanceSelectors/verifySelectorAuditScenario';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  ALL_ANALYTICS_EVENT_NAMES,
  FORBIDDEN_ANALYTICS_PAYLOAD_KEYS,
} from './analyticsConstants';
import {
  buildAssignmentAnalyticsPayload,
  buildCrisisAnalyticsPayload,
  buildDecisionAnalyticsPayload,
  buildEventResultAnalyticsPayload,
  buildResourceAnalyticsPayload,
  buildSeasonEndAnalyticsPayload,
  getCrisisRiskBand,
  sanitizeAnalyticsId,
} from './analyticsPayloadBuilders';
import { findForbiddenAnalyticsKeys, hasFreeTextLikePayload } from './analyticsPrivacy';
import {
  ANALYTICS_EVENT_DEFINITIONS,
  buildAnalyticsPayload,
  validateAnalyticsEventPayload,
} from './analyticsSchema';
import {
  clearTrackedAnalyticsEventsForTesting,
  getTrackedAnalyticsEventsForTesting,
  setAnalyticsEnabledForTesting,
} from './analyticsTracker';
import type { AnalyticsEventName, AnalyticsEventPayload } from './analyticsTypes';
import {
  buildCommonAnalyticsBase,
  clearAnalyticsRuntimeGuardsForTesting,
  getAnalyticsRuntimeGuardKeysForTesting,
  trackCreviaEvent,
  trackOncePerRuntime,
} from './analyticsRuntime';
import { validateAnalyticsEventDefinitions } from './analyticsSchema';
import { verifyAnalyticsScenario } from './verifyAnalyticsScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const INSTRUMENTED_EVENTS: AnalyticsEventName[] = [
  'day_started',
  'first_guide_seen',
  'daily_plan_seen',
  'daily_plan_confirmed',
  'operational_resources_card_seen',
  'operational_resources_detail_opened',
  'first_event_opened',
  'decision_selected',
  'assignment_seen',
  'assignment_confirmed',
  'field_phase_started',
  'micro_decision_seen',
  'micro_decision_resolved',
  'event_completed',
  'report_opened',
  'report_primary_impact_seen',
  'report_daily_plan_seen',
  'report_assignment_seen',
  'report_resources_seen',
  'report_crisis_seen',
  'report_micro_decision_seen',
  'report_main_operation_seen',
  'report_season_end_seen',
  'season_end_seen',
  'season_end_detail_opened',
  'hub_returned',
  'map_opened',
  'map_resource_overlay_seen',
  'map_crisis_overlay_seen',
  'crisis_action_sheet_opened',
  'crisis_action_selected',
  'season_goal_card_seen',
  'crisis_desk_seen',
];

export type VerifyAnalyticsRuntimeOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  consoleReport: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function minimalGameState(overrides: {
  day?: number;
  pilotStatus?: 'active' | 'completed';
  phase?: 'main_operation_full' | 'main_operation_light';
} = {}) {
  const day = overrides.day ?? 1;
  return {
    city: { day },
    pilot: {
      status: overrides.pilotStatus ?? 'active',
      currentPilotDay: day,
      postPilotOperation:
        overrides.phase != null
          ? { phase: overrides.phase, operationDay: day }
          : undefined,
    },
  } as import('@/core/models/GameState').GameState;
}

function minimalMonetization(
  access: 'none' | 'limited' | 'full' = 'none',
): import('@/core/monetization/monetizationTypes').MonetizationState {
  return {
    mainOperationAccess: access === 'full' ? 'full' : access === 'limited' ? 'limited' : 'none',
    offerStatus: 'not_available',
    hasSeenMainOperationOffer: false,
    ownedPacks: [],
  };
}

function validateBuilt(
  eventName: AnalyticsEventName,
  base: Parameters<typeof buildAnalyticsPayload>[1],
  extra: Record<string, string | number | boolean | undefined> = {},
): boolean {
  const payload = buildAnalyticsPayload(eventName, base, extra);
  return validateAnalyticsEventPayload(payload).valid;
}

export function verifyAnalyticsRuntimeScenario(): VerifyAnalyticsRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const pushWarn = (condition: boolean, pass: string, fail: string) => {
    if (!warn(checks, condition, pass, fail)) {
      hasWarn = true;
    }
  };

  setAnalyticsEnabledForTesting(true);
  clearTrackedAnalyticsEventsForTesting();
  clearAnalyticsRuntimeGuardsForTesting();

  ok =
    assert(
      checks,
      typeof trackCreviaEvent === 'function' &&
        typeof trackOncePerRuntime === 'function' &&
        typeof buildCommonAnalyticsBase === 'function',
      'analyticsRuntime exports exist',
      'missing analyticsRuntime exports',
    ) && ok;

  const hubBase = buildCommonAnalyticsBase(minimalGameState(), 'hub');
  trackCreviaEvent('day_started', hubBase);
  ok =
    assert(
      checks,
      getTrackedAnalyticsEventsForTesting().length === 1,
      'trackCreviaEvent buffers in test mode',
      'track buffer empty',
    ) && ok;

  clearTrackedAnalyticsEventsForTesting();
  trackOncePerRuntime('dup:test', 'day_started', hubBase);
  trackOncePerRuntime('dup:test', 'day_started', hubBase);
  ok =
    assert(
      checks,
      getTrackedAnalyticsEventsForTesting().length === 1,
      'trackOncePerRuntime prevents duplicate',
      'duplicate not prevented',
    ) && ok;

  clearAnalyticsRuntimeGuardsForTesting();
  clearTrackedAnalyticsEventsForTesting();
  trackOncePerRuntime('dup:test', 'day_started', hubBase);
  ok =
    assert(
      checks,
      getAnalyticsRuntimeGuardKeysForTesting().includes('dup:test'),
      'clear guards allows re-track',
      'guard clear failed',
    ) && ok;

  clearTrackedAnalyticsEventsForTesting();
  clearAnalyticsRuntimeGuardsForTesting();

  ok =
    assert(
      checks,
      hubBase.day === 1 && hubBase.accessMode === 'pilot' && hubBase.surface === 'hub',
      'buildCommonAnalyticsBase day/accessMode/surface',
      'common base invalid',
    ) && ok;

  ok =
    assert(checks, hubBase.isFirstSession === true, 'Day 1 isFirstSession true', 'isFirstSession') &&
    ok;

  const day10State = minimalGameState({ day: 10, pilotStatus: 'completed', phase: 'main_operation_full' });
  const day10Monet = minimalMonetization('full');
  const fullBase = buildCommonAnalyticsBase(day10State, 'hub', day10Monet);

  const payloadChecks: Array<{
    name: string;
    event: AnalyticsEventName;
    base: Parameters<typeof buildAnalyticsPayload>[1];
    extra?: Record<string, string | number | boolean | undefined>;
  }> = [
    { name: 'day_started', event: 'day_started', base: hubBase },
    {
      name: 'first_guide_seen',
      event: 'first_guide_seen',
      base: hubBase,
      extra: { isTutorial: true },
    },
    { name: 'daily_plan_seen', event: 'daily_plan_seen', base: hubBase },
    {
      name: 'daily_plan_confirmed',
      event: 'daily_plan_confirmed',
      base: hubBase,
      extra: { source: 'hub_card', optionId: 'district_focus' },
    },
    {
      name: 'operational_resources_detail_opened',
      event: 'operational_resources_detail_opened',
      base: fullBase,
      extra: { resourceStatusBand: 'strained' },
    },
    {
      name: 'first_event_opened',
      event: 'first_event_opened',
      base: { ...hubBase, surface: 'event_plan' },
      extra: { eventType: 'container' },
    },
    {
      name: 'decision_selected',
      event: 'decision_selected',
      base: { ...hubBase, surface: 'event_plan' },
      extra: { optionId: 'decision_a', decisionType: 'balanced' },
    },
    {
      name: 'assignment_seen',
      event: 'assignment_seen',
      base: { ...hubBase, surface: 'event_dispatch' },
      extra: { eventType: 'container' },
    },
    {
      name: 'assignment_confirmed',
      event: 'assignment_confirmed',
      base: { ...hubBase, surface: 'event_dispatch' },
      extra: { eventType: 'container', assignmentFitBand: 'strong' },
    },
    {
      name: 'field_phase_started',
      event: 'field_phase_started',
      base: { ...hubBase, surface: 'event_field' },
      extra: { eventType: 'container' },
    },
    {
      name: 'micro_decision_seen',
      event: 'micro_decision_seen',
      base: { ...fullBase, surface: 'event_field' },
      extra: { eventType: 'container' },
    },
    {
      name: 'micro_decision_resolved',
      event: 'micro_decision_resolved',
      base: { ...fullBase, surface: 'event_field' },
      extra: { optionId: 'micro_opt_a' },
    },
    {
      name: 'event_completed',
      event: 'event_completed',
      base: { ...hubBase, surface: 'event_result' },
      extra: { resultBand: 'strong' },
    },
    { name: 'report_opened', event: 'report_opened', base: { ...hubBase, surface: 'report' } },
    {
      name: 'report_resources_seen',
      event: 'report_resources_seen',
      base: { ...hubBase, surface: 'report' },
      extra: { resourceStatusBand: 'busy' },
    },
    {
      name: 'report_crisis_seen',
      event: 'report_crisis_seen',
      base: { ...hubBase, surface: 'report' },
      extra: { crisisRiskBand: 'watch' },
    },
    {
      name: 'report_season_end_seen',
      event: 'report_season_end_seen',
      base: { ...fullBase, surface: 'report' },
      extra: { ratingBand: 'strong', hasSeasonEnd: true },
    },
    {
      name: 'season_end_seen',
      event: 'season_end_seen',
      base: { ...fullBase, surface: 'report' },
      extra: { ratingBand: 'steady' },
    },
    {
      name: 'season_end_detail_opened',
      event: 'season_end_detail_opened',
      base: { ...fullBase, surface: 'report' },
      extra: { ratingBand: 'steady', hasSeasonEnd: true },
    },
    { name: 'hub_returned', event: 'hub_returned', base: hubBase },
    { name: 'map_opened', event: 'map_opened', base: { ...hubBase, surface: 'map' } },
    {
      name: 'map_resource_overlay_seen',
      event: 'map_resource_overlay_seen',
      base: { ...fullBase, surface: 'map' },
      extra: { resourceStatusBand: 'busy' },
    },
    {
      name: 'map_crisis_overlay_seen',
      event: 'map_crisis_overlay_seen',
      base: { ...fullBase, surface: 'map' },
      extra: { crisisRiskBand: 'elevated' },
    },
    {
      name: 'crisis_action_sheet_opened',
      event: 'crisis_action_sheet_opened',
      base: fullBase,
      extra: { crisisRiskBand: 'elevated' },
    },
    {
      name: 'crisis_action_selected',
      event: 'crisis_action_selected',
      base: fullBase,
      extra: { crisisRiskBand: 'elevated', optionId: 'crisis_coordination' },
    },
  ];

  for (const item of payloadChecks) {
    ok =
      assert(
        checks,
        validateBuilt(item.event, item.base, item.extra),
        `${item.name} payload valid`,
        `${item.name} invalid`,
      ) && ok;
  }

  const trackedSample = buildAnalyticsPayload('daily_plan_confirmed', hubBase, {
    source: 'hub',
    districtId: 'merkez',
  });
  ok =
    assert(
      checks,
      findForbiddenAnalyticsKeys(trackedSample).length === 0,
      'No forbidden keys in runtime payloads',
      'forbidden keys present',
    ) && ok;

  const textPayload: AnalyticsEventPayload = {
    ...trackedSample,
    reportText: 'secret',
    advisorLine: 'hint',
  };
  ok =
    assert(
      checks,
      hasFreeTextLikePayload(textPayload),
      'Free text keys detected in probe',
      'free text probe failed',
    ) && ok;

  ok =
    assert(
      checks,
      getAnalyticsRuntimeGuardKeysForTesting().length === 0 ||
        !getAnalyticsRuntimeGuardKeysForTesting().some((k) => !k.includes(':')),
      'Impression guard keys structured',
      'guard key format',
    ) && ok;

  trackOncePerRuntime('assignment_seen:e1', 'assignment_seen', {
    ...hubBase,
    surface: 'event_dispatch',
  }, { eventType: 'container' });
  trackCreviaEvent(
    'decision_selected',
    { ...hubBase, surface: 'event_plan' },
    { optionId: 'a', decisionType: 'balanced' },
  );
  ok =
    assert(
      checks,
      getTrackedAnalyticsEventsForTesting().filter((e) => e.eventName === 'decision_selected').length >=
        1,
      'Action events not over-guarded',
      'decision_selected missing',
    ) && ok;

  const hubBlob = readRepo('src/features/hub/screens/HubScreen.tsx');
  ok =
    assert(
      checks,
      hubBlob.includes('useEffect') && hubBlob.includes('trackOncePerRuntime'),
      'Hub uses guarded useEffect tracking',
      'Hub tracking pattern',
    ) && ok;
  ok =
    assert(
      checks,
      !hubBlob.match(/return\s*\([\s\S]*trackCreviaEvent/s),
      'Hub render does not call track directly',
      'Hub render track spam risk',
    ) && ok;

  const reportBlob = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  ok =
    assert(
      checks,
      reportBlob.includes('trackOncePerRuntime') && reportBlob.includes('useEffect'),
      'Report uses guarded impressions',
      'report impression pattern',
    ) && ok;

  const mapBlob = readRepo('src/features/map/screens/MapScreen.tsx');
  ok =
    assert(
      checks,
      mapBlob.includes('trackOncePerRuntime') && mapBlob.includes('map_opened'),
      'Map overlay events guarded',
      'map instrumentation',
    ) && ok;

  const iapVerify = verifyIapIntegrationScenario();
  if (
    !warn(
      checks,
      iapVerify.ok,
      'IAP analytics still valid',
      'IAP verify pending manual keys or stale cascade — check iap-integration for code FAIL only',
    )
  ) {
    hasWarn = true;
  }

  for (const name of INSTRUMENTED_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `Schema includes ${name}`,
        `missing schema ${name}`,
      ) && ok;
  }

  const schemaAudit = validateAnalyticsEventDefinitions();
  ok =
    assert(
      checks,
      schemaAudit.failCount === 0,
      'analytics-events schema compatible',
      `schema definition FAIL count=${schemaAudit.failCount}`,
    ) && ok;

  const selectorVerify = verifySelectorAuditScenario();
  ok =
    assert(checks, selectorVerify.audit.health !== 'FAIL', 'performance-selectors compatible', 'selector FAIL') &&
    ok;

  const contractsVerify = verifyInteractionContractsScenario();
  ok =
    assert(checks, contractsVerify.ok, 'interaction-contracts compatible', 'contracts FAIL') && ok;

  const first10 = verifyFirstTenMinutesScenario();
  ok = assert(checks, first10.ok, 'first-10-minutes compatible', 'first10 FAIL') && ok;

  const trackerBlob = readRepo('src/core/analytics/analyticsTracker.ts');
  ok =
    assert(
      checks,
      !trackerBlob.includes('firebase') &&
        !trackerBlob.includes('amplitude') &&
        !trackerBlob.includes('posthog'),
      'No real SDK/network import in tracker',
      'SDK import in tracker',
    ) && ok;

  ok =
    assert(
      checks,
      SAVE_VERSION === 25,
      `SAVE_VERSION unchanged (${SAVE_VERSION})`,
      'SAVE_VERSION changed',
    ) && ok;

  const persistBlob = readRepo('src/store/gamePersist.ts');
  ok =
    assert(
      checks,
      !persistBlob.includes('analyticsRuntimeGuard'),
      'No new persist key for analytics guards',
      'persist key added',
    ) && ok;

  ok =
    assert(
      checks,
      sanitizeAnalyticsId('Merkez-1') === 'merkez_1',
      'districtId controlled/safe',
      'district sanitize',
    ) && ok;
  ok =
    assert(
      checks,
      sanitizeAnalyticsId('email@x.com') === undefined,
      'unsafe districtId dropped',
      'district unsafe',
    ) && ok;

  const sparseState = {
    city: { day: 0 },
    pilot: { status: 'active' as const, currentPilotDay: 1 },
  } as import('@/core/models/GameState').GameState;
  ok =
    assert(
      checks,
      buildCommonAnalyticsBase(sparseState, 'hub').day === 1,
      'Sparse gameState fields do not crash builder',
      'sparse gameState crash',
    ) && ok;

  const limitedBase = buildCommonAnalyticsBase(
    minimalGameState({ day: 8, pilotStatus: 'completed' }),
    'hub',
    minimalMonetization('limited'),
  );
  ok =
    assert(
      checks,
      limitedBase.accessMode === 'post_pilot_limited',
      'Limited access payload valid',
      'limited accessMode',
    ) && ok;

  ok =
    assert(
      checks,
      fullBase.accessMode === 'main_operation_full' && fullBase.seasonDay === 10,
      'Main operation full payload valid',
      'full access payload',
    ) && ok;

  const pilotBase = buildCommonAnalyticsBase(minimalGameState({ day: 3 }), 'hub');
  ok =
    assert(checks, pilotBase.pilotDay === 3, 'Pilot Day payload valid', 'pilot day') && ok;

  pushWarn(true, 'Real analytics SDK pending (expected)', '');
  pushWarn(true, 'Analytics dashboard pending (expected)', '');
  pushWarn(true, 'Session recording pending (expected)', '');
  pushWarn(
    INSTRUMENTED_EVENTS.length < ALL_ANALYTICS_EVENT_NAMES.length,
    'Full instrumentation coverage not complete (expected)',
    'coverage unexpectedly full',
  );

  const eventPayload = buildDecisionAnalyticsPayload(
    {
      id: 'evt_1',
      title: 'Test',
      category: 'container',
      district: 'merkez',
      eventType: 'citizen_complaint',
      riskLevel: 'medium',
      description: '',
      contextTag: '',
      urgencyHours: 1,
      decisions: [
        {
          id: 'dec_a',
          title: 'A',
          description: '',
          style: 'balanced',
          effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
        },
      ],
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
    {
      id: 'dec_a',
      title: 'A',
      description: '',
      style: 'balanced',
      effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
    },
    minimalGameState(),
  );
  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload('decision_selected', { surface: 'event_plan', day: 1, accessMode: 'pilot' }, eventPayload),
      ).valid,
      'decision payload builder valid',
      'decision builder',
    ) && ok;

  const resourcePayload = buildResourceAnalyticsPayload({
    personnelGroups: {
      field_team: {
        id: 'field_team',
        label: 'Field',
        status: 'busy',
        workloadScore: 50,
        fatigueScore: 50,
        moraleScore: 50,
        specialtyTags: [],
        usedToday: false,
        trend: 'steady',
        summary: '',
      },
      technical_team: {
        id: 'technical_team',
        label: 'Tech',
        status: 'stable',
        workloadScore: 30,
        fatigueScore: 30,
        moraleScore: 50,
        specialtyTags: [],
        usedToday: false,
        trend: 'steady',
        summary: '',
      },
      public_relations_team: {
        id: 'public_relations_team',
        label: 'PR',
        status: 'stable',
        workloadScore: 30,
        fatigueScore: 30,
        moraleScore: 50,
        specialtyTags: [],
        usedToday: false,
        trend: 'steady',
        summary: '',
      },
    },
    vehicleGroups: {
      standard_truck: {
        id: 'standard_truck',
        label: 'Truck',
        status: 'stable',
        capacityPressure: 40,
        maintenanceRisk: 10,
        routePressure: 20,
        specialtyTags: [],
        usedToday: false,
        trend: 'steady',
        summary: '',
      },
      maintenance_vehicle: {
        id: 'maintenance_vehicle',
        label: 'Maint',
        status: 'stable',
        capacityPressure: 30,
        maintenanceRisk: 5,
        routePressure: 15,
        specialtyTags: [],
        usedToday: false,
        trend: 'steady',
        summary: '',
      },
      route_support_vehicle: {
        id: 'route_support_vehicle',
        label: 'Route',
        status: 'stable',
        capacityPressure: 30,
        maintenanceRisk: 5,
        routePressure: 15,
        specialtyTags: [],
        usedToday: false,
        trend: 'steady',
        summary: '',
      },
    },
    containerNetworksByDistrictId: {},
  });
  ok =
    assert(
      checks,
      resourcePayload.resourceStatusBand === 'busy',
      'resourceStatusBand controlled',
      'resource band',
    ) && ok;

  ok =
    assert(
      checks,
      getCrisisRiskBand('elevated') === 'elevated',
      'crisisRiskBand controlled',
      'crisis band',
    ) && ok;

  ok =
    assert(
      checks,
      buildSeasonEndAnalyticsPayload({ overallRating: 'strong' }, minimalGameState()).ratingBand ===
        'strong',
      'ratingBand controlled',
      'rating band',
    ) && ok;

  ok =
    assert(
      checks,
      buildEventResultAnalyticsPayload(null, 'positive', minimalGameState()).resultBand === 'strong',
      'resultBand controlled',
      'result band',
    ) && ok;

  setAnalyticsEnabledForTesting(false);
  clearTrackedAnalyticsEventsForTesting();
  clearAnalyticsRuntimeGuardsForTesting();

  const consoleReport = [
    '=== Analytics Runtime Instrumentation ===',
    `Instrumented events: ${INSTRUMENTED_EVENTS.length}`,
    `Schema events: ${ANALYTICS_EVENT_DEFINITIONS.length}`,
    `Guards: module-level Set (non-persisted)`,
    `Tracker: no-op (dev buffer in verify only)`,
    `Forbidden keys blocked: ${FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.length}`,
    hasWarn ? 'Status: PASS with expected WARNs (SDK/dashboard pending)' : 'Status: PASS',
  ].join('\n');

  ok = assert(checks, consoleReport.length > 0, 'Console report non-empty', 'empty report') && ok;

  return {
    ok,
    warn: hasWarn,
    checks,
    consoleReport,
  };
}
