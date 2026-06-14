/**
 * City Memory Visibility verify runner.
 * Calistir: npm run verify:city-memory-visibility
 */

import { verifyCityMemoryVisibilityScenario } from '../src/core/cityMemoryVisibility/verifyCityMemoryVisibilityScenario';

const outcome = verifyCityMemoryVisibilityScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((l) => l.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((l) => l.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((l) => l.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
