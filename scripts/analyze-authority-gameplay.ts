/**
 * Authority gameplay diagnostic audit.
 * Çalıştır: npm run analyze:authority-gameplay
 */

import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import {
  buildAuthorityGameplayUnlockProfiles,
  getCoreGameplayUnlockProfiles,
} from '@/core/authority/authorityGameplayUnlockModel';
import { RANK_PERMISSION_DEFINITIONS } from '@/core/rankPermissions/rankPermissionMatrix';

// eslint-disable-next-line no-console
console.log('Authority gameplay audit\n');

const previewOnly = RANK_PERMISSION_DEFINITIONS.filter((p) => p.isPreviewOnly);
// eslint-disable-next-line no-console
console.log(`Rank permissions total=${RANK_PERMISSION_DEFINITIONS.length} previewOnly=${previewOnly.length}`);

const operationAffecting = buildAuthorityGameplayUnlockProfiles({
  authorityState: { ...createInitialAuthorityState(10), authorityTrust: 1300 },
  day: 10,
}).filter((profile) =>
  profile.affects.some((surface) =>
    ['inspect', 'plan', 'dispatch', 'field'].includes(surface),
  ),
);

// eslint-disable-next-line no-console
console.log('\nOperation phase copy/detail unlocks (day 10, trust 1300):');
for (const profile of operationAffecting) {
  // eslint-disable-next-line no-console
  console.log(
    `  ${profile.id} status=${profile.status} visibility=${profile.visibilityLevel} affects=${profile.affects.join(',')}`,
  );
}

let meaningfulUnlockDays = 0;
for (let day = 1; day <= 10; day += 1) {
  const trust = Math.min(3000, 80 + day * 120);
  const profiles = getCoreGameplayUnlockProfiles(
    buildAuthorityGameplayUnlockProfiles({
      authorityState: { ...createInitialAuthorityState(day), authorityTrust: trust },
      day,
    }),
  );
  const detailedCount = profiles.filter((p) => p.visibilityLevel === 'detailed').length;
  if (detailedCount > 0) meaningfulUnlockDays += 1;
  // eslint-disable-next-line no-console
  console.log(`Day ${day}: trust~${trust} coreDetailed=${detailedCount}/4`);
}

const warnings: string[] = [];
if (meaningfulUnlockDays < 3) {
  warnings.push('first 10 days show <3 days with detailed core unlocks');
}

const mapUnlocks = buildAuthorityGameplayUnlockProfiles({
  authorityState: { ...createInitialAuthorityState(20), authorityTrust: 2600 },
  day: 20,
}).filter((p) => p.affects.includes('map'));

// eslint-disable-next-line no-console
console.log('\nMap layer gameplay roles (planning handoff):');
for (const profile of mapUnlocks) {
  // eslint-disable-next-line no-console
  console.log(`  ${profile.id}: ${profile.canSeeLine} [${profile.unlockConditionLine}]`);
}

if (warnings.length) {
  // eslint-disable-next-line no-console
  console.log(`\nWARN: ${warnings.join('; ')}`);
}

// eslint-disable-next-line no-console
console.log('\nAuthority gameplay audit complete (diagnostic).');
