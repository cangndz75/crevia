/**
 * Final polish scope freeze & roadmap guard verify.
 * Çalıştır: npm run verify:final-polish
 */

import { verifyFinalPolishScenario } from '../src/core/quality/finalPolish/verifyFinalPolishScenario';

const outcome = verifyFinalPolishScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

const passCount = outcome.checks.filter((c) => c.startsWith('PASS')).length;
const warnCount = outcome.checks.filter((c) => c.startsWith('WARN')).length;
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(`Summary: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

if (!outcome.ok) {
  // eslint-disable-next-line no-console
  console.error('\nFinal polish verify FAILED.');
  process.exit(1);
}

if (outcome.warn) {
  // eslint-disable-next-line no-console
  console.warn('\nFinal polish verify passed with WARN.');
} else {
  // eslint-disable-next-line no-console
  console.log('\nFinal polish verify PASS.');
}
