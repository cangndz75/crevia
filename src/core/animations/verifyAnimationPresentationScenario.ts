import {
  allAnimationDurationsUnderCap,
  assertNoAnimationPresentationForbiddenWords,
  collectAnimationPresentationStrings,
  isPositiveAuthorityGainSummary,
  isStage1ComponentAllowed,
  pressScalePresetMinScaleSafe,
  selectedPulsePresetHasLoopGuard,
  STAGE1_ANIMATED_COMPONENTS,
} from './animationPresentation';
import { ANIMATION_DISTANCE, ANIMATION_DURATION, ANIMATION_SCALE } from './animationTokens';
import { getAnimationPreset } from './animationPresetDefinitions';
import { resolvePressScaleNoOp } from './animationPresentation';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { verifyMapUiScenario } from '@/features/map/verifyMapUiScenario';
import { verifyReportUiScenario } from '@/features/reports/verifyReportUiScenario';
import { verifyHubUiScenario } from '@/features/hub/verifyHubUiScenario';
import { verifyDispatchFieldUiScenario } from '@/features/events/verifyDispatchFieldUiScenario';
import { verifyEventResultUiScenario } from '@/features/events/verifyEventResultUiScenario';
import { verifyLeaderboardUiScenario } from '@/features/leaderboard/verifyLeaderboardUiScenario';
import { verifyProfileUiScenario } from '@/features/profile/verifyProfileUiScenario';
import { verifyPostPilotUxScenario } from '@/core/postPilot/verifyPostPilotUxScenario';

export type VerifyAnimationPresentationOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyAnimationPresentationScenario(): VerifyAnimationPresentationOutcome {
  const checks: Check[] = [];

  assert(
    checks,
    allAnimationDurationsUnderCap(),
    'animation tokens duration değerleri 300ms altında kalır',
    Object.values(ANIMATION_DURATION).join(', '),
  );

  assert(
    checks,
    pressScalePresetMinScaleSafe(),
    'pressScale preset scale 0.95 altına düşmez',
    String(getAnimationPreset('pressScale').minScale),
  );

  assert(
    checks,
    resolvePressScaleNoOp(true, false) === true,
    'usePressScale disabled/no-op mode güvenli model üretir',
    'disabled=true',
  );

  assert(
    checks,
    getAnimationPreset('cardEntrance').translateY === ANIMATION_DISTANCE.entrance,
    'entrance preset opacity/translateY final state güvenlidir',
    `translateY=${ANIMATION_DISTANCE.entrance}`,
  );

  assert(
    checks,
    resolvePressScaleNoOp(false, true) === true,
    'reduceMotion true iken animation helper no-op/final state döner',
    'reduceMotion=true',
  );

  assert(
    checks,
    selectedPulsePresetHasLoopGuard() &&
      getAnimationPreset('selectedPulse').endlessLoop === false,
    'selectedPulse endless heavy loop olarak işaretlenmez veya guard içerir',
    `repeat=${getAnimationPreset('selectedPulse').pulseRepeatCount}`,
  );

  assert(
    checks,
    STAGE1_ANIMATED_COMPONENTS.length === 12 &&
      STAGE1_ANIMATED_COMPONENTS.every(isStage1ComponentAllowed) &&
      !isStage1ComponentAllowed('HubScreen'),
    'Applied component listesi Aşama 1 kapsamını aşmaz',
    STAGE1_ANIMATED_COMPONENTS.join(', '),
  );

  assert(
    checks,
    ANIMATION_SCALE.press >= 0.95,
    'press scale token güvenli',
    String(ANIMATION_SCALE.press),
  );

  assert(
    checks,
    isPositiveAuthorityGainSummary(['Yetki güveni arttı.']),
    'positive authority marker tanınır',
    'ok',
  );

  const forbidden = collectAnimationPresentationStrings().reduce(
    (sum, text) => sum + assertNoAnimationPresentationForbiddenWords(text),
    0,
  );
  assert(checks, forbidden === 0, 'Yasaklı kelime taraması 0 döner', String(forbidden));

  const hub = verifyHubUiScenario();
  assert(
    checks,
    hub.failCount === 0,
    'Hub CTA animasyon entegrasyonu callback davranışını değiştirmez',
    `fail=${hub.failCount}`,
  );

  const dispatchField = verifyDispatchFieldUiScenario();
  assert(
    checks,
    dispatchField.failCount === 0,
    'Dispatch/Field CTA callback davranışını değiştirmez',
    `fail=${dispatchField.failCount}`,
  );

  const reportUi = verifyReportUiScenario();
  assert(
    checks,
    reportUi.ok,
    'Report CTA callback davranışını değiştirmez',
    reportUi.ok ? 'ok' : 'fail',
  );

  const mapUi = verifyMapUiScenario();
  assert(
    checks,
    mapUi.failCount === 0,
    'MapPin selected feedback mevcut selectedPin davranışını değiştirmez',
    `fail=${mapUi.failCount}`,
  );

  const fullUx = verifyFullUxFlowScenario();
  assert(
    checks,
    fullUx.audit.flowHealth === 'PASS',
    'full UX flow verify bozulmaz',
    fullUx.audit.flowHealth,
  );

  const eventResult = verifyEventResultUiScenario();
  assert(checks, eventResult.failCount === 0, 'event-result-ui verify bozulmaz', `fail=${eventResult.failCount}`);

  const leaderboard = verifyLeaderboardUiScenario();
  assert(
    checks,
    leaderboard.failCount === 0,
    'leaderboard-ui verify bozulmaz',
    `fail=${leaderboard.failCount}`,
  );

  const profile = verifyProfileUiScenario();
  assert(checks, profile.failCount === 0, 'profile-ui verify bozulmaz', `fail=${profile.failCount}`);

  const postPilot = verifyPostPilotUxScenario();
  assert(checks, postPilot.ok, 'post-pilot-ux verify bozulmaz', postPilot.ok ? 'ok' : 'fail');

  const failCount = checks.filter((c) => !c.ok).length;
  const checksOut = checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`);

  return { ok: failCount === 0, failCount, checks: checksOut };
}
