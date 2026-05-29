/**
 * Yönlendir / Sahada UI verify.
 * Çalıştır: npm run verify:dispatch-field-ui
 */

import { verifyDispatchFieldUiScenario } from '../src/features/events/verifyDispatchFieldUiScenario';

const result = verifyDispatchFieldUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nDispatch/Field UI verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nDispatch/Field UI verify passed.');
