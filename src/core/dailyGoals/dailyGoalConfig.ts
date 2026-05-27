import type { DailyGoalConfigEntry } from '@/core/dailyGoals/types';

export const DAILY_GOAL_CONFIG_BY_DAY: Record<number, DailyGoalConfigEntry> = {
  1: {
    type: 'resolve_critical_event',
    title: '1 kritik olayı çöz',
    target: 1,
    xpReward: 25,
  },
  2: {
    type: 'use_quick_action',
    title: '2 hızlı aksiyon kullan',
    target: 2,
    xpReward: 20,
  },
  3: {
    type: 'keep_staff_fatigue_under',
    title: 'Personel yorgunluğunu 70 altında tut',
    target: 1,
    xpReward: 25,
  },
  4: {
    type: 'reduce_risk',
    title: 'Operasyon riskini 2 azalt',
    target: 2,
    xpReward: 30,
  },
  5: {
    type: 'improve_satisfaction',
    title: 'Halk memnuniyetini artır',
    target: 1,
    xpReward: 25,
  },
  6: {
    type: 'resolve_events_count',
    title: '2 olayı çözüme ulaştır',
    target: 2,
    xpReward: 35,
  },
  7: {
    type: 'stay_under_budget',
    title: 'Günü bütçe aşmadan tamamla',
    target: 1,
    xpReward: 40,
  },
};

export const FALLBACK_DAILY_GOAL_CONFIG: DailyGoalConfigEntry =
  DAILY_GOAL_CONFIG_BY_DAY[1];
