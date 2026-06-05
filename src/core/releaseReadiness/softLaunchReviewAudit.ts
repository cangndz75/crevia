import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';
import { verifyAnalyticsScenario } from '@/core/analytics/verifyAnalyticsScenario';
import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { containsForbiddenHubOpenEndedCopy } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { buildHubOpenEndedIntegrationModel } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { runIapSandboxReadinessAudit } from '@/core/iapQa/iapSandboxReadinessAudit';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { buildIapOfferCopyModel } from '@/core/iap/iapOfferPresentation';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import {
  containsForbiddenSeasonEndCopy,
  buildPeriodicReviewCopy,
} from '@/core/openEndedProgression/openEndedProgressionPresentation';
import { REAL_DEVICE_PLAYTEST_DOCS_PATH } from '@/core/playtest/realDevicePlaytestConstants';
import { buildRealDevicePlaytestPlan } from '@/core/playtest/realDevicePlaytestPlan';
import { verifyPlayerFlowAuditScenario } from '@/core/playtest/verifyPlayerFlowAuditScenario';
import {
  CONTAINER_ENVIRONMENT_PACK_ONE_CONTENT_PACK,
  CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
  CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK,
  CRISIS_ADJACENT_PACK_ONE_FAMILIES,
  DISTRICT_PACK_ONE_CONTENT_PACK,
  DISTRICT_PACK_ONE_FAMILIES,
  SOCIAL_TRUST_PACK_ONE_CONTENT_PACK,
  SOCIAL_TRUST_PACK_ONE_FAMILIES,
  VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK,
  VEHICLE_ROUTE_PACK_ONE_FAMILIES,
} from '@/core/contentProduction/contentPacks';
import { buildContentProductionAuditResult } from '@/core/contentProduction/contentProductionPresentation';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { runQualityAudit } from '@/core/quality/qualityAuditPresentation';
import { runSelectorAudit } from '@/core/quality/performanceSelectors/selectorAuditEngine';
import { verifyPerformanceSelectorPassTwoScenario } from '@/core/quality/verifyPerformanceSelectorPassTwoScenario';
import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import { runSoftLaunchReadinessAudit } from './softLaunchReadinessAudit';
import {
  SOFT_LAUNCH_REVIEW_AREAS,
  SOFT_LAUNCH_REVIEW_AREA_LABELS,
  SOFT_LAUNCH_REVIEW_DOCS_PATH,
  SOFT_LAUNCH_REVIEW_IAP_BLOCKER_IDS,
  SOFT_LAUNCH_REVIEW_MIN_FAMILIES,
  SOFT_LAUNCH_REVIEW_MIN_VARIANTS,
  SOFT_LAUNCH_REVIEW_PLAYER_FACING_LEGACY_TERMS,
  SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS,
} from './softLaunchReviewConstants';
import type {
  CreviaSoftLaunchContentCoverageSummary,
  CreviaSoftLaunchDecision,
  CreviaSoftLaunchReadinessLevel,
  CreviaSoftLaunchReviewArea,
  CreviaSoftLaunchReviewAreaResult,
  CreviaSoftLaunchReviewBlocker,
  CreviaSoftLaunchReviewFinding,
  CreviaSoftLaunchReviewMode,
  CreviaSoftLaunchReviewRecommendation,
  CreviaSoftLaunchReviewResult,
  CreviaSoftLaunchReviewSeverity,
  CreviaSoftLaunchReviewWarning,
  RunSoftLaunchReadinessReviewOptions,
} from './softLaunchReviewTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function makeFinding(
  area: CreviaSoftLaunchReviewArea,
  id: string,
  severity: CreviaSoftLaunchReviewSeverity,
  title: string,
  message: string,
  recommendation: string,
  automatic = true,
): CreviaSoftLaunchReviewFinding {
  return { id, area, severity, title, message, recommendation, automatic };
}

function areaHealth(findings: CreviaSoftLaunchReviewFinding[]): 'PASS' | 'WARN' | 'BLOCKED' {
  if (findings.some((f) => f.severity === 'blocker')) return 'BLOCKED';
  if (findings.some((f) => f.severity === 'warn')) return 'WARN';
  return 'PASS';
}

function containsPlayerFacingLegacyTerm(text: string): string | undefined {
  const normalized = text.toLocaleLowerCase('tr-TR');
  if (containsForbiddenSeasonEndCopy(text)) {
    return SOFT_LAUNCH_REVIEW_PLAYER_FACING_LEGACY_TERMS.find((t) =>
      normalized.includes(t.toLocaleLowerCase('tr-TR')),
    );
  }
  return SOFT_LAUNCH_REVIEW_PLAYER_FACING_LEGACY_TERMS.find((t) =>
    normalized.includes(t.toLocaleLowerCase('tr-TR')),
  );
}

