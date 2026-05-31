import { verifyMainOperationContentScenario } from '../src/core/mainOperation/verifyMainOperationContentScenario';

const result = verifyMainOperationContentScenario();
const failCount = result.checks.filter((c) => c.startsWith('FAIL')).length;
const warnCount = result.checks.filter((c) => c.startsWith('WARN')).length;

for (const line of result.checks) {
  console.log(line);
}

console.log('');
console.log(
  `--- ${result.checks.length} checks, ${failCount} FAIL, ${warnCount} WARN ---`,
);

if (!result.ok) {
  console.error('verify:main-operation-content FAILED');
  process.exit(1);
}

console.log('verify:main-operation-content PASS' + (warnCount > 0 ? ' (with warnings)' : ''));
