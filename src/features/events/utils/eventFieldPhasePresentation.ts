import type { CompatibilityLabel } from '@/core/assignments/assignmentTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';
import {
  fieldVarietyHintLine,
  getEventGameplayVarietyProfile,
} from '@/core/eventVariety/eventGameplayVarietyPresentation';
import { applyAuthorityToFieldAssignmentEffect } from '@/core/authority/authorityGameplayUnlockPresentation';
import type { MicroDecisionCardModel } from '@/core/microDecisions/microDecisionTypes';
import {
  operationMotionFieldAutoCompleteDurationMs,
  OPERATION_MOTION_FIELD_REDUCED_MS,
} from '@/core/motion/operationMotionTokens';
import {
  getPlanStrategyLabel,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';

export type EventFieldOperationStatus =
  | 'ready'
  | 'running'
  | 'paused_for_decision'
  | 'completed'
  | 'failed_safe';

export type EventFieldInteractionState =
  | 'running'
  | 'paused_for_decision'
  | 'completed';

export type EventFieldSelectedPlanSummary = {
  strategyId?: EventPlanStrategyId;
  label: string;
  effectLine: string;
  tone: 'teal' | 'green' | 'gold' | 'warning' | 'neutral';
};

export type EventFieldAssignmentEffectScoreBand = 'low' | 'medium' | 'high' | 'unknown';

export type EventFieldAssignmentEffect = {
  label: string;
  body: string;
  scoreBand: EventFieldAssignmentEffectScoreBand;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventFieldResourceRow = {
  id: 'team' | 'vehicle' | 'risk' | 'impact';
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventFieldTimelineStepId =
  | 'departed'
  | 'intervention'
  | 'first_impact';

export type EventFieldTimelineStepState = 'done' | 'current' | 'next' | 'blocked';

export type EventFieldTimelineStep = {
  id: EventFieldTimelineStepId;
  label: string;
  state: EventFieldTimelineStepState;
  iconKey: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventFieldTimeline = {
  progressPercent: number;
  steps: EventFieldTimelineStep[];
  currentStepId?: EventFieldTimelineStepId;
  helperText?: string;
};

export type EventFieldMicroDecisionOption = {
  id: string;
  label: string;
  helperText?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventFieldMicroDecisionPresentation = {
  id: string;
  title: string;
  body: string;
  options: EventFieldMicroDecisionOption[];
  tone: 'neutral' | 'warning' | 'urgent';
  sourceLabel: string;
};

export type EventFieldAdvisorComment = {
  title: string;
  text: string;
  tone: 'calm' | 'teaching' | 'warning' | 'positive';
};

export type EventFieldCtaActionKey =
  | 'continue_operation'
  | 'resolve_micro_decision'
  | 'view_result'
  | 'disabled';

export type EventFieldCta = {
  label: string;
  actionKey: EventFieldCtaActionKey;
  enabled: boolean;
};

export type EventFieldAutoCompletePolicy = {
  enabled: boolean;
  durationMs: number;
  reducedMotionDurationMs: number;
};

export type EventFieldPhasePresentation = {
  title: string;
  subtitle?: string;
  operationStatus: EventFieldOperationStatus;
  selectedPlan: EventFieldSelectedPlanSummary;
  assignmentEffect: EventFieldAssignmentEffect;
  resourceRows: EventFieldResourceRow[];
  timeline: EventFieldTimeline;
  microDecision?: EventFieldMicroDecisionPresentation;
  advisorComment: EventFieldAdvisorComment;
  primaryCta: EventFieldCta;
  autoComplete: EventFieldAutoCompletePolicy;
  accessibilityLabel: string;
};

export type BuildEventFieldPhasePresentationInput = {
  event: EventCard;
  assignment?: EventAssignmentState | null;
  selectedPlanStrategyId?: EventPlanStrategyId | null;
  selectedPlanStrategyLabel?: string | null;
  interactionState?: EventFieldInteractionState;
  timelineStepIndex?: number;
  microDecision?: EventFieldMicroDecisionPresentation | null;
  day?: number;
  isDay1LearningEvent?: boolean;
  reducedMotion?: boolean;
  recentVarietyProfiles?: import('@/core/eventVariety/eventGameplayVarietyTypes').BuildEventGameplayVarietyProfileInput['recentProfiles'];
  authorityGameplayContext?: import('@/core/authority/authorityGameplayUnlockTypes').AuthorityGameplayPresentationContext;
};

const TIMELINE_STEP_DEFS: Array<{
  id: EventFieldTimelineStepId;
  label: string;
  iconKey: string;
}> = [
  { id: 'departed', label: 'Ekip yolda', iconKey: 'people-outline' },
  { id: 'intervention', label: 'Müdahale başladı', iconKey: 'construct-outline' },
  { id: 'first_impact', label: 'İlk etki alındı', iconKey: 'shield-checkmark-outline' },
];

const PLAN_FIELD_EFFECT: Record<EventPlanStrategyId, string> = {
  rapid_response: 'Süre öncelikli, kaynak baskısı artabilir.',
  balanced_plan: 'Kaynak dengesi korunuyor, rota süresi izleniyor.',
  long_term_fix: 'Güven etkisi güçlü, müdahale süresi izleniyor.',
};

const PLAN_FIELD_TONE: Record<EventPlanStrategyId, EventFieldSelectedPlanSummary['tone']> = {
  rapid_response: 'teal',
  balanced_plan: 'green',
  long_term_fix: 'gold',
};

const PLAN_FIELD_HEADLINE: Record<EventPlanStrategyId, string> = {
  rapid_response: 'Hızlı Müdahale sahada',
  balanced_plan: 'Dengeli Çözüm sahada',
  long_term_fix: 'Kalıcı Yatırım sahada',
};

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function mapCompatibilityToBand(
  label: CompatibilityLabel | undefined,
): EventFieldAssignmentEffectScoreBand {
  switch (label) {
    case 'Güçlü uyum':
      return 'high';
    case 'Dengeli uyum':
      return 'medium';
    case 'Zayıf uyum':
      return 'low';
    default:
      return 'unknown';
  }
}

function buildAssignmentEffect(
  assignment: EventAssignmentState | null | undefined,
): EventFieldAssignmentEffect {
  const band = mapCompatibilityToBand(assignment?.compatibilityLabel);

  switch (band) {
    case 'high':
      return {
        label: 'Ekip uyumu iyi',
        body: 'Saha akışı stabil ilerliyor.',
        scoreBand: 'high',
        tone: 'positive',
      };
    case 'low':
      return {
        label: 'Atama riski var',
        body: 'Ekip yorgunluğu operasyon süresini etkileyebilir.',
        scoreBand: 'low',
        tone: 'warning',
      };
    case 'medium':
      return {
        label: 'Uyum dengeli',
        body: 'Rota ve kaynak kullanımı izleniyor.',
        scoreBand: 'medium',
        tone: 'neutral',
      };
    default:
      return {
        label: 'Uyum izleniyor',
        body: 'Saha akışı değerlendiriliyor.',
        scoreBand: 'unknown',
        tone: 'neutral',
      };
  }
}

function buildSelectedPlanSummary(
  input: BuildEventFieldPhasePresentationInput,
): EventFieldSelectedPlanSummary {
  const strategyId = input.selectedPlanStrategyId ?? 'balanced_plan';
  const label =
    input.selectedPlanStrategyLabel?.trim() ||
    PLAN_FIELD_HEADLINE[strategyId] ||
    getPlanStrategyLabel(strategyId);

  return {
    strategyId,
    label,
    effectLine: PLAN_FIELD_EFFECT[strategyId],
    tone: PLAN_FIELD_TONE[strategyId],
  };
}

function resolveStepState(
  stepIndex: number,
  currentIndex: number,
  interactionState: EventFieldInteractionState,
): EventFieldTimelineStepState {
  if (interactionState === 'completed' && stepIndex <= currentIndex) return 'done';
  if (stepIndex < currentIndex) return 'done';
  if (stepIndex === currentIndex) return 'current';
  if (interactionState === 'paused_for_decision' && stepIndex === currentIndex + 1) {
    return 'blocked';
  }
  return 'next';
}

function buildTimeline(
  interactionState: EventFieldInteractionState,
  timelineStepIndex: number,
  assignmentEffect: EventFieldAssignmentEffect,
  event?: EventCard,
  varietyInput?: Pick<BuildEventFieldPhasePresentationInput, 'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles'>,
): EventFieldTimeline {
  const maxIndex = TIMELINE_STEP_DEFS.length - 1;
  const currentIndex =
    interactionState === 'completed'
      ? maxIndex
      : Math.min(Math.max(0, timelineStepIndex), maxIndex);

  const progressPercent = clampProgress((currentIndex / maxIndex) * 100);

  const steps: EventFieldTimelineStep[] = TIMELINE_STEP_DEFS.map((step, index) => ({
    ...step,
    state: resolveStepState(index, currentIndex, interactionState),
    tone:
      assignmentEffect.scoreBand === 'low' && index >= 2
        ? 'warning'
        : index <= currentIndex
          ? 'positive'
          : 'neutral',
  }));

  const currentStepId = TIMELINE_STEP_DEFS[currentIndex]?.id;

  let helperText = 'Operasyon sahada ilerliyor';
  if (interactionState === 'paused_for_decision') {
    helperText = 'Mikro karar bekleniyor · timeline duraklatıldı';
  } else if (interactionState === 'completed') {
    helperText = 'Operasyon tamamlandı · sonucu görüntüleyebilirsin';
  } else if (currentStepId === 'intervention') {
    helperText = 'Saha müdahalesi devam ediyor';
  } else if (currentStepId === 'first_impact') {
    helperText = 'İlk saha etkisi alınıyor';
  }

  if (event) {
    const profile = getEventGameplayVarietyProfile(event, {
      day: varietyInput?.day,
      isDay1LearningEvent: varietyInput?.isDay1LearningEvent,
      recentProfiles: varietyInput?.recentVarietyProfiles,
    });
    const fieldHint = fieldVarietyHintLine(profile);
    if (
      fieldHint &&
      interactionState === 'running' &&
      (profile.primaryPressure === 'social_sensitivity' ||
        profile.primaryPressure === 'container_network_pressure')
    ) {
      helperText = fieldHint;
    }
  }

  return {
    progressPercent,
    steps,
    currentStepId,
    helperText,
  };
}

function resolveOperationStatus(
  interactionState: EventFieldInteractionState,
): EventFieldOperationStatus {
  switch (interactionState) {
    case 'paused_for_decision':
      return 'paused_for_decision';
    case 'completed':
      return 'completed';
    default:
      return 'running';
  }
}

export function buildEventFieldAdvisorComment(
  input: BuildEventFieldPhasePresentationInput,
  assignmentEffect: EventFieldAssignmentEffect,
  selectedPlan: EventFieldSelectedPlanSummary,
  hasMicroDecision: boolean,
): EventFieldAdvisorComment {
  if (input.isDay1LearningEvent || input.day === 1) {
    return {
      title: 'Ece',
      text: 'Şimdi operasyonu takip ediyoruz. Tamamlandığında kararın şehir etkisini göreceksin.',
      tone: 'teaching',
    };
  }

  const profile = getEventGameplayVarietyProfile(input.event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentProfiles: input.recentVarietyProfiles,
  });
  if (profile.primaryPressure === 'social_sensitivity' && profile.fieldHintLine) {
    return {
      title: 'Ece',
      text: profile.fieldHintLine,
      tone: 'calm',
    };
  }

  if (hasMicroDecision || assignmentEffect.scoreBand === 'low') {
    return {
      title: 'Ece',
      text: 'Atama riski sahada hissediliyor. Mikro karar çıkarsa planı korumak güvenli olabilir.',
      tone: 'warning',
    };
  }

  if (selectedPlan.strategyId === 'rapid_response') {
    return {
      title: 'Ece',
      text: 'Hızlı müdahale seçtin; zaman kazanıyoruz ama kaynak baskısını izliyoruz.',
      tone: 'calm',
    };
  }

  if (assignmentEffect.scoreBand === 'high') {
    return {
      title: 'Ece',
      text: 'Ekip sahada dengeli ilerliyor. Bu akış sonucu daha okunur hale getirecek.',
      tone: 'positive',
    };
  }

  return {
    title: 'Ece',
    text: 'Operasyon akışı izleniyor. Tamamlandığında sonucu birlikte okuyacağız.',
    tone: 'calm',
  };
}

function buildFieldCta(
  interactionState: EventFieldInteractionState,
  hasMicroDecision: boolean,
): EventFieldCta {
  if (interactionState === 'completed') {
    return {
      label: 'Sonucu Gör',
      actionKey: 'view_result',
      enabled: true,
    };
  }

  if (hasMicroDecision || interactionState === 'paused_for_decision') {
    return {
      label: 'Karar bekleniyor',
      actionKey: 'resolve_micro_decision',
      enabled: false,
    };
  }

  return {
    label: 'Takip Ediliyor',
    actionKey: 'continue_operation',
    enabled: false,
  };
}

function buildFieldResourceRows(
  input: BuildEventFieldPhasePresentationInput,
  assignmentEffect: EventFieldAssignmentEffect,
  selectedPlan: EventFieldSelectedPlanSummary,
): EventFieldResourceRow[] {
  const teamTone =
    assignmentEffect.scoreBand === 'high'
      ? 'positive'
      : assignmentEffect.scoreBand === 'low'
        ? 'warning'
        : 'neutral';
  const vehicleTone: EventFieldResourceRow['tone'] = input.assignment?.vehicleType
    ? teamTone === 'warning'
      ? 'neutral'
      : 'positive'
    : 'warning';
  const riskTone: EventFieldResourceRow['tone'] =
    input.event.riskLevel === 'critical' || input.event.riskLevel === 'high'
      ? 'warning'
      : 'neutral';

  return [
    {
      id: 'team',
      label: 'Ekip',
      value: assignmentEffect.label,
      tone: teamTone,
      iconKey: 'people-outline',
    },
    {
      id: 'vehicle',
      label: 'Araç',
      value: input.assignment?.vehicleType ? 'Sahada' : 'Seçim bekliyor',
      tone: vehicleTone,
      iconKey: 'car-outline',
    },
    {
      id: 'risk',
      label: 'Kritik risk',
      value: riskTone === 'warning' ? 'Yakından izleniyor' : 'Kontrol altında',
      tone: riskTone,
      iconKey: 'alert-circle-outline',
    },
    {
      id: 'impact',
      label: 'Beklenen etki',
      value: selectedPlan.effectLine,
      tone: selectedPlan.tone === 'warning' ? 'warning' : 'positive',
      iconKey: 'pulse-outline',
    },
  ];
}

export function mapMicroDecisionCardToFieldPresentation(
  card: MicroDecisionCardModel,
): EventFieldMicroDecisionPresentation {
  const tone: EventFieldMicroDecisionPresentation['tone'] =
    card.tone === 'critical' || card.tone === 'warning'
      ? 'warning'
      : card.tone === 'positive'
        ? 'neutral'
        : 'neutral';

  return {
    id: card.id,
    title: card.title,
    body: card.summary || card.reasonLine,
    options: card.optionRows.map((option) => ({
      id: option.id,
      label: option.label,
      helperText: option.tradeoff || option.description,
      tone:
        option.tone === 'critical' || option.tone === 'warning'
          ? 'warning'
          : option.tone === 'positive'
            ? 'positive'
            : 'neutral',
    })),
    tone,
    sourceLabel: card.typeLabel,
  };
}

export function buildEventFieldPhasePresentation(
  input: BuildEventFieldPhasePresentationInput,
): EventFieldPhasePresentation {
  const interactionState = input.interactionState ?? 'running';
  const timelineStepIndex = input.timelineStepIndex ?? 0;
  const reducedMotion = input.reducedMotion ?? false;
  const hasMicroDecision = Boolean(input.microDecision);

  const selectedPlan = buildSelectedPlanSummary(input);
  const assignmentEffect = applyAuthorityToFieldAssignmentEffect(
    buildAssignmentEffect(input.assignment),
    input.authorityGameplayContext,
  );
  const timeline = buildTimeline(interactionState, timelineStepIndex, assignmentEffect, input.event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentVarietyProfiles: input.recentVarietyProfiles,
  });
  const resourceRows = buildFieldResourceRows(input, assignmentEffect, selectedPlan);
  const advisorComment = buildEventFieldAdvisorComment(
    input,
    assignmentEffect,
    selectedPlan,
    hasMicroDecision,
  );
  const primaryCta = buildFieldCta(interactionState, hasMicroDecision);

  const autoCompleteEnabled = !hasMicroDecision && interactionState !== 'completed';

  return {
    title: 'Sahada',
    subtitle: 'Operasyon sahada ilerliyor',
    operationStatus: resolveOperationStatus(interactionState),
    selectedPlan,
    assignmentEffect,
    resourceRows,
    timeline,
    microDecision: input.microDecision ?? undefined,
    advisorComment,
    primaryCta,
    autoComplete: {
      enabled: autoCompleteEnabled,
      durationMs: operationMotionFieldAutoCompleteDurationMs(false),
      reducedMotionDurationMs: OPERATION_MOTION_FIELD_REDUCED_MS,
    },
    accessibilityLabel: `${input.event.title} sahada operasyon, ${selectedPlan.label}, ${timeline.helperText ?? ''}`,
  };
}

export function auditEventFieldPhasePresentation(
  model: EventFieldPhasePresentation,
): string[] {
  const issues: string[] = [];

  if (!model.title.trim()) issues.push('title empty');
  if (!model.accessibilityLabel.trim()) issues.push('accessibilityLabel empty');
  if (!['ready', 'running', 'paused_for_decision', 'completed', 'failed_safe'].includes(model.operationStatus)) {
    issues.push('invalid operationStatus');
  }
  if (model.timeline.progressPercent < 0 || model.timeline.progressPercent > 100) {
    issues.push('progressPercent out of range');
  }
  if (model.timeline.steps.length < 3 || model.timeline.steps.length > 5) {
    issues.push('timeline steps count out of range');
  }

  const stepIds = new Set<string>();
  for (const step of model.timeline.steps) {
    if (stepIds.has(step.id)) issues.push(`duplicate step ${step.id}`);
    stepIds.add(step.id);
  }

  if (!model.selectedPlan.label.trim() || !model.selectedPlan.effectLine.trim()) {
    issues.push('selectedPlan incomplete');
  }
  if (!['low', 'medium', 'high', 'unknown'].includes(model.assignmentEffect.scoreBand)) {
    issues.push('invalid assignmentEffect scoreBand');
  }
  if (!model.advisorComment.text.trim()) issues.push('advisorComment empty');

  if (model.microDecision) {
    if (!model.microDecision.options.length) issues.push('microDecision options empty');
    const optionIds = new Set<string>();
    for (const option of model.microDecision.options) {
      if (optionIds.has(option.id)) issues.push(`duplicate micro option ${option.id}`);
      optionIds.add(option.id);
    }
  }

  if (model.autoComplete.durationMs < 900 || model.autoComplete.durationMs > 1400) {
    issues.push('autoComplete duration out of range');
  }
  if (
    model.autoComplete.reducedMotionDurationMs < 0 ||
    model.autoComplete.reducedMotionDurationMs > 150
  ) {
    issues.push('reduced autoComplete duration out of range');
  }

  if (model.microDecision && model.autoComplete.enabled) {
    issues.push('autoComplete should pause for microDecision');
  }

  if (model.operationStatus === 'completed' && !model.primaryCta.enabled) {
    issues.push('completed CTA should be enabled');
  }
  if (model.operationStatus === 'running' && model.primaryCta.actionKey === 'view_result') {
    issues.push('running should not enable view_result early');
  }

  return issues;
}

export function fieldAdvisorDiffersFromDispatchAdvisor(
  fieldComment: string,
  dispatchComment: string,
): boolean {
  return fieldComment.trim() !== dispatchComment.trim();
}
