import {
  applySocialDecisionEffect,
  inferSocialDecisionAction,
} from './socialDecisionEffects';
import {
  applySocialQuickAction,
  buildSocialQuickActionOutcomeId,
  hasSocialQuickActionLock,
} from './socialQuickAction';
import { processSocialPulseEndOfDay } from './socialEngine';
import {
  normalizeSocialPulseState,
  processSocialPulseAfterDecisionForStore,
  processSocialPulseEndOfDayForStore,
} from './socialIntegration';
import { normalizePersistedSocialPulseState } from './socialSeed';
import {
  SOCIAL_NEIGHBORHOOD_IDS,
  SOCIAL_OUTCOME_HISTORY_MAX,
  SOCIAL_VALUE_MAX,
  SOCIAL_VALUE_MIN,
} from './socialConstants';
import {
  calculateNeighborhoodSocialScore,
  clampSocialValue,
  isSocialRiskLevel,
  recomputeSocialPulseAggregates,
  selectNeighborhoodSocialRisks,
  selectSocialMentionFeed,
  selectActiveSocialTopics,
} from './socialSelectors';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { buildDailySocialSummaryLines } from '@/features/social/utils/socialReportModel';
import { applyDay1TutorialReportCopy } from '@/features/tutorial/tutorialSelectors';

import { createInitialSocialPulseState } from './socialSeed';
import type {
  NeighborhoodSocialProfile,
  SocialPulseState,
  SocialTopic,
} from './socialTypes';

function isProfileMetricsInRange(profile: NeighborhoodSocialProfile): boolean {
  const fields = [
    profile.trust,
    profile.complaintHeat,
    profile.misinformation,
    profile.gratitude,
    profile.crisisSpread,
    profile.mediaAttention,
    profile.fatigue,
  ];
  return fields.every(
    (value) => value >= SOCIAL_VALUE_MIN && value <= SOCIAL_VALUE_MAX,
  );
}

function cloneProfile(
  profile: NeighborhoodSocialProfile,
): NeighborhoodSocialProfile {
  return {
    ...profile,
    activeTopicIds: [...profile.activeTopicIds],
  };
}

