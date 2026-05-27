/** Para ve oyun durumu gösterim yardımcıları — mock veriden bağımsız. */

export function formatCurrency(amount: number): string {
  return `₺${Math.round(amount).toLocaleString('tr-TR')}`;
}

export function formatBudgetDelta(amount: number | null | undefined): string | null {
  if (amount == null || amount === 0) return null;
  const sign = amount > 0 ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(amount)).replace('₺', '')}`;
}

export function calculateXpProgress(xp: number, xpTarget: number): number {
  if (xpTarget <= 0) return 0;
  return Math.min(1, Math.max(0, xp / xpTarget));
}

export function calculateLevelProgress(xp: number, xpTarget: number): number {
  return calculateXpProgress(xp, xpTarget);
}
