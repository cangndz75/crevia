/**
 * Store metadata finalization verify.
 * Çalıştır: npm run verify:store-metadata-finalization
 */

import { runStoreMetadataFinalizationAudit } from '../src/core/releaseReadiness/storeMetadataFinalizationAudit';
import { buildStoreMetadataFinalizationConsoleSummary } from '../src/core/releaseReadiness/storeMetadataFinalizationPresentation';
import { verifyStoreMetadataFinalizationScenario } from '../src/core/releaseReadiness/verifyStoreMetadataFinalizationScenario';

const outcome = verifyStoreMetadataFinalizationScenario();
const result = runStoreMetadataFinalizationAudit({ mode: 'launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildStoreMetadataFinalizationConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Finalization health (launch_candidate): ${outcome.finalizationHealth}`);
// eslint-disable-next-line no-console
console.log('NOTE: Store console entry NOT done — metadata drafts in repo only.');

if (!outcome.ok) {
  process.exit(1);
}
