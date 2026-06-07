import { verifyAdvisorRelationshipScenario } from '../src/core/advisorRelationship/verifyAdvisorRelationshipScenario';

const result = verifyAdvisorRelationshipScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nAdvisor relationship verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nAdvisor relationship verify passed.');
