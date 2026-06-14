/**
 * Gameplay loop end-to-end QA verify.
 * Calistir: npm run verify:gameplay-loop-qa
 */

import { verifyGameplayLoopQaScenario } from '../src/core/quality/gameplayLoopQaScenario';

const outcome = verifyGameplayLoopQaScenario();

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

if (outcome.warn) {
  process.exit(2);
}
