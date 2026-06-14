/**
 * Day 8+ Strategic Content Pack verify.
 * Calistir: npm run verify:day8-strategic-content
 */

import { verifyDay8StrategicContentScenario } from '../src/core/day8StrategicContent/verifyDay8StrategicContentScenario';

const outcome = verifyDay8StrategicContentScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
