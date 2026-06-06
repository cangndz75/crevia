import {
  POST_LAUNCH_TELEMETRY_KPI_GROUP_LABELS,
} from './postLaunchTelemetryReadinessConstants';
import type { CreviaPostLaunchTelemetryReadinessResult } from './postLaunchTelemetryReadinessTypes';

export function buildTelemetryKpiTable(result: CreviaPostLaunchTelemetryReadinessResult): string {
  const rows = result.kpis.map((kpi) => {
    const group = POST_LAUNCH_TELEMETRY_KPI_GROUP_LABELS[kpi.groupId];
    return `| ${group} | ${kpi.label} | ${kpi.sourceEvent} | ${kpi.segmentNote ?? '—'} | ${kpi.optional ? 'optional' : 'core'} |`;
  });
  return [
    '| Group | KPI | Source event | Segment | Priority |',
    '|-------|-----|--------------|---------|----------|',
    ...rows,
  ].join('\n');
}

export function buildTelemetryFunnelTable(
  result: CreviaPostLaunchTelemetryReadinessResult,
): string {
  const rows = result.funnels.map((funnel) => {
    const steps = funnel.orderedSteps.map((s) => s.label).join(' → ');
    return `| ${funnel.title} | ${steps} | ${funnel.successEvent} |`;
  });
  return [
    '| Funnel | Steps | Success event |',
    '|--------|-------|---------------|',
    ...rows,
  ].join('\n');
}

export function buildTelemetryDashboardChecklist(
  result: CreviaPostLaunchTelemetryReadinessResult,
): string {
  const rows = result.dashboardCards.map((card) => {
    return `| ${card.title} | ${card.status} | ${card.owner} | ${card.recommendedChartType} | ${card.questionAnswered.slice(0, 60)}… |`;
  });
  return [
    '| Card | Status | Owner | Chart | Question |',
    '|------|--------|-------|-------|----------|',
    ...rows,
  ].join('\n');
}

export function buildTelemetryReviewQuestionList(
  result: CreviaPostLaunchTelemetryReadinessResult,
): string {
  return result.reviewQuestions
    .map((q, i) => `${i + 1}. **${q.question}** — _${q.dataSource}_ (${q.owner})`)
    .join('\n');
}

export function buildTelemetryCoverageGapTable(
  result: CreviaPostLaunchTelemetryReadinessResult,
): string {
  const gaps = result.eventCoverage.filter(
    (r) => !r.existsInSchema || !r.payloadPrivacySafe || !r.payloadHasDay,
  );
  if (gaps.length === 0) {
    return '_No coverage gaps — all required events in schema with day + privacy-safe payloads._';
  }
  const rows = gaps.map((r) => {
    return `| ${r.requiredEventName} | ${r.existsInSchema ? 'yes' : 'no'} | ${r.payloadHasDay ? 'yes' : 'no'} | ${r.payloadPrivacySafe ? 'yes' : 'no'} | ${r.missingReason ?? '—'} | ${r.recommendedAction} |`;
  });
  return [
    '| Event | In schema | Has day | Privacy safe | Gap | Action |',
    '|-------|-----------|---------|--------------|-----|--------|',
    ...rows,
  ].join('\n');
}

