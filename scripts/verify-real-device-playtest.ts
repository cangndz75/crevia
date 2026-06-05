/**
 * Crevia Real Device Playtest Round 1 — plan, scenarios, observation templates.
 * Çalıştır: npm run verify:real-device-playtest
 */

import { runRealDevicePlaytestAudit } from '../src/core/playtest/realDevicePlaytestAudit';
import { buildRealDevicePlaytestConsoleSummary } from '../src/core/playtest/realDevicePlaytestPresentation';
import { verifyRealDevicePlaytestScenario } from '../src/core/playtest/verifyRealDevicePlaytestScenario';

const outcome = verifyRealDevicePlaytestScenario();
const summary = runRealDevicePlaytestAudit();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildRealDevicePlaytestConsoleSummary(summary));
// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(
  `Summary: ${outcome.checks.filter((c) => c.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((c) => c.startsWith('WARN')).length} WARN, ` +
    `${outcome.checks.filter((c) => c.startsWith('FAIL')).length} FAIL`,
);
// eslint-disable-next-line no-console
console.log(`Playtest health: ${outcome.playtestHealth}`);
// eslint-disable-next-line no-console
console.log(`Decision: ${summary.decision}`);
// eslint-disable-next-line no-console
console.log('NOTE: Real device test NOT executed in verify — manual Round 1 required.');

if (!outcome.ok) {
  process.exit(1);
}
