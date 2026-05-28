/**
 * Mahalle kimlik katmanı smoke doğrulaması.
 * Çalıştır: npm run verify:neighborhood-identity
 */

import { verifyNeighborhoodIdentityScenario } from '../src/core/neighborhoodIdentity/verifyNeighborhoodIdentityScenario';

const result = verifyNeighborhoodIdentityScenario();

for (const line of result.checks) {
  // eslint-disable-next-line no-console
  console.log(line);
}

if (!result.ok) {
  // eslint-disable-next-line no-console
  console.error('\nNeighborhood identity verify failed.');
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log('\nNeighborhood identity verify passed.');
