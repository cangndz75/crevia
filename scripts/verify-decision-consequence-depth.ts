/**
 * Decision consequence depth pass verify.
 * Calistir: npm run verify:decision-consequence-depth
 */

import { verifyDecisionConsequenceDepthScenario } from '../src/core/decisionConsequence/verifyDecisionConsequenceDepthScenario';

const outcome = verifyDecisionConsequenceDepthScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error(`\n${outcome.failCount} check(s) failed.`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAll decision consequence depth checks passed.');
