import { verifyMonetizationScenario } from '@/core/monetization/verifyMonetizationScenario';

const result = verifyMonetizationScenario();

for (const line of result.checks) {
  console.log(line);
}

const fails = result.checks.filter((c) => c.startsWith('FAIL'));
const warns = result.checks.filter((c) => c.startsWith('WARN'));

console.log('');
console.log(
  `--- ${result.checks.length} checks, ${fails.length} FAIL, ${warns.length} WARN ---`,
);

if (!result.ok || fails.length > 0) {
  console.error('verify:monetization-gate FAILED');
  process.exit(1);
}

if (result.warn || warns.length > 0) {
  console.log('verify:monetization-gate PASS (with warnings)');
  process.exit(0);
}

console.log('verify:monetization-gate PASS');
process.exit(0);
