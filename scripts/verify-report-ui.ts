/**
 * Gün sonu rapor UI verify.
 * Çalıştır: npm run verify:report-ui
 */

import { verifyReportUiScenario } from '../src/features/reports/verifyReportUiScenario';

const result = verifyReportUiScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nReport UI verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nReport UI verify passed.');
