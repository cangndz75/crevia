/**
 * No-New-System freeze gate verify.
 * Çalıştır: npm run verify:no-new-system-freeze
 */

import { runNoNewSystemFreezeAudit } from '../src/core/releaseReadiness/noNewSystemFreezeAudit';
import { buildNoNewSystemFreezeConsoleSummary } from '../src/core/releaseReadiness/noNewSystemFreezePresentation';
import { verifyNoNewSystemFreezeScenario } from '../src/core/releaseReadiness/verifyNoNewSystemFreezeScenario';

const outcome = verifyNoNewSystemFreezeScenario();
const result = runNoNewSystemFreezeAudit({ mode: 'launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildNoNewSystemFreezeConsoleSummary(result));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Freeze health: ${outcome.freezeHealth} | Decision: ${outcome.freezeDecision}`);

if (!outcome.ok) {
  process.exit(1);
}
