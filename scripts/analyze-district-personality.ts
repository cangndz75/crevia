/**
 * Diagnostic analyzer for district personality diversity.
 * Calistir: npm run analyze:district-personality
 */

import { buildAllDistrictPersonalityProfiles } from '../src/core/districtPersonality/districtPersonalityModel';
import { buildDistrictPersonalityEventContext, buildDistrictRetentionHint } from '../src/core/districtPersonality/districtPersonalityPresentation';
import { DISTRICT_PERSONALITY_PROHIBITED_TERMS } from '../src/core/districtPersonality/districtPersonalityConstants';

const profiles = buildAllDistrictPersonalityProfiles({
  day: 8,
  unlockedPermissionIds: ['district_trust_preview', 'resource_pressure_summary', 'assignment_fit_preview'],
  resourceSignals: { id: 'resource-sample', districtId: 'sample' },
  socialSignals: { id: 'social-sample', districtId: 'sample' },
});

const fallbackCount = profiles.filter((profile) => profile.isFallback).length;
const highConfidenceCount = profiles.filter((profile) => profile.confidence === 'high').length;
const archetypes = profiles.flatMap((profile) => profile.archetypeIds);
const archetypeCounts = new Map<string, number>();
for (const archetype of archetypes) {
  archetypeCounts.set(archetype, (archetypeCounts.get(archetype) ?? 0) + 1);
}

const activeCriteria = new Set(
  profiles.flatMap((profile) =>
    profile.criteria.filter((criterion) => criterion.band === 'high').map((criterion) => criterion.id),
  ),
);
const day8Strategic = profiles.some((profile) => {
  const eventContext = buildDistrictPersonalityEventContext(profile);
  const retention = buildDistrictRetentionHint(profile, { day: 8, hasLiveSource: true });
  return eventContext.pressureBiases.length > 0 && profile.mapBias.preferredMapRoles.length > 0 && retention.priority >= 50;
});
const allCopy = profiles
  .flatMap((profile) => [
    profile.districtName,
    profile.mapBias.mapSignalLine,
    profile.strategyBias.recommendedCautionLine,
    profile.retentionHookHint ?? '',
    ...profile.criteria.map((criterion) => `${criterion.label} ${criterion.gameplayMeaning}`),
  ])
  .join(' ')
  .toLocaleLowerCase('tr-TR');
const prohibited = DISTRICT_PERSONALITY_PROHIBITED_TERMS.filter((term) => allCopy.includes(term));
const dominantShare =
  profiles.length === 0
    ? 0
    : Math.max(...Array.from(archetypeCounts.values())) / profiles.length;

let hasWarn = false;
let hasFail = false;

// eslint-disable-next-line no-console
console.log(`District profiles: ${profiles.length}`);
// eslint-disable-next-line no-console
console.log(`Fallback ratio: ${fallbackCount}/${profiles.length}`);
// eslint-disable-next-line no-console
console.log(`High confidence ratio: ${highConfidenceCount}/${profiles.length}`);
// eslint-disable-next-line no-console
console.log(`Archetypes: ${Array.from(archetypeCounts.entries()).map(([id, count]) => `${id}:${count}`).join(', ')}`);
// eslint-disable-next-line no-console
console.log(`Active criteria diversity: ${activeCriteria.size}`);

if (fallbackCount === profiles.length) {
  hasWarn = true;
  // eslint-disable-next-line no-console
  console.log('WARN All districts fell back to balanced fallback.');
}
if (dominantShare >= 0.7) {
  hasWarn = true;
  // eslint-disable-next-line no-console
  console.log('WARN One archetype dominates 70%+ of districts.');
}
if (activeCriteria.size < 5) {
  hasWarn = true;
  // eslint-disable-next-line no-console
  console.log('WARN Fewer than 5 criteria actively differentiate districts.');
}
if (archetypeCounts.size < 4) {
  hasWarn = true;
  // eslint-disable-next-line no-console
  console.log('WARN Fewer than 4 archetypes visible.');
}
if (!day8Strategic) {
  hasWarn = true;
  // eslint-disable-next-line no-console
  console.log('WARN No Day 8+ map/event/retention district contribution.');
}
if (prohibited.length > 0) {
  hasFail = true;
  // eslint-disable-next-line no-console
  console.log(`FAIL Prohibited profiling copy terms: ${prohibited.join(', ')}`);
}

for (const profile of profiles) {
  const badScore = profile.criteria.find((criterion) => criterion.score < 0 || criterion.score > 100);
  if (badScore) {
    hasFail = true;
    // eslint-disable-next-line no-console
    console.log(`FAIL ${profile.districtId} score out of range: ${badScore.id}`);
  }
  // eslint-disable-next-line no-console
  console.log(
    `${profile.districtId}: primary=${profile.primaryCriterionId} archetypes=${profile.archetypeIds.join('|')} map=${profile.mapBias.preferredMapRoles.join('|')}`,
  );
}

// eslint-disable-next-line no-console
console.log(hasFail ? '\nAnalyzer completed with FAIL.' : hasWarn ? '\nAnalyzer completed with WARN.' : '\nAnalyzer completed with PASS.');

if (hasFail) {
  process.exit(1);
}