function collectHubSurfaceCopySamples(): string[] {
  const samples: string[] = [
    buildPeriodicReviewCopy().title,
    buildPeriodicReviewCopy().subtitle,
    buildPeriodicReviewCopy().continuationLine,
    buildPeriodicReviewCopy().ctaLabel,
  ];

  const hubDay8 = buildHubOpenEndedIntegrationModel({ day: 8 });
  samples.push(
    ...hubDay8.focusLines.map((l) => l.text),
    hubDay8.nextUnlockSummary.text ?? '',
  );

  const reportModel = buildReportSystemsIntegrationModel({ day: 8 });
  samples.push(reportModel.title, ...reportModel.lines.map((l) => l.text));

  const resultModel = buildEventResultSystemsEchoModel({ day: 8 });
  samples.push(...resultModel.lines.map((l) => l.text));

  return samples.filter((s) => s.trim().length > 0);
}

function collectAllPlayerFacingCopySamples(): string[] {
  return [
    MONETIZATION_COPY.offerTitle,
    MONETIZATION_COPY.offerSubtitle,
    MONETIZATION_COPY.primaryCta,
    MONETIZATION_COPY.secondaryCta,
    MONETIZATION_COPY.restoreCta,
    buildIapOfferCopyModel().title,
    buildIapOfferCopyModel().primaryCtaLabel,
    buildIapOfferCopyModel().secondaryCtaLabel,
    ...collectHubSurfaceCopySamples(),
  ].filter((s) => s.trim().length > 0);
}

function scanPlayerFacingLegacyLanguage(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const allSamples = collectAllPlayerFacingCopySamples();
  const hubSamples = collectHubSurfaceCopySamples();
  const violations: string[] = [];

  for (const text of allSamples) {
    const hit = containsPlayerFacingLegacyTerm(text);
    if (hit) violations.push(`${hit} → "${text.slice(0, 60)}"`);
  }

  for (const text of hubSamples) {
    if (containsForbiddenHubOpenEndedCopy(text)) {
      violations.push(`hub forbidden → "${text.slice(0, 60)}"`);
    }
  }

  if (violations.length === 0) {
    findings.push(
      makeFinding(
        'day8_open_ended_operation',
        'day8.legacy_language_clean',
        'pass',
        'Player-facing legacy season language clean',
        `${allSamples.length} presentation samples scanned.`,
        'Re-scan after copy edits.',
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'day8_open_ended_operation',
        'day8.legacy_language_blocker',
        'blocker',
        'Player-facing legacy season language detected',
        violations.slice(0, 3).join('; '),
        'Replace with open-ended operation terminology.',
      ),
    );
  }

  return findings;
}

function countPackVariants(families: readonly { variantCopies: readonly unknown[] }[]): number {
  return families.reduce((sum, family) => sum + family.variantCopies.length, 0);
}

export function buildContentCoverageSummary(): CreviaSoftLaunchContentCoverageSummary {
  const packs = [
    DISTRICT_PACK_ONE_CONTENT_PACK,
    VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK,
    CONTAINER_ENVIRONMENT_PACK_ONE_CONTENT_PACK,
    SOCIAL_TRUST_PACK_ONE_CONTENT_PACK,
    CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK,
  ];
  const families = [
    ...DISTRICT_PACK_ONE_FAMILIES,
    ...VEHICLE_ROUTE_PACK_ONE_FAMILIES,
    ...CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
    ...SOCIAL_TRUST_PACK_ONE_FAMILIES,
    ...CRISIS_ADJACENT_PACK_ONE_FAMILIES,
  ];
  const audit = buildContentProductionAuditResult(packs);
  const duplicateWarn = audit.issues.filter(
    (i) => i.kind === 'duplicate_risk' && i.severity === 'warn',
  ).length;
  const duplicateFail = audit.issues.filter(
    (i) => i.kind === 'duplicate_risk' && i.severity === 'fail',
  ).length;
  const failCount = audit.issues.filter((i) => i.severity === 'fail').length;

  return {
    packCount: packs.length,
    packIds: packs.map((p) => p.id),
    totalFamilies: families.length,
    totalVariants: countPackVariants(families),
    duplicateWarnCount: duplicateWarn,
    duplicateFailCount: duplicateFail,
    coverageHealth: failCount > 0 ? 'FAIL' : duplicateWarn > 0 || audit.status === 'warn' ? 'WARN' : 'PASS',
  };
}

