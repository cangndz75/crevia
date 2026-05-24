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
};