/** Aşama 2 — social core skeleton smoke doğrulaması. */
export function verifySocialScenario(): {
  ok: boolean;
  checks: string[];
} {
  const checks: string[] = [];
  let ok = true;

  const pass = (message: string) => checks.push(`PASS ${message}`);
  const fail = (message: string) => {
    ok = false;
    checks.push(`FAIL ${message}`);
  };

  const initial = createInitialSocialPulseState(3);

  if (Object.keys(initial.neighborhoods).length === SOCIAL_NEIGHBORHOOD_IDS.length) {
    pass('createInitialSocialPulseState produces 5 neighborhoods');
  } else {
    fail(
      `expected ${SOCIAL_NEIGHBORHOOD_IDS.length} neighborhoods, got ${Object.keys(initial.neighborhoods).length}`,
    );
  }

  const allProfilesInRange = Object.values(initial.neighborhoods).every(
    isProfileMetricsInRange,
  );
  if (allProfilesInRange) {
    pass('all neighborhood values are within 0-100');
  } else {
    fail('neighborhood metric out of range');
  }

  if (
    initial.globalPulseScore >= SOCIAL_VALUE_MIN &&
    initial.globalPulseScore <= SOCIAL_VALUE_MAX
  ) {
    pass('globalPulseScore within 0-100');
  } else {
    fail(`globalPulseScore out of range: ${initial.globalPulseScore}`);
  }

  if (isSocialRiskLevel(initial.globalRiskLevel)) {
    pass('globalRiskLevel is valid enum');
  } else {
    fail(`invalid globalRiskLevel: ${initial.globalRiskLevel}`);
  }

  if (initial.globalPulseScore >= 45 && initial.globalPulseScore <= 80) {
    pass(`seed globalPulseScore in 45-80 band: ${initial.globalPulseScore}`);
  } else {
    fail(
      `seed globalPulseScore expected 45-80, got ${initial.globalPulseScore}`,
    );
  }

  const seedCriticalCount = selectNeighborhoodSocialRisks(initial).filter(
    (r) => r.riskLevel === 'critical',
  ).length;
  if (seedCriticalCount === 0) {
    pass('seed has no critical neighborhoods');
  } else {
    fail(`seed critical neighborhoods: ${seedCriticalCount}`);
  }

  const broken = normalizeSocialPulseState({
    neighborhoods: { merkez: { trust: 999, complaintHeat: -5 } },
    activeTopics: 'not-array',
    mentionFeed: null,
    outcomeHistory: undefined,
    globalPulseScore: 'bad',
    globalRiskLevel: 'unknown',
    lastProcessedDay: 'bad',
  });

  if (
    Object.keys(broken.neighborhoods).length === SOCIAL_NEIGHBORHOOD_IDS.length &&
    isProfileMetricsInRange(broken.neighborhoods.merkez!) &&
    Array.isArray(broken.activeTopics) &&
    Array.isArray(broken.mentionFeed) &&
    Array.isArray(broken.outcomeHistory) &&
    isSocialRiskLevel(broken.globalRiskLevel)
  ) {
    pass('broken state normalizes to valid shape');
  } else {
    fail('broken state normalization incomplete');
  }

  const missingNeighborhood = normalizeSocialPulseState({
    neighborhoods: {
      merkez: initial.neighborhoods.merkez,
    },
    activeTopics: [],
    mentionFeed: [],
    outcomeHistory: [],
    lastProcessedDay: 2,
  });

  if (
    Object.keys(missingNeighborhood.neighborhoods).length ===
    SOCIAL_NEIGHBORHOOD_IDS.length
  ) {
    pass('missing neighborhoods filled from seed defaults');
  } else {
    fail('missing neighborhoods not filled');
  }

  const merkezProfile = initial.neighborhoods.merkez!;
  const scoreA = calculateNeighborhoodSocialScore(merkezProfile);
  const scoreB = calculateNeighborhoodSocialScore(merkezProfile);
  if (scoreA === scoreB) {
    pass('calculateNeighborhoodSocialScore is deterministic');
  } else {
    fail('neighborhood score not deterministic');
  }

  const higherComplaint = cloneProfile(merkezProfile);
  higherComplaint.complaintHeat = clampSocialValue(
    merkezProfile.complaintHeat + 25,
  );
  if (
    calculateNeighborhoodSocialScore(higherComplaint) <
    calculateNeighborhoodSocialScore(merkezProfile)
  ) {
    pass('higher complaintHeat lowers score');
  } else {
    fail('complaintHeat did not lower score');
  }

  const higherTrust = cloneProfile(merkezProfile);
  higherTrust.trust = clampSocialValue(merkezProfile.trust + 20);
  if (
    calculateNeighborhoodSocialScore(higherTrust) >
    calculateNeighborhoodSocialScore(merkezProfile)
  ) {
    pass('higher trust raises score');
  } else {
    fail('trust did not raise score');
  }

  const higherMisinfo = cloneProfile(merkezProfile);
  higherMisinfo.misinformation = clampSocialValue(
    merkezProfile.misinformation + 25,
  );
  if (
    calculateNeighborhoodSocialScore(higherMisinfo) <
    calculateNeighborhoodSocialScore(merkezProfile)
  ) {
    pass('higher misinformation lowers score');
  } else {
    fail('misinformation did not lower score');
  }

  const higherCrisis = cloneProfile(merkezProfile);
  higherCrisis.crisisSpread = clampSocialValue(merkezProfile.crisisSpread + 25);
  if (
    calculateNeighborhoodSocialScore(higherCrisis) <
    calculateNeighborhoodSocialScore(merkezProfile)
  ) {
    pass('higher crisisSpread lowers score');
  } else {
    fail('crisisSpread did not lower score');
  }

  const higherFatigue = cloneProfile(merkezProfile);
  higherFatigue.fatigue = clampSocialValue(merkezProfile.fatigue + 25);
  if (
    calculateNeighborhoodSocialScore(higherFatigue) <
    calculateNeighborhoodSocialScore(merkezProfile)
  ) {
    pass('higher fatigue lowers score');
  } else {
    fail('fatigue did not lower score');
  }

  const higherGratitude = cloneProfile(merkezProfile);
  higherGratitude.gratitude = clampSocialValue(merkezProfile.gratitude + 20);
  if (
    calculateNeighborhoodSocialScore(higherGratitude) >
    calculateNeighborhoodSocialScore(merkezProfile)
  ) {
    pass('higher gratitude raises score');
  } else {
    fail('gratitude did not raise score');
  }

  const topics = selectActiveSocialTopics(initial);
  const mentions = selectSocialMentionFeed(initial);
  if (Array.isArray(topics) && Array.isArray(mentions)) {
    pass('mentionFeed and activeTopics remain arrays');
  } else {
    fail('topics or mentions not arrays');
  }

  const staleGlobal: SocialPulseState = {
    ...initial,
    globalPulseScore: 12,
    globalRiskLevel: 'low',
  };
  const recomputed = recomputeSocialPulseAggregates(staleGlobal);
  const expectedScore = calculateGlobalFromState(recomputed);
  if (
    recomputed.globalPulseScore === expectedScore &&
    recomputed.globalPulseScore !== 12 &&
    isSocialRiskLevel(recomputed.globalRiskLevel)
  ) {
    pass('recomputeSocialPulseAggregates updates global score/risk');
  } else {
    fail('recomputeSocialPulseAggregates did not refresh aggregates');
  }

  const legacyPersist = normalizePersistedSocialPulseState(undefined, 4);
  if (
    Object.keys(legacyPersist.neighborhoods).length ===
      SOCIAL_NEIGHBORHOOD_IDS.length &&
    legacyPersist.lastProcessedDay >= 0
  ) {
    pass('persist fallback seeds when socialPulseState missing');
  } else {
    fail('persist fallback failed');
  }

  const partialPersist = normalizePersistedSocialPulseState(
    { neighborhoods: {}, mentionFeed: 'x' },
    2,
  );
  if (
    partialPersist.mentionFeed.length >= 0 &&
    Object.keys(partialPersist.neighborhoods).length ===
      SOCIAL_NEIGHBORHOOD_IDS.length
  ) {
    pass('partial persisted payload normalizes safely');
  } else {
    fail('partial persist normalization failed');
  }

  const driftBase = createInitialSocialPulseState(1);
  const driftDay1 = processSocialPulseEndOfDay(
    { ...driftBase, lastProcessedDay: 0 },
    1,
  );
  if (driftDay1.lastProcessedDay === 1) {
    pass('processSocialPulseEndOfDay updates lastProcessedDay');
  } else {
    fail(`lastProcessedDay expected 1, got ${driftDay1.lastProcessedDay}`);
  }

  const driftTwice = processSocialPulseEndOfDay(driftDay1, 1);
  if (driftTwice === driftDay1) {
    pass('processSocialPulseEndOfDay is idempotent for same day');
  } else {
    fail('second drift on same day mutated state');
  }

  const noGratitudeTopics: SocialPulseState = {
    ...driftBase,
    lastProcessedDay: 0,
    activeTopics: driftBase.activeTopics.filter((t) => t.type !== 'gratitude_wave'),
    neighborhoods: {
      ...driftBase.neighborhoods,
      yesilvadi: {
        ...driftBase.neighborhoods.yesilvadi!,
        activeTopicIds: [],
      },
    },
  };
  const gratitudeBefore = noGratitudeTopics.neighborhoods.yesilvadi!.gratitude;
  const afterNoGratitudeWave = processSocialPulseEndOfDay(noGratitudeTopics, 1);
  if (afterNoGratitudeWave.neighborhoods.yesilvadi!.gratitude < gratitudeBefore) {
    pass('gratitude decays without gratitude_wave topic');
  } else {
    fail('gratitude did not decay without gratitude_wave');
  }

  const highComplaintState: SocialPulseState = {
    ...driftBase,
    lastProcessedDay: 0,
    activeTopics: [],
    neighborhoods: {
      ...driftBase.neighborhoods,
      sanayi: {
        ...driftBase.neighborhoods.sanayi!,
        trust: 70,
        complaintHeat: 70,
        crisisSpread: 40,
        activeTopicIds: [],
      },
    },
  };
  const trustBeforeHighComplaint =
    highComplaintState.neighborhoods.sanayi!.trust;
  const afterHighComplaint = processSocialPulseEndOfDay(highComplaintState, 1);
  if (afterHighComplaint.neighborhoods.sanayi!.trust < trustBeforeHighComplaint) {
    pass('high complaintHeat reduces trust');
  } else {
    fail('high complaintHeat did not reduce trust');
  }

  const lowStressState: SocialPulseState = {
    ...driftBase,
    lastProcessedDay: 0,
    activeTopics: [],
    neighborhoods: {
      ...driftBase.neighborhoods,
      yesilvadi: {
        ...driftBase.neighborhoods.yesilvadi!,
        trust: 60,
        complaintHeat: 25,
        crisisSpread: 20,
        activeTopicIds: [],
      },
    },
  };
  const trustBeforeRecovery = lowStressState.neighborhoods.yesilvadi!.trust;
  const afterRecovery = processSocialPulseEndOfDay(lowStressState, 1);
  if (afterRecovery.neighborhoods.yesilvadi!.trust > trustBeforeRecovery) {
    pass('low complaint and crisis enables trust recovery');
  } else {
    fail('trust recovery did not apply');
  }

  const misinfoTopic: SocialTopic = {
    id: 'topic-misinfo-test',
    neighborhoodId: 'cumhuriyet',
    type: 'misinformation',
    title: 'Test söylenti',
    severity: 'high',
    intensity: 70,
    createdDay: 1,
  };
  const misinfoState: SocialPulseState = {
    ...driftBase,
    lastProcessedDay: 0,
    activeTopics: [misinfoTopic],
    neighborhoods: {
      ...driftBase.neighborhoods,
      cumhuriyet: {
        ...driftBase.neighborhoods.cumhuriyet!,
        misinformation: 20,
        activeTopicIds: [misinfoTopic.id],
      },
    },
  };
  const misinfoBefore = misinfoState.neighborhoods.cumhuriyet!.misinformation;
  const afterMisinfo = processSocialPulseEndOfDay(misinfoState, 1);
  if (afterMisinfo.neighborhoods.cumhuriyet!.misinformation > misinfoBefore) {
    pass('active misinformation topic raises misinformation');
  } else {
    fail('misinformation topic did not raise misinformation');
  }

  const gratitudeTopic: SocialTopic = {
    id: 'topic-gratitude-test',
    neighborhoodId: 'yesilvadi',
    type: 'gratitude_wave',
    title: 'Teşekkür dalgası',
    severity: 'medium',
    intensity: 55,
    createdDay: 1,
  };
  const gratitudeState: SocialPulseState = {
    ...driftBase,
    lastProcessedDay: 0,
    activeTopics: [gratitudeTopic],
    neighborhoods: {
      ...driftBase.neighborhoods,
      yesilvadi: {
        ...driftBase.neighborhoods.yesilvadi!,
        gratitude: 30,
        trust: 60,
        activeTopicIds: [gratitudeTopic.id],
      },
    },
  };
  const gBefore = gratitudeState.neighborhoods.yesilvadi!;
  const afterGratitudeWave = processSocialPulseEndOfDay(gratitudeState, 1);
  const gAfter = afterGratitudeWave.neighborhoods.yesilvadi!;
  if (gAfter.gratitude > gBefore.gratitude && gAfter.trust > gBefore.trust) {
    pass('gratitude_wave raises gratitude and trust');
  } else {
    fail('gratitude_wave did not raise gratitude/trust');
  }

  const expiredTopic: SocialTopic = {
    id: 'topic-expired',
    neighborhoodId: 'merkez',
    type: 'crisis_pressure',
    title: 'Süresi dolmuş',
    severity: 'high',
    intensity: 80,
    createdDay: 1,
    expiresDay: 2,
  };
  const expiredState: SocialPulseState = {
    ...driftBase,
    lastProcessedDay: 0,
    activeTopics: [expiredTopic],
    neighborhoods: {
      ...driftBase.neighborhoods,
      merkez: {
        ...driftBase.neighborhoods.merkez!,
        activeTopicIds: [expiredTopic.id],
      },
    },
  };
  const afterExpire = processSocialPulseEndOfDay(expiredState, 2);
  if (!afterExpire.activeTopics.some((t) => t.id === expiredTopic.id)) {
    pass('expired topic removed from activeTopics');
  } else {
    fail('expired topic still in activeTopics');
  }
  if (!afterExpire.neighborhoods.merkez!.activeTopicIds.includes(expiredTopic.id)) {
    pass('profile.activeTopicIds cleared after topic expiry');
  } else {
    fail('expired topic id still on profile');
  }

  const driftForRecompute = processSocialPulseEndOfDay(
    { ...driftBase, lastProcessedDay: 0 },
    1,
  );
  const expectedGlobal = calculateGlobalFromState(driftForRecompute);
  if (driftForRecompute.globalPulseScore === expectedGlobal) {
    pass('globalPulseScore recomputed after drift');
  } else {
    fail('globalPulseScore mismatch after drift');
  }

  const allDriftedInRange = Object.values(driftForRecompute.neighborhoods).every(
    isProfileMetricsInRange,
  );
  if (allDriftedInRange) {
    pass('all values remain 0-100 after drift');
  } else {
    fail('drift produced out-of-range neighborhood values');
  }

  let passiveSim = createInitialSocialPulseState(1);
  passiveSim = { ...passiveSim, lastProcessedDay: 0, activeTopics: [] };
  for (let d = 1; d <= 7; d += 1) {
    passiveSim = processSocialPulseEndOfDay(passiveSim, d);
  }
  if (
    passiveSim.globalPulseScore >= 35 &&
    passiveSim.globalPulseScore <= 85
  ) {
    pass('7-day passive simulation keeps globalPulseScore in 35-85');
  } else {
    fail(
      `7-day globalPulseScore out of range: ${passiveSim.globalPulseScore}`,
    );
  }

  const storeDrift = processSocialPulseEndOfDayForStore(undefined, 3);
  if (
    Object.keys(storeDrift.neighborhoods).length === SOCIAL_NEIGHBORHOOD_IDS.length &&
    storeDrift.lastProcessedDay === 3
  ) {
    pass('processSocialPulseEndOfDayForStore normalizes and drifts');
  } else {
    fail('store wrapper drift failed');
  }

  const decisionBase = createInitialSocialPulseState(7);
  const communicateBefore = decisionBase.neighborhoods.merkez!;
  const communicateResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Şikayet ve kamuoyu baskısı' },
    decision: { id: 'comm-1', title: 'Halka bilgilendir ve şeffaf açıklama yap' },
    day: 7,
  });
  const communicateAfter = communicateResult.state.neighborhoods.merkez!;
  if (
    communicateResult.action === 'communicate' &&
    communicateAfter.trust > communicateBefore.trust
  ) {
    pass('communicate action raises trust');
  } else {
    fail('communicate action did not raise trust');
  }

  if (communicateAfter.misinformation < communicateBefore.misinformation) {
    pass('communicate action lowers misinformation');
  } else {
    fail('communicate action did not lower misinformation');
  }

  const dispatchBefore = decisionBase.neighborhoods.sanayi!;
  const dispatchResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Kriz yayılımı', neighborhoodId: 'sanayi' },
    decision: { id: 'disp-1', title: 'Saha ekibi yönlendir ve müdahale başlat' },
    day: 7,
  });
  const dispatchAfter = dispatchResult.state.neighborhoods.sanayi!;
  if (
    dispatchResult.action === 'dispatch_team' &&
    dispatchAfter.complaintHeat < dispatchBefore.complaintHeat &&
    dispatchAfter.crisisSpread < dispatchBefore.crisisSpread
  ) {
    pass('dispatch_team lowers complaintHeat and crisisSpread');
  } else {
    fail('dispatch_team did not lower complaintHeat/crisisSpread');
  }

  const silentBefore = decisionBase.neighborhoods.cumhuriyet!;
  const silentResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Kriz', neighborhoodId: 'cumhuriyet' },
    decision: { id: 'sil-1', title: 'Sessiz kal, bekle ve görmezden gel' },
    day: 7,
  });
  const silentAfter = silentResult.state.neighborhoods.cumhuriyet!;
  if (
    silentResult.action === 'stay_silent' &&
    silentAfter.trust < silentBefore.trust &&
    silentAfter.misinformation > silentBefore.misinformation &&
    silentAfter.crisisSpread > silentBefore.crisisSpread
  ) {
    pass('stay_silent lowers trust and raises misinformation/crisisSpread');
  } else {
    fail('stay_silent effect mismatch');
  }

  const permBefore = decisionBase.neighborhoods.istasyon!;
  const permResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Altyapı şikayeti', neighborhoodId: 'istasyon' },
    decision: { id: 'perm-1', title: 'Kalıcı altyapı yenileme yatırımı' },
    day: 7,
  });
  const permAfter = permResult.state.neighborhoods.istasyon!;
  if (
    permResult.action === 'permanent_solution' &&
    permAfter.complaintHeat < permBefore.complaintHeat &&
    permAfter.fatigue < permBefore.fatigue &&
    permAfter.crisisSpread < permBefore.crisisSpread
  ) {
    pass('permanent_solution lowers complaintHeat, fatigue, crisisSpread');
  } else {
    fail('permanent_solution effect mismatch');
  }

  const monitorBefore = decisionBase.neighborhoods.yesilvadi!;
  const monitorResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Sosyal nabız', neighborhoodId: 'yesilvadi' },
    decision: { id: 'mon-1', title: 'Sosyal medyayı izle ve raporla' },
    day: 7,
  });
  const monitorAfter = monitorResult.state.neighborhoods.yesilvadi!;
  const monitorTrustDelta = monitorAfter.trust - monitorBefore.trust;
  const monitorMisinfoDelta =
    monitorAfter.misinformation - monitorBefore.misinformation;
  if (
    monitorResult.action === 'monitor' &&
    monitorTrustDelta >= 0 &&
    monitorTrustDelta <= 3 &&
    monitorMisinfoDelta <= 0 &&
    monitorMisinfoDelta >= -3
  ) {
    pass('monitor applies small safe deltas');
  } else {
    fail('monitor effect out of expected safe range');
  }

  const noneBefore = createInitialSocialPulseState(2);
  const noneResult = applySocialDecisionEffect(noneBefore, {
    decision: { id: 'none-1', title: 'Rutin bütçe onayı' },
    day: 2,
  });
  if (noneResult.action === 'none') {
    pass('none action leaves state stable');
  } else {
    fail(`expected none action, got ${noneResult.action}`);
  }
  const noneProfilesOk = Object.values(noneResult.state.neighborhoods).every(
    isProfileMetricsInRange,
  );
  if (noneProfilesOk && noneResult.pulseDelta === 0) {
    pass('none action keeps clamped neighborhood metrics');
  } else {
    fail('none action disturbed metrics or pulseDelta');
  }

  const unknownNeighborhoodResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Kriz', neighborhoodId: 'bilinmeyen-mahalle' },
    decision: { id: 'unk-1', title: 'Halka bilgilendir' },
    day: 7,
  });
  if (
    unknownNeighborhoodResult.targetNeighborhoodId === 'merkez' &&
    unknownNeighborhoodResult.state.neighborhoods.merkez != null
  ) {
    pass('unknown neighborhood id falls back safely');
  } else {
    fail('unknown neighborhood fallback failed');
  }

  const historySeed = createInitialSocialPulseState(4);
  const paddedHistory = Array.from({ length: SOCIAL_OUTCOME_HISTORY_MAX }, (_, i) => ({
    id: `old-outcome-${i}`,
    title: `Kayıt ${i}`,
    description: 'Eski',
    pulseDelta: 0,
    createdDay: 1,
    neighborhoodId: 'merkez' as const,
  }));
  const historyState: SocialPulseState = {
    ...historySeed,
    outcomeHistory: paddedHistory,
  };
  const historyResult = applySocialDecisionEffect(historyState, {
    event: { title: 'Şikayet' },
    decision: { id: 'hist-1', title: 'Basın açıklaması ile bilgilendir' },
    day: 4,
  });
  if (
    historyResult.state.outcomeHistory.length === SOCIAL_OUTCOME_HISTORY_MAX &&
    historyResult.state.outcomeHistory[0]?.title === 'Açıklama Yapıldı'
  ) {
    pass('outcomeHistory prepends entry and respects max 12');
  } else {
    fail('outcomeHistory cap or ordering failed');
  }

  const recomputeResult = applySocialDecisionEffect(decisionBase, {
    event: { title: 'Kamuoyu', neighborhoodId: 'merkez' },
    decision: { id: 'rec-1', title: 'Kalıcı sistemli çözüm' },
    day: 7,
  });
  const expectedGlobalAfterDecision = calculateGlobalFromState(recomputeResult.state);
  if (recomputeResult.state.globalPulseScore === expectedGlobalAfterDecision) {
    pass('globalPulseScore recomputed after decision effect');
  } else {
    fail('globalPulseScore mismatch after decision');
  }

  const priorityAction = inferSocialDecisionAction(
    { title: 'Sosyal kriz' },
    {
      title:
        'Kalıcı altyapı yenile, ekip yönlendir ve halka bilgilendir',
    },
  );
  if (priorityAction === 'permanent_solution') {
    pass('action priority favors permanent_solution over dispatch/communicate');
  } else {
    fail(`priority classification expected permanent_solution, got ${priorityAction}`);
  }

  const dispatchVsCommunicate = inferSocialDecisionAction(
    { title: 'Şikayet' },
    { title: 'Ekip yönlendir ve açıklama yap' },
  );
  if (dispatchVsCommunicate === 'dispatch_team') {
    pass('action priority favors dispatch_team over communicate');
  } else {
    fail(`expected dispatch_team over communicate, got ${dispatchVsCommunicate}`);
  }

  const storeAfterDecision = processSocialPulseAfterDecisionForStore(undefined, {
    event: { title: 'Kriz' },
    decision: { id: 'store-1', title: 'Sosyal takip ve analiz' },
    day: 5,
  });
  if (
    Object.keys(storeAfterDecision.neighborhoods).length ===
      SOCIAL_NEIGHBORHOOD_IDS.length &&
    storeAfterDecision.outcomeHistory.length >= 1
  ) {
    pass('processSocialPulseAfterDecisionForStore handles undefined state');
  } else {
    fail('store after-decision wrapper failed on undefined state');
  }

  const feedTopic: SocialTopic = {
    id: 'preserve-topic',
    neighborhoodId: 'merkez',
    type: 'complaint_wave',
    title: 'Korunacak konu',
    severity: 'high',
    intensity: 70,
    createdDay: 1,
  };
  const preserveState: SocialPulseState = {
    ...decisionBase,
    activeTopics: [feedTopic],
    mentionFeed: [
      {
        id: 'mention-keep',
        neighborhoodId: 'merkez',
        type: 'complaint',
        authorName: 'Test',
        message: 'Korunmalı',
        createdDay: 1,
        minuteOffset: 0,
        likes: 0,
        replies: 0,
      },
    ],
    neighborhoods: {
      ...decisionBase.neighborhoods,
      merkez: {
        ...decisionBase.neighborhoods.merkez!,
        activeTopicIds: [feedTopic.id],
      },
    },
  };
  const preserveResult = applySocialDecisionEffect(preserveState, {
    event: { title: 'Şikayet' },
    decision: { id: 'pres-1', title: 'Duyuru ile bilgilendir' },
    day: 7,
  });
  if (
    preserveResult.state.activeTopics.length === 1 &&
    preserveResult.state.mentionFeed.length === 1
  ) {
    pass('decision effect preserves activeTopics and mentionFeed');
  } else {
    fail('decision effect removed activeTopics or mentionFeed');
  }

  const postDecisionInRange = Object.values(preserveResult.state.neighborhoods).every(
    isProfileMetricsInRange,
  );
  if (postDecisionInRange) {
    pass('all neighborhood metrics stay 0-100 after decision effect');
  } else {
    fail('decision effect produced out-of-range metrics');
  }

  const quickState = createInitialSocialPulseState(5);
  const primaryTopic = quickState.activeTopics[0];
  const topicId = primaryTopic?.id ?? 'topic-merkez-flooding';
  const merkezBeforeQuick = quickState.neighborhoods.merkez!;

  const quickCommunicate = applySocialQuickAction(quickState, {
    topicId,
    action: 'communicate',
    day: 5,
  });
  const merkezAfterCommunicate = quickCommunicate.state.neighborhoods.merkez!;
  if (
    quickCommunicate.success &&
    quickCommunicate.action === 'communicate' &&
    merkezAfterCommunicate.trust > merkezBeforeQuick.trust
  ) {
    pass('applySocialQuickAction communicate changes socialPulseState');
  } else {
    fail('applySocialQuickAction communicate did not update trust');
  }

  const sanayiBeforeDispatch = quickCommunicate.state.neighborhoods.sanayi!;
  const quickDispatch = applySocialQuickAction(quickCommunicate.state, {
    topicId: 'topic-sanayi-service-delay',
    action: 'dispatch_team',
    day: 5,
  });
  const sanayiAfterDispatch = quickDispatch.state.neighborhoods.sanayi!;
  if (
    quickDispatch.success &&
    sanayiAfterDispatch.complaintHeat < sanayiBeforeDispatch.complaintHeat &&
    sanayiAfterDispatch.crisisSpread < sanayiBeforeDispatch.crisisSpread
  ) {
    pass('applySocialQuickAction dispatch_team lowers complaintHeat/crisisSpread');
  } else {
    fail('applySocialQuickAction dispatch_team effect mismatch');
  }

  const silentBase = createInitialSocialPulseState(6);
  const merkezBeforeSilent = silentBase.neighborhoods.merkez!;
  const quickSilent = applySocialQuickAction(silentBase, {
    topicId: 'topic-merkez-flooding',
    action: 'stay_silent',
    day: 6,
  });
  const merkezAfterSilent = quickSilent.state.neighborhoods.merkez!;
  if (
    quickSilent.success &&
    merkezAfterSilent.trust < merkezBeforeSilent.trust &&
    merkezAfterSilent.misinformation > merkezBeforeSilent.misinformation &&
    merkezAfterSilent.crisisSpread > merkezBeforeSilent.crisisSpread
  ) {
    pass('applySocialQuickAction stay_silent raises risk metrics');
  } else {
    fail('applySocialQuickAction stay_silent effect mismatch');
  }

  const lockBase = createInitialSocialPulseState(3);
  const firstQuick = applySocialQuickAction(lockBase, {
    topicId: 'topic-merkez-flooding',
    action: 'communicate',
    day: 3,
  });
  const secondQuick = applySocialQuickAction(firstQuick.state, {
    topicId: 'topic-merkez-flooding',
    action: 'dispatch_team',
    day: 3,
  });
  if (
    firstQuick.success &&
    !secondQuick.success &&
    secondQuick.blocked &&
    hasSocialQuickActionLock(firstQuick.state, 'topic-merkez-flooding', 3)
  ) {
    pass('applySocialQuickAction blocks duplicate topic action same day');
  } else {
    fail('applySocialQuickAction duplicate guard failed');
  }

  const fallbackQuick = applySocialQuickAction(createInitialSocialPulseState(4), {
    action: 'communicate',
    day: 4,
  });
  if (fallbackQuick.success && fallbackQuick.state.neighborhoods.merkez != null) {
    pass('applySocialQuickAction works without topicId (merkez fallback)');
  } else {
    fail('applySocialQuickAction missing topicId fallback failed');
  }

  const outcomeId = buildSocialQuickActionOutcomeId(topicId, 'communicate', 5);
  if (quickCommunicate.state.outcomeHistory.some((entry) => entry.id === outcomeId)) {
    pass('applySocialQuickAction appends outcomeHistory entry');
  } else {
    fail('applySocialQuickAction outcomeHistory entry missing');
  }

  if (
    quickCommunicate.state.activeTopics.length === quickState.activeTopics.length &&
    quickCommunicate.state.mentionFeed.length === quickState.mentionFeed.length
  ) {
    pass('applySocialQuickAction preserves activeTopics and mentionFeed');
  } else {
    fail('applySocialQuickAction removed activeTopics or mentionFeed');
  }

  const quickMetricsOk = Object.values(quickCommunicate.state.neighborhoods).every(
    isProfileMetricsInRange,
  );
  if (quickMetricsOk) {
    pass('applySocialQuickAction keeps metrics within 0-100');
  } else {
    fail('applySocialQuickAction produced out-of-range metrics');
  }

  const persistedQuick = applySocialQuickAction(createInitialSocialPulseState(2), {
    topicId: 'topic-merkez-flooding',
    action: 'communicate',
    day: 2,
  });
  const hydratedQuick = normalizePersistedSocialPulseState(persistedQuick.state, 2);
  if (hasSocialQuickActionLock(hydratedQuick, 'topic-merkez-flooding', 2)) {
    pass('quick action spam guard survives persist hydrate');
  } else {
    fail('quick action lock lost after persist hydrate');
  }

  const afterQuickEod = processSocialPulseEndOfDay(persistedQuick.state, 2);
  const quickOutcomeKept = afterQuickEod.outcomeHistory.some((entry) =>
    entry.id.startsWith('social-action-'),
  );
  if (quickOutcomeKept) {
    pass('end of day drift preserves quick action outcomeHistory');
  } else {
    fail('end of day removed quick action outcomeHistory');
  }

  const multiTopicBase = createInitialSocialPulseState(5);
  const merkezQuick = applySocialQuickAction(multiTopicBase, {
    topicId: 'topic-merkez-flooding',
    action: 'communicate',
    day: 5,
  });
  const sanayiQuick = applySocialQuickAction(merkezQuick.state, {
    topicId: 'topic-sanayi-service-delay',
    action: 'dispatch_team',
    day: 5,
  });
  if (merkezQuick.success && sanayiQuick.success) {
    pass('different topics allow multiple quick actions same day');
  } else {
    fail('different topics quick action same day failed');
  }

  const emptyTopicsQuick = applySocialQuickAction(
    { ...createInitialSocialPulseState(1), activeTopics: [] },
    { action: 'communicate', day: 1 },
  );
  if (
    emptyTopicsQuick.success &&
    emptyTopicsQuick.state.neighborhoods.merkez != null
  ) {
    pass('empty activeTopics quick action uses merkez fallback');
  } else {
    fail('empty activeTopics quick action fallback failed');
  }

  const seedForHotTopic = createInitialSocialPulseState(3);
  const primaryCrisis = seedForHotTopic.activeTopics.find(
    (topic) => topic.id === 'topic-merkez-flooding',
  );
  if (primaryCrisis != null && primaryCrisis.type === 'crisis_pressure') {
    pass('seed activeTopics includes primary crisis topic for UI binding');
  } else {
    fail('seed activeTopics missing expected crisis topic');
  }

  const reportSeedState = createInitialSocialPulseState(2);
  const reportLines = buildDailySocialSummaryLines(reportSeedState, { day: 2 });
  if (reportLines.length >= 1 && reportLines.length <= 2) {
    pass('buildDailySocialSummaryLines produces max 2 lines');
  } else {
    fail('buildDailySocialSummaryLines line count out of range');
  }

  if (
    buildDailySocialSummaryLines(undefined).length === 0 &&
    buildDailySocialSummaryLines(null).length === 0
  ) {
    pass('buildDailySocialSummaryLines safe for null/undefined');
  } else {
    fail('buildDailySocialSummaryLines null/undefined not empty');
  }

  const criticalNeighborhoods = Object.fromEntries(
    Object.entries(reportSeedState.neighborhoods).map(([id, profile]) => [
      id,
      {
        ...profile,
        trust: 8,
        complaintHeat: 92,
        misinformation: 88,
        crisisSpread: 90,
        gratitude: 4,
        fatigue: 80,
      },
    ]),
  );
  const criticalState = recomputeSocialPulseAggregates({
    ...reportSeedState,
    neighborhoods: criticalNeighborhoods,
  });
  const criticalLines = buildDailySocialSummaryLines(criticalState, { day: 2 });
  if (
    criticalLines[0]?.includes('kritik') ||
    criticalLines[0]?.includes('baskı')
  ) {
    pass('buildDailySocialSummaryLines critical score warning line');
  } else {
    fail('buildDailySocialSummaryLines missing critical warning');
  }

  const topicOnlyLines = buildDailySocialSummaryLines(
    createInitialSocialPulseState(3),
    { day: 3 },
  );
  if (
    topicOnlyLines.some(
      (line) => line.includes('gündemde') || line.includes('kriz'),
    )
  ) {
    pass('buildDailySocialSummaryLines active topic neighborhood line');
  } else {
    fail('buildDailySocialSummaryLines missing topic line');
  }

  const quickReportDay = 4;
  const quickForReport = applySocialQuickAction(
    createInitialSocialPulseState(quickReportDay),
    {
      topicId: 'topic-merkez-flooding',
      action: 'communicate',
      day: quickReportDay,
    },
  );
  const quickLines = buildDailySocialSummaryLines(quickForReport.state, {
    day: quickReportDay,
  });
  if (
    quickLines.length <= 2 &&
    quickLines.some((line) => line.includes('Açıklama'))
  ) {
    pass('buildDailySocialSummaryLines prefers today social-action outcome');
  } else {
    fail('buildDailySocialSummaryLines missing today outcome line');
  }

  const day1SocialReport = buildDailyReport({
    day: 1,
    metrics: {
      publicSatisfaction: 55,
      budget: 100_000,
      staffMorale: 60,
    },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
    socialPulseState: createInitialSocialPulseState(1),
    socialPulseStateBefore: createInitialSocialPulseState(1),
  });
  const day1TutorialReport = applyDay1TutorialReportCopy(day1SocialReport, true);
  if (
    day1TutorialReport.socialSummaryLines == null ||
    day1TutorialReport.socialSummaryLines.length === 0
  ) {
    pass('Day 1 tutorial report hides socialSummaryLines');
  } else {
    fail('Day 1 tutorial report should hide social summary');
  }

  return { ok, checks };
}

function calculateGlobalFromState(state: SocialPulseState): number {
  const profiles = Object.values(state.neighborhoods);
  if (profiles.length === 0) {
    return 0;
  }
  const total = profiles.reduce(
    (sum, profile) => sum + calculateNeighborhoodSocialScore(profile),
    0,
  );
  return clampSocialValue(total / profiles.length);
}

export function runVerifySocialScenario(): void {
  const result = verifySocialScenario();
  for (const line of result.checks) {
    // eslint-disable-next-line no-console
    console.log(`[social] ${line}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[social] ${result.ok ? 'PASS' : 'FAIL'}`);
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  /verifySocialScenario(?:\.ts)?$/i.test(process.argv[1]);

if (isDirectRun) {
  runVerifySocialScenario();
  const result = verifySocialScenario();
  process.exit(result.ok ? 0 : 1);
}
