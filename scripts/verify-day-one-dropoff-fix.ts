/**
 * Day 1 drop-off pre-launch fix pass verify.
 * Çalıştır: npm run verify:day-one-dropoff-fix
 */

import { runDayOneDropoffFixAudit } from '../src/core/onboarding/dayOneDropoffFixAudit';
import { buildDayOneDropoffFixConsoleSummary } from '../src/core/onboarding/dayOneDropoffFixPresentation';
import { verifyDayOneDropoffFixScenario } from '../src/core/onboarding/verifyDayOneDropoffFixScenario';

const outcome = verifyDayOneDropoffFixScenario();
const audit = runDayOneDropoffFixAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildDayOneDropoffFixConsoleSummary(audit));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Audit health: ${outcome.auditHealth}`);

if (!outcome.ok) {
  process.exit(1);
}
