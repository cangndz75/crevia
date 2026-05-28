/**
 * Live Flow / Event Lifecycle smoke doğrulaması.
 * Çalıştır: npm run verify:live-flow
 */

import { verifyLiveFlowScenario } from '../src/core/liveFlow/verifyLiveFlowScenario';

const result = verifyLiveFlowScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nLive flow verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nLive flow verify passed (${result.warnCount} WARN).`);
