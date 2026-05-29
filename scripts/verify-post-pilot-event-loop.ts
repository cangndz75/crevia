/**
 * Post-pilot light event loop verify.
 * Çalıştır: npm run verify:post-pilot-event-loop
 */

import { verifyPostPilotEventLoopScenario } from '../src/core/postPilot/verifyPostPilotEventLoopScenario';

const result = verifyPostPilotEventLoopScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nPost-pilot event loop verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nPost-pilot event loop verify passed.');
