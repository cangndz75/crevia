/**
 * Gün sonu raporu systems integration verify.
 * Çalıştır: npm run verify:report-systems-integration
 */

import { verifyReportSystemsIntegrationScenario } from '../src/core/reports/verifyReportSystemsIntegrationScenario';

const result = verifyReportSystemsIntegrationScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nReport systems integration verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nReport systems integration verify passed.');
