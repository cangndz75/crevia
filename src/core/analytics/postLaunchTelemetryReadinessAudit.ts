import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { runPrivacyPolicyReadinessAudit } from '@/core/releaseReadiness/privacyPolicyReadinessAudit';

import {
  FORBIDDEN_ANALYTICS_PAYLOAD_KEYS,
  FREE_TEXT_LIKE_PAYLOAD_KEY_SUFFIXES,
} from './analyticsConstants';
import { validateAnalyticsPrivacy } from './analyticsPrivacy';
import { ANALYTICS_EVENT_DEFINITIONS, getAnalyticsEventDefinition } from './analyticsSchema';
import {
  collectPostLaunchTelemetryRequiredEvents,
  POST_LAUNCH_TELEMETRY_ALERT_THRESHOLDS,
  POST_LAUNCH_TELEMETRY_DASHBOARD_CARDS,
  POST_LAUNCH_TELEMETRY_FUNNEL_DEFINITIONS,
  POST_LAUNCH_TELEMETRY_KPI_DEFINITIONS,
  POST_LAUNCH_TELEMETRY_KPI_GROUP_LABELS,
  POST_LAUNCH_TELEMETRY_MIN_DASHBOARD_CARDS,
  POST_LAUNCH_TELEMETRY_MIN_FUNNELS,
  POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS,
  POST_LAUNCH_TELEMETRY_MIN_REVIEW_QUESTIONS,
  POST_LAUNCH_TELEMETRY_READINESS_DOCS_PATH,
  POST_LAUNCH_TELEMETRY_REVIEW_QUESTIONS,
} from './postLaunchTelemetryReadinessConstants';
import type {
  CreviaPostLaunchTelemetryReadinessResult,
  CreviaTelemetryEventCoverage,
  CreviaTelemetryKpiGroupId,
  CreviaTelemetryPrivacyGuardResult,
  CreviaTelemetryReadinessBlocker,
  CreviaTelemetryReadinessWarning,
  CreviaTelemetrySoftLaunchFindings,
  RunPostLaunchTelemetryReadinessAuditOptions,
} from './postLaunchTelemetryReadinessTypes';
import type { AnalyticsEventName } from './analyticsTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const CRITICAL_FUNNEL_IDS = [
  'first_session_funnel',
  'day_1_completion_funnel',
  'pilot_completion_funnel',
  'iap_funnel',
] as const;

function schemaHasEvent(name: string): boolean {
  return ANALYTICS_EVENT_DEFINITIONS.some((d) => d.name === name);
}

function eventPayloadHasKey(name: AnalyticsEventName, key: string): boolean {
  const def = getAnalyticsEventDefinition(name);
  if (!def) return false;
  return (
    def.requiredPayloadKeys.includes(key) || def.allowedPayloadKeys.includes(key)
  );
}

