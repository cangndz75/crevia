/**
 * EAS / store build prep verify.
 * Calistir: npm run verify:build-prep
 */

import { buildBuildPrepConsoleSummary, runBuildPrepAudit } from '../src/core/buildPrep/buildPrepAudit';
import { verifyBuildPrepScenario } from '../src/core/buildPrep/verifyBuildPrepScenario';

const outcome = verifyBuildPrepScenario();
const audit = runBuildPrepAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildBuildPrepConsoleSummary(audit));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL | Audit health: ${outcome.auditHealth}`,
);

if (!outcome.ok) {
  process.exit(1);
}
