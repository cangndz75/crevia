import type { IapProductCopyAuditResult } from './iapProductCopyTypes';

export function buildIapProductCopyConsoleSummary(result: IapProductCopyAuditResult): string {
  const lines = [
    '=== IAP Product Copy + Offer Screen Trust Pack ===',
    `Pack ID: ${result.packId}`,
    `Status: ${result.status}`,
    `Items: ${result.productCopyItems.length}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Product setup: pending | Sandbox: pending | Restore: pending`,
    `Fake pass guard: ${result.fakePassGuard ? 'ACTIVE' : 'OFF'}`,
    '',
    '--- Positioning ---',
    `TR: ${result.positioningTR}`,
    `EN: ${result.positioningEN}`,
    '',
    '--- Offer titles ---',
    `TR: ${result.offerScreenCopy.titleOptionsTR.join(' | ')}`,
    `EN: ${result.offerScreenCopy.titleOptionsEN.join(' | ')}`,
    '',
    '--- Trust checklist ---',
    ...result.trustChecklist.map((t) => `- [${t.status}] ${t.rule}`),
    '',
    '--- Manual setup blockers ---',
    ...result.manualSetupBlockers.map((b) => `- ${b.id}: ${b.message}`),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `- ${a}`),
    '',
    `Docs: ${result.docsPath}`,
  ];
  return lines.join('\n');
}
