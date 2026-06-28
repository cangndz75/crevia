import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

export type TuningLevel = 'low' | 'medium' | 'high';
export type TuningMode = 'standard' | 'custom';

export type PlanTuningValues = {
  cleaningIntensity: TuningLevel;
  inspectionLevel: TuningLevel;
  neighborhoodParticipation: TuningLevel;
};

export type TuningControlKey = keyof PlanTuningValues;

export type TuningControlTone = 'teal' | 'purple' | 'amber';

export type TuningControlOption = {
  label: string;
  value: TuningLevel;
};

export type TuningControlDefinition = {
  key: TuningControlKey;
  title: string;
  description: string;
  icon: 'water-outline' | 'shield-checkmark-outline' | 'people-outline';
  tone: TuningControlTone;
  options: TuningControlOption[];
};

export type LiveImpactMetricId = 'risk' | 'cost' | 'trust' | 'visibility';

export type LiveImpactMetric = {
  id: LiveImpactMetricId;
  label: string;
  value: string;
  subtitle: string;
  tone: 'warning' | 'info' | 'positive' | 'social';
};

export type PlanTuningAccordionPresentation = {
  title: string;
  description: string;
  collapsedSubtitle: string;
  summaryChips: Array<{ label: string; value: string }>;
  modeBadge: { label: string; tone: 'standard' | 'custom' };
  resetActionLabel: string | null;
  showResetAction: boolean;
  controls: TuningControlDefinition[];
  accessibilityLabelCollapsed: string;
  accessibilityLabelExpanded: string;
};

export type EventPlanTuningPresentation = {
  accordion: PlanTuningAccordionPresentation;
  liveImpact: {
    title: string;
    description: string;
    metrics: LiveImpactMetric[];
    accessibilityLabel: string;
  };
  eceForecast: {
    title: string;
    badge: string;
    body: string;
    accessibilityLabel: string;
  };
  refineCta: {
    label: string;
    accessibilityLabel: string;
  };
  values: PlanTuningValues;
  mode: TuningMode;
};

export const TUNING_PRESETS: Record<EventPlanStrategyId, PlanTuningValues> = {
  rapid_response: {
    cleaningIntensity: 'high',
    inspectionLevel: 'medium',
    neighborhoodParticipation: 'low',
  },
  balanced_plan: {
    cleaningIntensity: 'medium',
    inspectionLevel: 'high',
    neighborhoodParticipation: 'medium',
  },
  long_term_fix: {
    cleaningIntensity: 'medium',
    inspectionLevel: 'high',
    neighborhoodParticipation: 'high',
  },
};

export const TUNING_CONTROLS: TuningControlDefinition[] = [
  {
    key: 'cleaningIntensity',
    title: 'Temizlik Yoğunluğu',
    description: 'Saha temizlik sıklığını belirler.',
    icon: 'water-outline',
    tone: 'teal',
    options: [
      { label: 'Düşük', value: 'low' },
      { label: 'Orta', value: 'medium' },
      { label: 'Yüksek', value: 'high' },
    ],
  },
  {
    key: 'inspectionLevel',
    title: 'Denetim Düzeyi',
    description: 'Denetim ve kontrol aralığını belirler.',
    icon: 'shield-checkmark-outline',
    tone: 'purple',
    options: [
      { label: 'Düşük', value: 'low' },
      { label: 'Orta', value: 'medium' },
      { label: 'Yüksek', value: 'high' },
    ],
  },
  {
    key: 'neighborhoodParticipation',
    title: 'Mahalle Katılımı',
    description: 'Gönüllü katılım ve bilgilendirme düzeyi.',
    icon: 'people-outline',
    tone: 'amber',
    options: [
      { label: 'Düşük', value: 'low' },
      { label: 'Orta', value: 'medium' },
      { label: 'Yüksek', value: 'high' },
    ],
  },
];

export function getTuningPresetForPlan(strategyId: EventPlanStrategyId): PlanTuningValues {
  return { ...TUNING_PRESETS[strategyId] };
}

export function tuningLevelLabel(level: TuningLevel): string {
  switch (level) {
    case 'low':
      return 'Düşük';
    case 'high':
      return 'Yüksek';
    default:
      return 'Orta';
  }
}

