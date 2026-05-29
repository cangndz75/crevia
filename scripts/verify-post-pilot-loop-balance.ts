/**
 * Post-pilot light loop balance & QA verify.
 * Çalıştır: npm run verify:post-pilot-loop-balance
 */

import { verifyPostPilotLoopBalanceScenario } from '../src/core/postPilot/verifyPostPilotLoopBalanceScenario';

const result = verifyPostPilotLoopBalanceScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('\n--- Post-pilot loop audit ---');
// eslint-disable-next-line no-console
console.log(JSON.stringify(result.audit, null, 2));

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPost-pilot loop balance verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nPost-pilot loop balance verify passed (${result.audit.health}).`);
