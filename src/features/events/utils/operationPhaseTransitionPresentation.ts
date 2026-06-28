import type { EventCard } from '@/core/models/EventCard';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';
import {
  OPERATION_WORKFLOW_STEPS,
  type OperationWorkflowStepId,
} from '@/features/events/utils/eventWorkflowPresentation';

export type OperationPhaseKey = 'inspect' | 'plan' | 'dispatch' | 'field' | 'result';

export type OperationPhaseBridgeChipTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral';

export type OperationPhaseBridgeChip = {
  label: string;
  value: string;
  tone: OperationPhaseBridgeChipTone;
};

export type OperationPhaseBridgePresentation = {
  fromPhase?: OperationPhaseKey;
  toPhase: OperationPhaseKey;
  title: string;
  summary: string;
  chips: OperationPhaseBridgeChip[];
};

export type OperationPhaseProgressItem = {
  id: OperationPhaseKey;
  label: string;
  status: 'completed' | 'active' | 'pending';
  tone: 'positive' | 'active' | 'neutral';
};

export type OperationPhaseProgressPresentation = {
  items: OperationPhaseProgressItem[];
  activeIndex: number;
  phaseLabel: string;
};

export type OperationPhaseShellPresentation = {
  phaseKey: OperationPhaseKey;
  title: string;
  subtitle: string;
  phaseLabel: string;
};

export type OperationPhaseCtaPresentation = {
  label: string;
  disabledLabel?: string;
  enabled: boolean;
  actionKey: string;
};

export type OperationPhaseTransitionPresentation = {
  progress: OperationPhaseProgressPresentation;
  shell: OperationPhaseShellPresentation;
  bridge: OperationPhaseBridgePresentation | null;
  primaryCta: OperationPhaseCtaPresentation;
};

export const OPERATION_PHASE_CTA_LABELS: Record<OperationPhaseKey, string> = {
  inspect: 'Planlamaya Geç',
  plan: 'Yönlendirmeye Geç',
  dispatch: 'Ekibi Sahaya Çıkar',
  field: 'Sonucu Gör',
  result: 'Raporu Gör',
};

const PHASE_SHELL: Record<
  OperationPhaseKey,
  { title: string; subtitle: string }
> = {
  inspect: {
    title: 'İncele',
    subtitle: 'Sinyalleri doğrula, bulguları netleştir.',
  },
  plan: {
    title: 'Planla',
    subtitle: 'Stratejiyi seç, bedelini gör.',
  },
  dispatch: {
    title: 'Yönlendir',
    subtitle: 'Planı sahaya aktar.',
  },
  field: {
    title: 'Sahada',
    subtitle: 'Operasyon ilerlemesini izle.',
  },
  result: {
    title: 'Sonuç',
    subtitle: 'Kararın şehir etkisini gör.',
  },
};

const PHASE_ORDER: OperationPhaseKey[] = [
  'inspect',
  'plan',
  'dispatch',
  'field',
  'result',
];

function phaseIndex(phase: OperationPhaseKey): number {
  return PHASE_ORDER.indexOf(phase);
}

function phaseLabelForKey(phase: OperationPhaseKey): string {
  const step = OPERATION_WORKFLOW_STEPS.find((item) => {
    if (phase === 'dispatch') return item.id === 'assign';
    return item.id === phase;
  });
  return step?.label ?? PHASE_SHELL[phase].title;
}

