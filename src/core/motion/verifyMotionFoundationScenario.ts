import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  MOTION_DENSITY_CAPS,
  MOTION_DURATION,
  MOTION_FOUNDATION_DOCS_PATH,
  MOTION_NO_NEW_DEPENDENCY_NOTE,
} from '@/core/motion/motionConstants';
import { resolveMotionDensity } from '@/core/motion/motionPresentation';
import { runManualLaunchTrackerAudit } from '@/core/manualLaunchTracker/manualLaunchTrackerAudit';
import { runReleaseCandidateAudit } from '@/core/releaseCandidate/releaseCandidateAudit';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

function readRepo(rel: string): string {
  const full = join(REPO_ROOT, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function pass(checks: string[], condition: boolean, label: string, fail = label): boolean {
  checks.push(`${condition ? 'PASS' : 'FAIL'} ${condition ? label : fail}`);
  return condition;
}

export type VerifyMotionFoundationOutcome = {
  ok: boolean;
  checks: string[];
};

export function verifyMotionFoundationScenario(): VerifyMotionFoundationOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (condition: boolean, label: string, fail = label) => {
    ok = pass(checks, condition, label, fail) && ok;
  };

  const packageJson = readRepo('package.json');
  const docs = readRepo(MOTION_FOUNDATION_DOCS_PATH);
  const motionConstants = readRepo('src/core/motion/motionConstants.ts');
  const motionAccessibility = readRepo('src/core/motion/motionAccessibility.ts');
  const sharedIndex = readRepo('src/shared/motion/index.ts');
  const sharedFiles = [
    'src/shared/motion/CreviaAnimatedCard.tsx',
    'src/shared/motion/CreviaAnimatedPressable.tsx',
    'src/shared/motion/CreviaAnimatedChip.tsx',
    'src/shared/motion/CreviaAnimatedLine.tsx',
    'src/shared/motion/CreviaMotionView.tsx',
    'src/shared/motion/CreviaSoftPulseDot.tsx',
    'src/shared/motion/useCreviaReducedMotion.ts',
    'src/shared/motion/useCreviaEntranceMotion.ts',
    'src/shared/motion/useCreviaPressMotion.ts',
  ];
  const sharedSources = sharedFiles.map(readRepo).join('\n');

  record(MOTION_DURATION.instant === 0, 'Motion duration instant token');
  record(MOTION_DURATION.fast === 120, 'Motion duration fast token');
  record(MOTION_DURATION.base === 180, 'Motion duration base token');
  record(MOTION_DURATION.medium === 260, 'Motion duration medium token');
  record(MOTION_DURATION.slow === 360, 'Motion duration slow token');
  record(MOTION_DURATION.emphasis === 480, 'Motion duration emphasis token');
  record(motionConstants.includes('screen_enter') && motionConstants.includes('cta_press'), 'MotionKind constants present');
  record(resolveMotionDensity({ day: 1 }) === 'day1_minimal', 'Day 1 minimal density');
  record(resolveMotionDensity({ day: 8 }) === 'post_pilot_highlighted', 'Day 8 highlighted density');
  record(MOTION_DENSITY_CAPS.hub.maxAnimatedItems === 3, 'Hub max 3 animated cards');
  record(MOTION_DENSITY_CAPS.decision_result.maxEmphasisItems === 2, 'Result max 2 emphasis');
  record(MOTION_DENSITY_CAPS.report.maxAnimatedItems === 3, 'Report max 3 visible animations');
  record(MOTION_DENSITY_CAPS.social.maxAnimatedItems === 2, 'Social max 2 mention animations');
  record(MOTION_DENSITY_CAPS.map.maxAnimatedItems === 0, 'Map V2 not added by foundation');

  record(motionAccessibility.includes('fallbackToStatic: true'), 'Reduced motion falls back to static');
  record(motionAccessibility.includes('allowPulseMotion: false') && motionAccessibility.includes('allowGlowMotion: false'), 'Reduced motion disables pulse/glow');
  record(motionAccessibility.includes('allowPressScale: false'), 'Reduced motion disables press scale');
  record(motionAccessibility.includes('AccessibilityInfo'), 'AccessibilityInfo reduced motion helper');
  record(motionAccessibility.includes('reduceMotionChanged'), 'Reduced motion change subscription');

  for (const file of sharedFiles) {
    record(readRepo(file).length > 0, `${file} exists`);
  }
  record(sharedIndex.includes('CreviaAnimatedCard'), 'Animated card primitive exported');
  record(sharedIndex.includes('CreviaAnimatedPressable'), 'Animated pressable primitive exported');
  record(sharedIndex.includes('CreviaAnimatedChip'), 'Animated chip primitive exported');
  record(sharedIndex.includes('CreviaAnimatedLine'), 'Animated line primitive exported');
  record(sharedIndex.includes('CreviaSoftPulseDot'), 'Soft pulse dot primitive exported');
  record(sharedSources.includes('react-native-reanimated'), 'Reanimated existing dependency used');
  record(packageJson.includes('"react-native-reanimated": "~4.1.1"'), 'Reanimated existing dependency checked');
  record(!packageJson.includes('"moti"') && !packageJson.includes('"lottie-react-native"'), 'No new motion dependency');
  record(MOTION_NO_NEW_DEPENDENCY_NOTE.includes('no new dependency'), 'No-new-dependency note');

  record(!sharedSources.includes('setInterval'), 'No setInterval in motion primitives');
  record(!/withRepeat\([^,]+,\s*-1/.test(sharedSources), 'No unbounded withRepeat in motion primitives');
  record(sharedSources.includes('reducedMotion'), 'Primitives accept reducedMotion');
  record(sharedSources.includes('accessibilityRole'), 'Pressable role is preserved');
  record(sharedSources.includes('accessibilityLabel'), 'Pressable label is preserved');

  const hub = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  const centerMotion = readRepo('src/features/hub/components/CenterMotionEnter.tsx');
  const motionTokens = readRepo('src/core/motion/motionTokens.ts');
  const motionPresets = readRepo('src/core/motion/motionPresets.ts');
  const result = readRepo('src/features/events/screens/DecisionResultScreen.tsx');
  const resultReveal = readRepo(
    'src/features/events/components/result/ResultRevealMotionSections.tsx',
  );
  const report = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  const onboarding = readRepo('src/features/onboarding/screens/CreviaOnboardingScreen.tsx');
  const social = readRepo('src/features/social/components/mentions/MentionFeedCard.tsx');
  const mapLayer = readRepo('src/features/map/components/MapReactionMotionLayer.tsx');

  record(hub.includes('CenterMotionEnter') && hub.includes('hubMotionEnabled'), 'Hub integration present');
  record(centerMotion.includes('CreviaAnimatedCard') && centerMotion.includes('surface="hub"'), 'Center motion enter uses hub surface');
  record(hub.includes('disabled={!hubMotionEnabled}') && hub.includes('index={3}'), 'Hub animation cap guarded');
  record(motionTokens.includes('MOTION_TOKEN_DURATION'), 'Center motion tokens present');
  record(motionPresets.includes('centerCtaPulseConfig'), 'Center motion presets present');
  record(result.includes('surface="decision_result"'), 'DecisionResult integration present');
  record(
    result.includes('motionKind="result_emphasis"') ||
      resultReveal.includes('motionKind="result_emphasis"'),
    'Result emphasis motion present',
  );
  record(
    result.includes('CreviaAnimatedPressable') || resultReveal.includes('CreviaAnimatedPressable'),
    'DecisionResult CTA press motion present',
  );
  record(report.includes('surface="report"'), 'Report integration present');
  record(report.includes('index={2}'), 'Report max 3 source cap visible');
  record(onboarding.includes('surface="onboarding"'), 'Onboarding integration present');
  record(onboarding.includes('scrollEnabled={false}'), 'Onboarding swipe remains disabled');
  record(social.includes('surface="social"'), 'Social light integration present');
  record(social.includes('disabled={index >= 2}'), 'Social max 2 mention animation guard');
  record(mapLayer.includes('MapReactionMotionLayer') && mapLayer.includes('withRepeat'), 'Map V1 motion layer still intact');
  record(!mapLayer.includes('CreviaSoftPulseDot'), 'Map Motion V2 not mixed into V1 layer');

  record(docs.includes('Expo SDK v54 checked'), 'Docs Expo v54 check note');
  record(docs.includes('Reanimated existing dependency checked'), 'Docs Reanimated check note');
  record(docs.includes('Reduced motion pattern checked'), 'Docs reduced motion check note');
  record(docs.includes('New dependency: none'), 'Docs new dependency none note');
  record(docs.includes('VoiceOver/TalkBack manual QA pending'), 'Docs manual accessibility QA pending');

  const persist = readRepo('src/store/gamePersist.ts');
  record(SAVE_VERSION === 26 && persist.includes('export const SAVE_VERSION = 26'), 'SAVE_VERSION unchanged');
  record(!persist.includes('motionFoundationState'), 'Persist shape unchanged');
  record(!readRepo('src/core/game/applyDecision.ts').includes('motionFoundation'), 'applyDecision unchanged');
  record(!readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('motionFoundation'), 'dayPipeline unchanged');
  record(!readRepo('src/core/game/ensureDailyEventsForDay.ts').includes('motionFoundation'), 'event generation unchanged');
  record(!readRepo('src/core/iapQa/iapManualSetupTrackerAudit.ts').includes('motionFoundation'), 'IAP state unchanged by motion');
  record(!readRepo('src/core/storeScreenshotNarrative/storeScreenshotNarrativeAudit.ts').includes('motionFoundation'), 'Store/evidence state unchanged by motion');

  const release = runReleaseCandidateAudit();
  record(release.publicLaunchDecision === 'blocked', 'Public launch remains blocked');
  const tracker = runManualLaunchTrackerAudit();
  record(
    tracker.evidenceLog.filter((evidence) => evidence.status === 'verified').length === 0,
    'Evidence verified remains 0',
  );

  record(packageJson.includes('"verify:motion-foundation"'), 'package.json script present');
  record(existsSync(join(REPO_ROOT, 'scripts/verify-motion-foundation.ts')), 'verify script exists');

  return { ok, checks };
}
