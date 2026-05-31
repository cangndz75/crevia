/**
 * Operasyon danışmanı MVP doğrulaması.
 * Çalıştır: npm run verify:advisor
 */

import { verifyAdvisorScenario } from '../src/core/advisors/verifyAdvisorScenario';

const result = verifyAdvisorScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nAdvisor verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nAdvisor verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nAdvisor verify PASS.');
}
