import { getUnlockedAuthoritiesForLevel } from '@/core/xp/authorityUnlocks';
import {
  mapDecisionResultToXpInput,
  type MapDecisionResultToXpInputParams,
  type XpDecisionLike,
  type XpDecisionResultLike,
  type XpDistrictLike,
  type XpEventLike,
} from '@/core/xp/xpDecisionAdapter';
import {
  applyXpTransactions,
  breakdownToXpTransactions,
  calculateEventXpBreakdown,
} from '@/core/xp/xpEngine';
import type { PlayerProgress, XpBreakdown, XpTransaction } from '@/core/xp/types';

export type ApplyDecisionXpParams = {
  playerProgress: PlayerProgress;
  day: number;
  event: XpEventLike;
  decision?: XpDecisionLike;
  decisionResult: XpDecisionResultLike;
  district?: XpDistrictLike;
  dailyGoalCompleted?: boolean;
  butterflyPositive?: boolean;
  tutorialBonus?: boolean;
};

export type ApplyDecisionXpResult = {
  playerProgress: PlayerProgress;
  xpBreakdown: XpBreakdown;
  xpTransactions: XpTransaction[];
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  unlockedAuthorities: string[];
};

export function applyDecisionXp(params: ApplyDecisionXpParams): ApplyDecisionXpResult {
  const mapParams: MapDecisionResultToXpInputParams = {
    day: params.day,
    event: params.event,
    decision: params.decision,
    decisionResult: params.decisionResult,
    district: params.district,
    dailyGoalCompleted: params.dailyGoalCompleted,
    butterflyPositive: params.butterflyPositive,
    tutorialBonus: params.tutorialBonus,
  };

  const xpInput = mapDecisionResultToXpInput(mapParams);
  const xpBreakdown = calculateEventXpBreakdown(xpInput);
  const xpTransactions = breakdownToXpTransactions(xpBreakdown, {
    day: params.day,
    sourceId: params.event.id,
    sourceType: 'event',
  });

  const applyResult = applyXpTransactions(params.playerProgress, xpTransactions);

  const unlockedAuthorities = applyResult.leveledUp
    ? getUnlockedAuthoritiesForLevel(applyResult.newLevel)
    : [];

  return {
    playerProgress: applyResult.progress,
    xpBreakdown,
    xpTransactions,
    leveledUp: applyResult.leveledUp,
    previousLevel: applyResult.previousLevel,
    newLevel: applyResult.newLevel,
    unlockedAuthorities,
  };
}
