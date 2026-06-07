import { validateAnalyticsEventDefinitions } from '@/core/analytics/analyticsSchema';
import { runCrashPerformanceAudit } from '@/core/crashPerformance/crashPerformanceAudit';
import { runSelectorAudit } from '@/core/quality/performanceSelectors/selectorAuditEngine';
import { runNoNewSystemFreezeAudit } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import { runPrivacyPolicyReadinessAudit } from '@/core/releaseReadiness/privacyPolicyReadinessAudit';
import { runSoftLaunchReadinessReview } from '@/core/releaseReadiness/softLaunchReviewAudit';

export function isAnalyticsSchemaCodeHealthy(): boolean {
  return validateAnalyticsEventDefinitions().failCount === 0;
}

export function isAnalyticsSelectorPerfAcceptableForSoftLaunch(): {
  acceptable: boolean;
  health: string;
  isCodeRegression: boolean;
} {
  const audit = runSelectorAudit();
  if (audit.health === 'FAIL') {
    return { acceptable: false, health: audit.health, isCodeRegression: true };
  }
  return { acceptable: true, health: audit.health, isCodeRegression: false };
}

function isManualSoftLaunchBlockerFinding(finding: { id: string; area: string }): boolean {
  return (
    finding.area === 'iap_monetization' ||
    finding.area === 'release_store_readiness' ||
    finding.id.includes('privacy') ||
    finding.id.includes('playtest') ||
    finding.id.includes('sandbox') ||
    finding.id.includes('store') ||
    finding.id.includes('sentry') ||
    finding.id.includes('crash_env') ||
    finding.id.includes('crash_smoke') ||
    finding.id.includes('source_map') ||
    finding.id.startsWith('telemetry.dashboard')
  );
}

function classifySoftLaunchBlockerEntry(blocker: { id: string; title: string; area: string }): 'code' | 'manual' | 'stale' {
  if (isManualSoftLaunchBlockerFinding(blocker)) {
    return 'manual';
  }
  if (blocker.id === 'analytics.schema_fail' && isAnalyticsSchemaCodeHealthy()) {
    return 'stale';
  }
  if (blocker.id === 'iap.integration_fail' && isAnalyticsSchemaCodeHealthy()) {
    return 'stale';
  }
  return 'code';
}

export function summarizeSoftLaunchReviewCodeBlockers(mode: 'internal_device_test' | 'launch_candidate'): {
  codeBlockers: string[];
  manualBlockers: string[];
} {
  const reviewInternal = runSoftLaunchReadinessReview({ mode: 'internal_device_test' });
  const reviewLaunch = runSoftLaunchReadinessReview({ mode: 'launch_candidate' });
  const review = mode === 'launch_candidate' ? reviewLaunch : reviewInternal;
  const codeBlockers: string[] = [];
  const manualBlockers: string[] = [];
  const seenManual = new Set<string>();

  for (const blocker of review.blockers) {
    const kind = classifySoftLaunchBlockerEntry(blocker);
    if (kind === 'manual') {
      const key = `${blocker.id}: ${blocker.title}`;
      if (!seenManual.has(key)) {
        seenManual.add(key);
        manualBlockers.push(key);
      }
      continue;
    }
    if (kind === 'stale') {
      const key = `stale_expectation: ${blocker.id}`;
      if (!seenManual.has(key)) {
        seenManual.add(key);
        manualBlockers.push(key);
      }
      continue;
    }
    codeBlockers.push(`${blocker.id}: ${blocker.title}`);
  }

  for (const finding of reviewLaunch.findings.filter((f) => f.severity === 'blocker')) {
    if (!isManualSoftLaunchBlockerFinding(finding)) {
      continue;
    }
    const key = `${finding.id}: ${finding.title}`;
    if (!seenManual.has(key)) {
      seenManual.add(key);
      manualBlockers.push(key);
    }
  }

  return { codeBlockers, manualBlockers };
}

export function summarizeFreezeCompliance(): {
  freezeViolations: number;
  manualPending: number;
  codeExpansionBlockers: string[];
} {
  const audit = runNoNewSystemFreezeAudit({ mode: 'soft_launch_candidate' });
  return {
    freezeViolations: audit.violations.filter((v) => v.severity === 'blocker').length,
    manualPending: audit.manualBlockers.filter((b) => b.status === 'pending').length,
    codeExpansionBlockers: audit.violations
      .filter((v) => v.severity === 'blocker')
      .map((v) => v.id),
  };
}

export function summarizePrivacyReadiness(): {
  placeholderUrlBlocked: boolean;
  sentryProcessorListed: boolean;
  crashCollectedPending: boolean;
} {
  const audit = runPrivacyPolicyReadinessAudit({ mode: 'launch_candidate' });
  const sentry = audit.thirdPartyProcessors.find((p) => p.id === 'crash_reporting');
  const crash = audit.sections.find((s) => s.id === 'crash_logging_data');
  return {
    placeholderUrlBlocked: audit.publishedPrivacyUrlIsPlaceholder,
    sentryProcessorListed: sentry?.name.toLowerCase().includes('sentry') ?? false,
    crashCollectedPending: crash?.summaryEn.toLowerCase().includes('pending') ?? true,
  };
}

export function summarizeCrashSdkStatus(): {
  codeIntegrationPass: boolean;
  envPending: boolean;
  smokePending: boolean;
} {
  const audit = runCrashPerformanceAudit({ mode: 'soft_launch_candidate' });
  return {
    codeIntegrationPass: audit.codeIntegrationPass,
    envPending: audit.environmentConfigStatus !== 'ready',
    smokePending: audit.smokeTestStatus !== 'passed',
  };
}
