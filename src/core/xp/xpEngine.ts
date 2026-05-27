import { createId } from '@/core/game/createId';
import {
  BUTTERFLY_BONUS_XP,
  CAPPED_XP_CATEGORIES,
  DAILY_GOAL_BONUS_XP,
  DAILY_XP_CAPS,
  TUTORIAL_BONUS_XP,
} from '@/core/xp/constants';
import { calculateDistrictBonus } from '@/core/xp/districtBonus';
import { buildPlayerProgress } from '@/core/xp/levelProgress';
import {
  calculateBaseEventXp,
  calculateEfficiencyBonus,
  calculateQualityBonus,
  calculateRiskBonus,
} from '@/core/xp/xpBonuses';
import type {
  ApplyXpTransactionsResult,
  CreateXpTransactionInput,
  EventXpBreakdownInput,
  PlayerProgress,
  XpBreakdown,
  XpBreakdownItem,
  XpCategory,
  XpTransaction,
} from '@/core/xp/types';

const SEVERITY_EVENT_TITLES: Record<EventXpBreakdownInput['severity'], string> = {
  low: 'Olay çözüldü',
  medium: 'Olay çözüldü',
  high: 'Kritik olay çözüldü',
  critical: 'Kritik olay çözüldü',
};

function positiveAmount(amount: number): number {
  return Math.max(0, amount);
}

function appendBreakdownItem(
  items: XpBreakdownItem[],
  item: XpBreakdownItem | null | undefined,
): void {
  if (!item || item.amount <= 0) {
    return;
  }
  items.push({ ...item, amount: positiveAmount(item.amount) });
}

function sumBreakdownItems(items: XpBreakdownItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function createXpTransaction(input: CreateXpTransactionInput): XpTransaction {
  return {
    ...input,
    amount: positiveAmount(input.amount),
    id: createId('xp'),
    createdAt: new Date().toISOString(),
  };
}

export function applyXpTransactions(
  playerProgress: PlayerProgress,
  transactions: XpTransaction[],
): ApplyXpTransactionsResult {
  const previousLevel = playerProgress.currentLevel;
  const earnedXp = transactions.reduce(
    (sum, tx) => sum + positiveAmount(tx.amount),
    0,
  );

  const totalXp = playerProgress.totalXp + earnedXp;
  const xpHistory = [...playerProgress.xpHistory, ...transactions];
  const progress = buildPlayerProgress(totalXp, xpHistory);
  const newLevel = progress.currentLevel;

  return {
    progress,
    leveledUp: newLevel > previousLevel,
    previousLevel,
    newLevel,
  };
}

/**
 * Günlük kategori cap'lerini uygular (risk, efficiency, district).
 * event, daily_goal, butterfly ve tutorial cap dışındadır.
 *
 * MVP ana akışına bağlı değil — gün sonu veya store entegrasyonunda kullanılmak üzere hazır.
 */
export function applyDailyXpCaps(
  transactions: XpTransaction[],
  existingDayTransactions: XpTransaction[],
): XpTransaction[] {
  const dayTotals: Partial<Record<XpCategory, number>> = {};

  for (const tx of existingDayTransactions) {
    if (!CAPPED_XP_CATEGORIES.includes(tx.category)) {
      continue;
    }
    dayTotals[tx.category] = (dayTotals[tx.category] ?? 0) + tx.amount;
  }

  return transactions.map((tx) => {
    const cap = DAILY_XP_CAPS[tx.category];
    if (cap == null) {
      return tx;
    }

    const used = dayTotals[tx.category] ?? 0;
    const remaining = Math.max(0, cap - used);
    const cappedAmount = Math.min(tx.amount, remaining);
    dayTotals[tx.category] = used + cappedAmount;

    if (cappedAmount === tx.amount) {
      return tx;
    }

    return { ...tx, amount: cappedAmount };
  }).filter((tx) => tx.amount > 0);
}

export function calculateEventXpBreakdown(input: EventXpBreakdownInput): XpBreakdown {
  const items: XpBreakdownItem[] = [];

  const baseXp = calculateBaseEventXp(input.severity);
  appendBreakdownItem(items, {
    category: 'event',
    amount: baseXp,
    title: SEVERITY_EVENT_TITLES[input.severity],
    description: input.eventTitle,
  });

  const qualityXp = calculateQualityBonus({
    satisfactionDelta: input.satisfactionDelta,
    riskDelta: input.riskDelta,
  });
  appendBreakdownItem(items, {
    category: 'event',
    amount: qualityXp,
    title: 'Kalite bonusu',
    description: 'Memnuniyet ve risk dengesi',
  });

  const riskXp = calculateRiskBonus(input.riskDelta);
  appendBreakdownItem(items, {
    category: 'risk',
    amount: riskXp,
    title: 'Risk azaltıldı',
  });

  const efficiencyXp = calculateEfficiencyBonus({
    budgetSpent: input.budgetSpent,
    expectedBudget: input.expectedBudget,
    staffFatigueDelta: input.staffFatigueDelta,
    vehicleConditionDelta: input.vehicleConditionDelta,
  });
  appendBreakdownItem(items, {
    category: 'efficiency',
    amount: efficiencyXp,
    title:
      efficiencyXp >= 10 ? 'Personel dengeli kullanıldı' : 'Bütçe verimli kullanıldı',
  });

  const districtBonus = calculateDistrictBonus({
    districtId: input.districtId,
    districtType: input.districtType,
    flags: input.districtBonusFlags,
  });
  for (const districtItem of districtBonus.items) {
    appendBreakdownItem(items, districtItem);
  }

  if (input.dailyGoalCompleted) {
    appendBreakdownItem(items, {
      category: 'daily_goal',
      amount: DAILY_GOAL_BONUS_XP,
      title: 'Günlük hedef tamamlandı',
    });
  }

  if (input.butterflyPositive) {
    appendBreakdownItem(items, {
      category: 'butterfly',
      amount: BUTTERFLY_BONUS_XP,
      title: 'Pozitif kelebek etkisi',
    });
  }

  if (input.tutorialBonus) {
    appendBreakdownItem(items, {
      category: 'tutorial',
      amount: TUTORIAL_BONUS_XP,
      title: 'Öğretici akış bonusu',
    });
  }

  return {
    total: sumBreakdownItems(items),
    items,
  };
}

export function breakdownToXpTransactions(
  breakdown: XpBreakdown,
  meta: {
    day: number;
    sourceId?: string;
    sourceType?: XpTransaction['sourceType'];
  },
): XpTransaction[] {
  return breakdown.items.map((item) =>
    createXpTransaction({
      day: meta.day,
      amount: item.amount,
      category: item.category,
      sourceId: meta.sourceId,
      sourceType: meta.sourceType,
      title: item.title,
      description: item.description,
    }),
  );
}
