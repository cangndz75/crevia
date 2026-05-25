import { getProgressionMilestones } from '@/core/content/progressionRoadmap';

export type ProgressionUnlock = {
  id: string;
  title: string;
  xpRequired: number;
};

/** Roadmap milestone node'larından türetilir — tek kaynak. */
export const PROGRESSION_UNLOCKS: ProgressionUnlock[] =
  getProgressionMilestones();
