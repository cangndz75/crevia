import {
  claimDailyGoalXp,
  createDailyGoalForDay,
  processDailyGoalEvent,
  updateDailyGoalProgress,
} from '@/core/dailyGoals/dailyGoalEngine';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';

export function verifyDailyGoalScenario(): { passed: boolean; message: string } {
  const scenario1 = verifyScenario1();
  if (!scenario1.passed) {
    return scenario1;
  }

  const scenario2 = verifyScenario2();
  if (!scenario2.passed) {
    return scenario2;
  }

  return { passed: true, message: 'Daily goal senaryoları geçti' };
}

function verifyScenario1(): { passed: boolean; message: string } {
  let goal = createDailyGoalForDay(1);
  let progress = createInitialPlayerProgress();

  goal = updateDailyGoalProgress(goal, {
    type: 'decision_applied',
    event: { severity: 'high' },
  });

  if (!goal.completed || goal.progress !== 1) {
    return {
      passed: false,
      message: `Senaryo 1: hedef tamamlanmadı (progress=${goal.progress}, completed=${goal.completed})`,
    };
  }

  const firstClaim = claimDailyGoalXp({ playerProgress: progress, goal });
  if (firstClaim.playerProgress.totalXp !== 25) {
    return {
      passed: false,
      message: `Senaryo 1: totalXp beklenen 25, alınan ${firstClaim.playerProgress.totalXp}`,
    };
  }
  if (!firstClaim.goal.xpClaimed) {
    return { passed: false, message: 'Senaryo 1: xpClaimed true olmalı' };
  }
  if (firstClaim.xpTransaction?.category !== 'daily_goal') {
    return { passed: false, message: 'Senaryo 1: transaction category daily_goal olmalı' };
  }

  const secondClaim = claimDailyGoalXp({
    playerProgress: firstClaim.playerProgress,
    goal: firstClaim.goal,
  });
  if (secondClaim.playerProgress.totalXp !== 25) {
    return {
      passed: false,
      message: 'Senaryo 1: ikinci claim totalXp değiştirmemeli',
    };
  }

  return { passed: true, message: 'Senaryo 1 geçti' };
}

function verifyScenario2(): { passed: boolean; message: string } {
  let goal = createDailyGoalForDay(4);
  let progress = createInitialPlayerProgress();

  const first = processDailyGoalEvent({
    goal,
    playerProgress: progress,
    event: {
      type: 'decision_applied',
      decisionResult: { riskDelta: -1 },
    },
  });

  goal = first.goal;
  progress = first.playerProgress;

  if (goal.completed || goal.progress !== 1) {
    return {
      passed: false,
      message: `Senaryo 2: ilk riskDelta sonrası progress 1/2 olmalı (progress=${goal.progress})`,
    };
  }
  if (first.claim) {
    return { passed: false, message: 'Senaryo 2: ilk adımda XP claim olmamalı' };
  }

  const second = processDailyGoalEvent({
    goal,
    playerProgress: progress,
    event: {
      type: 'decision_applied',
      decisionResult: { riskDelta: -1 },
    },
  });

  if (!second.goal.completed || second.goal.progress !== 2) {
    return {
      passed: false,
      message: `Senaryo 2: ikinci riskDelta sonrası completed olmalı (progress=${second.goal.progress})`,
    };
  }
  if (!second.claim || second.playerProgress.totalXp !== 30) {
    return {
      passed: false,
      message: `Senaryo 2: +30 XP bekleniyor, totalXp=${second.playerProgress.totalXp}`,
    };
  }

  return { passed: true, message: 'Senaryo 2 geçti' };
}

export function assertDailyGoalScenario(): void {
  const result = verifyDailyGoalScenario();
  if (!result.passed) {
    throw new Error(result.message);
  }
}
