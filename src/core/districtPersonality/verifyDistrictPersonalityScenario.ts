import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_PERSONALITY_EXPECTED_SAVE_VERSION,
  DISTRICT_PERSONALITY_PROHIBITED_TERMS,
} from './districtPersonalityConstants';
import {
  DISTRICT_PERSONALITY_CONTENT_LINES,
  DISTRICT_PERSONALITY_FALLBACK_LINES,
} from './districtPersonalityContentLines';
import {
  buildAllDistrictPersonalityProfiles,
  buildDistrictPersonalityProfile,
  isDistrictPersonalityDetailedAllowed,
} from './districtPersonalityModel';
import {
  buildDistrictPersonalityAdvisorLine,
  buildDistrictPersonalityEventContext,
  buildDistrictPersonalityMapContext,
  buildDistrictRetentionHint,
} from './districtPersonalityPresentation';
import {
  DISTRICT_ARCHETYPE_IDS,
  DISTRICT_CRITERION_IDS,
  DISTRICT_PERSONALITY_SOURCE_KINDS,
  type DistrictPersonalityProfile,
} from './districtPersonalityTypes';

import { verifyDistrictPersonalityBindingScenario } from './verifyDistrictPersonalityBindingScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictPersonalityOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail}`);
  return pass;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function containsProhibited(text: string): string[] {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return DISTRICT_PERSONALITY_PROHIBITED_TERMS.filter((term) => normalized.includes(term));
}

function allStrings(profile: DistrictPersonalityProfile): string[] {
  return [
    profile.districtName,
    profile.sourceLabel,
    profile.mapBias.mapSignalLine,
    profile.strategyBias.recommendedCautionLine,
    profile.retentionHookHint ?? '',
    ...profile.criteria.flatMap((criterion) => [
      criterion.label,
      criterion.gameplayMeaning,
      ...criterion.sourceIds,
    ]),
    ...Object.values(DISTRICT_PERSONALITY_CONTENT_LINES).flatMap((byKind) =>
      Object.values(byKind).flatMap((lines) => lines ?? []),
    ),
    ...Object.values(DISTRICT_PERSONALITY_FALLBACK_LINES),
  ].filter(Boolean);
}

function validateProfile(checks: string[], profile: DistrictPersonalityProfile): boolean {
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, profile.districtId.trim().length > 0, `${profile.districtId} districtId`, 'empty districtId'));
  record(assert(checks, profile.districtName.trim().length > 0, `${profile.districtId} districtName`, 'empty districtName'));
  record(assert(checks, profile.criteria.length >= 8, `${profile.districtId} 8+ criteria`, `${profile.districtId} too few criteria`));
  record(assert(checks, profile.archetypeIds.length <= 2, `${profile.districtId} max 2 archetypes`, `${profile.districtId} archetype spam`));
  record(assert(checks, DISTRICT_ARCHETYPE_IDS.includes(profile.primaryArchetypeId), `${profile.districtId} primary archetype valid`, `${profile.districtId} bad archetype`));
  record(assert(checks, DISTRICT_CRITERION_IDS.includes(profile.primaryCriterionId), `${profile.districtId} primary criterion valid`, `${profile.districtId} bad criterion`));
  record(assert(checks, profile.secondaryCriterionIds.length <= 3, `${profile.districtId} max 3 secondary criteria`, `${profile.districtId} secondary spam`));
  record(assert(checks, unique(profile.sourceIds), `${profile.districtId} sourceIds unique`, `${profile.districtId} duplicate sourceIds`));

  for (const criterion of profile.criteria) {
    record(assert(checks, DISTRICT_CRITERION_IDS.includes(criterion.id), `${profile.districtId}:${criterion.id} criterion valid`, `${profile.districtId}:${criterion.id} invalid criterion`));
    record(assert(checks, criterion.score >= 0 && criterion.score <= 100, `${profile.districtId}:${criterion.id} score clamp`, `${profile.districtId}:${criterion.id} score out of range`));
    record(assert(checks, ['low', 'medium', 'high'].includes(criterion.band), `${profile.districtId}:${criterion.id} band valid`, `${profile.districtId}:${criterion.id} band invalid`));
    record(assert(checks, criterion.sourceKinds.every((kind) => DISTRICT_PERSONALITY_SOURCE_KINDS.includes(kind)), `${profile.districtId}:${criterion.id} source kind valid`, `${profile.districtId}:${criterion.id} source kind invalid`));
    record(assert(checks, unique(criterion.sourceIds), `${profile.districtId}:${criterion.id} sourceIds unique`, `${profile.districtId}:${criterion.id} duplicate sourceIds`));
  }

  const prohibited = containsProhibited(allStrings(profile).join(' '));
  record(assert(checks, prohibited.length === 0, `${profile.districtId} prohibited profiling clean`, `${profile.districtId} prohibited terms: ${prohibited.join(', ')}`));
  const enumLeak = allStrings(profile).some((line) =>
    DISTRICT_CRITERION_IDS.some((id) => line.includes(id)) ||
    DISTRICT_ARCHETYPE_IDS.some((id) => line.includes(id)),
  );
  record(assert(checks, !enumLeak, `${profile.districtId} no technical enum copy`, `${profile.districtId} enum leaked to copy`));

  if (profile.isFallback) {
    record(assert(checks, profile.confidence === 'low', `${profile.districtId} fallback low confidence`, `${profile.districtId} fallback confidence unsafe`));
    record(assert(checks, profile.primaryArchetypeId === 'balanced_district', `${profile.districtId} fallback balanced`, `${profile.districtId} fallback not balanced`));
    record(assert(checks, !profile.mapBias.mapSignalLine.includes('Bugun'), `${profile.districtId} fallback no live claim`, `${profile.districtId} fallback live claim`));
  }

  return ok;
}

