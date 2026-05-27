import { LEVEL_THRESHOLDS, MAX_LEVEL } from '@/core/xp/constants';
import type { LevelProgress, PlayerProgress } from '@/core/xp/types';
import { getUnlockedAuthoritiesForLevel } from '@/core/xp/authorityUnlocks';

export function getLevelFromTotalXp(totalXp: number): number {
  const safeXp = Math.max(0, totalXp);
  let level = LEVEL_THRESHOLDS[0].level;

  for (const threshold of LEVEL_THRESHOLDS) {
    if (safeXp >= threshold.requiredTotalXp) {
      level = threshold.level;
    }
  }

  return level;
}

export function getCurrentLevelProgress(totalXp: number): LevelProgress {
  const safeXp = Math.max(0, totalXp);
  const currentLevel = getLevelFromTotalXp(safeXp);
  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel)!;
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1);

  const currentLevelXp = safeXp - currentThreshold.requiredTotalXp;

  if (!nextThreshold) {
    return {
      currentLevel,
      currentLevelXp,
      nextLevelXp: 0,
      xpToNextLevel: 0,
      progressRatio: 1,
    };
  }

  const nextLevelXp = nextThreshold.requiredTotalXp - currentThreshold.requiredTotalXp;
  const xpToNextLevel = Math.max(0, nextThreshold.requiredTotalXp - safeXp);
  const progressRatio =
    nextLevelXp > 0 ? Math.min(1, Math.max(0, currentLevelXp / nextLevelXp)) : 1;

  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
    xpToNextLevel,
    progressRatio,
  };
}

export function createInitialPlayerProgress(): PlayerProgress {
  return buildPlayerProgress(0, []);
}

export function buildPlayerProgress(
  totalXp: number,
  xpHistory: PlayerProgress['xpHistory'],
): PlayerProgress {
  const levelProgress = getCurrentLevelProgress(totalXp);

  return {
    totalXp,
    currentLevel: levelProgress.currentLevel,
    currentLevelXp: levelProgress.currentLevelXp,
    nextLevelXp: levelProgress.nextLevelXp,
    xpToNextLevel: levelProgress.xpToNextLevel,
    unlockedAuthorities: getUnlockedAuthoritiesForLevel(levelProgress.currentLevel),
    xpHistory,
  };
}

export function isMaxLevel(level: number): boolean {
  return level >= MAX_LEVEL;
}
