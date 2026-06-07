/**
 * Manual launch blocker execution tracker verify.
 * Çalıştır: npm run verify:manual-launch-tracker
 */

import { buildEvidenceSummaryConsoleLines } from '../src/core/manualLaunchTracker/manualLaunchEvidencePresentation';
import { buildRoundOneConsoleLines } from '../src/core/manualLaunchTracker/manualLaunchRoundOnePresentation';
import { buildManualLaunchTrackerConsoleSummary } from '../src/core/manualLaunchTracker/manualLaunchTrackerPresentation';
import { runManualLaunchEvidenceAudit } from '../src/core/manualLaunchTracker/manualLaunchEvidenceAudit';
import { runManualLaunchTrackerAudit } from '../src/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { verifyManualLaunchTrackerScenario } from '../src/core/manualLaunchTracker/verifyManualLaunchTrackerScenario';

const outcome = verifyManualLaunchTrackerScenario();
const audit = runManualLaunchTrackerAudit({ mode: 'internal_device_test' });

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildManualLaunchTrackerConsoleSummary(audit));
// eslint-disable-next-line no-console
console.log('');
for (const line of buildEvidenceSummaryConsoleLines(runManualLaunchEvidenceAudit())) {
  // eslint-disable-next-line no-console
  console.log(line);
}
// eslint-disable-next-line no-console
console.log('');
for (const line of buildRoundOneConsoleLines(audit.roundOne)) {
  // eslint-disable-next-line no-console
  console.log(line);
}
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Overall status: ${outcome.overallStatus}`);

if (!outcome.ok) {
  process.exit(1);
}
