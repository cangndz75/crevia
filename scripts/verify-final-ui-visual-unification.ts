/**
 * Final UI visual unification verify.
 * Calistir: npm run verify:final-ui-visual-unification
 */

import { verifyFinalUiVisualUnificationScenario } from '../src/features/finalUi/verifyFinalUiVisualUnificationScenario';

const outcome = verifyFinalUiVisualUnificationScenario();

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
