/**
 * Onboarding continuation verify.
 * Run: npm run verify:onboarding-continuation
 */

import { readFileSync } from 'node:fs';
import { assertVerifySaveVersionPolicy } from '@/core/quality/saveVersionPolicy';

import { SAVE_VERSION } from '../src/store/gamePersist';
import { ONBOARDING_CONTINUATION_STEPS, ONBOARDING_DISTRICT_OPTIONS } from '../src/features/onboarding/utils/onboardingContinuationConstants';
import {
  buildOnboardingContinuationViewModel,
  collectOnboardingContinuationStrings,
  mapOnboardingDistrictToGameDistrict,
  mapStarterDecisionToContinuationStyle,
} from '../src/features/onboarding/utils/onboardingContinuationPresentation';
import type { OnboardingDecisionStyle } from '../src/features/onboarding/utils/onboardingContinuationTypes';

type Check = {
  ok: boolean;
  label: string;
  detail?: string;
};

const checks: Check[] = [];
const repo = (path: string) => readFileSync(path, 'utf8');

function add(ok: boolean, label: string, detail?: string) {
  checks.push({ ok, label, detail });
}

const expectedSteps = [
  'region',
  'decision',
  'ece_briefing',
  'field_briefing',
  'first_impact',
  'city_reaction',
  'center_unlocked',
];
const expectedDistricts = ['merkez', 'cumhuriyet', 'sanayi', 'istasyon', 'yesilvadi'];
const expectedStyles: OnboardingDecisionStyle[] = [
  'fast_response',
  'planned_solution',
  'partial_intervention',
];
const forbiddenWords = [
  'runtime',
  'pack',
  'state',
  'engine',
  'persist',
  'AI',
  'LLM',
  'metadata',
  'panic',
  'punish',
];

add(
  ONBOARDING_CONTINUATION_STEPS.length === 7 &&
    ONBOARDING_CONTINUATION_STEPS.every((step, index) => step.id === expectedSteps[index]),
  '7-step onboarding continuation order',
);
add(
  ONBOARDING_DISTRICT_OPTIONS.length === 5 &&
    expectedDistricts.every((id) => ONBOARDING_DISTRICT_OPTIONS.some((district) => district.id === id)),
  '5 presentation districts available',
);
add(
  mapOnboardingDistrictToGameDistrict('merkez') === 'central' &&
    mapOnboardingDistrictToGameDistrict('cumhuriyet') === 'cumhuriyet' &&
    mapOnboardingDistrictToGameDistrict('sanayi') === 'industrial_market' &&
    mapOnboardingDistrictToGameDistrict('istasyon') === 'central' &&
    mapOnboardingDistrictToGameDistrict('yesilvadi') === 'central',
  'presentation districts map to existing gameplay district ids',
);
add(
  mapStarterDecisionToContinuationStyle('fast') === 'fast_response' &&
    mapStarterDecisionToContinuationStyle('planned') === 'planned_solution' &&
    mapStarterDecisionToContinuationStyle('partial') === 'partial_intervention' &&
    mapStarterDecisionToContinuationStyle(null) === 'fast_response',
  'starter decision styles and fallback',
);
add(
  mapOnboardingDistrictToGameDistrict(null) === 'central',
  'empty district fallback stays central',
);

const styleModels = expectedStyles.map((style) => buildOnboardingContinuationViewModel('merkez', style));
const styleBodies = new Set(styleModels.map((model) => model.eceIntro.body));
add(styleBodies.size === expectedStyles.length, '3 decision styles change Ece impact copy');

for (const district of ONBOARDING_DISTRICT_OPTIONS) {
  for (const style of expectedStyles) {
    const model = buildOnboardingContinuationViewModel(district.id, style);
    const strings = collectOnboardingContinuationStrings(model);
    const tooLong = strings.filter((text) => text.length > 220);
    const forbidden = strings.filter((text) =>
      forbiddenWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(text)),
    );
    add(tooLong.length === 0, `copy length guard ${district.id}/${style}`, tooLong.join(' | '));
    add(forbidden.length === 0, `forbidden technical words ${district.id}/${style}`, forbidden.join(' | '));
  }
}

const screen = repo('src/features/onboarding/screens/CreviaOnboardingScreen.tsx');
add(screen.includes('ONBOARDING_CONTINUATION_STEPS'), 'screen uses continuation step meta');
add(screen.includes('OnboardingEceBriefingCard'), 'screen renders Ece briefing continuation');
add(screen.includes('OnboardingFieldBriefingCard'), 'screen renders field briefing continuation');
add(screen.includes('OnboardingFirstImpactCard'), 'screen renders first impact continuation');
add(screen.includes('OnboardingCityReactionCard'), 'screen renders city reaction continuation');
add(screen.includes('OnboardingCenterUnlockedCard'), 'screen renders center unlocked continuation');
add(screen.includes('scrollEnabled={false}'), 'pager swipe is locked behind CTA gates');
add(screen.includes('isPrimaryDisabled'), 'selection gates are wired');
add(!screen.includes("from '@/core/game/applyDecision'"), 'screen does not import applyDecision');
add(!screen.includes('dayPipeline'), 'screen does not import dayPipeline');

const persist = repo('src/store/gamePersist.ts');
const applyDecision = repo('src/core/game/applyDecision.ts');
const dayPipeline = repo('src/core/dayPipeline/dayPipelineOrchestrator.ts');
const eventGeneration = repo('src/core/game/generateDailyEventSet.ts');
add(assertVerifySaveVersionPolicy(persist, SAVE_VERSION), 'SAVE_VERSION matches policy');
add(!applyDecision.includes('onboardingContinuation'), 'applyDecision untouched by continuation');
add(!dayPipeline.includes('onboardingContinuation'), 'dayPipeline untouched by continuation');
add(!eventGeneration.includes('onboardingContinuation'), 'event generation untouched by continuation');

for (const check of checks) {
  // eslint-disable-next-line no-console
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.label}${check.detail ? `: ${check.detail}` : ''}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\nOnboarding continuation verify failed (${failed.length} FAIL).`);
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\nOnboarding continuation verify passed (${checks.length} checks).`);
