import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateAnalyticsEventDefinitions } from '@/core/analytics/analyticsSchema';
import { runPostLaunchTelemetryReadinessAudit } from '@/core/analytics/postLaunchTelemetryReadinessAudit';
import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';
import { CRASH_PERFORMANCE_DOCS_PATH } from '@/core/crashPerformance/crashPerformanceConstants';
import { verifyAnalyticsNewSystemsScenario } from '@/core/analytics/verifyAnalyticsNewSystemsScenario';
import { buildEventResultSystemsEchoModel } from '@/core/events/eventResultNewSystemsPresentation';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import { containsForbiddenHubOpenEndedCopy } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { buildHubOpenEndedIntegrationModel } from '@/core/hub/hubOpenEndedIntegrationPresentation';
import { runIapSandboxReadinessAudit } from '@/core/iapQa/iapSandboxReadinessAudit';
import { verifyIapIntegrationScenario } from '@/core/iap/verifyIapIntegrationScenario';
import { buildIapOfferCopyModel } from '@/core/iap/iapOfferPresentation';
import { verifyFirstTenMinutesScenario } from '@/core/onboarding/verifyFirstTenMinutesScenario';
import {
  buildDayOneDropoffSoftLaunchFindings,
  runDayOneDropoffFixAudit,
} from '@/core/onboarding/dayOneDropoffFixAudit';
import { DAY_ONE_DROPOFF_FIX_DOCS_PATH } from '@/core/onboarding/dayOneDropoffFixConstants';
import {
  containsForbiddenSeasonEndCopy,
  buildPeriodicReviewCopy,
} from '@/core/openEndedProgression/openEndedProgressionPresentation';
import {
  buildIapSandboxSmokeExecutionResult,
} from '@/core/iapQa/iapSandboxSmokeExecutionAudit';
import { IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH } from '@/core/iapQa/iapSandboxSmokeExecutionConstants';
import { buildIapManualSetupTracker } from '@/core/iapQa/iapManualSetupTrackerAudit';
import { IAP_MANUAL_SETUP_TRACKER_DOCS_PATH } from '@/core/iapQa/iapManualSetupTrackerConstants';
import { runSecretHygieneScan } from '@/core/security/secretHygieneAudit';
import { SECRET_HYGIENE_DOCS_PATH } from '@/core/security/secretHygieneConstants';
import { buildSecretRotationClosureResult } from '@/core/security/secretRotationClosureAudit';
import { SECRET_ROTATION_CLOSURE_DOCS_PATH } from '@/core/security/secretRotationClosureConstants';

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
import { runContentPackRuntimeActivationReviewAudit } from '@/core/contentProduction/contentPackRuntimeActivationReviewAudit';
import { buildContentProductionAuditResult } from '@/core/contentProduction/contentProductionPresentation';
import { buildReportSystemsIntegrationModel } from '@/core/reports/reportSystemsIntegrationPresentation';
import { runQualityAudit } from '@/core/quality/qualityAuditPresentation';
import { runSelectorAudit } from '@/core/quality/performanceSelectors/selectorAuditEngine';
import { verifyPerformanceSelectorPassTwoScenario } from '@/core/quality/verifyPerformanceSelectorPassTwoScenario';
import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import {
  DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH,
  runDistrictOperationActionPersistenceReviewAudit,
} from '@/core/districtOperationActions/districtOperationActionPersistenceReviewAudit';
import {
  OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
  runOperationEraRuntimeExpansionReviewAudit,
} from '@/core/operationEra/operationEraRuntimeExpansionReviewAudit';
import {
  STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH,
  runStoryChainPersistentRuntimeReviewAudit,
} from '@/core/storyChains/storyChainPersistentRuntimeReviewAudit';
import { runIapConversionReadinessAudit } from '@/core/monetization/iapConversionReadinessAudit';
import { IAP_CONVERSION_READINESS_DOCS_PATH } from '@/core/monetization/iapConversionReadinessConstants';
import { buildIapConversionSoftLaunchFindings } from '@/core/monetization/iapConversionReadinessPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

