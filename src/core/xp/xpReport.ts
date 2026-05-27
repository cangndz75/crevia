import type { XpCategory, XpTransaction } from '@/core/xp/types';

export const XP_CATEGORY_LABELS: Record<XpCategory, string> = {
  event: 'Olay Çözümü',
  daily_goal: 'Günlük Hedef',
  risk: 'Risk Kontrolü',
  efficiency: 'Kaynak Verimliliği',
  district: 'Mahalle Bonusu',
  butterfly: 'Kelebek Etkisi',
  tutorial: 'Öğretici Akış',
};

const CATEGORY_ORDER: XpCategory[] = [
  'event',
  'daily_goal',
  'risk',
  'efficiency',
  'district',
  'butterfly',
  'tutorial',
];

const FALLBACK_CATEGORY_LABEL = 'Diğer';

export type DailyXpCategoryGroup = {
  category: XpCategory | 'other';
  label: string;
  total: number;
  items: XpTransaction[];
};

export type DailyXpReport = {
  day: number;
  totalXp: number;
  categories: DailyXpCategoryGroup[];
};

function positiveAmount(amount: number): number {
  return Math.max(0, amount);
}

function isXpCategory(value: string): value is XpCategory {
  return value in XP_CATEGORY_LABELS;
}

export function getXpTransactionsForDay(
  xpHistory: XpTransaction[],
  day: number,
): XpTransaction[] {
  if (!Array.isArray(xpHistory)) {
    return [];
  }
  return xpHistory.filter((tx) => tx.day === day);
}

export function getDailyXpTotal(transactions: XpTransaction[]): number {
  return transactions.reduce((sum, tx) => sum + positiveAmount(tx.amount), 0);
}

export function groupXpTransactionsByCategory(
  transactions: XpTransaction[],
): DailyXpCategoryGroup[] {
  const buckets = new Map<string, DailyXpCategoryGroup>();

  for (const tx of transactions) {
    const amount = positiveAmount(tx.amount);
    if (amount <= 0) {
      continue;
    }

    const categoryKey = isXpCategory(tx.category) ? tx.category : 'other';
    const label =
      categoryKey === 'other'
        ? FALLBACK_CATEGORY_LABEL
        : XP_CATEGORY_LABELS[categoryKey];

    const existing = buckets.get(categoryKey);
    if (existing) {
      existing.total += amount;
      existing.items.push(tx);
      continue;
    }

    buckets.set(categoryKey, {
      category: categoryKey,
      label,
      total: amount,
      items: [tx],
    });
  }

  const ordered: DailyXpCategoryGroup[] = [];

  for (const category of CATEGORY_ORDER) {
    const group = buckets.get(category);
    if (group) {
      ordered.push(group);
      buckets.delete(category);
    }
  }

  for (const group of buckets.values()) {
    ordered.push(group);
  }

  return ordered;
}

export function buildDailyXpReport(
  xpHistory: XpTransaction[],
  day: number,
): DailyXpReport {
  const dayTransactions = getXpTransactionsForDay(xpHistory, day);
  const categories = groupXpTransactionsByCategory(dayTransactions);

  return {
    day,
    totalXp: getDailyXpTotal(dayTransactions),
    categories,
  };
}
