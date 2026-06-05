import { SOFT_LAUNCH_REVIEW_AREA_LABELS } from './softLaunchReviewConstants';
import type {
  CreviaSoftLaunchReviewBlocker,
  CreviaSoftLaunchReviewResult,
  CreviaSoftLaunchReviewWarning,
} from './softLaunchReviewTypes';

export function buildSoftLaunchReviewChecklist(result: CreviaSoftLaunchReviewResult): string[] {
  return result.areaResults.map(
    (area) =>
      `[${area.health}] ${area.label} — ${area.summary}`,
  );
}

export function buildSoftLaunchBlockerTable(blockers: CreviaSoftLaunchReviewBlocker[]): string {
  if (blockers.length === 0) return '_No blockers._\n';
  const rows = blockers.map(
    (b) => `| ${b.area} | ${b.title} | ${b.message.slice(0, 80)} | ${b.recommendation.slice(0, 60)} |`,
  );
  return `| Area | Blocker | Message | Next step |\n|------|---------|---------|----------|\n${rows.join('\n')}\n`;
}

export function buildSoftLaunchWarningTable(warnings: CreviaSoftLaunchReviewWarning[]): string {
  if (warnings.length === 0) return '_No warnings._\n';
  const rows = warnings.slice(0, 20).map(
    (w) => `| ${SOFT_LAUNCH_REVIEW_AREA_LABELS[w.area]} | ${w.title} | ${w.message.slice(0, 70)} |`,
  );
  return `| Area | Warning | Detail |\n|------|---------|--------|\n${rows.join('\n')}\n`;
}

export function buildSoftLaunchReviewNextStepTable(result: CreviaSoftLaunchReviewResult): string {
  const rows = [
    ...result.nextActions.map((a, i) => `| ${i + 1} | Auto | ${a} |`),
    ...result.manualActions.map((a, i) => `| ${result.nextActions.length + i + 1} | Manual | ${a} |`),
  ];
  return `| # | Type | Action |\n|---|------|--------|\n${rows.join('\n')}\n`;
}

export function buildSoftLaunchReviewConsoleSummary(
  result: CreviaSoftLaunchReviewResult,
): string {
  const lines: string[] = [
    '=== Crevia Soft Launch Readiness Review ===',
    `Mode: ${result.mode}`,
    `Decision: ${result.decision}`,
    `Readiness level: ${result.readinessLevel}`,
    `Health: ${result.health}`,
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Blocker: ${result.blockerCount}`,
    `Content: ${result.contentCoverage.totalFamilies} families, ${result.contentCoverage.totalVariants} variants, ${result.contentCoverage.packCount} packs`,
    `No-New-System Freeze recommended: ${result.noNewSystemFreezeRecommended ? 'YES' : 'NO'}`,
    '',
    '--- Area summary ---',
  ];

  for (const area of result.areaResults) {
    lines.push(`  ${area.label}: ${area.health} (${area.passCount}p/${area.warnCount}w/${area.blockerCount}b)`);
  }

  if (result.blockers.length > 0) {
    lines.push('', '--- Blockers ---');
    for (const b of result.blockers.slice(0, 8)) {
      lines.push(`  [BLOCKER] ${b.title} — ${b.message.slice(0, 100)}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('', '--- Top warnings ---');
    for (const w of result.warnings.slice(0, 8)) {
      lines.push(`  [WARN] ${w.title} — ${w.message.slice(0, 100)}`);
    }
  }

  lines.push('', '--- Next actions ---');
  for (const action of result.nextActions.slice(0, 6)) {
    lines.push(`  • ${action}`);
  }

  lines.push('', `Recommended prompt: ${result.recommendedNextPrompt}`);

  return lines.join('\n');
}

export function buildSoftLaunchReviewMarkdown(
  result: CreviaSoftLaunchReviewResult,
): string {
  return [
    '# Crevia Soft Launch Readiness Review',
    '',
    `**Mode:** ${result.mode}`,
    `**Decision:** ${result.decision}`,
    `**Readiness level:** ${result.readinessLevel}`,
    `**Health:** ${result.health}`,
    '',
    '## Snapshot',
    '',
    `- Pass: ${result.passCount} | Warn: ${result.warnCount} | Blocker: ${result.blockerCount}`,
    `- Content families: ${result.contentCoverage.totalFamilies} (min 80+)`,
    `- Content variants: ${result.contentCoverage.totalVariants} (min 300+)`,
    `- Packs: ${result.contentCoverage.packIds.join(', ')}`,
    `- No-New-System Freeze: ${result.noNewSystemFreezeRecommended ? '**Recommended**' : 'Not yet'}`,
    '',
    '## Blockers',
    '',
    buildSoftLaunchBlockerTable(result.blockers),
    '',
    '## Warnings',
    '',
    buildSoftLaunchWarningTable(result.warnings),
    '',
    '## Next actions',
    '',
    buildSoftLaunchReviewNextStepTable(result),
    '',
    '## Area checklist',
    '',
    ...buildSoftLaunchReviewChecklist(result).map((line) => `- ${line}`),
    '',
    `## Recommended next prompt`,
    '',
    result.recommendedNextPrompt,
    '',
  ].join('\n');
}