export function buildPostLaunchTelemetryConsoleSummary(
  result: CreviaPostLaunchTelemetryReadinessResult,
): string {
  const lines = [
    '=== Crevia Post-Launch Telemetry Readiness ===',
    `Health: ${result.health}`,
    `KPI groups: ${result.kpiGroups.length}`,
    `KPIs: ${result.kpis.length}`,
    `Funnels: ${result.funnels.length}`,
    `Dashboard cards: ${result.dashboardCards.length}`,
    `Review questions: ${result.reviewQuestions.length}`,
    `Alert thresholds: ${result.alertThresholds.length}`,
    '',
    '--- Event coverage ---',
    `Required events: ${result.coverageSummary.totalRequiredEvents}`,
    `In schema: ${result.coverageSummary.eventsInSchema}`,
    `Missing: ${result.coverageSummary.eventsMissing}`,
    `Partial: ${result.coverageSummary.eventsPartial}`,
    '',
    '--- Privacy guard ---',
    `Passed: ${result.privacyGuard.passed}`,
    `Purchase aligned: ${result.privacyGuard.purchasePayloadAligned}`,
    `Dashboard SDK pending: ${result.softLaunchFindings.dashboardSdkPending}`,
    '',
  ];

  if (result.blockers.length > 0) {
    lines.push('--- Blockers ---');
    for (const b of result.blockers.slice(0, 5)) {
      lines.push(`  [BLOCKER] ${b.title}`);
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('--- Warnings ---');
    for (const w of result.warnings.slice(0, 6)) {
      lines.push(`  [WARN] ${w.title}`);
    }
  }

  return lines.join('\n');
}

export function buildPostLaunchTelemetryReadinessMarkdown(
  result: CreviaPostLaunchTelemetryReadinessResult,
): string {
  const thresholdRows = result.alertThresholds.map(
    (t) =>
      `| ${t.metricLabel} | ${t.condition} ${t.thresholdValue} | ${t.severity} | ${t.recommendedAction} |`,
  );

  return [
    '# Crevia Post-Launch Telemetry Readiness',
    '',
    '## Amaç',
    '',
    'Soft launch sonrası ürün metriklerini **mevcut analytics schema ve new-systems event\'leri** üzerinden okuyabilmek için KPI, funnel, dashboard kart önerileri, alert eşikleri ve post-launch review sorularını tanımlar. Bu paket gerçek analytics SDK veya dashboard entegrasyonu yapmaz; yeni analytics event eklemez. No-New-System Freeze kapsamında yalnızca readiness, documentation, verify ve reporting sağlar.',
    '',
    `**Health:** ${result.health}`,
    `**Docs:** ${result.docsPath}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| KPI groups | ${result.kpiGroups.length} |`,
    `| KPI definitions | ${result.kpis.length} |`,
    `| Funnel definitions | ${result.funnels.length} |`,
    `| Dashboard cards | ${result.dashboardCards.length} |`,
    `| Review questions | ${result.reviewQuestions.length} |`,
    `| Events in schema | ${result.coverageSummary.eventsInSchema}/${result.coverageSummary.totalRequiredEvents} |`,
    `| Privacy guard | ${result.privacyGuard.passed ? 'PASS' : 'FAIL'} |`,
    '',
    '## KPI list',
    '',
    buildTelemetryKpiTable(result),
    '',
    '## Funnel definitions',
    '',
    buildTelemetryFunnelTable(result),
    '',
    '## Dashboard cards',
    '',
    buildTelemetryDashboardChecklist(result),
    '',
    '## Alert thresholds',
    '',
    '_Review thresholds — not hard-coded business truth._',
    '',
    '| Metric | Threshold | Severity | Action |',
    '|--------|-----------|----------|--------|',
    ...thresholdRows,
    '',
    '## Post-launch review questions',
    '',
    buildTelemetryReviewQuestionList(result),
    '',
    '## Event coverage gaps',
    '',
    buildTelemetryCoverageGapTable(result),
    '',
    '## Privacy guard',
    '',
    `- Raw copy blocked: ${result.privacyGuard.rawCopyBlocked}`,
    `- Save dump blocked: ${result.privacyGuard.saveDumpBlocked}`,
    `- Precise location blocked: ${result.privacyGuard.preciseLocationBlocked}`,
    `- Device ID policy aligned: ${result.privacyGuard.deviceIdPolicyAligned}`,
    `- Purchase payload aligned: ${result.privacyGuard.purchasePayloadAligned}`,
    `- Dashboard needs PII: no`,
    '',
    '## What is missing before real analytics dashboard?',
    '',
    '- Production analytics SDK (Firebase/Amplitude/etc.) not connected',
    '- Dashboard workspace and chart builds',
    '- Platform/screen-size segmentation',
    '- Crash SDK integration',
    '- Purchase cancel event (store-native; schema gap — manual proxy)',
    '- Story chain hint + district action selection events (optional backlog)',
    '',
    '## Soft launch first 7 days review plan',
    '',
    '1. **Day 0–1:** First session + Day 1 funnel — `verify:post-launch-telemetry-readiness` + manual playtest cross-check',
    '2. **Day 2:** Day 2 transition rate vs Day 1 completion',
    '3. **Day 3:** Pilot pacing — Day 3 reach threshold review',
    '4. **Day 4–5:** Map/report engagement cards',
    '5. **Day 6:** IAP offer view (if pilot nearing completion on test cohort)',
    '6. **Day 7:** Pilot completion funnel + smoke status',
    '7. **Day 8+:** Open-ended engagement funnel when cohort reaches Day 8',
    '',
  ].join('\n');
}
