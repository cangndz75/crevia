import { verifyCrisisScenario } from '@/core/crisis/verifyCrisisScenario';

const result = verifyCrisisScenario();

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
  console.error('verify:crisis-desk FAILED');
  process.exit(1);
}

if (result.warn || warns.length > 0) {
  console.log('verify:crisis-desk PASS (with warnings)');
  process.exit(0);
}

console.log('verify:crisis-desk PASS');
process.exit(0);
