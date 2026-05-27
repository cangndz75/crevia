export type DailyReportStat = {
  label: string;
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

export type DailyReport = {
  day: number;
  title: string;
  stats: DailyReportStat[];
  rewardTitle: string;
  rewardDescription?: string;
  summaryLines?: string[];
  warnings?: string[];
  highlights?: string[];
  /** Gün sonu personel bloğu — genel özetten ayrı tutulur. */
  personnelSummaryLines?: string[];
  /** Gün sonu atık/konteyner operasyon özeti (en fazla 3 satır). */
  containerSummaryLines?: string[];
  createdAt?: string;
};
