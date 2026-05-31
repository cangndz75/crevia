import {
  SOFT_LAUNCH_AREA_LABELS,
  SOFT_LAUNCH_READINESS_AREAS,
} from './softLaunchReadinessConstants';
import type {
  SoftLaunchReadinessAuditResult,
  SoftLaunchReadinessFinding,
  SoftLaunchReleaseDecision,
} from './softLaunchReadinessTypes';

export function formatSoftLaunchFinding(finding: SoftLaunchReadinessFinding): string {
  const tag = finding.severity.toUpperCase();
  return `[${tag}] ${finding.title}: ${finding.message}`;
}

export function groupSoftLaunchFindingsByArea(
  result: SoftLaunchReadinessAuditResult,
): Map<string, SoftLaunchReadinessFinding[]> {
  const grouped = new Map<string, SoftLaunchReadinessFinding[]>();
  for (const area of SOFT_LAUNCH_READINESS_AREAS) {
    grouped.set(area, []);
  }
  for (const finding of result.findings) {
    const list = grouped.get(finding.area) ?? [];
    list.push(finding);
    grouped.set(finding.area, list);
  }
  return grouped;
}

export function getSoftLaunchReleaseDecision(
  result: SoftLaunchReadinessAuditResult,
): SoftLaunchReleaseDecision {
  if (result.health === 'BLOCKED' || result.blockerCount > 0) {
    return 'Blocked';
  }
  if (result.health === 'FAIL') {
    return 'Needs Manual Playtest';
  }

  const sdkReady = !result.findings.some(
    (f) =>
      f.id === 'monetization_iap.iap_sdk_pending' ||
      f.id === 'monetization_iap.iap_sdk_missing_launch',
  );
  const instrumentationReady = !result.findings.some(
    (f) =>
      f.id === 'analytics.instrumentation_pending' ||
      f.id === 'analytics.instrumentation_launch',
  );
  const playtestReady = !result.findings.some(
    (f) =>
      f.id === 'qa_playtest.manual_playtest_pending' ||
      f.id === 'qa_playtest.manual_playtest_launch',
  );

  if (
    sdkReady &&
    instrumentationReady &&
    playtestReady &&
    result.health === 'PASS' &&
    result.warnCount === 0
  ) {
    return 'Ready for Soft Launch Candidate';
  }

  if (result.blockerCount === 0 && result.failCount === 0) {
    return 'Ready for SDK Integration';
  }

  return 'Needs Manual Playtest';
}

export function getNextRecommendedPatch(result: SoftLaunchReadinessAuditResult): string {
  if (result.health === 'BLOCKED' || result.blockerCount > 0) {
    return 'Release blocker patch — typecheck, full-loop, privacy veya dev tool sızıntısını gider.';
  }
  if (result.failCount > 0) {
    return 'Regression fix patch — başarısız verify scriptlerini düzelt.';
  }
  if (result.findings.some((f) => f.id.includes('manual_playtest'))) {
    return 'Manual playtest patch — docs/crevia-player-flow-playtest-checklist.md ile 4 profil + gerçek cihaz testi.';
  }
  if (
    result.findings.some((f) => f.id === 'monetization_iap.iap_sdk_pending') &&
    result.auditMode === 'pre_sdk'
  ) {
    return 'Real IAP Integration (Aşama 2) — IapAdapter implementasyonu, store product ID ve RevenueCat/Billing bağlantısı.';
  }
  if (result.findings.some((f) => f.id.includes('analytics_instrumentation'))) {
    return 'Analytics instrumentation patch — trackAnalyticsEvent UI bağlantıları ve dashboard.';
  }
  if (result.findings.some((f) => f.id.includes('performance_selector'))) {
    return 'Performance selector refactor — Hub kartlarında dar selector / useShallow.';
  }
  return 'Real IAP Integration (Aşama 2) veya manual playtest tamamlama.';
}

