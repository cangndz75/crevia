/**
 * Hub Quick Actions full-loop doğrulaması.
 * Çalıştır: npm run verify:hub-quick-actions-full-loop
 */

import { verifyHubQuickActionsFullLoopScenario } from '../src/core/hubQuickActions/verifyHubQuickActionsFullLoopScenario';

const result = verifyHubQuickActionsFullLoopScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error(`\nHub quick actions full-loop verify failed (${result.failCount} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nHub quick actions full-loop verify passed.');
