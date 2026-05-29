import {
  buildAuthorityDailySummaryLines,
  buildDay1AuthoritySummaryLines,
  buildOperationPreviewAuthoritySummary,
  buildPilotAuthorityCompletionPresentation,
} from '@/core/authority/authorityPresentation';
import {
  buildAuthorityPermissionPreviewLine,
  buildAuthorityPermissionPreviewTone,
  selectAuthorityPermissionPreviewForDecision,
} from '@/core/authority/authorityPermissionPreview';
import { processPilotCompletionAuthority } from '@/core/authority/authorityPilotCompletion';
import {
  applyDailyAuthorityTrustGain,
  calculateDailyAuthorityTrustGain,
} from '@/core/authority/authorityEngine';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityState } from '@/core/authority/authorityTypes';
import {
  buildReportBadgeSummaryModel,
  buildBadgeSummaryLines,
} from '@/core/badges/badgePresentation';
import { evaluateAveragePilotBadgeCount } from '@/core/badges/badgeBalanceSimulation';
import { runFullLoopAnalysis } from '@/core/fullLoop/runFullLoopSimulation';
import {
  buildProgressionBridgePilotReportLines,
  buildProgressionBridgeSummary,
  collectProgressionPresentationStrings,
  progressionPresentationContainsBannedWords,
} from '@/core/progression/progressionPresentation';
import { buildProfileAuthoritySummary } from '@/features/profile/utils/profileAuthorityModel';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';
import { buildHubAuthorityChipSummaryFromPilot } from '@/features/hub/utils/hubAuthorityModel';

export const META_PROGRESSION_BANNED_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'yetkin yetersiz',
  'premium',
  'satın al',
  'paywall',
] as const;

export type MetaProgressionAnalytics = {
  averageDailyAuthorityTrustGain: number;
  earnedBadgeCountAfterPilot: number;
  finalFormalRankId: string;
  progressionPrimaryPreview: string;
  warningCount: number;
  warnings: string[];
};

export function metaProgressionTextContainsBannedWords(text: string): string[] {
  const haystack = text.toLowerCase();
  return META_PROGRESSION_BANNED_WORDS.filter((word) => {
    if (word === 'xp') {
      return /\bxp\b/.test(haystack);
    }
    return haystack.includes(word);
  });
}

export function scanMetaProgressionStrings(strings: string[]): string[] {
  const hits = new Set<string>();
  for (const line of strings) {
    for (const word of metaProgressionTextContainsBannedWords(line)) {
      hits.add(word);
    }
  }
  return [...hits];
}

