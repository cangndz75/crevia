import { applyDecisionXp } from '@/core/xp/applyDecisionXp';
import { getUnlockedAuthoritiesForLevel } from '@/core/xp/authorityUnlocks';
import {
  buildPlayerProgress,
  createInitialPlayerProgress,
  getCurrentLevelProgress,
} from '@/core/xp/levelProgress';

export type ScenarioVerificationResult = {
  passed: boolean;
  message: string;
};

const EXPECTED_BREAKDOWN_TOTAL = 108;
const EXPECTED_TOTAL_XP = 143;
const EXPECTED_CURRENT_LEVEL_XP = 23;
const EXPECTED_XP_TO_NEXT = 177;

export function verifyApplyDecisionXpScenario(): ScenarioVerificationResult {
  const initialProgress = buildPlayerProgress(35, []);

  const result = applyDecisionXp({
    playerProgress: initialProgress,
    day: 2,
    event: {
      id: 'event_market_blocked_sidewalk',
      title: 'Pazar Yüklemesi Kaldırımı Kapattı',
      severity: 'high',
      districtType: 'pazar',
    },
    decisionResult: {
      satisfactionDelta: 0.3,
      riskDelta: -2,
      budgetSpent: 4000,
      expectedBudget: 5000,
      staffFatigueDelta: 8,
      districtBonusFlags: {
        trafficReduced: true,
      },
    },
    dailyGoalCompleted: false,
    butterflyPositive: false,
    tutorialBonus: false,
  });

  const levelProgress = getCurrentLevelProgress(result.playerProgress.totalXp);
  const expectedAuthorities = getUnlockedAuthoritiesForLevel(2);

  const checks: [boolean, string][] = [
    [
      result.xpBreakdown.total === EXPECTED_BREAKDOWN_TOTAL,
      `breakdown total ${result.xpBreakdown.total} !== ${EXPECTED_BREAKDOWN_TOTAL}`,
    ],
    [
      result.playerProgress.totalXp === EXPECTED_TOTAL_XP,
      `totalXp ${result.playerProgress.totalXp} !== ${EXPECTED_TOTAL_XP}`,
    ],
    [result.leveledUp === true, `leveledUp beklenen true, alınan ${result.leveledUp}`],
    [
      result.previousLevel === 1 && result.newLevel === 2,
      `level ${result.previousLevel}->${result.newLevel}, beklenen 1->2`,
    ],
    [
      levelProgress.currentLevelXp === EXPECTED_CURRENT_LEVEL_XP,
      `currentLevelXp ${levelProgress.currentLevelXp} !== ${EXPECTED_CURRENT_LEVEL_XP}`,
    ],
    [
      levelProgress.xpToNextLevel === EXPECTED_XP_TO_NEXT,
      `xpToNextLevel ${levelProgress.xpToNextLevel} !== ${EXPECTED_XP_TO_NEXT}`,
    ],
    [
      result.unlockedAuthorities.length === expectedAuthorities.length &&
        expectedAuthorities.every((id) => result.unlockedAuthorities.includes(id)),
      'unlockedAuthorities level 2 ile uyuşmuyor',
    ],
    [
      result.xpTransactions.length > 0,
      'xpTransactions boş',
    ],
  ];

  const failed = checks.find(([ok]) => !ok);
  if (failed) {
    return { passed: false, message: failed[1] };
  }

  return {
    passed: true,
    message: 'applyDecisionXp senaryosu geçti',
  };
}

export function assertApplyDecisionXpScenario(): void {
  const result = verifyApplyDecisionXpScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}

/** Store başlangıç değeri doğrulaması */
export function verifyInitialPlayerProgress(): ScenarioVerificationResult {
  const progress = createInitialPlayerProgress();
  if (progress.totalXp !== 0 || progress.currentLevel !== 1) {
    return {
      passed: false,
      message: `createInitialPlayerProgress beklenmeyen değer: xp=${progress.totalXp} level=${progress.currentLevel}`,
    };
  }
  return { passed: true, message: 'initial playerProgress geçerli' };
}
