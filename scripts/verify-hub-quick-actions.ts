/**
 * Hub Quick Actions smoke doğrulaması.
 * Çalıştır: npm run verify:hub-quick-actions
 */

import { verifyHubQuickActionsScenario } from '../src/core/hubQuickActions/verifyHubQuickActionsScenario';

const result = verifyHubQuickActionsScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nHub quick actions verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nHub quick actions verify passed (${result.warnCount} WARN).`);