export function isTuningValuesEqual(a: PlanTuningValues, b: PlanTuningValues): boolean {
  return (
    a.cleaningIntensity === b.cleaningIntensity &&
    a.inspectionLevel === b.inspectionLevel &&
    a.neighborhoodParticipation === b.neighborhoodParticipation
  );
}

type ImpactScores = {
  risk: number;
  cost: number;
  trust: number;
  visibility: number;
};

function computeImpactScores(values: PlanTuningValues): ImpactScores {
  let risk = 2;
  let cost = 2;
  let trust = 2;
  let visibility = 2;

  if (values.cleaningIntensity === 'high') {
    visibility += 1;
    cost += 1;
  } else if (values.cleaningIntensity === 'low') {
    visibility -= 1;
    cost -= 1;
  }

  if (values.inspectionLevel === 'high') {
    risk -= 1;
    trust += 1;
  } else if (values.inspectionLevel === 'low') {
    risk += 1;
  }

  if (values.neighborhoodParticipation === 'high') {
    trust += 1;
    visibility += 1;
    cost += 1;
  } else if (values.neighborhoodParticipation === 'low') {
    trust -= 1;
    visibility -= 1;
  }

  const clamp = (score: number) => Math.min(3, Math.max(1, score));

  return {
    risk: clamp(risk),
    cost: clamp(cost),
    trust: clamp(trust),
    visibility: clamp(visibility),
  };
}

function riskLabel(score: number): string {
  if (score <= 1) return 'Düşük';
  if (score >= 3) return 'Yüksek';
  return 'Orta';
}

function costLabel(score: number): string {
  if (score <= 1) return 'Düşük';
  if (score >= 3) return 'Yüksek';
  return 'Orta';
}

function trustLabel(score: number): string {
  if (score >= 3) return 'Çok Yüksek';
  if (score >= 2) return 'Yüksek';
  return 'Orta';
}

function visibilityLabel(score: number): string {
  if (score >= 3) return 'Çok Yüksek';
  if (score >= 2) return 'Yüksek';
  return 'Orta';
}

export function buildLiveImpactMetrics(values: PlanTuningValues): LiveImpactMetric[] {
  const scores = computeImpactScores(values);

  return [
    {
      id: 'risk',
      label: 'Risk',
      value: riskLabel(scores.risk),
      subtitle: 'Risk seviyesi',
      tone: 'warning',
    },
    {
      id: 'cost',
      label: 'Maliyet',
      value: costLabel(scores.cost),
      subtitle: 'Tahmini maliyet',
      tone: 'info',
    },
    {
      id: 'trust',
      label: 'Güven',
      value: trustLabel(scores.trust),
      subtitle: 'Beklenen güven',
      tone: 'positive',
    },
    {
      id: 'visibility',
      label: 'Görünürlük',
      value: visibilityLabel(scores.visibility),
      subtitle: 'Kamu görünürlüğü',
      tone: 'social',
    },
  ];
}

function resolveEceForecastBody(
  values: PlanTuningValues,
  mode: TuningMode,
  strategyId: EventPlanStrategyId,
): string {
  if (mode === 'standard') {
    const preset = TUNING_PRESETS[strategyId];
    if (isTuningValuesEqual(values, preset)) {
      if (strategyId === 'balanced_plan') {
        return 'Mevcut ayarlarınız dengeli bir etki yaratıyor. Denetim düzeyinizi yüksek tutmanız riskleri azaltmada etkili olacaktır.';
      }
      if (strategyId === 'rapid_response') {
        return 'Hızlı müdahale için yoğun temizlik ayarı görünürlüğü artırır; ekip temposunu izlemeyi unutma.';
      }
      return 'Uzun vadeli plan için denetim ve katılım dengesi sürdürülebilir etki sağlar.';
    }
  }

  const allMedium =
    values.cleaningIntensity === 'medium' &&
    values.inspectionLevel === 'medium' &&
    values.neighborhoodParticipation === 'medium';

  if (allMedium && mode === 'standard') {
    return 'Dengeli ayarlar bu görev için güvenli bir başlangıç sunuyor.';
  }

  if (values.cleaningIntensity === 'high') {
    return 'Görünürlük artar, ancak ekip temposunu izlemeyi unutma.';
  }

  if (values.inspectionLevel === 'high') {
    return 'Denetimi yüksek tutmak riskleri daha kontrollü azaltır.';
  }

  if (values.neighborhoodParticipation === 'high') {
    return 'Mahalle katılımı güveni artırır, ancak koordinasyon ihtiyacını yükseltir.';
  }

  if (allMedium) {
    return 'Dengeli ayarlar bu görev için güvenli bir başlangıç sunuyor.';
  }

  return 'Mevcut ayarlarınız dengeli bir etki yaratıyor. Denetim düzeyinizi yüksek tutmanız riskleri azaltmada etkili olacaktır.';
}