import { runSoftLaunchReadinessAudit } from './softLaunchReadinessAudit';
import { runPrivacyPolicyReadinessAudit } from './privacyPolicyReadinessAudit';
import { runStoreMetadataFinalizationAudit } from './storeMetadataFinalizationAudit';
import { STORE_METADATA_FINALIZATION_DOCS_PATH } from './storeMetadataFinalizationConstants';
import { runStoreScreenshotReadinessAudit } from './storeScreenshotReadinessAudit';
import { STORE_SCREENSHOT_READINESS_DOCS_PATH } from './storeScreenshotReadinessConstants';
import {
  DATA_SAFETY_DRAFT_DOCS_PATH,
  PRIVACY_POLICY_DRAFT_DOCS_PATH,
} from './privacyPolicyReadinessConstants';
import { runStoreListingReadinessAudit } from './storeListingReadinessAudit';
import { STORE_LISTING_READINESS_DOCS_PATH } from './storeListingReadinessConstants';
import {
  isNoNewSystemFreezeActive,
  runNoNewSystemFreezeAudit,
} from './noNewSystemFreezeAudit';
import { NO_NEW_SYSTEM_FREEZE_DOCS_PATH } from './noNewSystemFreezeConstants';
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

  const day1Fix = runDayOneDropoffFixAudit();
  const d1 = buildDayOneDropoffSoftLaunchFindings(day1Fix);

  findings.push(
    makeFinding(
      'first_ten_minutes',
      'day1.dropoff_fix_pass_present',
      d1.dropoffFixPassPresent ? 'pass' : 'warn',
      'Day 1 drop-off fix pass present',
      DAY_ONE_DROPOFF_FIX_DOCS_PATH,
      'Run verify:day-one-dropoff-fix.',
    ),
    makeFinding(
      'first_ten_minutes',
      'day1.hub_density_guard_pass',
      d1.hubDensityGuardPass ? 'pass' : 'warn',
      d1.hubDensityGuardPass ? 'Day 1 hub density guard PASS' : 'Day 1 hub density guard needs review',
      `maxFeatured=${day1Fix.density.hubMaxFeaturedCards}`,
      'Suppress non-essential Hub cards on Day 1.',
    ),
    makeFinding(
      'first_ten_minutes',
      'day1.event_flow_cta_guard_pass',
      d1.eventFlowCtaGuardPass ? 'pass' : 'warn',
      d1.eventFlowCtaGuardPass ? 'Day 1 event flow CTA guard PASS' : 'Day 1 event CTA unclear',
      'Inspect/plan/dispatch/field CTAs must be explicit.',
      'Keep single primary CTA per event step.',
    ),
    makeFinding(
      'first_ten_minutes',
      'day1.report_density_guard_pass',
      d1.reportDensityGuardPass ? 'pass' : 'warn',
      d1.reportDensityGuardPass ? 'Day 1 report density guard PASS' : 'Day 1 report too dense',
      `reportSystemLines=${day1Fix.density.reportMaxSystemLines}`,
      'Report Day 1 learning mode — max 1 systems line.',
    ),
    makeFinding(
      'first_ten_minutes',
      'day1.forbidden_advanced_systems_hidden',
      d1.forbiddenAdvancedSystemsHidden ? 'pass' : 'blocker',
      d1.forbiddenAdvancedSystemsHidden
        ? 'Forbidden advanced systems hidden on Day 1'
        : 'Advanced systems visible on Day 1',
      `hidden=${day1Fix.density.advancedSystemsHidden.length}`,
      'Hide operation era, story chain, crisis desk on Day 1.',
    ),
    makeFinding(
      'first_ten_minutes',
      'day1.copy_guard_pass',
      d1.copyGuardPass ? 'pass' : 'blocker',
      d1.copyGuardPass ? 'Day 1 copy guard PASS' : 'Day 1 forbidden copy detected',
      d1.copyGuardPass
        ? `${day1Fix.copyGuard.scannedStringCount} strings clean`
        : day1Fix.copyGuard.violations.map((v) => v.term).join(', '),
      'Remove punitive/false-claim copy from Day 1.',
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
  const operationEraExpansion = runOperationEraRuntimeExpansionReviewAudit({ mode: 'review_only' });
  const oe = operationEraExpansion.softLaunchFindings;

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

  findings.push(
    makeFinding(
      'day8_open_ended_operation',
      'operation_era.expansion_review_present',
      oe.expansionReviewPresent ? 'pass' : 'warn',
      oe.expansionReviewPresent
        ? 'Operation era expansion review present'
        : 'Operation era expansion review missing',
      OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
      'Run verify:operation-era-runtime-expansion-review.',
    ),
    makeFinding(
      'day8_open_ended_operation',
      'operation_era.runtime_lite_current',
      oe.runtimeLiteCurrent ? 'pass' : 'blocker',
      oe.runtimeLiteCurrent
        ? 'Operation era runtime-lite preview current'
        : 'Operation era persist shape detected',
      operationEraExpansion.currentBehaviorSummary.slice(0, 120),
      'Keep runtime-lite preview during freeze; V1.1 telemetry decision.',
    ),
    makeFinding(
      'day8_open_ended_operation',
      'operation_era.expansion_not_required_for_soft_launch',
      oe.expansionNotRequiredForSoftLaunch ? 'pass' : 'warn',
      oe.expansionNotRequiredForSoftLaunch
        ? 'Operation era expansion not required for soft launch'
        : 'Operation era expansion unexpectedly required',
      'Presentation/context layer only; restart continuity acceptable.',
      OPERATION_ERA_RUNTIME_EXPANSION_REVIEW_DOCS_PATH,
    ),
    makeFinding(
      'day8_open_ended_operation',
      'operation_era.v11_expansion_backlog_defined',
      oe.v11ExpansionBacklogDefined ? 'pass' : 'warn',
      oe.v11ExpansionBacklogDefined
        ? 'Operation era V1.1 expansion backlog defined'
        : 'Operation era V1.1 expansion backlog incomplete',
      `${operationEraExpansion.v11Backlog.length} backlog items.`,
      'Evaluate Option B after telemetry.',
    ),
    makeFinding(
      'day8_open_ended_operation',
      'operation_era.save_version_unchanged',
      oe.saveVersionUnchanged ? 'pass' : 'blocker',
      oe.saveVersionUnchanged
        ? `SAVE_VERSION ${operationEraExpansion.saveImpact.currentSaveVersion} unchanged`
        : 'SAVE_VERSION changed during expansion review',
      `Expected ${operationEraExpansion.saveImpact.expectedSaveVersion}.`,
      'Separate migration patch if V1.1 persist approved.',
    ),
    makeFinding(
      'day8_open_ended_operation',
      'operation_era.runtime_activation_not_done',
      oe.runtimeActivationNotDone ? 'pass' : 'blocker',
      oe.runtimeActivationNotDone
        ? 'Operation era runtime activation not done'
        : 'Operation era runtime activation detected',
      'isRuntimeLinked false; event generation unchanged.',
      'Do not activate during freeze.',
    ),
  );

  return findings;
}

function auditAreaDistrictRuntime(): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const mapIntel = readRepo('src/core/map/mapDistrictIntelligencePresentation.ts');
  const actionPersistence = runDistrictOperationActionPersistenceReviewAudit({ mode: 'review_only' });
  const ap = actionPersistence.softLaunchFindings;
  const storyChainPersistence = runStoryChainPersistentRuntimeReviewAudit({ mode: 'review_only' });
  const sc = storyChainPersistence.softLaunchFindings;

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
    makeFinding(
      'district_runtime_systems',
      'district_action.persistence_review_present',
      ap.persistenceReviewPresent ? 'pass' : 'warn',
      ap.persistenceReviewPresent
        ? 'District action persistence review present'
        : 'District action persistence review missing',
      DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH,
      'Run verify:district-operation-action-persistence-review.',
    ),
    makeFinding(
      'district_runtime_systems',
      'district_action.session_only_current',
      ap.sessionOnlyCurrent ? 'pass' : 'blocker',
      ap.sessionOnlyCurrent
        ? 'District action state session-only'
        : 'District action state in persist shape',
      actionPersistence.currentBehaviorSummary.slice(0, 120),
      'Do not persist during freeze; V1.1 telemetry decision.',
    ),
    makeFinding(
      'district_runtime_systems',
      'district_action.persist_not_required_for_soft_launch',
      ap.persistNotRequiredForSoftLaunch ? 'pass' : 'warn',
      ap.persistNotRequiredForSoftLaunch
        ? 'Persist not required for soft launch'
        : 'Persist unexpectedly required',
      'Small-effect optional action; restart continuity acceptable.',
      DISTRICT_OPERATION_ACTION_PERSISTENCE_REVIEW_DOCS_PATH,
    ),
    makeFinding(
      'district_runtime_systems',
      'district_action.v11_persistence_backlog_defined',
      ap.v11PersistenceBacklogDefined ? 'pass' : 'warn',
      ap.v11PersistenceBacklogDefined
        ? 'V1.1 persistence backlog defined'
        : 'V1.1 persistence backlog incomplete',
      `${actionPersistence.v11Backlog.length} backlog items.`,
      'Evaluate Option B after telemetry.',
    ),
    makeFinding(
      'district_runtime_systems',
      'district_action.save_version_unchanged',
      ap.saveVersionUnchanged ? 'pass' : 'blocker',
      ap.saveVersionUnchanged
        ? `SAVE_VERSION ${actionPersistence.saveImpact.currentSaveVersion} unchanged`
        : 'SAVE_VERSION changed during persistence review',
      `Expected ${actionPersistence.saveImpact.expectedSaveVersion}.`,
      'Separate migration patch if V1.1 persist approved.',
    ),
    makeFinding(
      'district_runtime_systems',
      'story_chain.persistence_review_present',
      sc.persistenceReviewPresent ? 'pass' : 'warn',
      sc.persistenceReviewPresent
        ? 'Story chain persistence review present'
        : 'Story chain persistence review missing',
      STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH,
      'Run verify:story-chain-persistent-runtime-review.',
    ),
    makeFinding(
      'district_runtime_systems',
      'story_chain.presentation_only_current',
      sc.presentationOnlyCurrent ? 'pass' : 'blocker',
      sc.presentationOnlyCurrent
        ? 'Story chain hints presentation-only'
        : 'Story chain persist shape detected',
      storyChainPersistence.currentBehaviorSummary.slice(0, 120),
      'Keep derived hints during freeze; V1.1 telemetry decision.',
    ),
    makeFinding(
      'district_runtime_systems',
      'story_chain.persist_not_required_for_soft_launch',
      sc.persistNotRequiredForSoftLaunch ? 'pass' : 'warn',
      sc.persistNotRequiredForSoftLaunch
        ? 'Story chain persist not required for soft launch'
        : 'Story chain persist unexpectedly required',
      'Felt context only; restart continuity acceptable.',
      STORY_CHAIN_PERSISTENT_RUNTIME_REVIEW_DOCS_PATH,
    ),
    makeFinding(
      'district_runtime_systems',
      'story_chain.v11_persistence_backlog_defined',
      sc.v11PersistenceBacklogDefined ? 'pass' : 'warn',
      sc.v11PersistenceBacklogDefined
        ? 'Story chain V1.1 persistence backlog defined'
        : 'Story chain V1.1 persistence backlog incomplete',
      `${storyChainPersistence.v11Backlog.length} backlog items.`,
      'Evaluate Option B after telemetry.',
    ),
    makeFinding(
      'district_runtime_systems',
      'story_chain.save_version_unchanged',
      sc.saveVersionUnchanged ? 'pass' : 'blocker',
      sc.saveVersionUnchanged
        ? `SAVE_VERSION ${storyChainPersistence.saveImpact.currentSaveVersion} unchanged`
        : 'SAVE_VERSION changed during story chain persistence review',
      `Expected ${storyChainPersistence.saveImpact.expectedSaveVersion}.`,
      'Separate migration patch if V1.1 persist approved.',
    ),
    makeFinding(
      'district_runtime_systems',
      'story_chain.runtime_activation_not_done',
      sc.runtimeActivationNotDone ? 'pass' : 'blocker',
      sc.runtimeActivationNotDone
        ? 'Story chain runtime activation not done'
        : 'Story chain runtime activation detected',
      `isRuntimeLinked=${storyChainPersistence.isRuntimeLinked}`,
      'Full runtime engine deferred to V2 backlog.',
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

  const activationReview = runContentPackRuntimeActivationReviewAudit({ mode: 'review_only' });
  const af = {
    ...activationReview.softLaunchFindings,
    decision: activationReview.decision,
    totalFamilyCount: activationReview.totalFamilyCount,
    totalVariantCount: activationReview.totalVariantCount,
    v11BacklogLength: activationReview.v11Backlog.length,
  };

  findings.push(
    makeFinding(
      'content_coverage',
      'content.activation_review_present',
      af.activationReviewPresent ? 'pass' : 'warn',
      'Content pack activation review present',
      `Decision: ${af.decision}`,
      'Run verify:content-pack-runtime-activation-review.',
    ),
    makeFinding(
      'content_coverage',
      'content.runtime_activation_blocked_by_freeze',
      af.runtimeActivationBlockedByFreeze ? 'pass' : 'warn',
      'Runtime activation blocked by freeze',
      'Activation deferred to V1.1 backlog.',
      'No runtime activation during freeze.',
    ),
    makeFinding(
      'content_coverage',
      'content.pack_coverage_sufficient',
      af.packCoverageSufficient ? 'pass' : 'warn',
      'Pack coverage sufficient for soft launch',
      `Families: ${af.totalFamilyCount}, Variants: ${af.totalVariantCount}`,
      'Content volume meets Day 8+ threshold.',
    ),
    makeFinding(
      'content_coverage',
      'content.v11_backlog_defined',
      af.v11BacklogDefined ? 'pass' : 'warn',
      'V1.1 activation backlog defined',
      `${af.v11BacklogLength} backlog items.`,
      'Review V1.1 backlog after soft launch telemetry.',
    ),
    makeFinding(
      'content_coverage',
      'content.activation_not_required_for_soft_launch',
      af.activationNotRequiredForSoftLaunch ? 'pass' : 'warn',
      'Content activation not required for soft launch',
      'Soft launch uses existing event families without pack gating.',
      'Pack activation is a post-launch optimization.',
    ),
  );

  return findings;
}

function auditAreaAnalytics(mode: CreviaSoftLaunchReviewMode): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const analyticsSchemaAudit = validateAnalyticsEventDefinitions();
  const analyticsSchemaOk = analyticsSchemaAudit.failCount === 0;
  const newSystems = verifyAnalyticsNewSystemsScenario();
  const telemetryMode =
    mode === 'launch_candidate' || mode === 'soft_launch_candidate'
      ? mode
      : 'internal_device_test';
  const telemetry = runPostLaunchTelemetryReadinessAudit({ mode: telemetryMode });
  const tf = telemetry.softLaunchFindings;

  findings.push(
    makeFinding(
      'analytics',
      analyticsSchemaOk ? 'analytics.schema_pass' : 'analytics.schema_fail',
      analyticsSchemaOk ? 'pass' : 'blocker',
      'Analytics schema verify',
      analyticsSchemaOk
        ? 'Core analytics event definitions valid (schema-only; selector perf separate).'
        : `Analytics schema regression (${analyticsSchemaAudit.failCount} FAIL).`,
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

  findings.push(
    makeFinding(
      'analytics',
      'telemetry.post_launch_readiness_present',
      tf.postLaunchReadinessPresent ? 'pass' : 'warn',
      'Post-launch telemetry readiness pack present',
      `${telemetry.kpis.length} KPIs, ${telemetry.funnels.length} funnels, ${telemetry.dashboardCards.length} dashboard cards.`,
      'docs/crevia-post-launch-telemetry-readiness.md',
    ),
    makeFinding(
      'analytics',
      'telemetry.kpi_definitions_present',
      tf.kpiDefinitionsPresent ? 'pass' : mode === 'soft_launch_candidate' ? 'warn' : 'warn',
      tf.kpiDefinitionsPresent
        ? 'Telemetry KPI definitions present'
        : 'Telemetry KPI definitions incomplete',
      `${telemetry.kpiGroups.length} KPI groups documented.`,
      'Run verify:post-launch-telemetry-readiness.',
    ),
    makeFinding(
      'analytics',
      'telemetry.funnel_definitions_present',
      tf.funnelDefinitionsPresent ? 'pass' : 'warn',
      tf.funnelDefinitionsPresent
        ? 'Telemetry funnel definitions present'
        : 'Telemetry funnel definitions incomplete',
      `${telemetry.funnels.length} funnels mapped to schema events.`,
      'Complete funnel docs before soft launch review.',
    ),
    makeFinding(
      'analytics',
      'telemetry.dashboard_cards_present',
      tf.dashboardCardsPresent ? 'pass' : 'warn',
      tf.dashboardCardsPresent
        ? 'Telemetry dashboard card recommendations present'
        : 'Dashboard card recommendations incomplete',
      `${telemetry.dashboardCards.length} cards defined (SDK pending).`,
      'Dashboard cards are documentation-only until SDK connect.',
    ),
    makeFinding(
      'analytics',
      'telemetry.privacy_guard_pass',
      tf.privacyGuardPass ? 'pass' : 'blocker',
      tf.privacyGuardPass
        ? 'Telemetry privacy guard PASS'
        : 'Telemetry privacy guard FAIL',
      tf.privacyGuardPass
        ? 'No raw copy/PII in analytics payload schema.'
        : telemetry.privacyGuard.findings.join('; ') || 'Privacy alignment issue.',
      'Align analytics schema with privacy policy draft.',
    ),
    makeFinding(
      'analytics',
      'telemetry.dashboard_sdk_pending',
      'warn',
      'Telemetry dashboard SDK pending',
      'KPI/funnel/dashboard definitions ready; production SDK and charts not connected.',
      'WARN only — not a soft-launch code blocker.',
      false,
    ),
  );

  const crash = runCrashPerformanceAudit({
    mode:
      mode === 'launch_candidate' || mode === 'soft_launch_candidate'
        ? mode
        : 'internal_device_test',
  });

  findings.push(
    makeFinding(
      'analytics',
      'crash.code_integration_present',
      crash.codeIntegrationPass ? 'pass' : 'warn',
      crash.codeIntegrationPass
        ? 'Crash SDK code integration present (Sentry-first)'
        : 'Crash SDK code integration incomplete',
      `provider=${crash.selectedProvider}, mode=${crash.integrationMode}, release=${crash.releaseReadinessStatus}.`,
      CRASH_PERFORMANCE_DOCS_PATH,
    ),
    makeFinding(
      'analytics',
      'crash.dsn_or_enable_pending',
      crash.environmentConfigStatus === 'ready' ? 'pass' : 'warn',
      crash.environmentConfigStatus === 'ready'
        ? 'Crash SDK env configured'
        : 'Crash SDK DSN / enable flag pending',
      `environmentConfigStatus=${crash.environmentConfigStatus}`,
      'Set EXPO_PUBLIC_SENTRY_DSN and EXPO_PUBLIC_CRASH_REPORTING_ENABLED for internal EAS builds.',
      false,
    ),
    makeFinding(
      'analytics',
      'crash.smoke_test_pending',
      crash.smokeTestStatus === 'passed' ? 'pass' : 'warn',
      'Crash dashboard smoke test pending',
      'Manual real-device crash not verified in dashboard.',
      'Run dev crash test on internal build; confirm event in Sentry.',
      false,
    ),
    makeFinding(
      'analytics',
      'crash.source_maps_pending',
      crash.sourceMapStatus === 'configured' ? 'pass' : 'warn',
      crash.sourceMapStatus === 'configured'
        ? 'Sentry source maps configured'
        : 'Sentry source maps not fully configured',
      `sourceMapStatus=${crash.sourceMapStatus}`,
      'Add SENTRY_AUTH_TOKEN to EAS; see crash-performance docs.',
      false,
    ),
    makeFinding(
      'analytics',
      'crash.analytics_separation_pass',
      crash.analyticsSeparationPass ? 'pass' : 'blocker',
      crash.analyticsSeparationPass
        ? 'Crash layer separated from analytics tracker'
        : 'Crash layer coupled to analytics runtime',
      'Crash breadcrumbs must not mutate analytics schema or call trackAnalyticsEvent.',
      'Keep crashPerformance independent.',
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
      'Sandbox smoke readiness pending',
      `${sandbox.smokeTestPlan.cases.filter((c) => c.status === 'pending').length} readiness smoke cases.`,
      'Complete smoke matrix on EAS dev build.',
      false,
    ),
  );

  const smokeExecution = buildIapSandboxSmokeExecutionResult();
  if (existsSync(join(REPO_ROOT, IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.smoke_execution_plan',
        'pass',
        'IAP sandbox smoke execution plan',
        `${smokeExecution.plan.cases.length} execution cases; iOS/Android platform model.`,
        IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.smoke_execution_plan_missing',
        mode === 'launch_candidate' ? 'blocker' : 'warn',
        'IAP smoke execution docs missing',
        'Execution plan not documented.',
        IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH,
      ),
    );
  }

  if (smokeExecution.decision === 'failed_smoke_test') {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.smoke_execution_failed',
        'blocker',
        'IAP sandbox smoke execution failed',
        smokeExecution.blockers.map((b) => b.title).slice(0, 3).join('; '),
        'Fix failed cases and re-run on device.',
        false,
      ),
    );
  } else if (!smokeExecution.sandboxSmokePassed) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.smoke_execution_pending',
        mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
        'IAP sandbox smoke execution pending',
        `Decision: ${smokeExecution.decision}; manual results: ${smokeExecution.manualResultsPresent}.`,
        IAP_SANDBOX_SMOKE_EXECUTION_DOCS_PATH,
        false,
      ),
    );
  }

  if (smokeExecution.devMockOnlyPassed && !smokeExecution.manualResultsPresent) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.smoke_dev_mock_only',
        'warn',
        'Dev mock pass does not replace sandbox smoke',
        'Automated mock/disabled cases pass; real store sandbox not logged.',
        'Run EAS dev build sandbox matrix.',
      ),
    );
  }

  for (const pr of smokeExecution.platformResults) {
    if (pr.status !== 'passed') {
      findings.push(
        makeFinding(
          'iap_monetization',
          `iap.smoke_platform_${pr.platform}_pending`,
          mode === 'launch_candidate' ? 'blocker' : 'warn',
          `${pr.platform.toUpperCase()} sandbox smoke pending`,
          `pass=${pr.passedCount} pending=${pr.pendingCount} of ${pr.sandboxCaseCount}.`,
          `Complete ${pr.platform} device smoke tests.`,
          false,
        ),
      );
    }
  }

  const manualSetup = buildIapManualSetupTracker();

  if (existsSync(join(REPO_ROOT, IAP_MANUAL_SETUP_TRACKER_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.manual_setup_tracker_present',
        'pass',
        'IAP manual setup tracker present',
        `${manualSetup.items.length} items across ${manualSetup.areas.length} areas.`,
        IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
      ),
    );
  }

  if (!manualSetup.revenueCatKeysConfigured) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.revenuecat_keys_pending',
        mode === 'internal_device_test' ? 'warn' : 'blocker',
        'RevenueCat keys pending (tracker)',
        'Manual setup tracker: public SDK keys not configured.',
        'Create RC project and add appl_/goog_ keys to EAS secrets.',
        false,
      ),
    );
  }

  if (manualSetup.entitlementMappingPending) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.entitlement_mapping_pending',
        mode === 'iap_sandbox_test' || mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
        'Entitlement mapping pending (tracker)',
        'RevenueCat entitlement/offering not configured in dashboard.',
        IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
        false,
      ),
    );
  }

  if (manualSetup.storeProductsPending) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.store_products_pending',
        mode === 'iap_sandbox_test' || mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
        'Store products pending (tracker)',
        'App Store Connect / Play Console products not configured.',
        IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
        false,
      ),
    );
  }

  if (manualSetup.easSecretsPending) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.eas_secrets_pending',
        mode === 'iap_sandbox_test' || mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
        'EAS secrets pending (tracker)',
        'EXPO_PUBLIC_REVENUECAT_* not stored in EAS secrets.',
        IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
        false,
      ),
    );
  }

  if (manualSetup.sandboxTestersPending) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.sandbox_testers_pending',
        mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
        'Sandbox testers pending (tracker)',
        'iOS sandbox tester / Android license tester not configured.',
        IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
        false,
      ),
    );
  }

  if (manualSetup.allVerified) {
    findings.push(
      makeFinding(
        'iap_monetization',
        'iap.manual_setup_verified',
        'pass',
        'IAP manual setup all verified',
        'All manual setup items verified on device.',
        IAP_MANUAL_SETUP_TRACKER_DOCS_PATH,
      ),
    );
  }

  const conversionReadiness = runIapConversionReadinessAudit();
  const conversionSl = buildIapConversionSoftLaunchFindings(conversionReadiness);

  findings.push(
    makeFinding(
      'iap_monetization',
      'iap_conversion.readiness_pass_present',
      conversionSl.readinessPassPresent ? 'pass' : 'warn',
      conversionSl.readinessPassPresent
        ? 'IAP conversion readiness pass present'
        : 'IAP conversion readiness incomplete',
      `Health: ${conversionReadiness.health}, ${conversionReadiness.passCount} pass, ${conversionReadiness.warnCount} warn, ${conversionReadiness.failCount} fail.`,
      IAP_CONVERSION_READINESS_DOCS_PATH,
    ),
    makeFinding(
      'iap_monetization',
      'iap_conversion.offer_copy_guard_pass',
      conversionSl.offerCopyGuardPass ? 'pass' : 'warn',
      conversionSl.offerCopyGuardPass
        ? 'Offer copy guard PASS'
        : 'Offer copy guard needs review',
      'Paywall pressure and false claim scan.',
      IAP_CONVERSION_READINESS_DOCS_PATH,
    ),
    makeFinding(
      'iap_monetization',
      'iap_conversion.limited_mode_playable',
      conversionSl.limitedModePlayable ? 'pass' : 'warn',
      conversionSl.limitedModePlayable
        ? 'Limited mode playable'
        : 'Limited mode playability issue',
      'Day 8 limited access remains functional.',
      IAP_CONVERSION_READINESS_DOCS_PATH,
    ),
    makeFinding(
      'iap_monetization',
      'iap_conversion.restore_cta_present',
      conversionSl.restoreCtaPresent ? 'pass' : 'warn',
      conversionSl.restoreCtaPresent
        ? 'Restore CTA present'
        : 'Restore CTA missing',
      'Restore CTA visibility on offer screen.',
      IAP_CONVERSION_READINESS_DOCS_PATH,
    ),
    makeFinding(
      'iap_monetization',
      'iap_conversion.product_metadata_pending_safe',
      conversionSl.productMetadataPendingSafe ? 'pass' : 'warn',
      conversionSl.productMetadataPendingSafe
        ? 'Product metadata pending safe'
        : 'Product metadata pending unsafe',
      'No fake price shown when store product pending.',
      IAP_CONVERSION_READINESS_DOCS_PATH,
    ),
    makeFinding(
      'iap_monetization',
      'iap_conversion.paywall_pressure_guard_pass',
      conversionSl.paywallPressureGuardPass ? 'pass' : 'warn',
      conversionSl.paywallPressureGuardPass
        ? 'Paywall pressure guard PASS'
        : 'Paywall pressure guard needs review',
      'Offer copy scanned for pressure patterns.',
      IAP_CONVERSION_READINESS_DOCS_PATH,
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
      SAVE_VERSION === 24 ? 'save.version_stable' : 'save.version_changed',
      SAVE_VERSION === 24 ? 'pass' : 'blocker',
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

function storeListingSeverity(
  mode: CreviaSoftLaunchReviewMode,
  wouldBlock: boolean,
): CreviaSoftLaunchReviewSeverity {
  if (!wouldBlock) return 'pass';
  if (mode === 'launch_candidate') return 'blocker';
  return 'warn';
}

function auditAreaReleaseStore(mode: CreviaSoftLaunchReviewMode): CreviaSoftLaunchReviewFinding[] {
  const findings: CreviaSoftLaunchReviewFinding[] = [];
  const softLaunch = runSoftLaunchReadinessAudit({
    mode: mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'launch_candidate' : 'pre_sdk',
  });
  const storeListing = runStoreListingReadinessAudit({ mode });
  const privacyPolicy = runPrivacyPolicyReadinessAudit({ mode });

  const iconReady =
    existsSync(join(REPO_ROOT, 'assets/icon.png')) ||
    existsSync(join(REPO_ROOT, 'assets/images/icon.png'));

  if (existsSync(join(REPO_ROOT, STORE_LISTING_READINESS_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'store.listing_readiness_plan',
        'pass',
        'Store listing readiness pack',
        `${storeListing.checklist.length} checklist items; ${storeListing.screenshots.length} screenshots; privacy matrix.`,
        STORE_LISTING_READINESS_DOCS_PATH,
      ),
    );
  }

  findings.push(
    makeFinding(
      'release_store_readiness',
      iconReady ? 'store.icon_present' : 'store.icon_pending',
      iconReady ? 'pass' : 'warn',
      iconReady ? 'App icon asset present' : 'App icon review pending',
      'assets/images/icon.png',
      'Finalize store icon before submission.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      storeListing.copyForbiddenClaimsScanPassed
        ? 'store.listing_copy_scan_pass'
        : 'store.listing_copy_scan_fail',
      storeListing.copyForbiddenClaimsScanPassed ? 'pass' : 'blocker',
      storeListing.copyForbiddenClaimsScanPassed
        ? 'Store copy false-claim scan passed'
        : 'Store copy contains forbidden claim',
      'Draft TR/EN descriptions scanned.',
      'Remove GPS/official municipality/real-money claims.',
    ),
    makeFinding(
      'release_store_readiness',
      'store.listing_screenshots_pending',
      storeListingSeverity(mode, !storeListing.screenshotsComplete),
      'Store screenshots pending',
      `${storeListing.screenshots.filter((s) => s.status === 'pending').length}/${storeListing.screenshots.length} screens not captured.`,
      STORE_LISTING_READINESS_DOCS_PATH,
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.listing_metadata_pending',
      storeListingSeverity(mode, !storeListing.storeMetadataReady),
      'Store metadata draft / pending',
      'TR+EN drafts in repo; store console entry manual.',
      STORE_LISTING_READINESS_DOCS_PATH,
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.listing_privacy_policy_pending',
      storeListingSeverity(mode, storeListing.privacyPolicyUrlIsPlaceholder),
      storeListing.privacyPolicyUrlIsPlaceholder
        ? 'Privacy policy URL placeholder'
        : 'Privacy policy URL configured',
      storeListing.metadataDraft.privacyPolicyUrl,
      'Publish real privacy policy before launch_candidate.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.listing_iap_metadata_pending',
      'warn',
      'IAP store metadata placeholder',
      'Product ids and price tier pending in dashboards.',
      'docs/crevia-iap-sandbox-smoke-test.md',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      'store.listing_data_safety_pending',
      'warn',
      'Privacy / data safety forms pending',
      'Apple Privacy Nutrition + Play Data safety manual.',
      DATA_SAFETY_DRAFT_DOCS_PATH,
      false,
    ),
  );

  if (existsSync(join(REPO_ROOT, PRIVACY_POLICY_DRAFT_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.policy_draft_present',
        'pass',
        'Privacy policy draft present',
        `${privacyPolicy.sections.length} sections; TR+EN in ${PRIVACY_POLICY_DRAFT_DOCS_PATH}.`,
        'Legal review required before publication.',
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.policy_draft_missing',
        storeListingSeverity(mode, mode === 'soft_launch_candidate'),
        'Privacy policy draft missing',
        PRIVACY_POLICY_DRAFT_DOCS_PATH,
        'Create privacy policy draft before store submission.',
        false,
      ),
    );
  }

  if (privacyPolicy.publishedPrivacyUrlIsPlaceholder) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.published_url_placeholder',
        storeListingSeverity(mode, true),
        'Published privacy policy URL placeholder',
        privacyPolicy.publishedPrivacyUrlIsPlaceholder
          ? 'Real hosted URL required for launch.'
          : 'URL configured.',
        PRIVACY_POLICY_DRAFT_DOCS_PATH,
        false,
      ),
    );
  }

  if (!privacyPolicy.appStoreDraftComplete) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.app_store_answers_pending',
        mode === 'launch_candidate' ? 'blocker' : 'warn',
        'App Store privacy answers draft incomplete',
        'Manual confirmation items remain.',
        DATA_SAFETY_DRAFT_DOCS_PATH,
        false,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.app_store_answers_draft',
        'pass',
        'App Store privacy answer draft ready',
        `${privacyPolicy.appStoreAnswers.length} categories documented.`,
        DATA_SAFETY_DRAFT_DOCS_PATH,
      ),
    );
  }

  if (!privacyPolicy.googlePlayDraftComplete) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.google_play_safety_pending',
        mode === 'launch_candidate' ? 'blocker' : 'warn',
        'Google Play data safety draft incomplete',
        'Manual confirmation items remain.',
        DATA_SAFETY_DRAFT_DOCS_PATH,
        false,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.google_play_safety_draft',
        'pass',
        'Google Play data safety draft ready',
        `${privacyPolicy.googlePlayAnswers.length} data types documented.`,
        DATA_SAFETY_DRAFT_DOCS_PATH,
      ),
    );
  }

  if (privacyPolicy.thirdPartyConfirmationPending) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.third_party_sdk_pending',
        'warn',
        'Third-party SDK data confirmation pending',
        'RevenueCat, analytics, crash SDK behavior manual.',
        'docs/crevia-iap-sandbox-smoke-execution.md',
        false,
      ),
    );
  }

  if (privacyPolicy.legalReviewPending) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.legal_review_pending',
        'warn',
        'Legal review pending',
        'Draft is not legal advice; counsel review before publish.',
        PRIVACY_POLICY_DRAFT_DOCS_PATH,
        false,
      ),
    );
  }

  if (!privacyPolicy.riskyWordingScanPassed) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'privacy.risky_wording_fail',
        mode === 'launch_candidate' ? 'blocker' : 'warn',
        'Privacy copy risky wording detected',
        'Remove absolute no-data or compliance claims.',
        PRIVACY_POLICY_DRAFT_DOCS_PATH,
      ),
    );
  }

  const screenshotReadiness = runStoreScreenshotReadinessAudit({ mode });

  if (existsSync(join(REPO_ROOT, STORE_SCREENSHOT_READINESS_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'store.screenshot_capture_plan_present',
        'pass',
        'Screenshot capture plan present',
        `${screenshotReadiness.screenshotsTotal} screenshots; ${screenshotReadiness.deviceProfiles.length} device profiles.`,
        STORE_SCREENSHOT_READINESS_DOCS_PATH,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'store.screenshot_capture_plan_missing',
        storeListingSeverity(mode, mode === 'launch_candidate' || mode === 'soft_launch_candidate'),
        'Screenshot capture plan missing',
        STORE_SCREENSHOT_READINESS_DOCS_PATH,
        'Create screenshot capture plan docs.',
        false,
      ),
    );
  }

  findings.push(
    makeFinding(
      'release_store_readiness',
      'store.screenshots_pending',
      storeListingSeverity(mode, screenshotReadiness.screenshotsPending > 0),
      `Screenshots pending: ${screenshotReadiness.screenshotsPending}/${screenshotReadiness.screenshotsTotal}`,
      `${screenshotReadiness.screenshotsCaptured} captured, ${screenshotReadiness.screenshotsPending} pending.`,
      STORE_SCREENSHOT_READINESS_DOCS_PATH,
      false,
    ),
    makeFinding(
      'release_store_readiness',
      screenshotReadiness.copyGuard.passed
        ? 'store.screenshots_false_claim_scan_pass'
        : 'store.screenshots_false_claim_scan_fail',
      screenshotReadiness.copyGuard.passed ? 'pass' : 'blocker',
      screenshotReadiness.copyGuard.passed
        ? 'Screenshot false claim scan passed'
        : 'Screenshot false claim scan failed',
      screenshotReadiness.copyGuard.passed
        ? 'Overlay copy clean.'
        : `Violations: ${screenshotReadiness.copyGuard.violations.join(', ')}`,
      'Remove forbidden claims from screenshot overlay copy.',
    ),
    makeFinding(
      'release_store_readiness',
      'store.feature_graphic_pending',
      storeListingSeverity(mode, !screenshotReadiness.assets.some((a) => a.assetType.includes('feature graphic') && a.status === 'present')),
      'Feature graphic pending',
      'Play Store feature graphic (1024×500) not exported.',
      'Create feature graphic before store submission.',
      false,
    ),
    makeFinding(
      'release_store_readiness',
      iconReady ? 'store.icon_ready' : 'store.icon_not_ready',
      iconReady ? 'pass' : storeListingSeverity(mode, mode !== 'internal_device_test'),
      iconReady ? 'App icon ready' : 'App icon pending',
      iconReady ? 'assets/images/icon.png present.' : 'App icon asset not found.',
      'Finalize store icon before submission.',
      false,
    ),
  );

  const metaFinalization = runStoreMetadataFinalizationAudit({ mode });

  findings.push(
    makeFinding(
      'release_store_readiness',
      metaFinalization.metadataDraftPresent
        ? 'store.metadata_finalization_present'
        : 'store.metadata_finalization_missing',
      metaFinalization.metadataDraftPresent ? 'pass' : 'warn',
      metaFinalization.metadataDraftPresent
        ? 'Store metadata finalization draft present'
        : 'Metadata finalization draft missing',
      `TR+EN metadata, keywords, IAP draft in ${STORE_METADATA_FINALIZATION_DOCS_PATH}.`,
      STORE_METADATA_FINALIZATION_DOCS_PATH,
    ),
    makeFinding(
      'release_store_readiness',
      metaFinalization.riskScan.passed
        ? 'store.metadata_false_claim_scan_pass'
        : 'store.metadata_false_claim_scan_fail',
      metaFinalization.riskScan.passed ? 'pass' : 'blocker',
      metaFinalization.riskScan.passed
        ? 'Metadata false claim scan passed'
        : 'Metadata false claim scan failed',
      `${metaFinalization.riskScan.scannedTexts} texts scanned.`,
      'Remove false claims from metadata drafts.',
    ),
    makeFinding(
      'release_store_readiness',
      metaFinalization.iapMetadataDraftPresent
        ? 'store.iap_metadata_draft_present'
        : 'store.iap_metadata_draft_missing',
      metaFinalization.iapMetadataDraftPresent ? 'pass' : 'warn',
      metaFinalization.iapMetadataDraftPresent
        ? 'IAP metadata draft present'
        : 'IAP metadata draft missing',
      'Entitlement, offering, product type documented.',
      STORE_METADATA_FINALIZATION_DOCS_PATH,
    ),
    makeFinding(
      'release_store_readiness',
      metaFinalization.reviewNotesDraftPresent
        ? 'store.review_notes_draft_present'
        : 'store.review_notes_draft_missing',
      metaFinalization.reviewNotesDraftPresent ? 'pass' : 'warn',
      metaFinalization.reviewNotesDraftPresent
        ? 'App review notes draft present'
        : 'App review notes draft missing',
      'Day 8+ test instructions and sandbox placeholder.',
      STORE_METADATA_FINALIZATION_DOCS_PATH,
    ),
    makeFinding(
      'release_store_readiness',
      'store.metadata_manual_console_entry_pending',
      storeListingSeverity(mode, mode === 'launch_candidate' || mode === 'soft_launch_candidate'),
      'Store console metadata entry pending',
      'Metadata not entered in App Store Connect / Play Console.',
      STORE_METADATA_FINALIZATION_DOCS_PATH,
      false,
    ),
  );

  findings.push(
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

  const secretHygiene = runSecretHygieneScan();

  if (existsSync(join(REPO_ROOT, SECRET_HYGIENE_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.secret_hygiene_scan_present',
        'pass',
        'Secret hygiene scan present',
        `${secretHygiene.scannedFileCount} source + ${secretHygiene.scannedDocCount} doc files scanned.`,
        SECRET_HYGIENE_DOCS_PATH,
      ),
    );
  }

  if (secretHygiene.findings.some((f) => f.kind === 'revenuecat_secret_key')) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.secret_pattern_found',
        'blocker',
        'Secret key pattern found in repo',
        'Real secret key detected in source or docs.',
        'Remove and rotate key in provider dashboard.',
      ),
    );
  }

  if (secretHygiene.findings.some((f) => f.kind === 'docs_real_key_value')) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.docs_real_key_found',
        mode === 'internal_device_test' ? 'warn' : 'blocker',
        'Real API key value found in docs',
        'Public key value detected in documentation files.',
        'Replace with placeholder; keys belong in EAS secrets only.',
        false,
      ),
    );
  }

  if (secretHygiene.rotationPending) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.rotation_required',
        mode === 'launch_candidate' || mode === 'soft_launch_candidate' ? 'blocker' : 'warn',
        'Key rotation required',
        'Secret key was found; provider-side rotation pending.',
        'Rotate/revoke key in provider dashboard.',
        false,
      ),
    );
  }

  if (secretHygiene.currentTreeSanitized) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.current_tree_sanitized',
        'pass',
        'Current tree sanitized',
        'No secret patterns detected in working tree.',
        SECRET_HYGIENE_DOCS_PATH,
      ),
    );
  } else {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.current_tree_dirty',
        'blocker',
        'Current tree not sanitized',
        'Secret patterns detected — closure and sandbox blocked.',
        'Run verify:secret-hygiene and sanitize first.',
        false,
      ),
    );
  }

  const rotationClosure = buildSecretRotationClosureResult();

  if (existsSync(join(REPO_ROOT, SECRET_ROTATION_CLOSURE_DOCS_PATH))) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.secret_rotation_closure_present',
        'pass',
        'Secret rotation closure tracker present',
        `${rotationClosure.exposureCount} exposure record(s); closure can proceed: ${rotationClosure.closureCanProceed}.`,
        SECRET_ROTATION_CLOSURE_DOCS_PATH,
      ),
    );
  }

  if (
    rotationClosure.rotationRequired &&
    !rotationClosure.rotationVerifiedClosed
  ) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.rotation_required_pending',
        mode === 'internal_device_test' ? 'warn' : 'blocker',
        'Secret rotation closure pending',
        `${rotationClosure.pendingRotationCount} exposure(s) await provider rotate/revoke.`,
        SECRET_ROTATION_CLOSURE_DOCS_PATH,
        false,
      ),
    );
  }

  if (rotationClosure.blockers.some((b) => b.id === 'closure.rotation_evidence_missing')) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.rotation_evidence_missing',
        mode === 'soft_launch_candidate' || mode === 'launch_candidate' ? 'blocker' : 'warn',
        'Rotation evidence missing',
        'Exposure requires manual evidence before launch.',
        'Record evidence without raw key values.',
        false,
      ),
    );
  }

  if (rotationClosure.rotationVerifiedClosed && rotationClosure.closureCanProceed) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.rotation_verified_closed',
        'pass',
        'Secret rotation verified closed',
        'All required rotations closed or not required.',
        SECRET_ROTATION_CLOSURE_DOCS_PATH,
      ),
    );
  }

  if (
    mode === 'iap_sandbox_test' &&
    rotationClosure.rotationRequired &&
    !rotationClosure.rotationVerifiedClosed
  ) {
    findings.push(
      makeFinding(
        'release_store_readiness',
        'security.rotation_blocks_sandbox',
        'blocker',
        'Rotation pending blocks IAP sandbox test',
        'Complete rotation closure before sandbox execution.',
        SECRET_ROTATION_CLOSURE_DOCS_PATH,
        false,
      ),
    );
  }

  findings.push(...auditNoNewSystemFreezeFindings(mode));

  return findings;
}

