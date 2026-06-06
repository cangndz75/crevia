import { NO_NEW_SYSTEM_FREEZE_V11_BACKLOG } from './noNewSystemFreezeConstants';
import type { CreviaNoNewSystemFreezeResult } from './noNewSystemFreezeTypes';

export function buildNoNewSystemFreezeConsoleSummary(
  result: CreviaNoNewSystemFreezeResult,
): string {
  const pending = result.manualBlockers.filter((b) => b.status === 'pending');
  const lines = [
    '=== Crevia No-New-System Freeze Gate ===',
    `Mode: ${result.mode}`,
    `Health: ${result.health}`,
    `Decision: ${result.decision}`,
    `Freeze active: ${result.freezeActive}`,
    `Fix-only mode: ${result.fixOnlyMode}`,
    `SAVE_VERSION: ${result.saveVersion} (expected ${result.expectedSaveVersion})`,
    `Allowed scopes: ${result.allowedScopes.length}`,
    `Forbidden scopes: ${result.forbiddenScopes.length}`,
    `Violations: ${result.violations.length}`,
    `Manual blockers pending: ${pending.length}`,
    '',
  ];

  if (pending.length > 0) {
    lines.push('--- Manual blockers (drive freeze, do not cancel it) ---');
    for (const b of pending) {
      lines.push(`  • ${b.title}`);
    }
    lines.push('');
  }

  if (result.violations.length > 0) {
    lines.push('--- Expansion risks ---');
    for (const v of result.violations.slice(0, 6)) {
      lines.push(`  [${v.severity}] ${v.title}`);
    }
    lines.push('');
  }

  if (result.nextActions.length > 0) {
    lines.push('--- Next actions ---');
    for (const a of result.nextActions.slice(0, 6)) {
      lines.push(`  • ${a}`);
    }
  }

  return lines.join('\n');
}

export function buildNoNewSystemFreezeMarkdown(
  result: CreviaNoNewSystemFreezeResult,
): string {
  const pending = result.manualBlockers.filter((b) => b.status === 'pending');
  return [
    '# No-New-System Freeze Report',
    '',
    `**Mode:** ${result.mode}`,
    `**Health:** ${result.health}`,
    `**Decision:** ${result.decision}`,
    `**Freeze active:** ${result.freezeActive}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Allowed scopes | ${result.allowedScopes.length} |`,
    `| Forbidden scopes | ${result.forbiddenScopes.length} |`,
    `| Violations | ${result.violations.length} |`,
    `| Manual blockers pending | ${pending.length} |`,
    `| Prompt guard items | ${result.promptGuardChecklist.length} |`,
    '',
  ].join('\n');
}

export function buildFreezeAllowedScopeTable(
  result: CreviaNoNewSystemFreezeResult,
): string {
  const rows = result.allowedScopes.map((s) => `| ${s} | allowed |`);
  return ['| Scope | Policy |', '|-------|--------|', ...rows].join('\n');
}

export function buildFreezeForbiddenScopeTable(
  result: CreviaNoNewSystemFreezeResult,
): string {
  const rows = result.forbiddenScopes.map((s) => `| ${s} | forbidden |`);
  return ['| Scope | Policy |', '|-------|--------|', ...rows].join('\n');
}

export function buildFreezePromptGuardChecklist(
  result: CreviaNoNewSystemFreezeResult,
): string[] {
  return result.promptGuardChecklist.map((item) => {
    const prefix = item.rejectIfYes ? '[REJECT if yes]' : '[ALLOW if yes]';
    return `${prefix} ${item.question}`;
  });
}

export function buildFreezeNextActionTable(
  result: CreviaNoNewSystemFreezeResult,
): string {
  if (result.nextActions.length === 0) return 'No pending actions.';
  return result.nextActions.map((a, i) => `${i + 1}. ${a}`).join('\n');
}

export function buildV11BacklogSummary(): string[] {
  return [...NO_NEW_SYSTEM_FREEZE_V11_BACKLOG];
}