export function verifyDistrictPersonalityScenario(): VerifyDistrictPersonalityOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  const profiles = buildAllDistrictPersonalityProfiles({
    day: 8,
    unlockedPermissionIds: ['district_trust_preview', 'resource_pressure_summary', 'assignment_fit_preview'],
  });
  const liveProfile = buildDistrictPersonalityProfile({
    districtId: 'sanayi',
    day: 8,
    unlockedPermissionIds: ['resource_pressure_summary', 'assignment_fit_preview', 'district_memory_trace_preview'],
    resourceSignals: { id: 'resource-sanayi', districtId: 'sanayi', pressure: 'high' },
    containerNetworkSignals: { id: 'container-sanayi', districtId: 'sanayi' },
    activeTaskRouteSignals: { routeId: 'route-sanayi', districtId: 'sanayi' },
    vehicleMaintenanceSignals: { id: 'maintenance-sanayi', districtId: 'sanayi' },
    districtMemorySignals: { id: 'memory-sanayi', districtId: 'sanayi' },
    cityArchiveSignals: { id: 'archive-sanayi', districtId: 'sanayi' },
  });
  const fallback = buildDistrictPersonalityProfile({ districtId: 'unknown-district' });

  for (const profile of [...profiles, liveProfile, fallback]) {
    record(validateProfile(checks, profile));
  }

  const baselineOnly = buildDistrictPersonalityProfile({ districtId: 'sanayi', day: 8 });
  const liveResource = liveProfile.criteria.find((criterion) => criterion.id === 'resource_dependency');
  const baselineResource = baselineOnly.criteria.find((criterion) => criterion.id === 'resource_dependency');
  record(assert(checks, Boolean(liveResource && baselineResource && liveResource.score > baselineResource.score), 'live modifiers separated from baseline', 'live modifiers did not affect presentation score'));
  record(assert(checks, baselineOnly.criteria.every((criterion) => criterion.sourceKinds.includes('design_baseline') || criterion.sourceKinds.includes('district_identity')), 'baseline source kinds separated', 'baseline uses live source without input'));

  const eventContext = buildDistrictPersonalityEventContext(liveProfile);
  record(assert(checks, eventContext.domainBiases.length > 0, 'event context domain biases', 'event context missing domains'));
  record(assert(checks, eventContext.pressureBiases.length > 0, 'event context pressure biases', 'event context missing pressure hints'));
  record(assert(checks, (eventContext.planLine ?? '').trim().length > 0, 'event context plan line', 'event context missing plan line'));

  const mapContext = buildDistrictPersonalityMapContext(liveProfile);
  record(assert(checks, mapContext.preferredMapRoles.length > 0, 'map context roles', 'map context missing roles'));
  record(assert(checks, mapContext.mapSignalLine.trim().length > 0, 'map context line', 'map context missing line'));
  const mapScreen = readRepo('src/features/map/screens/MapScreen.tsx');
  record(
    assert(
      checks,
      mapScreen.includes('buildDistrictPersonalityProfile'),
      'MapScreen read-only district profile',
      'MapScreen missing district profile integration',
    ),
  );
  record(
    assert(
      checks,
      !mapScreen.includes('districtPersonalityContentLines'),
      'Map UI does not import content lines directly',
      'MapScreen imports districtPersonalityContentLines',
    ),
  );

  const noPermission = buildDistrictPersonalityProfile({ districtId: 'cumhuriyet', day: 8 });
  const withPermission = buildDistrictPersonalityProfile({
    districtId: 'cumhuriyet',
    day: 8,
    unlockedPermissionIds: ['district_trust_preview'],
  });
  record(assert(checks, !isDistrictPersonalityDetailedAllowed({ profile: noPermission, permissionIds: [] }), 'no detailed without permission', 'detailed allowed without permission'));
  record(assert(checks, isDistrictPersonalityDetailedAllowed({ profile: withPermission, permissionIds: ['district_trust_preview'], criterionId: 'social_sensitivity' }), 'detailed possible with permission', 'detailed blocked with permission'));

  const day1 = buildDistrictPersonalityProfile({ districtId: 'merkez', day: 1 });
  const day1Advisor = buildDistrictPersonalityAdvisorLine(day1, { phase: 'hub', day: 1 });
  record(assert(checks, day1Advisor == null, 'Day 1 low-noise advisor helper', 'Day 1 advisor spam'));
  const advisorLine = buildDistrictPersonalityAdvisorLine(liveProfile, { phase: 'plan', day: 8, permissionVisibility: 'summary' });
  record(assert(checks, (advisorLine ?? '').trim().length > 0, 'advisor line helper', 'advisor line missing'));

  const retention = buildDistrictRetentionHint(liveProfile, { day: 8 });
  record(assert(checks, retention.isActionable, 'retention hint actionable with live source', 'retention hint not actionable'));
  const fallbackRetention = buildDistrictRetentionHint(fallback, { day: 8 });
  record(assert(checks, !fallbackRetention.isActionable, 'fallback retention non-actionable', 'fallback retention actionable'));

  record(assert(checks, profiles.some((profile) => profile.primaryArchetypeId !== 'balanced_district'), 'non-balanced archetypes produced', 'all districts balanced fallback'));
  record(assert(checks, profiles.flatMap((profile) => profile.archetypeIds).filter((id, index, arr) => arr.indexOf(id) === index).length >= 4, '4+ archetypes visible', 'too few archetypes'));
  record(assert(checks, liveProfile.criteria.some((criterion) => criterion.band === 'high'), 'Day 8+ strategic district context', 'Day 8+ lacks high criterion'));

  const packageJson = readRepo('package.json');
  record(assert(checks, packageJson.includes('verify:district-personality'), 'package verify script exists', 'missing verify script'));
  record(assert(checks, packageJson.includes('analyze:district-personality'), 'package analyzer script exists', 'missing analyzer script'));
  record(assert(checks, readRepo('docs/crevia-district-personality-criteria-foundation.md').includes('Baseline personality vs live pressure'), 'docs baseline/live section', 'docs missing baseline/live section'));

  record(assert(checks, SAVE_VERSION === DISTRICT_PERSONALITY_EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', `SAVE_VERSION changed: ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('districtPersonality'), 'persist shape unchanged', 'persist imports districtPersonality'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('districtPersonality'), 'applyDecision unchanged', 'applyDecision imports districtPersonality'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('districtPersonality'), 'dayPipeline unchanged', 'dayPipeline imports districtPersonality'));
  record(assert(checks, !readRepo('src/core/eventVariety/eventGameplayVarietyModel.ts').includes('districtPersonality'), 'event selection/profile core unchanged', 'event variety core imports districtPersonality'));

  const bindingOutcome = verifyDistrictPersonalityBindingScenario();
  for (const line of bindingOutcome.checks) {
    checks.push(line);
    if (line.startsWith('FAIL')) ok = false;
  }

  checks.push('PASS District personality binding surfaces wired read-only');

  return { ok, warn: false, checks };
}
