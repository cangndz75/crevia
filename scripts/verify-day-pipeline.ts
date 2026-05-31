/**
 * Gün sonu pipeline orchestrator & audit doğrulaması.
 * Çalıştır: npm run verify:day-pipeline
 */

import { verifyDayPipelineScenario } from '../src/core/dayPipeline/verifyDayPipelineScenario';

const result = verifyDayPipelineScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nDay pipeline verify FAILED.');
  process.exit(1);
}

if (result.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nDay pipeline verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nDay pipeline verify PASS.');
}
