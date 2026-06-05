import type { CreviaStoreMetadataFinalizationResult } from './storeMetadataFinalizationTypes';
import { STORE_METADATA_FINALIZATION_DOCS_PATH } from './storeMetadataFinalizationConstants';

export function buildStoreMetadataFinalizationConsoleSummary(
  result: CreviaStoreMetadataFinalizationResult,
): string {
  const lines = [
    '=== Crevia Store Metadata Finalization ===',
    `Health: ${result.health}`,
    `Mode: ${result.mode}`,
    `Metadata draft present: ${result.metadataDraftPresent}`,
    `Keywords TR: ${result.keywordsTr.keywords.length} | EN: ${result.keywordsEn.keywords.length}`,
    `IAP metadata draft: ${result.iapMetadataDraftPresent}`,
    `Review notes draft: ${result.reviewNotesDraftPresent}`,
    `Risk scan: ${result.riskScan.passed ? 'PASS' : 'FAIL'} (${result.riskScan.scannedTexts} texts)`,
    `Privacy URL placeholder: ${result.privacyUrlIsPlaceholder}`,
    `Console entry pending: ${result.consoleEntryPending}`,
    '',
    '--- Blockers ---',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `  • ${b.title}: ${b.message}`)
      : ['  (none for current mode)']),
    '',
    '--- Warnings ---',
    ...(result.warnings.length > 0
      ? result.warnings.map((w) => `  • ${w.title}: ${w.message}`)
      : ['  (none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `  • ${a}`),
    '',
    `Docs: ${STORE_METADATA_FINALIZATION_DOCS_PATH}`,
  ];
  return lines.join('\n');
}

export function buildStoreMetadataFinalizationMarkdown(
  result: CreviaStoreMetadataFinalizationResult,
): string {
  return [
    '# Store Metadata Finalization Report',
    '',
    `**Health:** ${result.health} | **Mode:** ${result.mode}`,
    '',
    '## TR Metadata (summary)',
    '',
    `**App name:** ${result.metadataTr.appName}`,
    `**Subtitle:** ${result.metadataTr.subtitle}`,
    `**Feature bullets:** ${result.metadataTr.featureBullets.length}`,
    `**Keywords:** ${result.keywordsTr.keywords.join(', ')}`,
    '',
    '## EN Metadata (summary)',
    '',
    `**App name:** ${result.metadataEn.appName}`,
    `**Subtitle:** ${result.metadataEn.subtitle}`,
    `**Feature bullets:** ${result.metadataEn.featureBullets.length}`,
    `**Keywords:** ${result.keywordsEn.keywords.join(', ')}`,
    '',
    '## IAP Metadata',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| iOS product id | ${result.iapMetadata.productIdIos} |`,
    `| Android product id | ${result.iapMetadata.productIdAndroid} |`,
    `| Display name TR | ${result.iapMetadata.displayNameTr} |`,
    `| Display name EN | ${result.iapMetadata.displayNameEn} |`,
    `| Entitlement | ${result.iapMetadata.entitlementId} |`,
    `| Offering | ${result.iapMetadata.offeringId} |`,
    `| Type | ${result.iapMetadata.productType} |`,
    `| Price tier | ${result.iapMetadata.priceTierStatus} |`,
    `| Store setup | ${result.iapMetadata.storeSetupStatus} |`,
    '',
    '## Risk Scan',
    '',
    result.riskScan.passed
      ? `PASS — ${result.riskScan.scannedTexts} texts scanned, no false claims.`
      : `FAIL — hits: ${result.riskScan.hits.join(', ')}`,
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `- **${b.title}:** ${b.message}`)
      : ['_None for current mode._']),
  ].join('\n');
}
