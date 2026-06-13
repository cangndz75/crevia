/**
 * Operasyon Planla fazı UI verify.
 * Çalıştır: npm run verify:operation-plan-ui
 */

import { verifyOperationPlanUiScenario } from '../src/features/events/verifyOperationPlanUiScenario';

const outcome = verifyOperationPlanUiScenario();

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
console.log('\nAll operation plan UI checks passed.');