function clampSummary(text: string, max = 120): string {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function riskBandLabel(risk: EventCard['riskLevel']): string {
  switch (risk) {
    case 'critical':
    case 'high':
      return 'Yüksek';
    case 'medium':
      return 'Orta';
    default:
      return 'Düşük';
  }
}

function socialBandLabel(event: EventCard): { value: string; tone: OperationPhaseBridgeChipTone } {
  const satisfaction = event.previewEffects?.publicSatisfaction ?? 0;
  if (satisfaction <= -4) return { value: 'Yüksek', tone: 'warning' };
  if (satisfaction <= -2) return { value: 'Orta', tone: 'mixed' };
  return { value: 'Düşük', tone: 'neutral' };
}

export function mapWorkflowStepToPhaseKey(
  step: OperationWorkflowStepId,
): OperationPhaseKey {
  if (step === 'assign') return 'dispatch';
  return step;
}

export function buildOperationPhaseProgressPresentation(
  activePhase: OperationPhaseKey,
): OperationPhaseProgressPresentation {
  const activeIndex = phaseIndex(activePhase);
  const items = PHASE_ORDER.map((id, index) => ({
    id,
    label: phaseLabelForKey(id),
    status:
      index < activeIndex
        ? ('completed' as const)
        : index === activeIndex
          ? ('active' as const)
          : ('pending' as const),
    tone:
      index < activeIndex
        ? ('positive' as const)
        : index === activeIndex
          ? ('active' as const)
          : ('neutral' as const),
  }));

  return {
    items,
    activeIndex,
    phaseLabel: `Faz ${activeIndex + 1}/5 · ${phaseLabelForKey(activePhase)}`,
  };
}

export function buildOperationPhaseShellPresentation(
  phase: OperationPhaseKey,
): OperationPhaseShellPresentation {
  const shell = PHASE_SHELL[phase];
  const progress = buildOperationPhaseProgressPresentation(phase);
  return {
    phaseKey: phase,
    title: shell.title,
    subtitle: shell.subtitle,
    phaseLabel: progress.phaseLabel,
  };
}

export function buildInspectToPlanBridge(event: EventCard): OperationPhaseBridgePresentation {
  const social = socialBandLabel(event);
  const fieldValue =
    event.riskLevel === 'critical' || event.riskLevel === 'high' ? 'Yüksek' : 'Orta';
  const riskValue = riskBandLabel(event.riskLevel);

  return {
    fromPhase: 'inspect',
    toPhase: 'plan',
    title: 'İncele Özeti',
    summary: clampSummary(
      'Sinyaller netleşti. Şimdi müdahale yaklaşımını seç.',
    ),
    chips: [
      { label: 'Sosyal Nabız', value: social.value, tone: social.tone },
      { label: 'Saha Bulgusu', value: fieldValue, tone: fieldValue === 'Yüksek' ? 'warning' : 'mixed' },
      { label: 'Risk Ön Okuması', value: riskValue, tone: riskValue === 'Yüksek' ? 'warning' : 'neutral' },
    ],
  };
}

export function buildPlanToDispatchBridge(input: {
  event: EventCard;
  planLabel: string;
  planId?: EventPlanStrategyId | null;
  impactLabel?: string;
  costLabel?: string;
}): OperationPhaseBridgePresentation {
  const impact =
    input.impactLabel?.trim() ||
    (input.planId === 'rapid_response'
      ? 'Hızlı güven'
      : input.planId === 'long_term_fix'
        ? 'Uzun vadeli'
        : 'Dengeli');
  const cost =
    input.costLabel?.trim() ||
    (input.planId === 'long_term_fix' ? 'Yüksek' : input.planId === 'rapid_response' ? 'Orta' : 'Düşük');

  return {
    fromPhase: 'plan',
    toPhase: 'dispatch',
    title: 'Plan Aktarımı',
    summary: clampSummary(
      `${input.planLabel} seçildi. Kaynakları zorlamadan sahaya aktarılıyor.`,
    ),
    chips: [
      { label: 'Plan', value: input.planLabel, tone: 'neutral' },
      { label: 'Etki', value: impact, tone: 'positive' },
      { label: 'Bedel', value: cost, tone: cost === 'Yüksek' ? 'warning' : 'mixed' },
    ],
  };
}

export function buildDispatchToFieldBridge(input: {
  event: EventCard;
  teamStatus?: string;
  dispatchStatus?: string;
}): OperationPhaseBridgePresentation {
  const district = input.event.district?.trim() || 'Bölge';
  const team = input.teamStatus?.trim() || 'Sahada';
  const status = input.dispatchStatus?.trim() || 'Yönlendirildi';

  return {
    fromPhase: 'dispatch',
    toPhase: 'field',
    title: 'Saha Başladı',
    summary: clampSummary(
      `Ekip ${district} odağına yönlendirildi. İlk saha sinyali bekleniyor.`,
    ),
    chips: [
      { label: 'Ekip', value: team, tone: 'positive' },
      { label: 'Bölge', value: district, tone: 'neutral' },
      { label: 'Durum', value: status, tone: 'mixed' },
    ],
  };
}

export function buildFieldToResultBridge(input: {
  event: EventCard;
  outcomeTone?: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  trustLabel?: string;
  riskLabel?: string;
  resourceLabel?: string;
}): OperationPhaseBridgePresentation {
  const trust = input.trustLabel?.trim() || (input.outcomeTone === 'positive' ? 'Toparlandı' : 'İzleniyor');
  const risk = input.riskLabel?.trim() || (input.outcomeTone === 'warning' ? 'Taşınıyor' : 'Düşük');
  const resource = input.resourceLabel?.trim() || 'Kayıtta';

  return {
    fromPhase: 'field',
    toPhase: 'result',
    title: 'Saha Sonucu',
    summary: clampSummary(
      'Müdahale tamamlandı. İlk etki şehir göstergelerine yansıdı.',
    ),
    chips: [
      {
        label: 'Güven',
        value: trust,
        tone: input.outcomeTone === 'positive' ? 'positive' : 'mixed',
      },
      {
        label: 'Risk',
        value: risk,
        tone: input.outcomeTone === 'warning' || input.outcomeTone === 'critical' ? 'warning' : 'neutral',
      },
      { label: 'Kaynak', value: resource, tone: 'neutral' },
    ],
  };
}

export type BuildOperationPhaseTransitionInput = {
  phase: OperationPhaseKey;
  event?: EventCard | null;
  planLabel?: string;
  planId?: EventPlanStrategyId | null;
  planImpactLabel?: string;
  planCostLabel?: string;
  teamStatus?: string;
  dispatchStatus?: string;
  outcomeTone?: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  trustLabel?: string;
  riskLabel?: string;
  resourceLabel?: string;
  ctaEnabled?: boolean;
  ctaDisabledLabel?: string;
  ctaActionKey?: string;
  avoidSummaries?: string[];
};

function dedupeBridgeSummary(
  bridge: OperationPhaseBridgePresentation,
  avoidSummaries: string[] = [],
): OperationPhaseBridgePresentation {
  const normalized = bridge.summary.toLocaleLowerCase('tr-TR');
  const duplicate = avoidSummaries.some((line) => {
    const other = line.trim().toLocaleLowerCase('tr-TR');
    if (!other) return false;
    return other === normalized || other.includes(normalized.slice(0, 24));
  });
  if (!duplicate) return bridge;
  const alternateByToPhase: Partial<Record<OperationPhaseKey, string>> = {
    plan: 'İncele verileri plana aktarıldı. Stratejiyi seç.',
    dispatch: 'Seçilen plan sahaya aktarılmaya hazırlanıyor.',
    field: 'Ekip bölgeye yönlendirildi. İlk saha etkisi izleniyor.',
    result: 'Müdahale tamamlandı. Etki şehir göstergelerine yansıyor.',
  };
  return {
    ...bridge,
    summary: clampSummary(
      alternateByToPhase[bridge.toPhase] ?? `${bridge.title} bağlantısı kuruldu.`,
    ),
  };
}

export function buildOperationPhaseTransitionPresentation(
  input: BuildOperationPhaseTransitionInput,
): OperationPhaseTransitionPresentation {
  const progress = buildOperationPhaseProgressPresentation(input.phase);
  const shell = buildOperationPhaseShellPresentation(input.phase);

  let bridge: OperationPhaseBridgePresentation | null = null;
  const event = input.event;

  if (input.phase === 'plan' && event) {
    bridge = dedupeBridgeSummary(buildInspectToPlanBridge(event), input.avoidSummaries);
  } else if (input.phase === 'dispatch' && event) {
    bridge = dedupeBridgeSummary(
      buildPlanToDispatchBridge({
        event,
        planLabel: input.planLabel?.trim() || 'Dengeli Plan',
        planId: input.planId,
        impactLabel: input.planImpactLabel,
        costLabel: input.planCostLabel,
      }),
      input.avoidSummaries,
    );
  } else if (input.phase === 'field' && event) {
    bridge = dedupeBridgeSummary(
      buildDispatchToFieldBridge({
        event,
        teamStatus: input.teamStatus,
        dispatchStatus: input.dispatchStatus,
      }),
      input.avoidSummaries,
    );
  } else if (input.phase === 'result' && event) {
    bridge = dedupeBridgeSummary(
      buildFieldToResultBridge({
        event,
        outcomeTone: input.outcomeTone,
        trustLabel: input.trustLabel,
        riskLabel: input.riskLabel,
        resourceLabel: input.resourceLabel,
      }),
      input.avoidSummaries,
    );
  }

  const primaryCta: OperationPhaseCtaPresentation = {
    label: OPERATION_PHASE_CTA_LABELS[input.phase],
    disabledLabel: input.ctaDisabledLabel,
    enabled: input.ctaEnabled ?? true,
    actionKey: input.ctaActionKey ?? `phase_${input.phase}`,
  };

  return { progress, shell, bridge, primaryCta };
}

export function auditOperationPhaseTransitionPresentation(
  model: OperationPhaseTransitionPresentation,
): string[] {
  const issues: string[] = [];
  if (!model.shell.title.trim()) issues.push('shell title empty');
  if (!model.shell.subtitle.trim()) issues.push('shell subtitle empty');
  if (!model.progress.phaseLabel.trim()) issues.push('progress phaseLabel empty');
  if (model.progress.items.length !== 5) issues.push('progress items count');
  if (!model.primaryCta.label.trim()) issues.push('primaryCta label empty');
  if (model.bridge && !model.bridge.summary.trim()) issues.push('bridge summary empty');
  if (model.bridge && model.bridge.chips.length === 0) issues.push('bridge chips empty');
  return issues;
}
