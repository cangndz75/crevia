import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyInteractionContractsScenario } from '@/core/quality/interactionContracts/verifyInteractionContractsScenario';
import { verifySelectorAuditScenario } from '@/core/quality/performanceSelectors/verifySelectorAuditScenario';
import { verifySeasonEndScenario } from '@/core/seasonEnd/verifySeasonEndScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  ALL_ANALYTICS_EVENT_NAMES,
  ANALYTICS_SCHEMA_VERSION,
  FORBIDDEN_ANALYTICS_PAYLOAD_KEYS,
} from './analyticsConstants';
import { ANALYTICS_FUNNEL_DEFINITIONS, validateAnalyticsFunnels } from './analyticsFunnels';
import {
  assertNoForbiddenPayloadKeys,
  findForbiddenAnalyticsKeys,
  hasFreeTextLikePayload,
  isAnalyticsPayloadPrivacySafe,
  validateAnalyticsPrivacy,
} from './analyticsPrivacy';
import {
  buildAnalyticsEventTableMarkdown,
  buildAnalyticsFunnelMarkdown,
  buildAnalyticsSchemaConsoleReport,
} from './analyticsPresentation';
import {
  ANALYTICS_EVENT_DEFINITIONS,
  buildAnalyticsPayload,
  sanitizeAnalyticsPayload,
  validateAnalyticsEventDefinitions,
  validateAnalyticsEventPayload,
} from './analyticsSchema';
import {
  clearTrackedAnalyticsEventsForTesting,
  createAnalyticsEvent,
  getTrackedAnalyticsEventsForTesting,
  setAnalyticsEnabledForTesting,
  trackAnalyticsEvent,
} from './analyticsTracker';
import type { AnalyticsEventPayload } from './analyticsTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyAnalyticsOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  consoleReport: string;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

const FIRST_SESSION_EVENTS = [
  'app_opened',
  'session_started',
  'day_started',
  'first_guide_seen',
  'daily_plan_confirmed',
  'report_opened',
  'hub_returned',
] as const;

const PILOT_EVENTS = [
  'day7_report_opened',
  'pilot_completion_seen',
  'post_pilot_offer_opened',
] as const;

const POST_PILOT_EVENTS = [
  'post_pilot_offer_opened',
  'limited_continue_selected',
  'main_operation_mock_purchase_completed',
] as const;

const CRISIS_EVENTS = [
  'crisis_desk_seen',
  'crisis_action_selected',
  'crisis_action_processed',
] as const;

const RESOURCE_EVENTS = [
  'operational_resources_card_seen',
  'operational_resources_detail_opened',
  'map_resource_overlay_seen',
] as const;

const SEASON_END_EVENTS = [
  'season_end_seen',
  'season_end_detail_opened',
  'report_season_end_seen',
] as const;

