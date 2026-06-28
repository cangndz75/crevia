import { verifyEndOfDayReportClosureScenario } from '../src/features/reports/verifyEndOfDayReportClosureScenario';

const outcome = verifyEndOfDayReportClosureScenario();

for (const line of outcome.checks) {
  console.log(line);
}

console.log('');
console.log('--- Summary ---');
console.log(`FAIL: ${outcome.failCount}`);
console.log('');
console.log(outcome.ok ? 'RESULT: PASS' : 'RESULT: FAIL');
process.exit(outcome.ok ? 0 : 1);