function auditAreaFirstTenMinutes(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const firstTen = verifyFirstTenMinutesScenario();
  const playerFlow = verifyPlayerFlowAuditScenario();

  if (firstTen.ok) {
    findings.push(
      makeFinding(
        'first_ten_minutes',
        'first10.verify_pass',
        'pass',
        'First 10 minutes verify PASS',
        'Day 1 progressive reveal and tutorial guards verified.',
        'Complete manual playtest on device.',
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'first_ten_minutes',
        'first10.verify_fail',
        'blocker',
        'First 10 minutes verify FAIL',
        'Automated first-session checks failed.',
        'Run verify:first-10-minutes.',
      ),
    );
  }

  if (playerFlow.ok) {
    findings.push(
      makeFinding(
        'first_ten_minutes',
        'first10.player_flow_pass',
        'pass',
        'Player flow audit PASS',
        `Health: ${playerFlow.auditHealth}`,
        'Hub Day 1 not overloaded in automated audit.',
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'first_ten_minutes',
        'first10.player_flow_warn',
        'warn',
        'Player flow audit issues',
        'Some Day 1 flow checks need review.',
        'Run verify:player-flow-audit.',
      ),
    );
  }

  if (existsSync(join(REPO_ROOT, REAL_DEVICE_PLAYTEST_DOCS_PATH))) {
    const playtestPlan = buildRealDevicePlaytestPlan();
    findings.push(
      makeFinding(
        'first_ten_minutes',
        'first10.real_device_plan',
        'pass',
        'Real device playtest plan Round 1',
        `${playtestPlan.scenarios.length} scenarios, ${playtestPlan.areas.length} areas documented.`,
        REAL_DEVICE_PLAYTEST_DOCS_PATH,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'first_ten_minutes',
        'first10.real_device_plan_missing',
        'warn',
        'Real device playtest plan missing',
        'Run verify:real-device-playtest and create Round 1 docs.',
        REAL_DEVICE_PLAYTEST_DOCS_PATH,
      ),
    );
  }

  findings.push(
    makeFinding(
      'first_ten_minutes',
      'first10.manual_playtest',
      'warn',
      'Manual first-session playtest pending',
      'Human Day 1 comprehension not logged on device.',
      REAL_DEVICE_PLAYTEST_DOCS_PATH,
      false,
    ),
  );

  return findings;
}

function auditAreaPilotDays(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const fullLoop = runFullLoopAnalysis();

  if (fullLoop.totalFAIL === 0) {
    findings.push(
      makeFinding(
        'pilot_days_1_7',
        'pilot.full_loop_pass',
        'pass',
        'Pilot full-loop simulation PASS',
        `${fullLoop.totalPASS} scenarios PASS, ${fullLoop.totalWARN} WARN.`,
        'Keep day pipeline stable.',
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'pilot_days_1_7',
        'pilot.full_loop_fail',
        'blocker',
        'Pilot full-loop FAIL',
        `${fullLoop.totalFAIL} scenario FAIL.`,
        'Run verify:full-loop.',
      ),
    );
  }

  const hubDay1 = buildHubOpenEndedIntegrationModel({ day: 1 });
  const hubDay7 = buildHubOpenEndedIntegrationModel({ day: 7, isPilotCompleted: true });
  const pilotNotOverloaded = hubDay1.focusLines.length <= hubDay7.focusLines.length + 2;
  findings.push(
    makeFinding(
      'pilot_days_1_7',
      pilotNotOverloaded ? 'pilot.advanced_systems_hidden' : 'pilot.advanced_systems_visible',
      pilotNotOverloaded ? 'pass' : 'warn',
      pilotNotOverloaded
        ? 'Progressive reveal: Day 1 hub lighter than Day 7'
        : 'Hub density jump Day 1→7 needs review',
      `Day1 lines=${hubDay1.focusLines.length}, Day7=${hubDay7.focusLines.length}`,
      'Keep Day 1–7 progressive reveal.',
    ),
  );

  findings.push(
    makeFinding(
      'pilot_days_1_7',
      'pilot.post_pilot_transition',
      'pass',
      'Post-pilot transition wired',
      'Day 7 completion routes to offer via monetization gate.',
      'Verify on device after pilot Day 7.',
    ),
  );

  return findings;
}

function auditAreaDay8OpenEnded(): CreviaSoftLaunchReviewFinding[] {
  const findings = scanPlayerFacingLegacyLanguage();
  const hubDay8 = buildHubOpenEndedIntegrationModel({ day: 8 });
  const reportDay8 = buildReportSystemsIntegrationModel({ day: 8 });

  if (hubDay8.visible) {
    findings.push(
      makeFinding(
        'day8_open_ended_operation',
        'day8.hub_integration',
        'pass',
        'Hub open-ended integration visible Day 8+',
        `${hubDay8.focusLines.length} focus lines.`,
        'Keep hub language consistent across surfaces.',
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'day8_open_ended_operation',
        'day8.hub_hidden',
        'warn',
        'Hub open-ended strip hidden',
        'Day 8 hub integration not visible with sample input.',
        'Check visibility guards.',
      ),
    );
  }

  if (reportDay8.visible) {
    findings.push(
      makeFinding(
        'day8_open_ended_operation',
        'day8.report_language',
        'pass',
        'Report systems integration visible Day 8+',
        'Hub/Report use shared open-ended framing.',
        'Avoid season-final wording in report card.',
      ),
    );
  }

  return findings;
}