export function auditNoNewSystemFreezeFindings(
  mode: CreviaSoftLaunchReviewMode,
): CreviaSoftLaunchReviewFinding[] {
  const freeze = runNoNewSystemFreezeAudit({ mode });
  const findings: CreviaSoftLaunchReviewFinding[] = [];

  const mapSeverity = (
    severity: 'pass' | 'warn' | 'blocker',
  ): CreviaSoftLaunchReviewSeverity => {
    if (severity === 'blocker') {
      if (mode === 'internal_device_test' || mode === 'iap_sandbox_test') {
        return 'warn';
      }
      return 'blocker';
    }
    return severity;
  };

  for (const f of freeze.findings) {
    if (!f.id.startsWith('freeze.')) continue;

    let severity = mapSeverity(f.severity);

    if (f.id === 'freeze.recommendation') {
      const freezeActive = isNoNewSystemFreezeActive(mode);
      if (mode === 'soft_launch_candidate' && !freezeActive) {
        severity = 'blocker';
      } else if (
        (mode === 'launch_candidate' || mode === 'soft_launch_candidate') &&
        !freezeActive &&
        f.severity !== 'blocker'
      ) {
        severity = 'warn';
      } else if (
        (mode === 'internal_device_test' || mode === 'iap_sandbox_test') &&
        freeze.freezeActive
      ) {
        severity = 'pass';
      }
    }

    findings.push(
      makeFinding(
        'release_store_readiness',
        f.id,
        severity,
        f.title,
        f.message,
        f.recommendation || NO_NEW_SYSTEM_FREEZE_DOCS_PATH,
        f.automatic,
      ),
    );
  }

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
    analytics: auditAreaAnalytics(mode),
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
    id.startsWith('iap.revenuecat_keys_pending') ||
    id.startsWith('iap.entitlement_mapping_pending') ||
    id.startsWith('iap.store_products_pending') ||
    id.startsWith('iap.eas_secrets_pending') ||
    id.startsWith('iap.sandbox_testers_pending') ||
    SOFT_LAUNCH_REVIEW_IAP_BLOCKER_IDS.some((b) => id.includes(b))
  );
}

