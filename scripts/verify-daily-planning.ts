import { verifyDailyPlanningScenario } from '@/core/dailyPlanning/verifyDailyPlanningScenario';

const result = verifyDailyPlanningScenario();

for (const line of result.checks) {
  console.log(line);
}

if (!result.ok) {
  console.error('\nDaily planning verify FAIL.');
  process.exit(1);
}

if (result.warn) {
  console.warn('\nDaily planning verify PASS with warnings.');
} else {
  console.log('\nDaily planning verify PASS.');
}
