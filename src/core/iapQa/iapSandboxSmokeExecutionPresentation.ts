import type {
  CreviaIapSandboxSmokeExecutionResult,
  CreviaIapSandboxSmokeObservation,
} from './iapSandboxSmokeExecutionTypes';
import { buildIapSandboxSmokeManualTemplate } from './iapSandboxSmokeExecutionAudit';

export function buildIapSandboxSmokeExecutionChecklist(
  result: CreviaIapSandboxSmokeExecutionResult,
): string[] {
  return result.plan.cases.map((testCase) => {
    const status = result.caseStatuses.find((c) => c.caseId === testCase.id);
    return `[${status?.overallStatus ?? 'pending'}] ${testCase.id} — ${testCase.title} (${testCase.platform})`;
  });
}

export function buildIapSandboxSmokeObservationSheet(
  observation: CreviaIapSandboxSmokeObservation,
): string {
  return [
    `### ${observation.caseId} (${observation.platform})`,
    `- device: ${observation.device || '_pending_'}`,
    `- build: ${observation.buildProfile || '_pending_'}`,
    `- status: ${observation.status}`,
    `- severity: ${observation.severity}`,
    `- observed: ${observation.observedResult || '_pending_'}`,
    `- logs: ${observation.logs || '-'}`,
    `- screenshot: ${observation.screenshotPath || '-'}`,
    `- video: ${observation.videoPath || '-'}`,
    `- notes: ${observation.notes || '-'}`,
  ].join('\n');
}

export function buildPlaytestFixPriorityTable(
  result: CreviaIapSandboxSmokeExecutionResult,
): string {
  if (result.blockers.length === 0) {
    return '_No execution blockers (manual results still required for pass)._\n';
  }
  const rows = result.blockers.map(
    (b) => `| ${b.platform} | ${b.title} | ${b.message.slice(0, 70)} |`,
  );
  return `| Platform | Blocker | Detail |\n|----------|---------|--------|\n${rows.join('\n')}\n`;
}

export function buildIapSandboxSmokeExecutionConsoleSummary(
  result: CreviaIapSandboxSmokeExecutionResult,
): string {
  const lines = [
    '=== Crevia IAP Sandbox Smoke Execution ===',
    `Health: ${result.health}`,
    `Decision: ${result.decision}`,
    `Cases: ${result.plan.cases.length} | Sandbox-pass cases: ${result.plan.cases.filter((c) => c.countsForSandboxPass).length}`,
    `RC keys configured: ${result.revenueCatKeysConfigured}`,
    `Store setup pending: ${result.storeSetupAssumedPending}`,
    `Manual results logged: ${result.manualResultsPresent}`,
    `Sandbox smoke passed: ${result.sandboxSmokePassed}`,
    `Dev mock only (not sandbox pass): ${result.devMockOnlyPassed}`,
    '',
    '--- Platform results ---',
    ...result.platformResults.map(
      (p) =>
        `  ${p.platform.toUpperCase()}: ${p.status} — pass=${p.passedCount} fail=${p.failedCount} pending=${p.pendingCount}`,
    ),
    '',
    '--- Blockers ---',
    ...(result.blockers.length > 0
      ? result.blockers.slice(0, 8).map((b) => `  • ${b.title}`)
      : ['  (none — still requires manual logging for pass)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `  • ${a}`),
  ];
  return lines.join('\n');
}

export function buildIapSandboxSmokeExecutionMarkdown(
  result: CreviaIapSandboxSmokeExecutionResult,
): string {
  const template = buildIapSandboxSmokeManualTemplate();
  return [
    '# IAP Sandbox Smoke Execution Report',
    '',
    `**Health:** ${result.health}`,
    `**Decision:** ${result.decision}`,
    `**Sandbox passed:** ${result.sandboxSmokePassed}`,
    '',
    '## Test case matrix',
    '',
    '| ID | Platform | Sandbox pass | Status |',
    '|----|----------|--------------|--------|',
    ...result.plan.cases.map((c) => {
      const st = result.caseStatuses.find((x) => x.caseId === c.id);
      return `| ${c.id} | ${c.platform} | ${c.countsForSandboxPass} | ${st?.overallStatus ?? 'pending'} |`;
    }),
    '',
    '## Manual result template',
    '',
    ...Object.entries(template).map(([k, v]) => `- **${k}:** ${v}`),
    '',
    '## Blockers',
    '',
    buildPlaytestFixPriorityTable(result),
    '',
    '## Platform results',
    '',
    ...result.platformResults.map(
      (p) =>
        `- **${p.platform}:** ${p.status} (${p.passedCount}/${p.sandboxCaseCount} pass, ${p.pendingCount} pending)`,
    ),
  ].join('\n');
}
