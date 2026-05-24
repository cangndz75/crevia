export type MetricTrendTone = 'success' | 'warning' | 'danger' | 'info';

export type CityPulseMetric = {
  id: string;
  label: string;
  value: string;
  progress: number;
  color: string;
  mutedColor: string;
  icon: 'happy' | 'cash' | 'people' | 'alert';
  trendLabel: string;
  trendValue: string;
  trendTone: MetricTrendTone;
  variant: 'ring' | 'icon';
};
