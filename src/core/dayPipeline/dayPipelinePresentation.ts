import type {
  DayPipelineAuditResult,
  DayPipelinePhase,
  DayPipelineStepResult,
} from './dayPipelineTypes';
import { END_OF_DAY_PIPELINE_STEP_DEFINITIONS } from './dayPipelineConstants';

export function buildDayPipelineAuditConsoleReport(
  result: DayPipelineAuditResult,
): string {
  const lines: string[] = [
    `Day pipeline audit — day ${result.day} — ${result.accessMode} — ${result.health}`,
    `Steps checked: ${result.checkedStepCount} | eligible: ${result.processedStepCount} | skipped: ${result.skippedStepCount}`,
    `Findings: ${result.failCount} FAIL, ${result.warnCount} WARN`,
    '',
  ];
  for (const finding of result.findings) {
    if (finding.severity === 'pass') continue;
    lines.push(
      `[${finding.severity.toUpperCase()}] ${finding.message}${finding.stepId ? ` (${finding.stepId})` : ''}`,
    );
    if (finding.recommendation) {
      lines.push(`  → ${finding.recommendation}`);
    }
  }
  if (result.health === 'PASS' && result.warnCount === 0) {
    lines.push('All pipeline definition checks passed.');
  }
  return lines.join('\n');
}

export function buildDayPipelineHealthSummary(
  result: DayPipelineAuditResult,
): string[] {
  return [
    `health=${result.health}`,
    `day=${result.day}`,
    `accessMode=${result.accessMode}`,
    `fail=${result.failCount}`,
    `warn=${result.warnCount}`,
  ];
}

export function groupDayPipelineFindingsByPhase(
  result: DayPipelineAuditResult,
): Record<DayPipelinePhase, typeof result.findings> {
  const grouped = {} as Record<DayPipelinePhase, typeof result.findings>;
  for (const step of END_OF_DAY_PIPELINE_STEP_DEFINITIONS) {
    if (!grouped[step.phase]) {
      grouped[step.phase] = [];
    }
  }
  for (const finding of result.findings) {
    const step = END_OF_DAY_PIPELINE_STEP_DEFINITIONS.find(
      (s) => s.id === finding.stepId,
    );
    const phase = step?.phase ?? 'preflight';
    grouped[phase] = [...(grouped[phase] ?? []), finding];
  }
  return grouped;
}

export function formatDayPipelineStepResult(result: DayPipelineStepResult): string {
  const parts = [
    `${result.stepId}: ${result.status} (day ${result.day})`,
    result.reason ? `reason=${result.reason}` : '',
    result.warnings.length > 0 ? `warnings=${result.warnings.join(';')}` : '',
  ].filter(Boolean);
  return parts.join(' | ');
}
