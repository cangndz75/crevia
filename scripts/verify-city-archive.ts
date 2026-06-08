/**
 * City Archive Persistence V1 verify.
 * Çalıştır: npm run verify:city-archive
 */

import { verifyCityArchiveScenario } from '../src/core/cityArchive/verifyCityArchiveScenario';

const outcome = verifyCityArchiveScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
