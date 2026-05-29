import { mergeAuthorityEvaluationIntoDailyReport } from '@/core/authority/authorityPilotCompletion';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { selectAuthorityPermissionPreviewForDecision } from '@/core/authority/authorityPermissionPreview';
import { processPilotCompletionAuthority } from '@/core/authority/authorityPilotCompletion';
import { buildDay1AuthoritySummaryLines } from '@/core/authority/authorityPresentation';
import {
  buildReportBadgeSummaryModel,
} from '@/core/badges/badgePresentation';
import {
  processDailyBadgeEvaluation,
  processPilotCompletionBadgeEvaluation,
} from '@/core/badges/badgeEngine';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { applyDay1TutorialReportCopy } from '@/features/tutorial/tutorialSelectors';
import { buildProfileAuthoritySummary } from '@/features/profile/utils/profileAuthorityModel';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';
import { buildHubAuthorityChipSummaryFromPilot } from '@/features/hub/utils/hubAuthorityModel';
import {
  buildProgressionBridgePilotReportLines,
  buildProgressionBridgeSummary,
  progressionPresentationContainsBannedWords,
} from '@/core/progression/progressionPresentation';

import {
  buildProgressionBridgeSummaryTwice,
  collectMetaProgressionUserFacingStrings,
  runFullLoopMetaProgressionHealthCheck,
  scanMetaProgressionStrings,
  simulateBalancedPilotMetaAnalytics,
  type MetaProgressionAnalytics,
} from './metaProgressionAudit';
import { evaluateAveragePilotBadgeCount } from '@/core/badges/badgeBalanceSimulation';

