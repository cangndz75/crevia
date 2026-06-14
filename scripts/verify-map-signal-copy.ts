/**
 * Map Signal Copy Pack verify.
 * Calistir: npm run verify:map-signal-copy
 */

import { verifyMapSignalCopyScenario } from '../src/core/mapSignalCopy/verifyMapSignalCopyScenario';

const outcome = verifyMapSignalCopyScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  outcome.ok
    ? 'All map signal copy checks passed.'
    : `Map signal copy checks failed (${outcome.checks.filter((line) => line.startsWith('✗')).length} failures).`,
);

if (!outcome.ok) {
  process.exit(1);
}
