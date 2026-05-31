import { ANALYTICS_SCHEMA_VERSION } from './analyticsConstants';
import { ANALYTICS_FUNNEL_DEFINITIONS } from './analyticsFunnels';
import { ANALYTICS_EVENT_DEFINITIONS } from './analyticsSchema';
import type { AnalyticsAuditFinding, AnalyticsAuditResult } from './analyticsTypes';

export function formatAnalyticsFinding(finding: AnalyticsAuditFinding): string {
  const tag = finding.severity.toUpperCase();
  return `[${tag}] ${finding.message} → ${finding.recommendation}`;
}

export function buildAnalyticsSchemaConsoleReport(result: AnalyticsAuditResult): string {
  const lines: string[] = [
    '=== Crevia Analytics Schema Audit ===',
    `Health: ${result.health}`,
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Fail: ${result.failCount}`,
    `Schema version: ${ANALYTICS_SCHEMA_VERSION}`,
    `Events: ${ANALYTICS_EVENT_DEFINITIONS.length}`,
    `Funnels: ${ANALYTICS_FUNNEL_DEFINITIONS.length}`,
    '',
  ];

  const fails = result.findings.filter((f) => f.severity === 'fail');
  if (fails.length > 0) {
    lines.push('--- FAIL ---');
    for (const f of fails.slice(0, 15)) {
      lines.push(formatAnalyticsFinding(f));
    }
  }

  const warns = result.findings.filter((f) => f.severity === 'warn');
  if (warns.length > 0) {
    lines.push('--- WARN (sample) ---');
    for (const f of warns.slice(0, 8)) {
      lines.push(formatAnalyticsFinding(f));
    }
  }

  return lines.join('\n');
}

export function groupAnalyticsEventsByFunnel(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  for (const def of ANALYTICS_EVENT_DEFINITIONS) {
    for (const funnelId of def.funnelIds) {
      grouped[funnelId] ??= [];
      grouped[funnelId].push(def.name);
    }
  }
  return grouped;
}

export function buildAnalyticsEventTableMarkdown(): string {
  const lines = [
    '| Event | Surface | Funnels | Privacy |',
    '| --- | --- | --- | --- |',
  ];
  for (const def of ANALYTICS_EVENT_DEFINITIONS) {
    lines.push(
      `| \`${def.name}\` | ${def.surface} | ${def.funnelIds.join(', ')} | ${def.privacyLevel} |`,
    );
  }
  return lines.join('\n');
}

export function buildAnalyticsFunnelMarkdown(): string {
  const lines: string[] = [];
  for (const funnel of ANALYTICS_FUNNEL_DEFINITIONS) {
    lines.push(`### ${funnel.title} (\`${funnel.id}\`)`);
    lines.push('');
    lines.push(funnel.description);
    lines.push('');
    lines.push(`**Başarı olayı:** \`${funnel.successEvent}\``);
    lines.push('');
    lines.push('**Sıra:**');
    for (const event of funnel.orderedEvents) {
      lines.push(`1. \`${event}\``);
    }
    lines.push('');
    lines.push('**Drop-off riskleri:**');
    for (const risk of funnel.dropoffRisks) {
      lines.push(`- ${risk}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
