import { verifyMainOperationScenario } from '@/core/mainOperation/verifyMainOperationScenario';

const result = verifyMainOperationScenario();

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
  console.error('verify:main-operation FAILED');
  process.exit(1);
}

if (result.warn || warns.length > 0) {
  console.log('verify:main-operation PASS (with warnings)');
  process.exit(0);
}

console.log('verify:main-operation PASS');
process.exit(0);