export type BuildEventPlanTuningPresentationInput = {
  selectedStrategyId: EventPlanStrategyId;
  tuningMode: TuningMode;
  tuningValues: PlanTuningValues;
  isAccordionOpen: boolean;
};

export function buildEventPlanTuningPresentation(
  input: BuildEventPlanTuningPresentationInput,
): EventPlanTuningPresentation {
  const { tuningMode, tuningValues, isAccordionOpen } = input;
  const metrics = buildLiveImpactMetrics(tuningValues);
  const eceBody = resolveEceForecastBody(tuningValues, tuningMode, input.selectedStrategyId);

  const summaryChips = [
    { label: 'Temizlik', value: tuningLevelLabel(tuningValues.cleaningIntensity) },
    { label: 'Denetim', value: tuningLevelLabel(tuningValues.inspectionLevel) },
    { label: 'Katılım', value: tuningLevelLabel(tuningValues.neighborhoodParticipation) },
  ];

  const modeBadge =
    tuningMode === 'custom'
      ? { label: 'Özel Ayar', tone: 'custom' as const }
      : { label: 'Standart', tone: 'standard' as const };

  const collapsedSubtitle =
    tuningMode === 'custom'
      ? 'Ayarlar özelleştirildi; etki özeti güncellendi.'
      : 'Standart ayarlar seçili plan için hazır.';

  return {
    values: tuningValues,
    mode: tuningMode,
    accordion: {
      title: 'Plan İnce Ayarı',
      description: 'Plan parametrelerini hedeflerinize göre ayarlayın.',
      collapsedSubtitle,
      summaryChips,
      modeBadge,
      resetActionLabel: 'Standarta dön',
      showResetAction: tuningMode === 'custom',
      controls: TUNING_CONTROLS,
      accessibilityLabelCollapsed: `Plan İnce Ayarı. ${modeBadge.label} ayarlar seçili. Açmak için dokunun.`,
      accessibilityLabelExpanded:
        'Plan İnce Ayarı açık. Temizlik, denetim ve mahalle katılımı ayarları düzenlenebilir.',
    },
    liveImpact: {
      title: 'Canlı Etki Özeti',
      description: 'Ayarlarınıza göre planınızın tahmini etkisi.',
      metrics,
      accessibilityLabel: metrics
        .map((metric) => `${metric.label} ${metric.value}`)
        .join(', '),
    },
    eceForecast: {
      title: 'Ece Öngörüsü',
      badge: 'AI Destekli',
      body: eceBody,
      accessibilityLabel: `Ece Öngörüsü. ${eceBody}`,
    },
    refineCta: {
      label: 'Planı Netleştir',
      accessibilityLabel:
        'Planı Netleştir. Seçili ayarlarla planı bir sonraki aşamaya taşır.',
    },
  };
}

export function auditEventPlanTuningPresentation(
  model: EventPlanTuningPresentation,
): string[] {
  const issues: string[] = [];

  if (!model.accordion.title.trim()) issues.push('tuning accordion title empty');
  if (model.accordion.summaryChips.length !== 3) issues.push('tuning summary chips count');
  if (model.liveImpact.metrics.length !== 4) issues.push('live impact metrics count');
  if (!model.eceForecast.body.trim()) issues.push('ece forecast empty');
  if (!model.refineCta.label.trim()) issues.push('refine cta empty');

  return issues;
}