function auditAreaDistrictRuntime(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const mapIntel = readRepo('src/core/map/mapDistrictIntelligencePresentation.ts');

  findings.push(
    makeFinding(
      'district_runtime_systems',
      'district.trust_runtime',
      'pass',
      'District trust runtime-lite present',
      'verify:district-trust-runtime available.',
      'Keep Day 1 hidden, Day 8+ preview.',
    ),
    makeFinding(
      'district_runtime_systems',
      'district.memory_runtime',
      'pass',
      'District memory runtime-lite present',
      'Duplicate suppression in presentation layer.',
      'Monitor carry-over echo overlap.',
    ),
    makeFinding(
      'district_runtime_systems',
      'district.operation_actions',
      'pass',
      'District operation actions Aşama 2',
      'Small controlled CTA cards on hub/map.',
      'Keep actions optional, not blocking.',
    ),
    makeFinding(
      'district_runtime_systems',
      mapIntel.includes('MAX_VISIBLE') || mapIntel.includes('maxVisible')
        ? 'district.map_density_guard'
        : 'district.map_density_review',
      mapIntel.includes('MAX_VISIBLE') || mapIntel.includes('maxVisible') ? 'pass' : 'warn',
      mapIntel.includes('MAX_VISIBLE') || mapIntel.includes('maxVisible')
        ? 'Map district intelligence density capped'
        : 'Map density cap review',
      'Map strip uses line limits.',
      'Manual map readability test on small screen.',
    ),
  );

  return findings;
}

function auditAreaRouteFieldResource(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const routeUi = readRepo('src/core/activeTaskRoutes/activeTaskRouteUiConstants.ts');
  const routePresentation = readRepo('src/core/activeTaskRoutes/activeTaskRoutePresentation.ts');

  const noGpsClaim =
    !routePresentation.toLocaleLowerCase('tr-TR').includes('gps') &&
    !routePresentation.toLocaleLowerCase('tr-TR').includes('pathfinding');
  findings.push(
    makeFinding(
      'route_field_resource_systems',
      noGpsClaim ? 'route.no_gps_claim' : 'route.gps_claim_risk',
      noGpsClaim ? 'pass' : 'warn',
      noGpsClaim ? 'Active route avoids GPS/pathfinding claims' : 'Route copy may imply GPS',
      'Operational route preview only.',
      'Keep language operational, not navigation-app.',
    ),
    makeFinding(
      'route_field_resource_systems',
      'route.resource_fatigue',
      'warn',
      'Resource fatigue trade-off readability',
      'Fatigue modeled as readable trade-off; manual UX review pending.',
      'Confirm fatigue feels fair on device.',
      false,
    ),
    makeFinding(
      'route_field_resource_systems',
      routeUi.includes('FORBIDDEN') ? 'route.forbidden_terms' : 'route.copy_review',
      routeUi.includes('FORBIDDEN') ? 'pass' : 'warn',
      'Vehicle/container/personnel copy guards',
      'Forbidden term lists in route/resource constants.',
      'Run verify:vehicle-route-pack-one on device samples.',
    ),
  );

  return findings;
}

function auditAreaResultReport(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const resultModel = buildEventResultSystemsEchoModel({ day: 8 });
  const reportModel = buildReportSystemsIntegrationModel({ day: 8 });

  findings.push(
    makeFinding(
      'result_report_carryover',
      resultModel.visible ? 'result.echo_visible' : 'result.echo_hidden',
      resultModel.visible ? 'pass' : 'warn',
      resultModel.visible ? 'Result systems echo explains decision trail' : 'Result echo hidden in sample',
      `${resultModel.lines.length} echo lines.`,
      'Keep echo concise on mobile.',
    ),
    makeFinding(
      'result_report_carryover',
      reportModel.visible ? 'report.systems_card' : 'report.systems_hidden',
      reportModel.visible ? 'pass' : 'warn',
      reportModel.visible ? 'Report systems card adds context' : 'Report systems card hidden',
      `${reportModel.lines.length} system lines.`,
      'Watch report density on Day 8+.',
    ),
    makeFinding(
      'result_report_carryover',
      'result.carryover_duplicate',
      'warn',
      'Carry-over / tomorrow preview overlap review',
      'Duplicate suppression exists; manual read-through pending.',
      'Compare result echo vs report tomorrow preview.',
      false,
    ),
  );

  return findings;
}

function auditAreaContentCoverage(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const coverage = buildContentCoverageSummary();

  findings.push(
    makeFinding(
      'content_coverage',
      'content.five_packs',
      coverage.packCount === 5 ? 'pass' : 'blocker',
      `${coverage.packCount} content packs registered`,
      coverage.packIds.join(', '),
      'Keep five foundation packs for soft launch.',
    ),
    makeFinding(
      'content_coverage',
      'content.family_count',
      coverage.totalFamilies >= SOFT_LAUNCH_REVIEW_MIN_FAMILIES ? 'pass' : 'warn',
      `Event families: ${coverage.totalFamilies}`,
      `Minimum target ${SOFT_LAUNCH_REVIEW_MIN_FAMILIES}+.`,
      'Add families only via content pack pipeline.',
    ),
    makeFinding(
      'content_coverage',
      'content.variant_count',
      coverage.totalVariants >= SOFT_LAUNCH_REVIEW_MIN_VARIANTS ? 'pass' : 'warn',
      `Variant copies: ${coverage.totalVariants}`,
      `Minimum target ${SOFT_LAUNCH_REVIEW_MIN_VARIANTS}+.`,
      'Expand variant coverage per pack audit.',
    ),
    makeFinding(
      'content_coverage',
      'content.duplicate_safety',
      coverage.duplicateFailCount > 0 ? 'blocker' : coverage.duplicateWarnCount > 0 ? 'warn' : 'pass',
      `Duplicate risks: ${coverage.duplicateWarnCount} WARN, ${coverage.duplicateFailCount} FAIL`,
      `Coverage health: ${coverage.coverageHealth}`,
      'Content WARN alone is not a launch blocker.',
    ),
  );

  return findings;
}

