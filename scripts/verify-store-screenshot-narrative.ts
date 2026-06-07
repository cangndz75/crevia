/**
 * Store Screenshot Narrative Pack verify.
 * Çalıştır: npm run verify:store-screenshot-narrative
 */

import { verifyStoreScreenshotNarrativeScenario } from '../src/core/storeScreenshotNarrative/verifyStoreScreenshotNarrativeScenario';
import { buildStoreScreenshotNarrativeConsoleSummary } from '../src/core/storeScreenshotNarrative/storeScreenshotNarrativePresentation';
import { runStoreScreenshotNarrativeAudit } from '../src/core/storeScreenshotNarrative/storeScreenshotNarrativeAudit';

const outcome = verifyStoreScreenshotNarrativeScenario();

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
console.log(buildStoreScreenshotNarrativeConsoleSummary(runStoreScreenshotNarrativeAudit()));