export function collectMetaProgressionUserFacingStrings(): string[] {
  const authorityState = createInitialAuthorityState(7);
  const gain = calculateDailyAuthorityTrustGain(
    { day: 2, mainEventResolved: true, sideEventsResolvedCount: 1 },
    authorityState,
  );
  const afterGain = applyDailyAuthorityTrustGain(authorityState, gain, 2);

  const strings = [
    ...buildDay1AuthoritySummaryLines(),
    ...buildAuthorityDailySummaryLines(afterGain.lastDailyGain, afterGain),
    ...buildBadgeSummaryLines({
      earnedBadgeIds: ['first_step'],
      earnedLines: ['Yeni rozet kazanıldı: İlk Saha İmzası'],
      progressLines: ['Rozet ilerlemesi: Halkın Sesi 2/3'],
    }),
    buildReportBadgeSummaryModel({
      earnedBadgeIds: ['first_step'],
      earnedLines: [],
      progressLines: ['Rozet ilerlemesi: Halkın Sesi 2/3'],
    }).title,
    ...collectProgressionPresentationStrings(buildProgressionBridgeSummary()),
    buildProfileAuthoritySummary(undefined, 1).rankLabel,
    buildProfileAuthoritySummary(undefined, 1).progressSubtitle,
    buildProfileBadgeShowcaseSummary(undefined, 1).earnedCountLabel,
    buildHubAuthorityChipSummaryFromPilot(undefined, 1).rankLabel,
    buildHubAuthorityChipSummaryFromPilot(undefined, 1).progressLine,
    buildOperationPreviewAuthoritySummary(undefined, 7).mainOperationRequirementLabel,
    selectAuthorityPermissionPreviewForDecision({
      authorityState: afterGain,
      decision: {
        id: 'route_preparation',
        title: 'Günlük rota hazırlığı',
        description: 'preparation plan',
        style: 'balanced',
        effects: {
          publicSatisfaction: 4,
          budget: -8,
          morale: 2,
          risk: -2,
          xp: 10,
        },
      },
      event: {
        id: 'event',
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
      day: 3,
    }).line,
    buildAuthorityPermissionPreviewLine(
      'daily_preparation_authority',
      buildAuthorityPermissionPreviewTone('daily_preparation_authority', true),
    ).line,
    buildProgressionBridgePilotReportLines({ authorityState: afterGain })?.scopeLine ?? '',
    buildProgressionBridgePilotReportLines({ authorityState: afterGain })?.trustLine ?? '',
    buildPilotAuthorityCompletionPresentation(
      {
        day: 7,
        pilotScore: 75,
        trustAtEvaluation: 460,
        previousFormalRankId: 'field_coordinator',
        evaluationStatus: 'promotion_candidate',
        promoted: false,
        summaryLines: [],
      },
      afterGain,
    )?.authorityTitle ?? '',
  ];

  return strings.filter(Boolean);
}

export function simulateBalancedPilotMetaAnalytics(): MetaProgressionAnalytics {
  let authorityState = createInitialAuthorityState(1);
  const dailyGains: number[] = [];
  const warnings: string[] = [];

  for (let day = 1; day <= 7; day += 1) {
    const gainSnapshot = calculateDailyAuthorityTrustGain(
      {
        day,
        mainEventResolved: true,
        sideEventsResolvedCount: 1,
        dailyGoalsCompletedCount: 1,
        budgetNotSeriouslyDamaged: true,
        personnelMoraleMaintained: true,
        socialPulseBalanced: true,
      },
      authorityState,
    );
    dailyGains.push(gainSnapshot.netGain);
    authorityState = applyDailyAuthorityTrustGain(authorityState, gainSnapshot, day);
  }

  const pilotRunId = 'meta-audit-pilot';
  const authorityPilot = processPilotCompletionAuthority({
    authorityState,
    evaluationDay: 7,
    pilotScore: 72,
    pilotRunId,
    skipIfAlreadyApplied: true,
  });
  authorityState = authorityPilot.authorityState;

  const earnedBadgeCountAfterPilot = evaluateAveragePilotBadgeCount();

  const progression = buildProgressionBridgeSummary({
    authorityState,
    currentDay: 7,
  });

  if (earnedBadgeCountAfterPilot > 8) {
    warnings.push(
      `Pilot sonrası ${earnedBadgeCountAfterPilot} rozet — ödül yoğunluğu yüksek olabilir`,
    );
  } else if (earnedBadgeCountAfterPilot >= 9) {
    warnings.push(
      `Pilot sonrası ${earnedBadgeCountAfterPilot} rozet — üst band sınırında`,
    );
  }
  if (earnedBadgeCountAfterPilot >= 10) {
    warnings.push(
      `Pilot sonrası ${earnedBadgeCountAfterPilot} rozet — sadece çok güçlü pilot bandı`,
    );
  }
  if (earnedBadgeCountAfterPilot < 4) {
    warnings.push(
      `Pilot sonrası ${earnedBadgeCountAfterPilot} rozet — ortalama pilot bandının altında`,
    );
  }
  if (authorityState.formalRankId === 'operations_responsible') {
    warnings.push('Pilot sonrası Operasyon Sorumlusu açıldı — pacing kontrol edilmeli');
  }
  const nearCount = progression.previewItems.filter((item) => item.status === 'near').length;
  if (nearCount >= 3) {
    warnings.push(`Progression Bridge ${nearCount} öğede "yaklaşıyor" gösteriyor`);
  }

  return {
    averageDailyAuthorityTrustGain:
      dailyGains.length > 0
        ? Math.round(
            (dailyGains.reduce((sum, value) => sum + value, 0) / dailyGains.length) * 10,
          ) / 10
        : 0,
    earnedBadgeCountAfterPilot,
    finalFormalRankId: authorityState.formalRankId,
    progressionPrimaryPreview: progression.primaryPreview?.title ?? '—',
    warningCount: warnings.length,
    warnings,
  };
}

export function runFullLoopMetaProgressionHealthCheck(): {
  ok: boolean;
  scenarioCount: number;
  crashCount: number;
} {
  const analysis = runFullLoopAnalysis();
  const crashCount = analysis.scenarios.reduce((sum, scenario) => sum + scenario.crashes, 0);
  return {
    ok: crashCount === 0 && analysis.scenarios.length > 0,
    scenarioCount: analysis.scenarios.length,
    crashCount,
  };
}

export function buildProgressionBridgeSummaryTwice(
  authorityState: AuthorityState,
): boolean {
  const first = buildProgressionBridgeSummary({ authorityState, currentDay: 7 });
  const second = buildProgressionBridgeSummary({ authorityState, currentDay: 7 });
  return (
    first.previewItems.length === second.previewItems.length &&
    first.nextActionLine === second.nextActionLine &&
    first.primaryPreview?.id === second.primaryPreview?.id
  );
}