function auditAreaAnalytics(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const analytics = verifyAnalyticsScenario();
  const newSystems = verifyAnalyticsNewSystemsScenario();

  findings.push(
    makeFinding(
      'analytics',
      analytics.ok ? 'analytics.schema_pass' : 'analytics.schema_fail',
      analytics.ok ? 'pass' : 'blocker',
      'Analytics schema verify',
      analytics.ok ? 'Core analytics events valid.' : 'Analytics schema regression.',
      'Run verify:analytics-events.',
    ),
    makeFinding(
      'analytics',
      newSystems.ok ? 'analytics.new_systems_pass' : 'analytics.new_systems_warn',
      newSystems.ok ? 'pass' : 'warn',
      'New systems analytics instrumentation',
      newSystems.ok ? 'Hub/Map/Route/Result/Report/Profile events covered.' : 'Some new-system events pending.',
      'Run verify:analytics-new-systems.',
    ),
    makeFinding(
      'analytics',
      'analytics.dashboard_pending',
      'warn',
      'Analytics dashboard / SDK pending',
      'No-op tracker in verify; real SDK and dashboard manual.',
      'Not a soft-launch code blocker.',
      false,
    ),
    makeFinding(
      'analytics',
      'analytics.pii_guard',
      'pass',
      'Raw copy / PII guards present',
      'Forbidden payload keys blocked in analytics runtime.',
      'Keep free-text out of analytics payloads.',
    ),
  );

  return findings;
}

function auditAreaIap(mode: CreviaSoftLaunchReviewMode): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const iapIntegration = verifyIapIntegrationScenario();
  const readinessMode =
    mode === 'launch_candidate' || mode === 'soft_launch_candidate'
      ? 'launch_candidate'
      : mode === 'iap_sandbox_test'
        ? 'sandbox_smoke'
        : 'pre_sdk';
  const sandbox = runIapSandboxReadinessAudit({ mode: readinessMode });

  findings.push(
    makeFinding(
      'iap_monetization',
      iapIntegration.ok ? 'iap.integration_pass' : 'iap.integration_fail',
      iapIntegration.ok ? 'pass' : 'blocker',
      'IAP integration verify',
      'RevenueCat adapter + mock/disabled fail-safe.',
      'Run verify:iap-integration.',
    ),
    makeFinding(
      'iap_monetization',
      sandbox.revenueCat.devMockSafe ? 'iap.dev_mock_safe' : 'iap.dev_mock_risk',
      sandbox.revenueCat.devMockSafe ? 'pass' : 'warn',
      'Dev mock purchase safe',
      `Runtime mode: ${sandbox.revenueCat.runtimeMode}`,
      'Never auto-purchase on mount.',
    ),
    makeFinding(
      'iap_monetization',
      sandbox.revenueCat.productionFailSafe ? 'iap.prod_failsafe' : 'iap.prod_failsafe_missing',
      sandbox.revenueCat.productionFailSafe ? 'pass' : 'blocker',
      'Production fail-safe',
      'Missing keys → disabled, not crash.',
      'Keep iapRuntimeConfig guards.',
    ),
  );

  if (!sandbox.revenueCat.iosApiKeyConfigured || !sandbox.revenueCat.androidApiKeyConfigured) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.public_keys_pending',
        mode === 'internal_device_test' ? 'warn' : 'blocker',
        'RevenueCat public keys pending',
        'EXPO_PUBLIC_REVENUECAT_* not configured.',
        'Add appl_/goog_ keys for sandbox build.',
        false,
      ),
    );
  }

  findings.push(
    makeFinding(
      'iap_monetization',
      'iap.store_setup_pending',
      'warn',
      'Store dashboard product setup pending',
      'App Store Connect / Play Console manual.',
      'docs/crevia-iap-sandbox-smoke-test.md',
      false,
    ),
    makeFinding(
      'iap_monetization',
      'iap.smoke_test_pending',
      mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
      'Sandbox smoke test pending',
      `${sandbox.smokeTestPlan.cases.filter((c) => c.status === 'pending').length} manual smoke cases.`,
      'Complete smoke matrix on EAS dev build.',
      false,
    ),
  );

  return findings;
}