function buildEventCoverageRow(requiredEventName: AnalyticsEventName): CreviaTelemetryEventCoverage {
  const def = getAnalyticsEventDefinition(requiredEventName);
  const existsInSchema = Boolean(def);

  if (!def) {
    return {
      requiredEventName,
      existsInSchema: false,
      payloadHasDay: false,
      payloadHasSurface: false,
      payloadHasPhase: false,
      payloadHasRankBand: false,
      payloadPrivacySafe: false,
      missingReason: 'Event not in ANALYTICS_EVENT_DEFINITIONS',
      recommendedAction: 'WARN only — do not add events during freeze; use proxy or post-freeze backlog',
    };
  }

  const forbiddenAllowed = def.allowedPayloadKeys.filter((k) =>
    FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(
      k as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number],
    ),
  );
  const freeTextAllowed = def.allowedPayloadKeys.filter((k) =>
    FREE_TEXT_LIKE_PAYLOAD_KEY_SUFFIXES.some((suffix) => k.includes(suffix)),
  );

  const payloadPrivacySafe =
    forbiddenAllowed.length === 0 &&
    freeTextAllowed.length === 0 &&
    (def.privacyLevel === 'safe' || def.privacyLevel === 'restricted');

  return {
    requiredEventName,
    existsInSchema: true,
    payloadHasDay: eventPayloadHasKey(requiredEventName, 'day'),
    payloadHasSurface: eventPayloadHasKey(requiredEventName, 'surface') || Boolean(def.surface),
    payloadHasPhase: eventPayloadHasKey(requiredEventName, 'phase'),
    payloadHasRankBand:
      eventPayloadHasKey(requiredEventName, 'rankBand') ||
      eventPayloadHasKey(requiredEventName, 'rankId'),
    payloadPrivacySafe,
    missingReason:
      forbiddenAllowed.length > 0
        ? `Allows forbidden keys: ${forbiddenAllowed.join(', ')}`
        : freeTextAllowed.length > 0
          ? `Allows free-text-like keys: ${freeTextAllowed.join(', ')}`
          : undefined,
    recommendedAction: payloadPrivacySafe
      ? 'Ready for dashboard mapping when SDK connected'
      : 'Remove forbidden/free-text keys from allowlist before production SDK',
  };
}

export function buildTelemetryEventCoverageAudit(): CreviaTelemetryEventCoverage[] {
  const required = collectPostLaunchTelemetryRequiredEvents();
  return required.map((name) => buildEventCoverageRow(name));
}

function buildPrivacyGuard(): CreviaTelemetryPrivacyGuardResult {
  const privacyAudit = validateAnalyticsPrivacy(ANALYTICS_EVENT_DEFINITIONS);
  const policyAudit = runPrivacyPolicyReadinessAudit({ mode: 'soft_launch_candidate' });

  const purchaseEvents = ANALYTICS_EVENT_DEFINITIONS.filter((d) =>
    d.name.startsWith('iap_'),
  );
  const purchasePrivacySafe = purchaseEvents.every(
    (d) =>
      d.privacyLevel === 'restricted' &&
      !d.allowedPayloadKeys.some((k) =>
        FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(
          k as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number],
        ),
      ),
  );

  const policyMentionsPurchase =
    policyAudit.sections.some((s) => s.id === 'purchase_payment_data') &&
    policyAudit.thirdPartyProcessors.some((p) => p.id === 'revenuecat');

  const findings: string[] = [];
  if (privacyAudit.failCount > 0) {
    findings.push(`${privacyAudit.failCount} analytics privacy audit FAIL`);
  }
  if (!purchasePrivacySafe) {
    findings.push('IAP event allowlists need privacy review');
  }
  if (!policyMentionsPurchase) {
    findings.push('Privacy docs purchase/RevenueCat section pending confirmation');
  }

  const rawCopyBlocked = FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('rawText');
  const passed =
    privacyAudit.failCount === 0 &&
    purchasePrivacySafe &&
    policyMentionsPurchase &&
    rawCopyBlocked;

  return {
    passed,
    rawCopyBlocked,
    rawUserTextBlocked:
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('freeText') &&
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('reportText'),
    saveDumpBlocked: FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('saveState'),
    preciseLocationBlocked:
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('locationLat') &&
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('locationLng'),
    deviceIdPolicyAligned:
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('deviceId') &&
      FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes('idfa'),
    purchasePayloadAligned: purchasePrivacySafe && policyMentionsPurchase,
    dashboardNoPiiRequired: true,
    findings,
  };
}

function funnelFullyMeasurable(funnelId: string): boolean {
  const funnel = POST_LAUNCH_TELEMETRY_FUNNEL_DEFINITIONS.find((f) => f.id === funnelId);
  if (!funnel) return false;

  return funnel.orderedSteps.every((step) => {
    if (step.sourceEvent === 'manual_proxy') return true;
    return schemaHasEvent(step.sourceEvent);
  });
}

