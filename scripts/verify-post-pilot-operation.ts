/**
 * Post-pilot operation state verify.
 * Çalıştır: npm run verify:post-pilot-operation
 */

import { verifyPostPilotOperationScenario } from '../src/core/postPilot/verifyPostPilotOperationScenario';

const result = verifyPostPilotOperationScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPost-pilot operation verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPost-pilot operation verify passed.');
