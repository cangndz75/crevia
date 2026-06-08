/**
 * Store Metadata Copy Pack verify.
 * Çalıştır: npm run verify:store-metadata-copy
 */

import { runStoreMetadataCopyAudit } from '../src/core/storeMetadataCopy/storeMetadataCopyAudit';
import { buildStoreMetadataCopyConsoleSummary } from '../src/core/storeMetadataCopy/storeMetadataCopyPresentation';
import { verifyStoreMetadataCopyScenario } from '../src/core/storeMetadataCopy/verifyStoreMetadataCopyScenario';

const outcome = verifyStoreMetadataCopyScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildStoreMetadataCopyConsoleSummary(runStoreMetadataCopyAudit()));
