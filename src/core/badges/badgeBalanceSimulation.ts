import { BADGE_BY_ID } from './badgeConstants';
import { processDailyBadgeEvaluation, processPilotCompletionBadgeEvaluation } from './badgeEngine';
import { createInitialBadgeState } from './badgeSeed';
import type { BadgeId, EvaluateDailyBadgesInput } from './badgeTypes';

export type BadgeBalanceScenarioId =
  | 'weak_pilot'
  | 'average_pilot'
  | 'good_pilot'
  | 'excellent_pilot'
  | 'authority_heavy'
  | 'passive_safe';

export type BadgeDayInput = Omit<EvaluateDailyBadgesInput, 'badgeState' | 'day'>;

export type BadgeBalanceScenarioResult = {
  scenarioId: BadgeBalanceScenarioId;
  earnedBadgeCount: number;
  earnedBadgeIds: BadgeId[];
  progressNearCompletion: Array<{ badgeId: BadgeId; current: number; target: number }>;
  rareBadgeCount: number;
  epicBadgeCount: number;
  warnings: string[];
  status: 'PASS' | 'WARN' | 'FAIL';
};

export type BadgeBalanceAnalysis = {
  ok: boolean;
  scenarios: BadgeBalanceScenarioResult[];
  warnings: string[];
};

const SCENARIO_EXPECTED_RANGES: Record<
  BadgeBalanceScenarioId,
  { min: number; max: number; failAbove?: number }
> = {
  weak_pilot: { min: 2, max: 4 },
  average_pilot: { min: 4, max: 6, failAbove: 6 },
  good_pilot: { min: 6, max: 8 },
  excellent_pilot: { min: 8, max: 9 },
  authority_heavy: { min: 5, max: 8 },
  passive_safe: { min: 2, max: 5, failAbove: 5 },
};

function qualifyingDay(
  overrides: Partial<BadgeDayInput> = {},
): BadgeDayInput {
  return {
    dailyOperationCompleted: true,
    positiveOperationDay: true,
    socialPulseBalanced: true,
    budgetNotSeriouslyDamaged: true,
    personnelMoraleMaintained: true,
    criticalRiskClosedWithoutGrowth: false,
    butterflyFollowUpWellManaged: false,
    vehicleDayPositive: false,
    containerRiskControlled: false,
    ...overrides,
  };
}

function passiveSafeDay(): BadgeDayInput {
  return qualifyingDay({
    positiveOperationDay: false,
    socialPulseBalanced: false,
    vehicleDayPositive: false,
    containerRiskControlled: false,
    criticalRiskClosedWithoutGrowth: false,
    butterflyFollowUpWellManaged: false,
    budgetNotSeriouslyDamaged: true,
    personnelMoraleMaintained: true,
  });
}

export const BADGE_BALANCE_SCENARIO_DAYS: Record<
  BadgeBalanceScenarioId,
  BadgeDayInput[]
> = {
  weak_pilot: [
    qualifyingDay({ positiveOperationDay: false, socialPulseBalanced: false }),
    qualifyingDay({ positiveOperationDay: false, budgetNotSeriouslyDamaged: false }),
    qualifyingDay({ positiveOperationDay: true, socialPulseBalanced: false }),
    qualifyingDay({ positiveOperationDay: false }),
    qualifyingDay({ positiveOperationDay: true, budgetNotSeriouslyDamaged: false }),
    qualifyingDay({ positiveOperationDay: false, personnelMoraleMaintained: false }),
    qualifyingDay({ positiveOperationDay: true, socialPulseBalanced: false }),
  ],
  average_pilot: [
    qualifyingDay(),
    qualifyingDay(),
    qualifyingDay(),
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay({ containerRiskControlled: true }),
    qualifyingDay(),
    qualifyingDay(),
  ],
  good_pilot: [
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay({ vehicleDayPositive: true, criticalRiskClosedWithoutGrowth: true }),
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay(),
    qualifyingDay(),
    qualifyingDay(),
  ],
  excellent_pilot: [
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay({
      vehicleDayPositive: true,
      criticalRiskClosedWithoutGrowth: true,
      socialPulseBalanced: false,
    }),
    qualifyingDay({ vehicleDayPositive: true, socialPulseBalanced: false }),
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay({ vehicleDayPositive: true, butterflyFollowUpWellManaged: true }),
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay({ vehicleDayPositive: true }),
  ],
  authority_heavy: [
    qualifyingDay(),
    qualifyingDay(),
    qualifyingDay({ vehicleDayPositive: true }),
    qualifyingDay(),
    qualifyingDay({ containerRiskControlled: true }),
    qualifyingDay(),
    qualifyingDay(),
  ],
  passive_safe: [
    passiveSafeDay(),
    passiveSafeDay(),
    passiveSafeDay(),
    passiveSafeDay(),
    passiveSafeDay(),
    passiveSafeDay(),
    passiveSafeDay(),
  ],
};

export type PilotCompletionProfile = {
  authorityEvaluationStatus?: 'stable' | 'watching' | 'promotion_candidate' | 'promoted';
  authorityPromoted?: boolean;
};