export function buildSoftLaunchNextSteps(result: SoftLaunchReadinessAuditResult): string[] {
  const steps: string[] = [];
  if (result.releaseDecision === 'Blocked') {
    steps.push('Blocker bulgularını gider ve verify paketini yeniden çalıştır.');
    return steps;
  }
  if (result.findings.some((f) => f.id === 'monetization_iap.iap_sdk_pending')) {
    steps.push('Real IAP SDK entegrasyonu (Aşama 2) — IapAdapter + store ürünleri.');
  }
  if (result.findings.some((f) => f.id === 'analytics.instrumentation_pending')) {
    steps.push('Runtime analytics instrumentation — post-pilot funnel ve purchase eventleri.');
  }
  if (result.findings.some((f) => f.id.includes('manual_playtest'))) {
    steps.push('Manuel playtest — 4 profil, gerçek cihaz, checklist logla.');
  }
  if (result.findings.some((f) => f.id.includes('performance_selector'))) {
    steps.push('Düşük cihazda Hub/Report performans testi; dar selector refactor planla.');
  }
  if (result.findings.some((f) => f.id.includes('store_product'))) {
    steps.push('App Store Connect / Play Console product ID oluştur.');
  }
  if (steps.length === 0) {
    steps.push('Soft-launch candidate build için launch_candidate modunda audit yeniden çalıştır.');
  }
  return steps;
}

export function buildSoftLaunchReadinessConsoleReport(
  result: SoftLaunchReadinessAuditResult,
): string {
  const lines: string[] = [];
  lines.push('=== Crevia Soft Launch Readiness Audit ===');
  lines.push(`Health: ${result.health}`);
  lines.push(`Mode: ${result.auditMode}`);
  lines.push(
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Fail: ${result.failCount} | Blocker: ${result.blockerCount}`,
  );
  lines.push(`Release decision: ${result.releaseDecision}`);
  lines.push(`Next patch: ${result.nextRecommendedPatch}`);
  lines.push('');
  lines.push('--- Area summary ---');
  for (const summary of result.areaSummaries) {
    const label = SOFT_LAUNCH_AREA_LABELS[summary.area];
    lines.push(
      `  ${label}: ${summary.status} (${summary.summary})`,
    );
  }
  lines.push('');
  lines.push('--- Top WARN / BLOCKER ---');
  const top = result.findings
    .filter((f) => f.severity === 'warn' || f.severity === 'blocker' || f.severity === 'fail')
    .slice(0, 10);
  if (top.length === 0) {
    lines.push('  (none)');
  } else {
    for (const f of top) {
      lines.push(`  [${f.severity.toUpperCase()}] ${f.title} — ${f.message}`);
    }
  }
  lines.push('');
  lines.push('--- Next steps ---');
  for (const step of buildSoftLaunchNextSteps(result)) {
    lines.push(`  • ${step}`);
  }
  return lines.join('\n');
}

export function buildSoftLaunchReadinessMarkdown(
  result: SoftLaunchReadinessAuditResult,
): string {
  const lines: string[] = [];
  lines.push('# Soft Launch Readiness — Generated Report');
  lines.push('');
  lines.push(`- **Health:** ${result.health}`);
  lines.push(`- **Decision:** ${result.releaseDecision}`);
  lines.push(`- **Pass / Warn / Fail / Blocker:** ${result.passCount} / ${result.warnCount} / ${result.failCount} / ${result.blockerCount}`);
  lines.push('');
  lines.push('## Area summaries');
  lines.push('');
  lines.push('| Area | Status | Summary |');
  lines.push('| --- | --- | --- |');
  for (const s of result.areaSummaries) {
    lines.push(
      `| ${SOFT_LAUNCH_AREA_LABELS[s.area]} | ${s.status} | ${s.summary} |`,
    );
  }
  lines.push('');
  lines.push('## Findings');
  lines.push('');
  const grouped = groupSoftLaunchFindingsByArea(result);
  for (const [area, items] of grouped) {
    if (items.length === 0) continue;
    lines.push(`### ${SOFT_LAUNCH_AREA_LABELS[area as keyof typeof SOFT_LAUNCH_AREA_LABELS]}`);
    for (const f of items) {
      lines.push(`- **${f.severity}** ${f.title}: ${f.message}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