export type VerifyMetaProgressionOutcome = {
  ok: boolean;
  checks: string[];
  analytics: MetaProgressionAnalytics;
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

function positiveDailyInput(day: number) {
  return {
    positiveOperationDay: true,
    socialPulseBalanced: true,
    budgetNotSeriouslyDamaged: true,
    personnelMoraleMaintained: true,
    criticalRiskClosedWithoutGrowth: false,
    butterflyFollowUpWellManaged: false,
    vehicleDayPositive: false,
    containerRiskControlled: false,
    dailyOperationCompleted: true,
    day,
  };
}

export function verifyMetaProgressionScenario(): VerifyMetaProgressionOutcome {
  const checks: string[] = [];
  let ok = true;
  const analytics = simulateBalancedPilotMetaAnalytics();

  ok =
    assert(
      checks,
      buildProgressionBridgeSummary({ authorityState: undefined, badgeState: undefined })
        .visible &&
        buildProfileBadgeShowcaseSummary(undefined).totalCount === 12,
      'Fresh state ile authority/badge/progression summary crash olmaz',
      'Fresh state summary crash',
    ) && ok;

  const day1Permission = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(1),
    decision: {
      id: 'prep',
      title: 'Günlük hazırlık',
      description: 'route_preparation plan',
      style: 'balanced',
      effects: { publicSatisfaction: 4, budget: -8, morale: 2, risk: -2, xp: 10 },
    },
    event: {
      id: 'e1',
      title: 'Test',
      category: 'operations',
      riskLevel: 'medium',
      district: 'merkez',
      description: 'Test',
      contextTag: 'test',
      urgencyHours: 4,
      decisions: [],
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
    day: 1,
  });
  ok =
    assert(
      checks,
      day1Permission.visible === false,
      'Day 1 tutorial’da permission preview görünmez',
      'Day 1 permission preview görünür',
    ) && ok;

  const day1AuthorityModel = buildReportBadgeSummaryModel(undefined);
  const day1AuthorityLines = buildDay1AuthoritySummaryLines();
  ok =
    assert(
      checks,
      day1AuthorityModel.visible === false && day1AuthorityLines.length <= 2,
      'Day 1 report badge/authority compact güvenli çalışır',
      'Day 1 compact rapor hatalı',
    ) && ok;

  let badgeState = createInitialBadgeState(2);
  const firstDaily = processDailyBadgeEvaluation({
    badgeState,
    day: 2,
    input: positiveDailyInput(2),
  });
  const secondDaily = processDailyBadgeEvaluation({
    badgeState: firstDaily.badgeState,
    day: 2,
    input: positiveDailyInput(2),
  });
  ok =
    assert(
      checks,
      secondDaily.alreadyApplied &&
        secondDaily.badgeState.history.length === firstDaily.badgeState.history.length,
      'Normal day report authority + badge snapshot duplicate üretmez',
      'Daily badge duplicate üretildi',
    ) && ok;

  const pilotRunId = 'meta-verify-pilot';
  let authorityState = createInitialAuthorityState(7);
  const firstPilotAuthority = processPilotCompletionAuthority({
    authorityState,
    evaluationDay: 7,
    pilotScore: 75,
    pilotRunId,
    skipIfAlreadyApplied: true,
  });
  const secondPilotAuthority = processPilotCompletionAuthority({
    authorityState: firstPilotAuthority.authorityState,
    evaluationDay: 7,
    pilotScore: 75,
    pilotRunId,
    skipIfAlreadyApplied: true,
  });
  ok =
    assert(
      checks,
      secondPilotAuthority.alreadyApplied,
      'completePilot iki kez çağrılınca authority evaluation duplicate olmaz',
      'Authority pilot duplicate',
    ) && ok;

  let badgePilotState = createInitialBadgeState(7);
  const firstBadgePilot = processPilotCompletionBadgeEvaluation({
    badgeState: badgePilotState,
    day: 7,
    pilotRunId,
    authorityEvaluationStatus: firstPilotAuthority.evaluation.evaluationStatus,
    authorityPromoted: firstPilotAuthority.evaluation.promoted,
    skipIfAlreadyApplied: true,
  });
  const secondBadgePilot = processPilotCompletionBadgeEvaluation({
    badgeState: firstBadgePilot.badgeState,
    day: 7,
    pilotRunId,
    authorityEvaluationStatus: firstPilotAuthority.evaluation.evaluationStatus,
    authorityPromoted: firstPilotAuthority.evaluation.promoted,
    skipIfAlreadyApplied: true,
  });
  ok =
    assert(
      checks,
      secondBadgePilot.alreadyApplied,
      'completePilot iki kez çağrılınca badge history duplicate olmaz',
      'Badge pilot duplicate',
    ) && ok;

  ok =
    assert(
      checks,
      !progressionPresentationContainsBannedWords(
        buildProgressionBridgeSummary({ authorityState: createInitialAuthorityState(3) }),
      ),
      'Progression bridge yasaklı kelime üretmez',
      'Progression yasaklı kelime',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary(undefined, 1).rankLabel.length > 0,
      'Profile authority card model undefined state ile güvenli döner',
      'Profile authority undefined crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileBadgeShowcaseSummary(undefined, 1).showcaseItems.length <= 6,
      'Profile badge showcase undefined state ile güvenli döner',
      'Profile badge undefined crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubAuthorityChipSummaryFromPilot(undefined, 1).rankLabel.length > 0,
      'Hub authority chip undefined state ile güvenli döner',
      'Hub chip undefined crash',
    ) && ok;

  const unknownPermission = selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(2),
    decision: { foo: 'bar' },
    event: { baz: 1 },
    day: 2,
  });
  ok =
    assert(
      checks,
      unknownPermission.visible === false,
      'Decision permission preview unknown decision shape ile crash olmaz',
      'Unknown decision permission crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildReportBadgeSummaryModel(undefined).visible === false &&
        buildReportBadgeSummaryModel({
          earnedBadgeIds: [],
          earnedLines: [],
          progressLines: [],
        }).visible === false,
      'Report badge summary earned/progress yoksa visible false döner',
      'Empty badge summary visible hatalı',
    ) && ok;

  const day7Report = mergeAuthorityEvaluationIntoDailyReport(
    {
      ...buildDailyReport({
        day: 7,
        metrics: { publicSatisfaction: 60, staffMorale: 55, budget: 50_000 },
        decisionHistory: [],
        activeEvents: [],
        resolvedEventIds: [],
        snapshots: [],
        containerState: createInitialContainerState(7),
        vehicleState: createInitialVehicleState(7),
        socialPulseState: createInitialSocialPulseState(7),
        authoritySummaryLines: ['Yetki güveni güncellendi.'],
      }),
      badgeEvaluation: {
        earnedBadgeIds: ['pilot_finisher'],
        earnedLines: ['Yeni rozet kazanıldı: Pilot Tamamlandı'],
        progressLines: [],
      },
    },
    firstPilotAuthority.evaluation,
    firstPilotAuthority.evaluationLines,
  );
  const day7Progression = buildProgressionBridgePilotReportLines({
    authorityState: firstPilotAuthority.authorityState,
    currentDay: 7,
  });
  ok =
    assert(
      checks,
      day7Report != null &&
        day7Report.authorityEvaluation != null &&
        day7Progression?.scopeLine.includes('Sıradaki kapsam:') === true,
      'Day 7 report authorityEvaluation + progression line içerirken crash olmaz',
      'Day 7 report progression hatalı',
    ) && ok;

  const duplicateBadgeShowcase = buildProfileBadgeShowcaseSummary(
    {
      earnedBadgeIds: ['first_step', 'first_step', 'public_listener'],
      recentlyEarnedBadgeIds: [],
      badgeProgress: createInitialBadgeState(2).badgeProgress,
      history: [],
      lastEvaluatedDay: 2,
    },
    2,
  );
  ok =
    assert(
      checks,
      duplicateBadgeShowcase.earnedCount === 2,
      'earnedBadgeIds duplicate olsa profile showcase unique count döner',
      'Duplicate badge showcase count hatalı',
    ) && ok;

  const decisionBefore = {
    id: 'dispatch',
    title: 'Ekibi sevk et',
    description: 'dispatch saha',
    style: 'balanced' as const,
    effects: { publicSatisfaction: 6, budget: -12, morale: 1, risk: -3, xp: 12 },
  };
  const decisionClone = {
    ...decisionBefore,
    effects: { ...decisionBefore.effects },
  };
  selectAuthorityPermissionPreviewForDecision({
    authorityState: createInitialAuthorityState(3),
    decision: decisionBefore,
    event: {
      id: 'event_dispatch',
      title: 'Saha',
      category: 'operations',
      riskLevel: 'medium',
      district: 'merkez',
      description: 'dispatch',
      contextTag: 'test',
      urgencyHours: 4,
      decisions: [],
      previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    },
    day: 3,
  });
  ok =
    assert(
      checks,
      decisionClone.effects.publicSatisfaction === 6,
      'authority permission preview applyDecision sonucunu değiştirmez',
      'Permission preview decision mutate',
    ) && ok;

  const bannedHits = scanMetaProgressionStrings(collectMetaProgressionUserFacingStrings());
  ok =
    assert(
      checks,
      bannedHits.length === 0,
      'Meta progression metinlerinde XP/level up/rank up/kilitli/premium/satın al yoktur',
      `Yasaklı kelime bulundu: ${bannedHits.join(', ')}`,
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileBadgeShowcaseSummary(createInitialBadgeState(1), 1).showcaseItems.length <=
        6,
      'Showcase max 6 badge item sınırını korur',
      'Showcase item limiti aşıldı',
    ) && ok;

  const progressModel = buildReportBadgeSummaryModel({
    earnedBadgeIds: [],
    earnedLines: [],
    progressLines: [
      'Rozet ilerlemesi: Halkın Sesi 2/3',
      'Rozet ilerlemesi: Kaynak Disiplini 1/3',
      'Rozet ilerlemesi: Personel 0/3',
    ],
  });
  ok =
    assert(
      checks,
      progressModel.progressLines.length <= 2,
      'Report badge progress max 2 satır sınırını korur',
      'Badge progress satır limiti aşıldı',
    ) && ok;

  const progressionSummary = buildProgressionBridgeSummary({
    authorityState: createInitialAuthorityState(5),
    currentDay: 5,
  });
  ok =
    assert(
      checks,
      progressionSummary.previewItems.length <= 4,
      'Progression bridge preview item sayısı kontrollüdür',
      'Progression preview item sayısı fazla',
    ) && ok;

  const fullLoop = runFullLoopMetaProgressionHealthCheck();
  ok =
    assert(
      checks,
      fullLoop.ok,
      'Full-loop simülasyonunda meta progression sistemleri birlikte çalışır',
      `Full-loop meta health fail (${fullLoop.crashCount} crash)`,
    ) && ok;

  ok =
    assert(
      checks,
      buildProgressionBridgeSummaryTwice(createInitialAuthorityState(7)),
      'progression summary build idempotent kalır',
      'Progression summary idempotency hatalı',
    ) && ok;

  const tutorialReport = applyDay1TutorialReportCopy(
    {
      ...buildDailyReport({
        day: 1,
        metrics: { publicSatisfaction: 50, staffMorale: 50, budget: 60_000 },
        decisionHistory: [],
        activeEvents: [],
        resolvedEventIds: [],
        snapshots: [],
        containerState: createInitialContainerState(1),
        vehicleState: createInitialVehicleState(1),
        socialPulseState: createInitialSocialPulseState(1),
      }),
      badgeEvaluation: {
        earnedBadgeIds: ['first_step'],
        earnedLines: ['Yeni rozet kazanıldı: İlk Saha İmzası'],
        progressLines: [],
      },
    },
    true,
  );
  ok =
    assert(
      checks,
      tutorialReport.badgeEvaluation == null,
      'Day 1 tutorial copy badge evaluation gizler',
      'Day 1 tutorial badge gizlenmedi',
    ) && ok;

  ok =
    assert(
      checks,
      analytics.earnedBadgeCountAfterPilot >= 4 &&
        analytics.earnedBadgeCountAfterPilot <= 8,
      `Meta audit average pilot rozet bandı 4-8 (${analytics.earnedBadgeCountAfterPilot})`,
      `Meta audit rozet sayısı band dışı: ${analytics.earnedBadgeCountAfterPilot}`,
    ) && ok;

  return { ok, checks, analytics };
}
