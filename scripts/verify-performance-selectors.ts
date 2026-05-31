/**
 * Performans ve store selector audit.
 * Çalıştır: npm run verify:performance-selectors
 */

import { verifySelectorAuditScenario } from '../src/core/quality/performanceSelectors/verifySelectorAuditScenario';

const outcome = verifySelectorAuditScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(outcome.consoleReport);
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL | ` +
    `Audit: ${outcome.audit.passCount} pass / ${outcome.audit.warnCount} warn / ${outcome.audit.failCount} fail`,
);

if (!outcome.ok) {
  process.exit(1);
}
