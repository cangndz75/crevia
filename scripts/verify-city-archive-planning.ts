/**
 * City Archive Persistence V1 planning verify.
 * Run: npm run verify:city-archive-planning
 */

import { buildCityArchivePlanningConsoleSummary } from '../src/core/cityArchivePlanning/cityArchivePlanningPresentation';
import { runCityArchivePlanningAudit } from '../src/core/cityArchivePlanning/cityArchivePlanningAudit';
import { verifyCityArchivePlanningScenario } from '../src/core/cityArchivePlanning/verifyCityArchivePlanningScenario';

const outcome = verifyCityArchivePlanningScenario();

for (const line of outcome.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

// eslint-disable-next-line no-console
console.log('');
// eslint-disable-next-line no-console
console.log(buildCityArchivePlanningConsoleSummary(runCityArchivePlanningAudit()));

// eslint-disable-next-line no-console
console.log(
  `\nSummary: ${outcome.checks.filter((line) => line.startsWith('PASS')).length} PASS, ` +
    `${outcome.checks.filter((line) => line.startsWith('FAIL')).length} FAIL`,
);

if (!outcome.ok) {
  process.exit(1);
}
