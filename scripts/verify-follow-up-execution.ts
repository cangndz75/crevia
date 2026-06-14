/**
 * Follow-up Action Execution Lite verify.
 * Calistir: npm run verify:follow-up-execution
 */

import { verifyFollowUpExecutionScenario } from '../src/core/followUpExecution/verifyFollowUpExecutionScenario';

const outcome = verifyFollowUpExecutionScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