function isPlaytestBlocker(id: string): boolean {
  return id.includes('device_playtest') || id.includes('manual_playtest');
}

function isStoreListingBlocker(id: string): boolean {
  return (
    id.startsWith('store.listing_') ||
    id.startsWith('store.metadata_') ||
    id.startsWith('store.screenshots_')
  );
}

function isPrivacyPolicyBlocker(id: string): boolean {
  return id.startsWith('privacy.');
}

export function collectSoftLaunchBlockers(
  mode: CreviaSoftLaunchReviewMode,
  findings: CreviaSoftLaunchReviewFinding[],
): CreviaSoftLaunchReviewBlocker[] {
  const blockers: CreviaSoftLaunchReviewBlocker[] = [];

  for (const f of findings.filter((x) => x.severity === 'blocker')) {
    if (
      mode === 'internal_device_test' &&
      (isIapStoreBlocker(f.id) ||
        isPlaytestBlocker(f.id) ||
        isStoreListingBlocker(f.id) ||
        isPrivacyPolicyBlocker(f.id))
    ) {
      continue;
    }
    if (
      mode === 'iap_sandbox_test' &&
      (isPlaytestBlocker(f.id) || isStoreListingBlocker(f.id) || isPrivacyPolicyBlocker(f.id))
    ) {
      continue;
    }
    if (mode === 'soft_launch_candidate' && isStoreListingBlocker(f.id)) {
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
  _blockers: CreviaSoftLaunchReviewBlocker[],
): boolean {
  return isNoNewSystemFreezeActive(mode) || runNoNewSystemFreezeAudit({ mode }).freezeActive;
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

  if (mode === 'soft_launch_candidate' || mode === 'launch_candidate') {
    recs.push({
      id: 'rec.freeze',
      priority: 'high',
      title: 'No-New-System Freeze',
      action: 'Fix-only mode: bugfix, polish, store prep only — manual blockers require freeze.',
      manual: false,
    });
  } else if (runNoNewSystemFreezeAudit({ mode }).freezeActive) {
    recs.push({
      id: 'rec.freeze',
      priority: 'medium',
      title: 'No-New-System Freeze recommended',
      action: 'Prepare for fix-only mode before launch candidate.',
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
    'Manual launch blocker tracker: docs/crevia-manual-launch-blocker-tracker.md',
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