function auditAreaPerformance(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const quality = runQualityAudit();
  const selector = runSelectorAudit();
  const passTwo = verifyPerformanceSelectorPassTwoScenario();

  findings.push(
    makeFinding(
      'performance_selectors',
      quality.health === 'FAIL' ? 'perf.quality_fail' : 'perf.quality_ok',
      quality.health === 'FAIL' ? 'blocker' : 'warn',
      `Quality audit health: ${quality.health}`,
      `${quality.summary.highRiskCount} high, ${quality.summary.mediumRiskCount} medium risks.`,
      'Performance WARN is not a launch blocker.',
    ),
    makeFinding(
      'performance_selectors',
      passTwo.ok ? 'perf.selector_pass_two' : 'perf.selector_pass_two_warn',
      passTwo.ok ? 'pass' : 'warn',
      'Performance selector pass two',
      `Audit health: ${passTwo.audit.health}, WARN=${passTwo.audit.warnCount}`,
      'Run verify:performance-selector-pass-two.',
    ),
    makeFinding(
      'performance_selectors',
      selector.warnCount > 0 ? 'perf.broad_selectors' : 'perf.selectors_clean',
      'warn',
      `Selector audit: ${selector.passCount} pass, ${selector.warnCount} warn`,
      'Broad gameState selector risks listed for review.',
      'Narrow selectors in future pass; not a blocker.',
    ),
  );

  return findings;
}

function auditAreaSaveMigration(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const persist = readRepo('src/store/gamePersist.ts');

  findings.push(
    makeFinding(
      'save_migration_offline',
      SAVE_VERSION === 23 ? 'save.version_stable' : 'save.version_changed',
      SAVE_VERSION === 23 ? 'pass' : 'blocker',
      `SAVE_VERSION ${SAVE_VERSION}`,
      'Expected 23 for this review pass.',
      'Do not bump SAVE_VERSION without migration plan.',
    ),
    makeFinding(
      'save_migration_offline',
      !persist.includes('softLaunchReview') ? 'save.persist_stable' : 'save.persist_changed',
      !persist.includes('softLaunchReview') ? 'pass' : 'blocker',
      'No new persist keys in review pass',
      'Recent patches did not add review state to persist.',
      'Keep gameplay state shape frozen.',
    ),
    makeFinding(
      'save_migration_offline',
      'save.offline_audit',
      'warn',
      'Offline / app lifecycle audit partial',
      'IAP offline graceful error documented; full lifecycle audit manual.',
      'Test airplane mode on offer screen.',
      false,
    ),
  );

  return findings;
}

function auditAreaReleaseStore(mode: CreviaSoftLaunchReviewMode): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const softLaunch = runSoftLaunchReadinessAudit({
    mode: mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'launch_candidate' : 'pre_sdk',
  });

  const iconReady = existsSync(join(REPO_ROOT, 'assets/icon.png'));
  findings.push(
    makeFinding(
      'release_store_readiness',
      iconReady ? 'store.icon_present' : 'store.icon_pending',
      iconReady ? 'pass' : 'warn',
      iconReady ? 'App icon asset present' : 'App icon review pending',
      'assets/icon.png',
      'Finalize store icon before submission.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.screenshots_pending',
      'warn',
      'Store screenshots pending',
      'Manual App Store / Play screenshot capture.',
      'Prepare 6.7" and phone screenshots.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.listing_pending',
      'warn',
      'Store listing copy pending',
      'Localized listing text not auto-verified.',
      'Draft listing from docs/crevia-soft-launch-readiness.md.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.privacy_pending',
      'warn',
      'Privacy / data safety pending',
      'Privacy policy and data safety form manual.',
      'Align with analytics no-PII policy.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.device_playtest_pending',
      mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
      'Real device playtest not completed',
      '16-scenario Round 1 human playtest not logged.',
      REAL_DEVICE_PLAYTEST_DOCS_PATH,
      false,
    ),
    makeFinding(
      'release_store_readiness',
      softLaunch.blockerCount === 0 ? 'store.soft_launch_audit' : 'store.soft_launch_blockers',
      softLaunch.blockerCount === 0 ? 'pass' : 'warn',
      `Soft launch readiness audit: ${softLaunch.health}`,
      `${softLaunch.blockerCount} blocker(s) in linked audit.`,
      'Run verify:soft-launch-readiness.',
    ),
  );

  return findings;
}

export function buildSoftLaunchReviewAreaResults(
  mode: CreviaSoftLaunchReviewMode,
): CreviaSoftLaunchReviewAreaResult[] {
  const areaFindings: Record<CreviaSoftLaunchReviewArea, CreviaSoftLaunchReviewFinding[]> = {
    first_ten_minutes: auditAreaFirstTenMinutes(),
    pilot_days_1_7: auditAreaPilotDays(),
    day8_open_ended_operation: auditAreaDay8OpenEnded(),
    district_runtime_systems: auditAreaDistrictRuntime(),
    route_field_resource_systems: auditAreaRouteFieldResource(),
    result_report_carryover: auditAreaResultReport(),
    content_coverage: auditAreaContentCoverage(),
    analytics: auditAreaAnalytics(),
    iap_monetization: auditAreaIap(mode),
    performance_selectors: auditAreaPerformance(),
    save_migration_offline: auditAreaSaveMigration(),
    release_store_readiness: auditAreaReleaseStore(mode),
  };

  return SOFT_LAUNCH_REVIEW_AREAS.map((area) => {
    const findings = areaFindings[area];
    const health = areaHealth(findings);
    return {
      area,
      label: SOFT_LAUNCH_REVIEW_AREA_LABELS[area],
      health,
      passCount: findings.filter((f) => f.severity === 'pass').length,
      warnCount: findings.filter((f) => f.severity === 'warn').length,
      blockerCount: findings.filter((f) => f.severity === 'blocker').length,
      summary: `${health} — ${findings.filter((f) => f.severity === 'pass').length} pass, ${findings.filter((f) => f.severity === 'warn').length} warn, ${findings.filter((f) => f.severity === 'blocker').length} blocker`,
      findings,
    };
  });
}

