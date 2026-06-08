import type { PrivacyPolicyTextAuditResult } from './privacyPolicyTextTypes';

export function buildPrivacyPolicyTextConsoleSummary(
  result: PrivacyPolicyTextAuditResult,
): string {
  const lines = [
    '=== Privacy Policy + Data Safety Text Pack ===',
    `Pack ID: ${result.packId}`,
    `Status: ${result.status}`,
    `Locale: ${result.localeCoverage}`,
    `Sections: ${result.sections.length}`,
    `Data safety rows: ${result.dataUseMatrix.length}`,
    `SDK disclosures: ${result.sdkDisclosureMatrix.length}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Privacy URL: ${result.privacyUrlStatus}`,
    `Legal review: ${result.legalReviewStatus}`,
    `Data safety forms: ${result.dataSafetyFormStatus}`,
    `Fake pass guard: ${result.fakePassGuard ? 'ACTIVE' : 'OFF'}`,
    '',
    '--- Store disclosure copy ---',
    `TR: ${result.storeDisclosureCopyTR}`,
    `EN: ${result.storeDisclosureCopyEN}`,
    '',
    '--- Manual review ---',
    ...result.manualReviewItems.map((m) => `- ${m.id}: ${m.note}`),
    '',
    '--- SDK matrix ---',
    ...result.sdkDisclosureMatrix.map(
      (s) => `${s.id}: code=${s.codeIntegration} env=${s.envOrDashboard}`,
    ),
    '',
    '--- Blockers ---',
    ...(result.blockerSummary.length > 0
      ? result.blockerSummary.map((b) => `- ${b.id}: ${b.message}`)
      : ['(none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `- ${a}`),
    '',
    `Docs: ${result.docsPath}`,
  ];
  return lines.join('\n');
}
