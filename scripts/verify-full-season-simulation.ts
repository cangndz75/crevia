/**
 * Full season balance simulation — 14 günlük ana operasyon denge denetimi.
 * Çalıştır: npm run verify:full-season-simulation
 */

import {
  buildFullSeasonSimulationConsoleReport,
  verifyFullSeasonSimulationScenario,
} from '@/core/simulation';

const outcome = verifyFullSeasonSimulationScenario();

console.log(buildFullSeasonSimulationConsoleReport(outcome.audit));
console.log('');
console.log('--- Verify checks ---');

let pass = 0;
let warn = 0;
let fail = 0;

for (const line of outcome.checks) {
  console.log(line);
  if (line.startsWith('PASS')) pass += 1;
  else if (line.startsWith('WARN')) warn += 1;
  else fail += 1;
}

console.log('');
console.log(`Summary: PASS=${pass} WARN=${warn} FAIL=${fail}`);
console.log(`Audit health: ${outcome.audit.health}`);
console.log(`Simulation verify: ${outcome.ok ? 'PASS' : 'FAIL'}${outcome.warn ? ' (warnings)' : ''}`);

if (!outcome.ok) {
  process.exit(1);
}
