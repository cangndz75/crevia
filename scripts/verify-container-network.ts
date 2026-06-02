import { verifyContainerNetworkScenario } from '../src/core/containerNetwork/verifyContainerNetworkScenario';

const outcome = verifyContainerNetworkScenario();
const failCount = outcome.checks.filter((line) => line.startsWith('FAIL')).length;
const warnCount = outcome.checks.filter((line) => line.startsWith('WARN')).length;
const passCount = outcome.checks.filter((line) => line.startsWith('PASS')).length;

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log(`Container Network Verify: ${outcome.ok ? 'PASS' : 'FAIL'} (${passCount} pass, ${warnCount} warn, ${failCount} fail)`);

if (!outcome.ok) {
  process.exit(1);
}
