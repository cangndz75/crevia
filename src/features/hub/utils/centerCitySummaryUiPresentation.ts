import type {
  CenterCitySummary,
  CenterCitySummaryMetric,
  CenterCitySummaryMetricId,
  CenterCitySummaryTone,
} from '@/features/hub/utils/centerCitySummaryPresentation';

export type CenterSummaryMetricAccent = 'green' | 'gold' | 'blue';

export type CenterSummaryMetricView = {
  id: CenterCitySummaryMetricId;
  label: string;
  valueText: string;
  helperText: string;
  percent: number;
  accent: CenterSummaryMetricAccent;
  iconKey: string;
  trendUp: boolean;
  accessibilityLabel: string;
};

export type CenterSummaryStatusView = {
  title: string;
  description: string;
  accessibilityLabel: string;
};

const METRIC_LABELS: Record<CenterCitySummaryMetricId, string> = {
  reputation: 'Mahalle Güveni',
  happiness: 'Sosyal Denge',
  activeOperations: 'Hizmet Hazırlığı',
  risk: 'Hizmet Hazırlığı',
  trust: 'Mahalle Güveni',
  authority: 'Mahalle Güveni',
};

const METRIC_ACCENTS: Record<CenterCitySummaryMetricId, CenterSummaryMetricAccent> = {
  reputation: 'green',
  happiness: 'gold',
  activeOperations: 'blue',
  risk: 'blue',
  trust: 'green',
  authority: 'green',
};

const METRIC_ICONS: Record<CenterCitySummaryMetricId, string> = {
  reputation: 'shield-checkmark-outline',
  happiness: 'people-outline',
  activeOperations: 'construct-outline',
  risk: 'construct-outline',
  trust: 'shield-checkmark-outline',
  authority: 'shield-checkmark-outline',
};

const FALLBACK_PERCENT: Record<string, number> = {
  Başlangıç: 80,
  Dengeli: 73,
  Hazır: 91,
  Sakin: 94,
  Mutlu: 85,
  İzleniyor: 65,
  Hassas: 58,
  Dikkat: 50,
};

const DEFAULT_HELPERS: Record<CenterSummaryMetricAccent, string> = {
  green: 'Güven artıyor',
  gold: 'Denge korunuyor',
  blue: 'Ekipler hazır',
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function toneFallbackPercent(tone: CenterCitySummaryTone): number {
  switch (tone) {
    case 'success':
      return 91;
    case 'stable':
      return 80;
    case 'warning':
      return 68;
    case 'urgent':
      return 52;
    default:
      return 75;
  }
}

function resolvePercent(metric: CenterCitySummaryMetric): number {
  const value = metric.valueText.trim();
  const percentMatch = /^%(\d+)/.exec(value);
  if (percentMatch) {
    return clampPercent(Number(percentMatch[1]));
  }

  if (value in FALLBACK_PERCENT) {
    return FALLBACK_PERCENT[value]!;
  }

  const numeric = Number(value.replace(/\./g, ''));
  if (Number.isFinite(numeric) && /^\d/.test(value)) {
    if (metric.id === 'reputation' || metric.id === 'trust' || metric.id === 'authority') {
      return clampPercent(Math.min(95, 42 + numeric / 4));
    }
    return clampPercent(numeric);
  }

  return toneFallbackPercent(metric.tone);
}

function resolveHelperText(metric: CenterCitySummaryMetric, accent: CenterSummaryMetricAccent): string {
  const helper = metric.helperText?.trim();
  if (helper && helper.length <= 28) {
    return helper;
  }
  return DEFAULT_HELPERS[accent];
}

function showsTrendUp(tone: CenterCitySummaryTone): boolean {
  return tone === 'success' || tone === 'stable' || tone === 'neutral';
}

const COMPACT_LABELS: Partial<Record<CenterCitySummaryMetricId, string>> = {
  activeOperations: 'Hazırlık',
  risk: 'Hazırlık',
};

function resolveMetricLabel(id: CenterCitySummaryMetricId, compact: boolean): string {
  if (compact && COMPACT_LABELS[id]) {
    return COMPACT_LABELS[id]!;
  }
  return METRIC_LABELS[id];
}

export type BuildCenterSummaryMetricViewOptions = {
  compact?: boolean;
};

export function buildCenterSummaryMetricView(
  metric: CenterCitySummaryMetric,
  options: BuildCenterSummaryMetricViewOptions = {},
): CenterSummaryMetricView {
  const accent = METRIC_ACCENTS[metric.id];
  const percent = resolvePercent(metric);
  const label = resolveMetricLabel(metric.id, options.compact === true);
  const valueText = `%${percent}`;
  const helperText = resolveHelperText(metric, accent);
  const iconKey = METRIC_ICONS[metric.id] ?? metric.iconKey;

  return {
    id: metric.id,
    label,
    valueText,
    helperText,
    percent,
    accent,
    iconKey,
    trendUp: showsTrendUp(metric.tone),
    accessibilityLabel: `${METRIC_LABELS[metric.id]} ${valueText}. ${helperText}`,
  };
}

export function buildCenterSummaryStatusView(summary: CenterCitySummary): CenterSummaryStatusView {
  const description =
    summary.primaryInsight?.text?.trim() ||
    'Bakım ekipleri hazır, şehir dengeli ilerliyor.';

  return {
    title: 'Merkez Durumu',
    description,
    accessibilityLabel: `Merkez Durumu. ${description}`,
  };
}

export function buildCenterSummaryMetricViews(
  summary: CenterCitySummary,
  options: BuildCenterSummaryMetricViewOptions = {},
): CenterSummaryMetricView[] {
  return summary.metrics.map((metric) => buildCenterSummaryMetricView(metric, options));
}
