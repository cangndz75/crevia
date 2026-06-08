import { verifyCityArchiveSurfaceWiringScenario } from '@/core/cityArchive/verifyCityArchiveSurfaceWiringScenario';

const outcome = verifyCityArchiveSurfaceWiringScenario();
for (const line of outcome.checks) {
  console.log(line);
}
const failCount = outcome.checks.filter((c) => c.startsWith('FAIL')).length;
console.log(`\nSummary: ${outcome.checks.length - failCount} PASS, ${failCount} FAIL`);
process.exit(failCount > 0 ? 1 : 0);
