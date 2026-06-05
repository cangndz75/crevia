import type { CreviaStoreListingReadinessResult } from './storeListingReadinessTypes';
import { STORE_LISTING_READINESS_DOCS_PATH } from './storeListingReadinessConstants';

export function buildStoreListingReadinessConsoleSummary(
  result: CreviaStoreListingReadinessResult,
): string {
  const lines = [
    '=== Crevia Store Listing / Privacy Readiness ===',
    `Health: ${result.health}`,
    `Mode: ${result.mode}`,
    `Checklist items: ${result.checklist.length}`,
    `Screenshots: ${result.screenshots.length} (${result.screenshots.filter((s) => s.status === 'pending').length} pending)`,
    `Privacy policy placeholder: ${result.privacyPolicyUrlIsPlaceholder}`,
    `Store metadata ready: ${result.storeMetadataReady}`,
    `Copy false-claim scan: ${result.copyForbiddenClaimsScanPassed ? 'PASS' : 'FAIL'}`,
    `IAP metadata placeholder: ${result.iapMetadataPlaceholder}`,
    '',
    '--- Blockers ---',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `  • ${b.title}`)
      : ['  (none for current mode)']),
    '',
    '--- Warnings ---',
    ...(result.warnings.length > 0
      ? result.warnings.slice(0, 8).map((w) => `  • ${w.title}`)
      : ['  (none)']),
    '',
    '--- Next actions ---',
    ...result.nextActions.map((a) => `  • ${a}`),
    '',
    `Docs: ${STORE_LISTING_READINESS_DOCS_PATH}`,
  ];
  return lines.join('\n');
}

export function buildStoreListingReadinessMarkdown(
  result: CreviaStoreListingReadinessResult,
): string {
  const d = result.metadataDraft;
  return [
    '# Store Listing Readiness Report',
    '',
    `**Health:** ${result.health} | **Mode:** ${result.mode}`,
    '',
    '## Metadata draft (TR short)',
    '',
    d.shortDescriptionTr,
    '',
    '## Metadata draft (EN short)',
    '',
    d.shortDescriptionEn,
    '',
    '## Screenshot checklist',
    '',
    '| Screen | Purpose | Status | Risk |',
    '|--------|---------|--------|------|',
    ...result.screenshots.map(
      (s) => `| ${s.screenName} | ${s.purpose} | ${s.status} | ${s.riskNotes.slice(0, 40)} |`,
    ),
    '',
    '## Privacy matrix (sample)',
    '',
    '| Data type | Linked | Tracking |',
    '|-----------|--------|----------|',
    ...result.privacyMatrix.slice(0, 6).map(
      (p) => `| ${p.collectedDataType} | ${p.linkedToUser} | ${p.usedForTracking} |`,
    ),
    '',
    '## Blockers',
    '',
    ...(result.blockers.length > 0
      ? result.blockers.map((b) => `- **${b.title}:** ${b.message}`)
      : ['_None for current mode._']),
  ].join('\n');
}

export function buildStoreListingScreenshotChecklist(
  result: CreviaStoreListingReadinessResult,
): string[] {
  return result.screenshots.map(
    (s) =>
      `[${s.status}] ${s.screenName} — ${s.purpose} (${s.deviceSize})${s.copyOverlayAllowed ? '' : ' [no overlay]'}`,
  );
}
