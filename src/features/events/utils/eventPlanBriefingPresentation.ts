import { getRiskLevelLabel } from '@/core/content/mockGameData';
import type { EventCard } from '@/core/models/EventCard';
import type {
  EventPlanInspectSummaryItem,
  EventPlanStrategyCard,
  EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';

export type PlanBriefingStepState = 'completed' | 'active' | 'upcoming';

export type PlanBriefingStepperItem = {
  label: string;
  state: PlanBriefingStepState;
};

export type PlanBriefingSignalTone = 'warning' | 'positive' | 'social';

export type PlanBriefingSignal = {
  key: string;
  label: string;
  value: string;
  body: string;
  tone: PlanBriefingSignalTone;
};

export type EventPlanBriefingPresentation = {
  header: {
    title: string;
    subtitle: string;
  };
  status: {
    priority: string;
    state: string;
  };
  stepper: PlanBriefingStepperItem[];
  stepperAccessibilityLabel: string;
  brief: {
    eyebrow: string;
    title: string;
    body: string;
  };
  suitability: {
    value: number;
    max: number;
    title: string;
    body: string;
    accessibilityLabel: string;
  };
  signals: PlanBriefingSignal[];
  signalsEyebrow: string;
  recommendedPlan: {
    eyebrow: string;
    title: string;
    body: string;
    chips: string[];
    accessibilityLabel: string;
  };
};

export type BuildEventPlanBriefingPresentationInput = {
  event: EventCard;
  recommendedStrategy: EventPlanStrategyCard;
  inspectSummary: EventPlanInspectSummaryItem[];
};

const BRIEFING_STEPPER: PlanBriefingStepperItem[] = [
  { label: 'İncele', state: 'completed' },
  { label: 'Değerlendir', state: 'completed' },
  { label: 'Planla', state: 'active' },
  { label: 'Sonuçlandır', state: 'upcoming' },
];

const BRIEFING_STEPPER_A11Y =
  'Planlama adımı. İncele ve Değerlendir tamamlandı. Planla aktif. Sonuçlandır bekliyor.';

function resolvePriorityChip(riskLevel: EventCard['riskLevel']): string {
  switch (riskLevel) {
    case 'critical':
    case 'high':
      return 'Yüksek Öncelik';
    case 'low':
      return 'Düşük Öncelik';
    default:
      return 'Orta Öncelik';
  }
}

function resolveBriefSubtitle(event: EventCard): string {
  const title = event.title?.trim();
  if (title) return title;
  const district = event.district?.trim() || 'Mahalle';
  return `${district} operasyonu`;
}

function resolveRiskSignal(
  event: EventCard,
  inspectSummary: EventPlanInspectSummaryItem[],
): PlanBriefingSignal {
  const riskItem = inspectSummary.find((item) => item.id.includes('risk'));
  const riskLabel = riskItem
    ? toneToSignalValue(riskItem.tone)
    : getRiskLevelLabel(event.riskLevel);

  const bodyByLevel =
    event.riskLevel === 'low'
      ? 'Düşük düzeyde çevresel risk izleniyor.'
      : event.riskLevel === 'high' || event.riskLevel === 'critical'
        ? 'Yüksek düzeyde çevresel risk mevcut.'
        : 'Orta düzeyde çevresel risk mevcut.';

  return {
    key: 'risk',
    label: 'Risk',
    value: riskLabel,
    body: bodyByLevel,
    tone: 'warning',
  };
}

function resolveReadinessSignal(event: EventCard): PlanBriefingSignal {
  const hasPressure = event.decisions.some((decision) => {
    const costs = decision.costs;
    if (!costs) return false;
    return (
      (costs.budget ?? 0) > 1800 ||
      (costs.staffHours ?? 0) > 3 ||
      (costs.vehicleUsage ?? 0) > 1
    );
  });

  if (hasPressure) {
    return {
      key: 'readiness',
      label: 'Hazırlık',
      value: 'Sınırlı',
      body: 'Kaynaklar mevcut ama ek destek planlanmalı.',
      tone: 'positive',
    };
  }

  return {
    key: 'readiness',
    label: 'Hazırlık',
    value: 'Yeterli',
    body: 'Malzeme ve ekip desteği hazır.',
    tone: 'positive',
  };
}

function resolveNeighborhoodSignal(event: EventCard): PlanBriefingSignal {
  const satisfaction = event.previewEffects?.publicSatisfaction ?? 0;
  const value =
    satisfaction <= -5 || event.riskLevel === 'critical'
      ? 'Yüksek'
      : satisfaction <= -2
        ? 'Orta'
        : 'Yüksek';

  const body =
    value === 'Orta'
      ? 'Toplumsal katılım ve fayda dengeli.'
      : 'Toplumsal katılım ve fayda yüksek.';

  return {
    key: 'neighborhood',
    label: 'Mahalle Etkisi',
    value,
    body,
    tone: 'social',
  };
}

function toneToSignalValue(tone: EventPlanInspectSummaryItem['tone']): string {
  switch (tone) {
    case 'urgent':
    case 'warning':
      return 'Yüksek';
    case 'positive':
      return 'Düşük';
    default:
      return 'Orta';
  }
}

function computeSuitabilityScore(
  event: EventCard,
  strategyId: EventPlanStrategyId,
): number {
  let score = 72;

  if (strategyId === 'balanced_plan') score += 10;
  if (strategyId === 'rapid_response') score += 4;
  if (strategyId === 'long_term_fix') score += 6;

  if (event.riskLevel === 'medium') score += 2;
  if (event.riskLevel === 'low') score += 4;
  if (event.riskLevel === 'high') score -= 2;
  if (event.riskLevel === 'critical') score -= 6;

  if ((event.previewEffects?.publicSatisfaction ?? 0) <= -3) score += 2;

  return Math.min(96, Math.max(58, score));
}

function resolveSuitabilityBody(score: number): string {
  if (score >= 82) {
    return 'Planınızın mahalle ihtiyaçlarıyla uyum düzeyi yüksek.';
  }
  if (score >= 70) {
    return 'Planınız mahalle ihtiyaçlarıyla uyumlu; ince ayar faydalı olabilir.';
  }
  return 'Plan uyumu geliştirilebilir; sinyalleri tekrar gözden geçirin.';
}

function resolveRecommendedPlanCopy(strategy: EventPlanStrategyCard): {
  title: string;
  body: string;
  chips: string[];
} {
  switch (strategy.id) {
    case 'rapid_response':
      return {
        title: 'Hızlı Müdahale',
        body: 'Kısa sürede riski düşürmek için hızlı ve yoğun kaynak kullanan bir yaklaşım.',
        chips: ['Hızlı Yaklaşım', 'Yüksek Maliyet', 'Hızlı Etki'],
      };
    case 'long_term_fix':
      return {
        title: 'Önleyici Plan',
        body: 'Bugünkü müdahaleyi yarınki riski azaltacak şekilde genişleten kalıcı bir yaklaşım.',
        chips: ['Önleyici Yaklaşım', 'Yüksek Maliyet', 'Kalıcı Etki'],
      };
    default:
      return {
        title: 'Dengeli Müdahale',
        body: 'Orta düzeyde çevresel riskleri azaltırken kalıcı iyileştirmeler sağlayan dengeli bir yaklaşım.',
        chips: ['Dengeli Yaklaşım', 'Orta Maliyet', 'Hızlı Etki'],
      };
  }
}

function buildRecommendedPlanAccessibilityLabel(
  title: string,
  chips: string[],
): string {
  const chipText = chips.join(', ').toLocaleLowerCase('tr-TR');
  return `Önerilen plan, ${title}. ${chipText}.`;
}

export function buildEventPlanBriefingPresentation(
  input: BuildEventPlanBriefingPresentationInput,
): EventPlanBriefingPresentation {
  const { event, recommendedStrategy, inspectSummary } = input;
  const suitabilityValue = computeSuitabilityScore(event, recommendedStrategy.id);
  const recommendedCopy = resolveRecommendedPlanCopy(recommendedStrategy);

  return {
    header: {
      title: 'Planla',
      subtitle: resolveBriefSubtitle(event),
    },
    status: {
      priority: resolvePriorityChip(event.riskLevel),
      state: 'Açık',
    },
    stepper: BRIEFING_STEPPER,
    stepperAccessibilityLabel: BRIEFING_STEPPER_A11Y,
    brief: {
      eyebrow: 'STRATEJİ BRİFİ',
      title: 'Veriye dayalı, dengeli bir müdahale planlayın.',
      body: 'Mahalle analizine göre öncelikli sorunları hedefleyin, kaynakları doğru dağıtın ve etkiyi en üst düzeye çıkarın.',
    },
    suitability: {
      value: suitabilityValue,
      max: 100,
      title: 'Uygunluk Skoru',
      body: resolveSuitabilityBody(suitabilityValue),
      accessibilityLabel: `Uygunluk skoru ${suitabilityValue} üzerinden 100. ${resolveSuitabilityBody(suitabilityValue)}`,
    },
    signalsEyebrow: 'SİNYAL ÖZETİ',
    signals: [
      resolveRiskSignal(event, inspectSummary),
      resolveReadinessSignal(event),
      resolveNeighborhoodSignal(event),
    ],
    recommendedPlan: {
      eyebrow: 'ÖNERİLEN PLAN',
      ...recommendedCopy,
      accessibilityLabel: buildRecommendedPlanAccessibilityLabel(
        recommendedCopy.title,
        recommendedCopy.chips,
      ),
    },
  };
}

export function auditEventPlanBriefingPresentation(
  model: EventPlanBriefingPresentation,
): string[] {
  const issues: string[] = [];

  if (!model.header.title.trim()) issues.push('briefing header title empty');
  if (!model.header.subtitle.trim()) issues.push('briefing header subtitle empty');
  if (!model.status.priority.trim()) issues.push('briefing priority empty');
  if (!model.status.state.trim()) issues.push('briefing state empty');
  if (model.stepper.length !== 4) issues.push('briefing stepper count');
  if (model.signals.length !== 3) issues.push('briefing signals count');
  if (!model.brief.title.trim()) issues.push('briefing brief title empty');
  if (model.suitability.value < 1 || model.suitability.value > model.suitability.max) {
    issues.push('briefing suitability out of range');
  }
  if (!model.recommendedPlan.title.trim()) issues.push('briefing recommended title empty');
  if (model.recommendedPlan.chips.length < 2) issues.push('briefing recommended chips');

  return issues;
}
