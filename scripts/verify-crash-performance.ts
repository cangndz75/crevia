/**
 * Crash / performance SDK integration verify (Aşama 1).
 * Çalıştır: npm run verify:crash-performance
 */

import { buildCrashPerformanceAuditConsoleSummary } from '../src/core/crashPerformance/crashPerformancePresentation';
import { runCrashPerformanceAudit } from '../src/core/crashPerformance/crashPerformanceAudit';
import { verifyCrashPerformanceScenario } from '../src/core/crashPerformance/verifyCrashPerformanceScenario';

const outcome = verifyCrashPerformanceScenario();
const audit = runCrashPerformanceAudit({ mode: 'soft_launch_candidate' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildCrashPerformanceAuditConsoleSummary(audit));

if (!outcome.ok) {
  process.exit(1);
}
