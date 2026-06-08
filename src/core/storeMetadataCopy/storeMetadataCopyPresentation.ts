import type { StoreMetadataCopyAuditResult } from './storeMetadataCopyTypes';

export function buildStoreMetadataCopyConsoleSummary(result: StoreMetadataCopyAuditResult): string {
  const lines = [
    '=== Store Metadata Copy Pack ===',
    `Pack ID: ${result.packId}`,
    `Status: ${result.status}`,
    `Locale: ${result.localeCoverage} | Stores: ${result.targetStores}`,
    `Items: ${result.items.length}`,
    `Copy guard: ${result.copyGuardPassed ? 'PASS' : 'FAIL'}`,
    `Console entry: pending (fakePassGuard: ${result.fakePassGuard ? 'ACTIVE' : 'OFF'})`,
    '',
    '--- Positioning ---',
    `TR: ${result.positioningTR}`,
    `EN: ${result.positioningEN}`,
    '',
    '--- Subtitle options ---',
    `TR: ${result.subtitleOptionsTR.join(' | ')}`,
    `EN: ${result.subtitleOptionsEN.join(' | ')}`,
    '',
    '--- Feature bullets ---',
    `TR (${result.featureBulletsTR.length}): ${result.featureBulletsTR.slice(0, 3).join('; ')}…`,
    `EN (${result.featureBulletsEN.length}): ${result.featureBulletsEN.slice(0, 3).join('; ')}…`,
    '',
    '--- Manual limit checks ---',
    ...result.manualLimitChecks.map((c) => `- ${c.id}: ${c.note}`),
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
    `Narrative: ${result.narrativePackDocsPath}`,
  ];
  return lines.join('\n');
}

export function buildStoreMetadataCopyFeatureTable(result: StoreMetadataCopyAuditResult): string {
  const header = '| Locale | # | Feature bullet |';
  const sep = '|--------|---|----------------|';
  const trRows = result.featureBulletsTR.map((b, i) => `| TR | ${i + 1} | ${b} |`);
  const enRows = result.featureBulletsEN.map((b, i) => `| EN | ${i + 1} | ${b} |`);
  return [header, sep, ...trRows, ...enRows].join('\n');
}
