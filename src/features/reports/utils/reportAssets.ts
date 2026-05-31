import { creviaAssets } from '@/core/assets/creviaAssets';

/** Rapor ekranı boş durum ve gün sonu görselleri. */
export const reportAssets = {
  emptyStateHero: creviaAssets.reports.endOfDay.bundle,
  heroDecor: creviaAssets.reports.endOfDay.clipboardStamp,
  chartSuccess: creviaAssets.reports.icons.chartSuccess,
  dailyTask: creviaAssets.reports.icons.dailyTaskCoin,
  checklistSuccess: creviaAssets.reports.icons.checklistSuccess,
  endOfDay: creviaAssets.reports.endOfDay,
} as const;