function collectBlockersAndWarnings(
  mode: RunPostLaunchTelemetryReadinessAuditOptions['mode'],
  eventCoverage: CreviaTelemetryEventCoverage[],
  privacyGuard: CreviaTelemetryPrivacyGuardResult,
): {
  blockers: CreviaTelemetryReadinessBlocker[];
  warnings: CreviaTelemetryReadinessWarning[];
} {
  const blockers: CreviaTelemetryReadinessBlocker[] = [];
  const warnings: CreviaTelemetryReadinessWarning[] = [];

  for (const row of eventCoverage) {
    if (!row.payloadPrivacySafe && row.existsInSchema) {
      blockers.push({
        id: `telemetry.pii_${row.requiredEventName}`,
        title: `PII/privacy risk: ${row.requiredEventName}`,
        message: row.missingReason ?? 'Payload not privacy-safe',
        recommendation: row.recommendedAction,
      });
    }
  }

  if (!privacyGuard.passed && privacyGuard.findings.length > 0) {
    if (privacyGuard.rawCopyBlocked === false || !privacyGuard.saveDumpBlocked) {
      blockers.push({
        id: 'telemetry.privacy_guard_fail',
        title: 'Telemetry privacy guard FAIL',
        message: privacyGuard.findings.join('; '),
        recommendation: 'Align analytics schema with privacy policy draft',
      });
    }
  }

  for (const funnelId of CRITICAL_FUNNEL_IDS) {
    if (!funnelFullyMeasurable(funnelId)) {
      const missing = POST_LAUNCH_TELEMETRY_FUNNEL_DEFINITIONS.find((f) => f.id === funnelId)
        ?.orderedSteps.filter(
          (s) => s.sourceEvent !== 'manual_proxy' && !schemaHasEvent(s.sourceEvent),
        )
        .map((s) => s.sourceEvent);

      if (missing && missing.length > 0) {
        blockers.push({
          id: `telemetry.funnel_blocked_${funnelId}`,
          title: `Critical funnel not measurable: ${funnelId}`,
          message: `Missing schema events: ${missing.join(', ')}`,
          recommendation: 'Critical funnel steps must exist in current schema',
        });
      }
    }
  }

  const missingEvents = eventCoverage.filter((r) => !r.existsInSchema);
  for (const row of missingEvents) {
    warnings.push({
      id: `telemetry.missing_event_${row.requiredEventName}`,
      title: `Event coverage gap: ${row.requiredEventName}`,
      message: row.missingReason ?? 'Not in schema',
      recommendation: row.recommendedAction,
    });
  }

  const optionalGaps = POST_LAUNCH_TELEMETRY_KPI_DEFINITIONS.filter(
    (k) => k.optional && (k.sourceEvent === 'manual_proxy' || !schemaHasEvent(k.sourceEvent as string)),
  );
  for (const kpi of optionalGaps) {
    warnings.push({
      id: `telemetry.optional_gap_${kpi.id}`,
      title: `Optional KPI gap: ${kpi.label}`,
      message: kpi.description,
      recommendation: 'Track via manual proxy or post-freeze schema backlog',
    });
  }

  warnings.push({
    id: 'telemetry.dashboard_sdk_pending',
    title: 'Analytics dashboard / SDK pending',
    message: 'No production analytics SDK or dashboard connected; definitions only.',
    recommendation: 'WARN only — connect SDK after soft launch instrumentation review',
  });

  const docsPresent = existsSync(join(REPO_ROOT, POST_LAUNCH_TELEMETRY_READINESS_DOCS_PATH));
  if (!docsPresent) {
    const isSoftLaunch = mode === 'soft_launch_candidate' || mode === 'launch_candidate';
    const issue = {
      id: 'telemetry.docs_missing',
      title: 'Post-launch telemetry readiness docs missing',
      message: POST_LAUNCH_TELEMETRY_READINESS_DOCS_PATH,
      recommendation: 'Create telemetry readiness documentation',
    };
    if (isSoftLaunch) {
      warnings.push(issue);
    } else {
      warnings.push(issue);
    }
  }

  if (
    mode === 'soft_launch_candidate' &&
    POST_LAUNCH_TELEMETRY_KPI_DEFINITIONS.length < POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS
  ) {
    warnings.push({
      id: 'telemetry.kpi_docs_insufficient',
      title: 'KPI definitions below soft launch minimum',
      message: `Expected KPI groups >= ${POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS}`,
      recommendation: 'Complete KPI documentation before soft launch candidate',
    });
  }

  return { blockers, warnings };
}

