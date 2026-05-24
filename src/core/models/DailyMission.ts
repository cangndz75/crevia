export type DailyMissionIcon = 'flame' | 'shield' | 'happy' | 'check';

export type DailyMissionStatus = 'active' | 'completed' | 'pending';

export type DailyMission = {
  id: string;
  title: string;
  description: string;
  icon: DailyMissionIcon;
  current: number;
  target: number;
  xpReward: number;
  budgetReward?: number;
  status: DailyMissionStatus;
};