export function verifyAnalyticsScenario(): VerifyAnalyticsOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  ok =
    assert(
      checks,
      ANALYTICS_SCHEMA_VERSION === 1,
      'Analytics schema version 1',
      'Schema version mismatch',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.length > 0,
      'Event definitions not empty',
      'No event definitions',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.length === ALL_ANALYTICS_EVENT_NAMES.length,
      'Definitions match event name registry',
      'Registry/definition count mismatch',
    ) && ok;

  for (const name of FIRST_SESSION_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `First session event ${name}`,
        `Missing ${name}`,
      ) && ok;
  }

  for (const name of PILOT_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `Pilot event ${name}`,
        `Missing ${name}`,
      ) && ok;
  }

  for (const name of POST_PILOT_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `Post-pilot event ${name}`,
        `Missing ${name}`,
      ) && ok;
  }

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === 'main_operation_day_started'),
      'Full main operation events',
      'Missing main_operation_day_started',
    ) && ok;

  for (const name of CRISIS_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `Crisis event ${name}`,
        `Missing ${name}`,
      ) && ok;
  }

  for (const name of RESOURCE_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `Resources event ${name}`,
        `Missing ${name}`,
      ) && ok;
  }

  for (const name of SEASON_END_EVENTS) {
    ok =
      assert(
        checks,
        ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name),
        `Season end event ${name}`,
        `Missing ${name}`,
      ) && ok;
  }

  const names = ANALYTICS_EVENT_DEFINITIONS.map((d) => d.name);
  ok =
    assert(
      checks,
      new Set(names).size === names.length,
      'Event names unique',
      'Duplicate event names',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.every((d) => d.description.trim().length > 0),
      'Every event has description',
      'Empty description',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.every((d) => d.funnelIds.length > 0),
      'Every event has funnelIds',
      'Missing funnelIds',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.every((d) => d.requiredPayloadKeys.length > 0),
      'Every event has requiredPayloadKeys',
      'Missing required keys',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.every((d) =>
        d.requiredPayloadKeys.every((k) => d.allowedPayloadKeys.includes(k)),
      ),
      'Required keys covered by allowed',
      'Required not in allowed',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.every((d) =>
        ['safe', 'restricted'].includes(d.privacyLevel),
      ),
      'Privacy level valid',
      'Invalid privacy level',
    ) && ok;

  ok =
    assert(
      checks,
      ANALYTICS_EVENT_DEFINITIONS.every((d) =>
        d.allowedPayloadKeys.every(
          (k) =>
            !FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(
              k as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number],
            ),
        ),
      ),
      'Forbidden keys not in allowlists',
      'Forbidden key in allowlist',
    ) && ok;

  const validPayload = buildAnalyticsPayload(
    'daily_plan_confirmed',
    { surface: 'hub', day: 1, accessMode: 'pilot' },
    { source: 'hub_card' },
  );
  const validResult = validateAnalyticsEventPayload(validPayload);
  ok =
    assert(checks, validResult.valid, 'Valid payload PASS', validResult.errors.join('; ')) &&
    ok;

  const missingKey = buildAnalyticsPayload('assignment_confirmed', {
    surface: 'event_dispatch',
    accessMode: 'pilot',
  });
  const missingResult = validateAnalyticsEventPayload(missingKey);
  ok =
    assert(
      checks,
      !missingResult.valid,
      'Missing required key FAIL',
      'Should fail without day',
    ) && ok;

  const forbiddenPayload: AnalyticsEventPayload = {
    eventName: 'daily_plan_confirmed',
    surface: 'hub',
    schemaVersion: 1,
    day: 1,
    accessMode: 'pilot',
    email: 'x@y.com',
  };
  ok =
    assert(
      checks,
      !validateAnalyticsEventPayload(forbiddenPayload).valid,
      'Forbidden key FAIL',
      'Should reject email',
    ) && ok;

  const freeTextPayload: AnalyticsEventPayload = {
    eventName: 'report_opened',
    surface: 'report',
    schemaVersion: 1,
    day: 1,
    accessMode: 'pilot',
    advisorLine: 'Uzun serbest metin',
  };
  ok =
    assert(
      checks,
      hasFreeTextLikePayload(freeTextPayload),
      'Free text key detected',
      'Free text detection failed',
    ) && ok;

  const sanitized = sanitizeAnalyticsPayload(forbiddenPayload);
  ok =
    assert(
      checks,
      findForbiddenAnalyticsKeys(sanitized).length === 0,
      'Sanitize removes forbidden keys',
      'Sanitize failed',
    ) && ok;

  ok =
    assert(
      checks,
      buildAnalyticsPayload('session_started', { surface: 'hub', day: 1 }).schemaVersion === 1,
      'buildAnalyticsPayload adds schemaVersion',
      'schemaVersion missing',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload(
          'assignment_confirmed',
          { surface: 'event_dispatch', day: 8, accessMode: 'main_operation_full' },
          { eventType: 'container', assignmentFitBand: 'strong' },
        ),
      ).valid,
      'assignment_confirmed payload valid',
      'assignment_confirmed invalid',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload(
          'crisis_action_selected',
          {
            surface: 'hub',
            day: 10,
            seasonDay: 3,
            accessMode: 'main_operation_full',
          },
          { crisisRiskBand: 'elevated', optionId: 'crisis_coordination' },
        ),
      ).valid,
      'crisis_action_selected payload valid',
      'crisis_action_selected invalid',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload(
          'operational_resources_detail_opened',
          {
            surface: 'hub',
            day: 10,
            seasonDay: 3,
            accessMode: 'main_operation_full',
          },
          { resourceStatusBand: 'strained' },
        ),
      ).valid,
      'operational_resources_detail_opened valid',
      'operational_resources_detail invalid',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload(
          'map_resource_overlay_seen',
          { surface: 'map', day: 10, accessMode: 'main_operation_full' },
          { resourceStatusBand: 'busy' },
        ),
      ).valid,
      'map_resource_overlay_seen valid',
      'map_resource_overlay invalid',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload('post_pilot_offer_opened', {
          surface: 'post_pilot_offer',
          day: 7,
          accessMode: 'pilot',
        }),
      ).valid,
      'post_pilot_offer_opened valid',
      'post_pilot_offer_opened invalid',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload('main_operation_mock_purchase_completed', {
          surface: 'post_pilot_offer',
          day: 7,
          accessMode: 'post_pilot_full',
        }),
      ).valid,
      'main_operation_mock_purchase_completed valid',
      'mock purchase invalid',
    ) && ok;

  ok =
    assert(
      checks,
      validateAnalyticsEventPayload(
        buildAnalyticsPayload(
          'season_end_seen',
          { surface: 'report', day: 21, seasonDay: 14 },
          { ratingBand: 'strong' },
        ),
      ).valid,
      'season_end_seen valid',
      'season_end_seen invalid',
    ) && ok;

  for (const funnelId of [
    'first_session',
    'pilot_completion',
    'post_pilot_offer',
    'full_main_operation',
    'crisis_management',
    'operational_resources',
    'season_end',
  ] as const) {
    const funnel = ANALYTICS_FUNNEL_DEFINITIONS.find((f) => f.id === funnelId);
    ok =
      assert(
        checks,
        funnel != null && funnel.orderedEvents.length > 0,
        `Funnel ${funnelId} defined`,
        `Missing funnel ${funnelId}`,
      ) && ok;
    if (funnel) {
      ok =
        assert(
          checks,
          funnel.orderedEvents.includes(funnel.successEvent),
          `Funnel ${funnelId} successEvent in order`,
          'successEvent not in orderedEvents',
        ) && ok;
      ok =
        assert(
          checks,
          funnel.dropoffRisks.length > 0,
          `Funnel ${funnelId} dropoff risks`,
          'Empty dropoffRisks',
        ) && ok;
    }
  }

  const defAudit = validateAnalyticsEventDefinitions();
  ok = assert(checks, defAudit.health !== 'FAIL', 'Definition audit not FAIL', 'Definition audit FAIL') && ok;

  const funnelAudit = validateAnalyticsFunnels();
  ok = assert(checks, funnelAudit.health !== 'FAIL', 'Funnel audit not FAIL', 'Funnel audit FAIL') && ok;
  if (funnelAudit.health === 'WARN') hasWarn = true;

  const privacyAudit = validateAnalyticsPrivacy(ANALYTICS_EVENT_DEFINITIONS);
  ok = assert(checks, privacyAudit.health !== 'FAIL', 'Privacy audit PASS', 'Privacy audit FAIL') && ok;

  clearTrackedAnalyticsEventsForTesting();
  setAnalyticsEnabledForTesting(true);
  trackAnalyticsEvent(
    createAnalyticsEvent('report_opened', { surface: 'report', day: 1, accessMode: 'pilot' }),
  );
  ok =
    assert(
      checks,
      getTrackedAnalyticsEventsForTesting().length === 1,
      'Testing buffer track works',
      'Buffer empty after track',
    ) && ok;
  clearTrackedAnalyticsEventsForTesting();
  ok =
    assert(
      checks,
      getTrackedAnalyticsEventsForTesting().length === 0,
      'Testing buffer clear works',
      'Buffer not cleared',
    ) && ok;
  setAnalyticsEnabledForTesting(false);

  trackAnalyticsEvent(forbiddenPayload);
  ok =
    assert(
      checks,
      getTrackedAnalyticsEventsForTesting().length === 0,
      'Invalid payload not buffered',
      'Invalid payload buffered',
    ) && ok;

  let threw = false;
  try {
    assertNoForbiddenPayloadKeys(forbiddenPayload);
  } catch {
    threw = true;
  }
  ok = assert(checks, threw, 'assertNoForbiddenPayloadKeys throws', 'Should throw on forbidden') && ok;

  const defResult = validateAnalyticsEventDefinitions();
  const funnelResult = validateAnalyticsFunnels();
  const privacyResult = validateAnalyticsPrivacy(ANALYTICS_EVENT_DEFINITIONS);
  const consoleReport = [
    buildAnalyticsSchemaConsoleReport(defResult),
    buildAnalyticsSchemaConsoleReport(funnelResult),
    buildAnalyticsSchemaConsoleReport(privacyResult),
  ].join('\n\n');

  ok = assert(checks, consoleReport.length > 80, 'Console report non-empty', 'Empty console report') && ok;

  const eventTable = buildAnalyticsEventTableMarkdown();
  ok = assert(checks, eventTable.includes('daily_plan_confirmed'), 'Event table non-empty', 'Empty event table') && ok;

  const docsPath = 'docs/crevia-analytics-event-schema.md';
  const docs = readRepo(docsPath);
  ok = assert(checks, docs.length > 200, 'Docs file exists', 'Docs missing') && ok;
  ok =
    assert(checks, docs.includes('Privacy-safe'), 'Docs privacy section', 'Privacy section missing') &&
    ok;
  ok =
    assert(checks, docs.includes('First Session Funnel'), 'Docs funnel section', 'Funnel section missing') &&
    ok;
  ok =
    assert(
      checks,
      docs.includes('Yasak') || docs.includes('yasak'),
      'Docs forbidden payload examples',
      'Forbidden examples missing',
    ) && ok;
  ok =
    assert(
      checks,
      docs.includes('SDK') || docs.includes('sonraki aşama'),
      'Docs SDK later section',
      'SDK section missing',
    ) && ok;

  const analyticsCore = readRepo('src/core/analytics/analyticsTracker.ts');
  ok =
    assert(
      checks,
      !analyticsCore.includes("from '@/features/"),
      'Analytics core no UI imports',
      'Analytics imports UI',
    ) && ok;
  ok =
    assert(
      checks,
      !readRepo('src/core/analytics/analyticsSchema.ts').includes('firebase') &&
        !readRepo('src/core/analytics/analyticsSchema.ts').includes('amplitude') &&
        !readRepo('src/core/analytics/analyticsSchema.ts').includes('posthog'),
      'No SDK imports',
      'SDK import found',
    ) && ok;
  ok =
    assert(
      checks,
      !analyticsCore.includes('fetch(') && !analyticsCore.includes('XMLHttpRequest'),
      'No network dependency',
      'Network call in tracker',
    ) && ok;

  ok = assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23', 'SAVE_VERSION changed') && ok;

  ok = assert(checks, verifySeasonEndScenario().ok, 'Season end compatible', 'Season end FAIL') && ok;
  ok =
    assert(checks, verifySelectorAuditScenario().ok, 'Performance selectors compatible', 'Perf FAIL') &&
    ok;
  ok =
    assert(
      checks,
      verifyInteractionContractsScenario().ok,
      'Interaction contracts compatible',
      'Contracts FAIL',
    ) && ok;

  checks.push('WARN Real SDK integration pending');
  checks.push('WARN Runtime instrumentation pending');
  checks.push('WARN Analytics dashboard not implemented');
  hasWarn = true;

  return { ok, warn: hasWarn, checks, consoleReport };
}