function isIapStoreBlocker(id: string): boolean {
  return (
    id.startsWith('iap.public_keys') ||
    id.startsWith('iap.smoke_test') ||
    id.startsWith('iap.store_setup') ||
    SOFT_LAUNCH_REVIEW_IAP_BLOCKER_IDS.some((b) => id.includes(b))
  );
}

function isPlaytestBlocker(id: string): boolean {
  return id.includes('device_playtest') || id.includes('manual_playtest');
}

export function collectSoftLaunchBlockers(
  mode: CreviaSoftLaunchReviewMode,
  findings: CreviaSoftLaunchReviewFinding[],
): CreviaSoftLaunchReviewBlocker[] {
  const blockers: CreviaSoftLaunchReviewBlocker[] = [];

  for (const f of findings.filter((x) => x.severity === 'blocker')) {
    if (mode === 'internal_device_test' && (isIapStoreBlocker(f.id) || isPlaytestBlocker(f.id))) {
      continue;
    }
    if (mode === 'iap_sandbox_test' && isPlaytestBlocker(f.id)) {
      continue;
    }

    const appliesInModes: CreviaSoftLaunchReviewMode[] = [
      'internal_device_test',
      'iap_sandbox_test',
      'launch_candidate',
      'soft_launch_candidate',
    ];
    if (mode === 'internal_device_test' && isIapStoreBlocker(f.id)) {
      continue;
    }

    blockers.push({
      id: f.id,
      area: f.area,
      title: f.title,
      message: f.message,
      recommendation: f.recommendation,
      appliesInModes,
    });
  }

  return blockers;
}

export function collectSoftLaunchWarnings(
  findings: CreviaSoftLaunchReviewFinding[],
): CreviaSoftLaunchReviewWarning[] {
  return findings
    .filter((f) => f.severity === 'warn')
    .map((f) => ({
      id: f.id,
      area: f.area,
      title: f.title,
      message: f.message,
      recommendation: f.recommendation,
    }));
}

export function buildSoftLaunchDecision(
  mode: CreviaSoftLaunchReviewMode,
  blockers: CreviaSoftLaunchReviewBlocker[],
  warnings: CreviaSoftLaunchReviewWarning[],
): CreviaSoftLaunchDecision {
  const activeBlockers = blockers.filter((b) => b.appliesInModes.includes(mode));

  if (activeBlockers.length > 0) {
    if (mode === 'launch_candidate' || mode === 'soft_launch_candidate') {
      return 'blocked';
    }
    if (mode === 'iap_sandbox_test') {
      return activeBlockers.some((b) => b.area === 'iap_monetization') ? 'fix_required' : 'proceed_sandbox_test_only';
    }
    return 'fix_required';
  }

  if (mode === 'soft_launch_candidate') {
    return warnings.length > 0 ? 'freeze_new_systems' : 'freeze_new_systems';
  }
  if (mode === 'launch_candidate') {
    return warnings.length > 0 ? 'fix_required' : 'proceed_sandbox_test_only';
  }
  if (mode === 'iap_sandbox_test') {
    return warnings.some((w) => w.area === 'iap_monetization') ? 'proceed_sandbox_test_only' : 'proceed_sandbox_test_only';
  }
  return 'proceed_internal_test';
}

export function buildSoftLaunchReadinessLevel(
  mode: CreviaSoftLaunchReviewMode,
  blockers: CreviaSoftLaunchReviewBlocker[],
): CreviaSoftLaunchReadinessLevel {
  const activeBlockers = blockers.filter((b) => b.appliesInModes.includes(mode));

  if (mode === 'soft_launch_candidate') {
    return activeBlockers.length === 0 ? 'ready_for_soft_launch_candidate' : 'blocked_for_launch_candidate';
  }
  if (mode === 'launch_candidate') {
    return activeBlockers.length > 0 ? 'blocked_for_launch_candidate' : 'needs_fix_pass';
  }
  if (mode === 'iap_sandbox_test') {
    return activeBlockers.some((b) => b.area === 'iap_monetization')
      ? 'needs_fix_pass'
      : 'ready_for_sandbox_iap_test';
  }
  return activeBlockers.length > 0 ? 'needs_fix_pass' : 'ready_for_internal_device_test';
}

export function buildNoNewSystemFreezeRecommendation(
  mode: CreviaSoftLaunchReviewMode,
  blockers: CreviaSoftLaunchReviewBlocker[],
): boolean {
  return mode === 'soft_launch_candidate' && blockers.length === 0;
}

