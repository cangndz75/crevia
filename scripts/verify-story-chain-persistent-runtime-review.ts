/**
 * Story chain persistent runtime review verify.
 * Çalıştır: npm run verify:story-chain-persistent-runtime-review
 */

import { runStoryChainPersistentRuntimeReviewAudit } from '../src/core/storyChains/storyChainPersistentRuntimeReviewAudit';
import { buildStoryChainPersistentRuntimeConsoleSummary } from '../src/core/storyChains/storyChainPersistentRuntimeReviewPresentation';
import { verifyStoryChainPersistentRuntimeReviewScenario } from '../src/core/storyChains/verifyStoryChainPersistentRuntimeReviewScenario';

const outcome = verifyStoryChainPersistentRuntimeReviewScenario();
const result = runStoryChainPersistentRuntimeReviewAudit({ mode: 'review_only' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildStoryChainPersistentRuntimeConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Review health: ${outcome.reviewHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