const SCENARIO_PILOT_COMPLETION: Record<
  BadgeBalanceScenarioId,
  PilotCompletionProfile
> = {
  weak_pilot: { authorityEvaluationStatus: 'watching', authorityPromoted: false },
  average_pilot: { authorityEvaluationStatus: 'stable', authorityPromoted: false },
  good_pilot: { authorityEvaluationStatus: 'stable', authorityPromoted: false },
  excellent_pilot: {
    authorityEvaluationStatus: 'stable',
    authorityPromoted: false,
  },
  authority_heavy: {
    authorityEvaluationStatus: 'promotion_candidate',
    authorityPromoted: false,
  },
  passive_safe: { authorityEvaluationStatus: 'stable', authorityPromoted: false },
};

function countByRarity(badgeIds: BadgeId[], rarity: 'rare' | 'epic'): number {
  return badgeIds.filter((id) => BADGE_BY_ID[id]?.rarity === rarity).length;
}

export function simulateBadgeBalanceScenario(
  scenarioId: BadgeBalanceScenarioId,
): BadgeBalanceScenarioResult {
  const days = BADGE_BALANCE_SCENARIO_DAYS[scenarioId];
  const pilotCompletion = SCENARIO_PILOT_COMPLETION[scenarioId];
  let badgeState = createInitialBadgeState(1);

  for (let day = 1; day <= days.length; day += 1) {
    const daily = processDailyBadgeEvaluation({
      badgeState,
      day,
      input: days[day - 1] ?? qualifyingDay(),
    });
    badgeState = daily.badgeState;
  }

  const pilot = processPilotCompletionBadgeEvaluation({
    badgeState,
    day: 7,
    pilotRunId: `balance-${scenarioId}`,
    authorityEvaluationStatus: pilotCompletion.authorityEvaluationStatus,
    authorityPromoted: pilotCompletion.authorityPromoted,
  });
  badgeState = pilot.badgeState;

  const progressNearCompletion = Object.values(badgeState.badgeProgress)
    .filter(
      (progress) =>
        !progress.completed &&
        progress.current > 0 &&
        progress.current >= progress.target - 1,
    )
    .map((progress) => ({
      badgeId: progress.badgeId,
      current: progress.current,
      target: progress.target,
    }));

  const warnings: string[] = [];
  const range = SCENARIO_EXPECTED_RANGES[scenarioId];
  const earnedBadgeCount = badgeState.earnedBadgeIds.length;

  if (earnedBadgeCount >= 12) {
    warnings.push(`${scenarioId}: 12/12 rozet — ilk pilot için fazla`);
  } else if (earnedBadgeCount >= 10) {
    warnings.push(`${scenarioId}: ${earnedBadgeCount} rozet — çok güçlü pilot bandı`);
  }
  if (earnedBadgeCount > range.max) {
    warnings.push(
      `${scenarioId}: ${earnedBadgeCount} rozet > beklenen üst sınır ${range.max}`,
    );
  }
  if (earnedBadgeCount < range.min) {
    warnings.push(
      `${scenarioId}: ${earnedBadgeCount} rozet < beklenen alt sınır ${range.min}`,
    );
  }

  let status: BadgeBalanceScenarioResult['status'] = 'PASS';
  if (earnedBadgeCount >= 12) {
    status = 'FAIL';
  } else if (
    scenarioId === 'passive_safe' &&
    earnedBadgeCount > (range.failAbove ?? range.max)
  ) {
    status = 'FAIL';
  } else if (
    scenarioId === 'average_pilot' &&
    earnedBadgeCount > (range.failAbove ?? range.max)
  ) {
    status = 'WARN';
  } else if (earnedBadgeCount >= 10) {
    status = 'WARN';
  } else if (earnedBadgeCount > range.max || earnedBadgeCount < range.min) {
    status = scenarioId === 'excellent_pilot' && earnedBadgeCount < 7 ? 'WARN' : 'WARN';
  }

  return {
    scenarioId,
    earnedBadgeCount,
    earnedBadgeIds: badgeState.earnedBadgeIds,
    progressNearCompletion,
    rareBadgeCount: countByRarity(badgeState.earnedBadgeIds, 'rare'),
    epicBadgeCount: countByRarity(badgeState.earnedBadgeIds, 'epic'),
    warnings,
    status,
  };
}

export function analyzeBadgeBalance(): BadgeBalanceAnalysis {
  const scenarioIds = Object.keys(BADGE_BALANCE_SCENARIO_DAYS) as BadgeBalanceScenarioId[];
  const scenarios = scenarioIds.map((scenarioId) =>
    simulateBadgeBalanceScenario(scenarioId),
  );
  const warnings = scenarios.flatMap((scenario) => scenario.warnings);
  const ok = scenarios.every((scenario) => scenario.status !== 'FAIL');

  return { ok, scenarios, warnings };
}

export function evaluateAveragePilotBadgeCount(): number {
  return simulateBadgeBalanceScenario('average_pilot').earnedBadgeCount;
}