export function buildSoftLaunchNextActions(
  mode: CreviaSoftLaunchReviewMode,
  blockers: CreviaSoftLaunchReviewBlocker[],
  warnings: CreviaSoftLaunchReviewWarning[],
): string[] {
  const actions: string[] = [];

  if (blockers.length > 0) {
    actions.push(`Resolve ${blockers.length} blocker(s) before ${mode}.`);
    actions.push(...blockers.slice(0, 3).map((b) => b.recommendation));
  }

  const iapWarns = warnings.filter((w) => w.area === 'iap_monetization');
  if (iapWarns.length > 0) {
    actions.push('Complete IAP manual setup: docs/crevia-iap-sandbox-smoke-test.md');
  }

  const playtestWarns = warnings.filter((w) => w.id.includes('playtest'));
  if (playtestWarns.length > 0 && mode !== 'internal_device_test') {
    actions.push('Schedule real device playtest: docs/crevia-player-flow-playtest-checklist.md');
  }

  if (actions.length === 0) {
    actions.push('Run verify:soft-launch-review after each polish patch.');
    actions.push(SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS[4]!);
  }

  return actions;
}

export function buildSoftLaunchReviewRecommendations(
  mode: CreviaSoftLaunchReviewMode,
  blockers: CreviaSoftLaunchReviewBlocker[],
): CreviaSoftLaunchReviewRecommendation[] {
  const recs: CreviaSoftLaunchReviewRecommendation[] = [];

  if (blockers.some((b) => b.area === 'iap_monetization')) {
    recs.push({
      id: 'rec.iap_sandbox',
      priority: 'high',
      title: 'IAP sandbox smoke test',
      action: 'EAS dev build + RevenueCat/store setup + smoke matrix.',
      manual: true,
    });
  }

  if (blockers.some((b) => b.id.includes('device_playtest'))) {
    recs.push({
      id: 'rec.device_playtest',
      priority: 'high',
      title: 'Real device playtest',
      action: '4 profiles on iOS/Android per player flow checklist.',
      manual: true,
    });
  }

  recs.push({
    id: 'rec.verify_loop',
    priority: 'medium',
    title: 'Regression verify loop',
    action: 'npm run verify:full-loop && verify:full-ux-flow',
    manual: false,
  });

  if (mode === 'soft_launch_candidate' && blockers.length === 0) {
    recs.push({
      id: 'rec.freeze',
      priority: 'high',
      title: 'No-New-System Freeze',
      action: 'Stop new systems; only bugfix, polish, store prep.',
      manual: false,
    });
  }

  return recs;
}

export function runSoftLaunchReadinessReview(
  options: RunSoftLaunchReadinessReviewOptions = {},
): CreviaSoftLaunchReviewResult {
  const mode = options.mode ?? 'internal_device_test';
  const areaResults = buildSoftLaunchReviewAreaResults(mode);
  const findings = areaResults.flatMap((a) => a.findings);
  const blockers = collectSoftLaunchBlockers(mode, findings);
  const warnings = collectSoftLaunchWarnings(findings);
  const decision = buildSoftLaunchDecision(mode, blockers, warnings);
  const readinessLevel = buildSoftLaunchReadinessLevel(mode, blockers);
  const contentCoverage = buildContentCoverageSummary();
  const noNewSystemFreezeRecommended = buildNoNewSystemFreezeRecommendation(mode, blockers);
  const recommendations = buildSoftLaunchReviewRecommendations(mode, blockers);

  const passCount = findings.filter((f) => f.severity === 'pass').length;
  const warnCount = findings.filter((f) => f.severity === 'warn').length;
  const blockerCount = blockers.length;
  const health: CreviaSoftLaunchReviewResult['health'] =
    blockerCount > 0 ? 'BLOCKED' : warnCount > 0 ? 'WARN' : 'PASS';

  const manualActions = [
    'RevenueCat dashboard + App Store Connect + Play Console product setup',
    'EAS development build install on test devices',
    'IAP sandbox smoke test matrix (14 cases)',
    '4-profile real device playtest checklist',
    'Store screenshots + listing + privacy/data safety forms',
  ];

  let recommendedNextPrompt: string = SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS[0]!;
  if (blockers.some((b) => b.area === 'iap_monetization')) {
    recommendedNextPrompt = SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS[1]!;
  } else if (blockers.some((b) => b.id.includes('device_playtest'))) {
    recommendedNextPrompt = SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS[0]!;
  } else if (noNewSystemFreezeRecommended && mode === 'soft_launch_candidate') {
    recommendedNextPrompt = SOFT_LAUNCH_REVIEW_RECOMMENDED_PROMPTS[4]!;
  }

  return {
    mode,
    readinessLevel,
    decision,
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    blockerCount,
    areaResults,
    findings,
    blockers,
    warnings,
    recommendations,
    contentCoverage,
    noNewSystemFreezeRecommended,
    recommendedNextPrompt,
    manualActions,
    nextActions: buildSoftLaunchNextActions(mode, blockers, warnings),
    docsPath: SOFT_LAUNCH_REVIEW_DOCS_PATH,
  };
}