export function buildTelemetrySoftLaunchFindings(
  result: Pick<
    CreviaPostLaunchTelemetryReadinessResult,
    'kpis' | 'funnels' | 'dashboardCards' | 'privacyGuard' | 'warnings'
  >,
): CreviaTelemetrySoftLaunchFindings {
  const kpiGroups = [...new Set(result.kpis.map((k) => k.groupId))];
  return {
    postLaunchReadinessPresent: true,
    kpiDefinitionsPresent: kpiGroups.length >= POST_LAUNCH_TELEMETRY_MIN_KPI_GROUPS,
    funnelDefinitionsPresent: result.funnels.length >= POST_LAUNCH_TELEMETRY_MIN_FUNNELS,
    dashboardCardsPresent: result.dashboardCards.length >= POST_LAUNCH_TELEMETRY_MIN_DASHBOARD_CARDS,
    privacyGuardPass: result.privacyGuard.passed,
    dashboardSdkPending: result.warnings.some((w) => w.id === 'telemetry.dashboard_sdk_pending'),
  };
}

export function runPostLaunchTelemetryReadinessAudit(
  options: RunPostLaunchTelemetryReadinessAuditOptions = {},
): CreviaPostLaunchTelemetryReadinessResult {
  const mode = options.mode ?? 'internal_device_test';

  const kpiGroups = Object.keys(POST_LAUNCH_TELEMETRY_KPI_GROUP_LABELS) as CreviaTelemetryKpiGroupId[];
  const eventCoverage = buildTelemetryEventCoverageAudit();
  const privacyGuard = buildPrivacyGuard();
  const { blockers, warnings } = collectBlockersAndWarnings(mode, eventCoverage, privacyGuard);

  const eventsInSchema = eventCoverage.filter((r) => r.existsInSchema).length;
  const eventsMissing = eventCoverage.filter((r) => !r.existsInSchema).length;
  const eventsPartial = eventCoverage.filter(
    (r) => r.existsInSchema && (!r.payloadHasDay || !r.payloadPrivacySafe),
  ).length;

  let health: CreviaPostLaunchTelemetryReadinessResult['health'] = 'PASS';
  if (blockers.length > 0) health = 'BLOCKED';
  else if (warnings.length > 0) health = 'WARN';

  const base = {
    health,
    kpiGroups,
    kpis: POST_LAUNCH_TELEMETRY_KPI_DEFINITIONS,
    funnels: POST_LAUNCH_TELEMETRY_FUNNEL_DEFINITIONS,
    dashboardCards: POST_LAUNCH_TELEMETRY_DASHBOARD_CARDS,
    eventCoverage,
    reviewQuestions: POST_LAUNCH_TELEMETRY_REVIEW_QUESTIONS,
    alertThresholds: POST_LAUNCH_TELEMETRY_ALERT_THRESHOLDS,
    privacyGuard,
    blockers,
    warnings,
    docsPath: POST_LAUNCH_TELEMETRY_READINESS_DOCS_PATH,
    coverageSummary: {
      totalRequiredEvents: eventCoverage.length,
      eventsInSchema,
      eventsMissing,
      eventsPartial,
    },
  };

  return {
    ...base,
    softLaunchFindings: buildTelemetrySoftLaunchFindings(base),
  };
}
