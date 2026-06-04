/**
 * Çalıştır: npm run verify:hub-open-ended-integration
 */

import { verifyHubOpenEndedIntegrationScenario } from '../src/core/hub/verifyHubOpenEndedIntegrationScenario';

const result = verifyHubOpenEndedIntegrationScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nHub open-ended integration verify failed (${result.failCount} checks).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nHub open-ended integration verify passed.');
