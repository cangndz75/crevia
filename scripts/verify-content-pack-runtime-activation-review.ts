/**
 * Content pack runtime activation review verify.
 * Çalıştır: npm run verify:content-pack-runtime-activation-review
 */

import { runContentPackRuntimeActivationReviewAudit } from '../src/core/contentProduction/contentPackRuntimeActivationReviewAudit';
import { buildContentPackActivationConsoleSummary } from '../src/core/contentProduction/contentPackRuntimeActivationReviewPresentation';
import { verifyContentPackRuntimeActivationReviewScenario } from '../src/core/contentProduction/verifyContentPackRuntimeActivationReviewScenario';

const outcome = verifyContentPackRuntimeActivationReviewScenario();
const result = runContentPackRuntimeActivationReviewAudit({ mode: 'review_only' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildContentPackActivationConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Activation health: ${outcome.activationHealth}`);
// eslint-disable-next-line no-console
console.log(`Decision: ${outcome.decision}`);

if (!outcome.ok) {
  process.exit(1);
}
