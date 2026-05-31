import { getInteractionContractById } from './interactionContractRegistry';
import type {
  InteractionAuditFinding,
  InteractionAuditResult,
  InteractionSurface,
} from './interactionContractTypes';

export function getInteractionAuditHealth(
  result: InteractionAuditResult,
): InteractionAuditResult['health'] {
  return result.health;
}

export function buildInteractionAuditSummary(result: InteractionAuditResult): string[] {
  const lines = [
    `Health: ${result.health}`,
    `Checked: ${result.checkedCount} | Pass: ${result.passCount} | Warn: ${result.warnCount} | Fail: ${result.failCount}`,
  ];
  if (result.failCount > 0) {
    lines.push('Failures:');
    for (const f of result.findings.filter((x) => x.severity === 'fail').slice(0, 8)) {
      lines.push(`  - ${f.componentName}: ${f.message}`);
    }
  }
  if (result.warnCount > 0) {
    lines.push('Warnings:');
    for (const f of result.findings.filter((x) => x.severity === 'warn').slice(0, 6)) {
      lines.push(`  - ${f.componentName}: ${f.message}`);
    }
  }
  return lines;
}

export function buildInteractionAuditConsoleReport(
  result: InteractionAuditResult,
): string {
  const grouped = groupInteractionFindingsBySurface(result);
  const parts = [
    '=== Interaction Contract Audit ===',
    ...buildInteractionAuditSummary(result),
    '',
  ];
  for (const [surface, findings] of Object.entries(grouped)) {
    if (findings.length === 0) continue;
    parts.push(`[${surface}]`);
    for (const f of findings) {
      parts.push(`  ${f.severity.toUpperCase()} ${f.contractId}: ${f.message}`);
    }
    parts.push('');
  }
  if (result.findings.length === 0) {
    parts.push('All contracts passed validation.');
  }
  return parts.join('\n');
}

export function groupInteractionFindingsBySurface(
  result: InteractionAuditResult,
): Partial<Record<InteractionSurface, InteractionAuditFinding[]>> {
  const map: Partial<Record<InteractionSurface, InteractionAuditFinding[]>> = {};
  for (const f of result.findings) {
    const contract = getInteractionContractById(f.contractId);
    const surface = contract?.surface ?? inferSurfaceFromComponent(f.componentName);
    if (!map[surface]) map[surface] = [];
    map[surface]!.push(f);
  }
  return map;
}

function inferSurfaceFromComponent(componentName: string): InteractionSurface {
  if (componentName.startsWith('Hub') || componentName.includes('Advisor')) return 'hub';
  if (componentName.startsWith('Report')) return 'report';
  if (componentName.startsWith('Map')) return 'map';
  if (componentName.includes('PostPilot') || componentName.includes('MainOperation'))
    return 'post_pilot';
  if (componentName.includes('Assignment') || componentName.includes('Event'))
    return 'event_dispatch';
  if (componentName.includes('Profile') || componentName.includes('Progression'))
    return 'profile';
  if (componentName.includes('Dev')) return 'devtools';
  return 'hub';
}
