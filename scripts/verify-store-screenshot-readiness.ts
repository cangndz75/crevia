/**
 * Store screenshot capture readiness verify.
 * Çalıştır: npm run verify:store-screenshot-readiness
 */

import { runStoreScreenshotReadinessAudit } from '../src/core/releaseReadiness/storeScreenshotReadinessAudit';
import { buildStoreScreenshotReadinessConsoleSummary } from '../src/core/releaseReadiness/storeScreenshotReadinessPresentation';
import { verifyStoreScreenshotReadinessScenario } from '../src/core/releaseReadiness/verifyStoreScreenshotReadinessScenario';

const outcome = verifyStoreScreenshotReadinessScenario();
const result = runStoreScreenshotReadinessAudit({ mode: 'launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildStoreScreenshotReadinessConsoleSummary(result));
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
console.log('NOTE: Real screenshots NOT captured — this is a readiness checklist only.');

if (!outcome.ok) {
  process.exit(1);
}
