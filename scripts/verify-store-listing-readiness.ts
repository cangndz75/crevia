/**
 * Store listing / privacy readiness verify.
 * Çalıştır: npm run verify:store-listing-readiness
 */

import { runStoreListingReadinessAudit } from '../src/core/releaseReadiness/storeListingReadinessAudit';
import { buildStoreListingReadinessConsoleSummary } from '../src/core/releaseReadiness/storeListingReadinessPresentation';
import { verifyStoreListingReadinessScenario } from '../src/core/releaseReadiness/verifyStoreListingReadinessScenario';

const outcome = verifyStoreListingReadinessScenario();
const result = runStoreListingReadinessAudit({ mode: 'launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildStoreListingReadinessConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Readiness health (launch_candidate): ${outcome.readinessHealth}`);
// eslint-disable-next-line no-console
console.log('NOTE: Real store dashboard work NOT done — privacy URL and screenshots are placeholders.');

if (!outcome.ok) {
  process.exit(1);
}
