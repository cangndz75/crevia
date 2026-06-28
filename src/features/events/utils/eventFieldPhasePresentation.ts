import type { CompatibilityLabel } from '@/core/assignments/assignmentTypes';
import type { EventAssignmentState } from '@/core/assignments/assignmentTypes';
import type { EventCard } from '@/core/models/EventCard';
import {
  buildEceMemorySnapshot,
  buildFieldEceLine,
  mapEceToneToFieldAdvisorTone,
  mapEceToneToToneLabel,
  type EceMemoryContextInput,
} from '@/core/eceTone';
import {
  fieldVarietyHintLine,
  getEventGameplayVarietyProfile,
} from '@/core/eventVariety/eventGameplayVarietyPresentation';
import { applyAuthorityToFieldAssignmentEffect } from '@/core/authority/authorityGameplayUnlockPresentation';
import {
  buildMaintenanceBacklogFromReadiness,
  buildMaintenanceBacklogRuntimePresentation,
  buildMaintenanceFieldHint,
  buildMaintenanceRuntimeFieldHint,
} from '@/core/maintenanceBacklog';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import {
  buildOperationReadinessSnapshot,
  mapReadinessToneToUiTone,
} from '@/core/operationReadiness';
import {
  READINESS_FIELD_ITEM_LABELS,
  READINESS_FIELD_VALUE_LABELS,
} from '@/core/operationReadiness/operationReadinessConstants';
import type { MicroDecisionCardModel } from '@/core/microDecisions/microDecisionTypes';
import {
  operationMotionFieldAutoCompleteDurationMs,
  OPERATION_MOTION_FIELD_REDUCED_MS,
} from '@/core/motion/operationMotionTokens';
import {
  buildOperationPhaseTransitionPresentation,
  type OperationPhaseTransitionPresentation,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
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
  description: string;
  statusLabel: string;
  state: EventFieldTimelineStepState;
  iconKey: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventFieldTimeline = {
  title: string;
  progressPercent: number;
  steps: EventFieldTimelineStep[];
  currentStepId?: EventFieldTimelineStepId;
  activeStepId?: EventFieldTimelineStepId;
  helperText?: string;
};

export type EventFieldStatusHero = {
  title: string;
  eventTitle: string;
  districtName: string;
  selectedPlanLabel: string;
  statusLabel: string;
  summary: string;
  livePillLabel: string;
  tone: EventFieldSelectedPlanSummary['tone'];
};

export type EventFieldFeedbackItem = {
  id: string;
  sourceLabel: string;
  message: string;
  tone: 'positive' | 'neutral' | 'warning';
  timeLabel?: string;
  iconKey: string;
};

export type EventFieldFeedbackPresentation = {
  title: string;
  items: EventFieldFeedbackItem[];
};

export type EventFieldFirstImpactItem = {
  id: string;
  label: string;
  valueLabel: string;
  description: string;
  tone: 'positive' | 'neutral' | 'warning';
  indicator: 'up' | 'down' | 'neutral';
};

export type EventFieldFirstImpactPresentation = {
  title: string;
  items: EventFieldFirstImpactItem[];
};

export type EventFieldResourcePulseItem = {
  id: string;
  label: string;
  value: string;
  description?: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventFieldResourcePulsePresentation = {
  title: string;
  items: EventFieldResourcePulseItem[];
  maintenanceHint?: {
    text: string;
    tone: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  };
};

export type EventFieldActionKey =
  | 'open_field_note'
  | 'watch_on_map'
  | 'view_team_status'
  | 'view_risks';

export type EventFieldAction = {
  id: string;
  label: string;
  iconKey: string;
  actionKey: EventFieldActionKey;
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
  toneLabel: string;
};

export type EventFieldCtaActionKey =
  | 'continue_operation'
  | 'resolve_micro_decision'
  | 'view_result'
  | 'disabled';

export type EventFieldCta = {
  label: string;
  disabledLabel: string;
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
  phaseHeading: string;
  phaseDescription: string;
  operationStatus: EventFieldOperationStatus;
  statusHero: EventFieldStatusHero;
  selectedPlan: EventFieldSelectedPlanSummary;
  assignmentEffect: EventFieldAssignmentEffect;
  resourceRows: EventFieldResourceRow[];
  resourcePulse: EventFieldResourcePulsePresentation;
  timeline: EventFieldTimeline;
  fieldFeedback: EventFieldFeedbackPresentation;
  firstImpact: EventFieldFirstImpactPresentation;
  microDecision?: EventFieldMicroDecisionPresentation;
  advisorComment: EventFieldAdvisorComment;
  actions: EventFieldAction[];
  primaryCta: EventFieldCta;
  autoComplete: EventFieldAutoCompletePolicy;
  accessibilityLabel: string;
  phaseTransition: OperationPhaseTransitionPresentation;
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
  eceMemoryContext?: EceMemoryContextInput;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
};

const TIMELINE_STEP_DEFS: Array<{
  id: EventFieldTimelineStepId;
  label: string;
  description: string;
  iconKey: string;
}> = [
  {
    id: 'departed',
    label: 'Ekip Ulaştı',
    description: 'Saha ekibi operasyon noktasına ulaştı.',
    iconKey: 'people-outline',
  },
  {
    id: 'intervention',
    label: 'Müdahale Başladı',
    description: 'Plan sahada uygulanıyor.',
    iconKey: 'construct-outline',
  },
  {
    id: 'first_impact',
    label: 'İlk Etki Alınıyor',
    description: 'Mahalle ve ekip tepkisi izleniyor.',
    iconKey: 'shield-checkmark-outline',
  },
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

function resolveStepStatusLabel(
  state: EventFieldTimelineStepState,
  stepId: EventFieldTimelineStepId,
): string {
  if (state === 'done') return 'Tamamlandı';
  if (state === 'current') {
    return stepId === 'first_impact' ? 'İzleniyor' : 'Devam Ediyor';
  }
  if (state === 'blocked') return 'Bekliyor';
  return 'Bekliyor';
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

  const steps: EventFieldTimelineStep[] = TIMELINE_STEP_DEFS.map((step, index) => {
    const state = resolveStepState(index, currentIndex, interactionState);
    return {
      ...step,
      state,
      statusLabel: resolveStepStatusLabel(state, step.id),
      tone:
        assignmentEffect.scoreBand === 'low' && index >= 2
          ? 'warning'
          : index <= currentIndex
            ? 'positive'
            : 'neutral',
    };
  });

  const currentStepId = TIMELINE_STEP_DEFS[currentIndex]?.id;

  let helperText = 'Ekip sahada, müdahale ilerliyor.';
  if (interactionState === 'paused_for_decision') {
    helperText = 'Mikro karar bekleniyor · saha akışı duraklatıldı';
  } else if (interactionState === 'completed') {
    helperText = 'İlk etki alındı · sonucu görüntüleyebilirsin';
  } else if (currentStepId === 'intervention') {
    helperText = 'Plan sahada uygulanıyor';
  } else if (currentStepId === 'first_impact') {
    helperText = 'Mahalle tepkisi izleniyor';
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
    title: 'Saha İlerlemesi',
    progressPercent,
    steps,
    currentStepId,
    activeStepId: currentStepId,
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
  const day = input.day ?? input.event.day ?? 1;

  const profile = getEventGameplayVarietyProfile(input.event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentProfiles: input.recentVarietyProfiles,
  });
  if (
    profile.primaryPressure === 'social_sensitivity' &&
    profile.fieldHintLine &&
    day > 1 &&
    !input.isDay1LearningEvent
  ) {
    return {
      title: 'Ece Notu',
      text: profile.fieldHintLine,
      tone: 'calm',
      toneLabel: 'İzleniyor',
    };
  }

  const memoryContext: EceMemoryContextInput = {
    day,
    event: input.event,
    eventId: input.event.id,
    districtName: input.event.district,
    selectedPlanId: selectedPlan.strategyId,
    selectedPlanLabel: selectedPlan.label,
    resourcePressure: assignmentEffect.scoreBand === 'low',
    ...input.eceMemoryContext,
  };

  const memory = buildEceMemorySnapshot(memoryContext);
  const line = buildFieldEceLine({
    memory,
    context: memoryContext,
    seed: `${input.event.id}:field:${day}`,
    microDecisionPending: hasMicroDecision,
    operationRisky: assignmentEffect.scoreBand === 'low',
    avoidLines: input.eceMemoryContext?.avoidLines,
  });

  if (input.isDay1LearningEvent || day === 1) {
    return {
      title: 'Ece Notu',
      text: line.message,
      tone: 'teaching',
      toneLabel: 'Hazır',
    };
  }

  const tone = mapEceToneToFieldAdvisorTone(line.tone);
  return {
    title: 'Ece Notu',
    text: line.message,
    tone,
    toneLabel: mapEceToneToToneLabel(line.tone),
  };
}

function buildFieldStatusHero(
  input: BuildEventFieldPhasePresentationInput,
  selectedPlan: EventFieldSelectedPlanSummary,
  interactionState: EventFieldInteractionState,
  timeline: EventFieldTimeline,
): EventFieldStatusHero {
  const districtName = input.event.district?.trim() || 'Mahalle';
  let statusLabel = 'Ekip sahada';
  let summary = 'Ekip mahalle odağına ulaştı. İlk geri bildirimler toplanıyor.';
  let livePillLabel = 'Canlı';

  if (interactionState === 'completed') {
    statusLabel = 'İlk etki alındı';
    summary = 'Saha müdahalesi tamamlandı. Sonuç özeti hazır.';
    livePillLabel = 'Tamamlandı';
  } else if (timeline.currentStepId === 'intervention') {
    statusLabel = 'Müdahale başladı';
    summary = 'Plan sahada uygulanıyor. Ekip geri bildirim gönderiyor.';
    livePillLabel = 'İlerliyor';
  } else if (timeline.currentStepId === 'first_impact') {
    statusLabel = 'İlk etki bekleniyor';
    summary = 'Mahalle tepkisi izleniyor. Sonuç özeti yakında.';
    livePillLabel = 'Sahada';
  }

  return {
    title: 'Saha Durumu',
    eventTitle: input.event.title,
    districtName,
    selectedPlanLabel: selectedPlan.label,
    statusLabel,
    summary,
    livePillLabel,
    tone: selectedPlan.tone,
  };
}

function buildFieldFeedback(
  selectedPlan: EventFieldSelectedPlanSummary,
  assignmentEffect: EventFieldAssignmentEffect,
  interactionState: EventFieldInteractionState,
): EventFieldFeedbackPresentation {
  const strategyId = selectedPlan.strategyId ?? 'balanced_plan';
  const teamMessage =
    interactionState === 'completed'
      ? 'Ön kontrol tamamlandı, saha notu iletildi.'
      : 'Ekip noktaya ulaştı, ön kontrol başladı.';

  let citizenMessage = 'Mahalle tepkisi izleniyor, görünürlük dengeli.';
  if (strategyId === 'rapid_response') {
    citizenMessage = 'Görünür müdahale mahallede fark edildi.';
  } else if (strategyId === 'long_term_fix') {
    citizenMessage = 'Mahallede düzenli müdahale sinyali alındı.';
  }

  const opsMessage =
    assignmentEffect.scoreBand === 'low'
      ? 'Kaynak kullanımı sınırda, tempo izleniyor.'
      : 'Kaynak kullanımı plan sınırında ilerliyor.';

  return {
    title: 'Saha Geri Bildirimi',
    items: [
      {
        id: 'team',
        sourceLabel: 'Ekip',
        message: teamMessage,
        tone: assignmentEffect.tone === 'warning' ? 'warning' : 'positive',
        timeLabel: 'şimdi',
        iconKey: 'people-outline',
      },
      {
        id: 'citizen',
        sourceLabel: 'Vatandaş',
        message: citizenMessage,
        tone: 'neutral',
        timeLabel: 'az önce',
        iconKey: 'chatbubbles-outline',
      },
      {
        id: 'ops',
        sourceLabel: 'Operasyon',
        message: opsMessage,
        tone: assignmentEffect.scoreBand === 'low' ? 'warning' : 'neutral',
        timeLabel: 'az önce',
        iconKey: 'pulse-outline',
      },
    ],
  };
}

function buildFirstImpact(
  input: BuildEventFieldPhasePresentationInput,
  selectedPlan: EventFieldSelectedPlanSummary,
  assignmentEffect: EventFieldAssignmentEffect,
): EventFieldFirstImpactPresentation {
  const strategyId = selectedPlan.strategyId ?? 'balanced_plan';

  let trustValue = 'Toparlanıyor';
  let trustDesc = 'Görünür müdahale olumlu sinyal veriyor.';
  let riskValue = 'Azalıyor';
  let riskDesc = 'Saha müdahalesi riski baskılıyor.';
  let resourceValue = 'İzleniyor';
  let resourceDesc = 'Ekip temposu hâlâ kritik.';
  let resourceTone: EventFieldFirstImpactItem['tone'] = 'neutral';

  if (strategyId === 'rapid_response') {
    resourceValue = 'Zorlanıyor';
    resourceDesc = 'Hızlı müdahale kaynak temposunu zorluyor.';
    resourceTone = 'warning';
  } else if (strategyId === 'balanced_plan') {
    resourceValue = 'Dengede';
    resourceDesc = 'Kaynak kullanımı plan dengesinde.';
  } else if (strategyId === 'long_term_fix') {
    riskValue = 'Yarın azalabilir';
    riskDesc = 'Kalıcı yatırım etkisi kademeli görünür.';
    resourceValue = 'Yüksek kullanım';
    resourceDesc = 'Uzun vadeli plan daha fazla kaynak istiyor.';
    resourceTone = 'warning';
  }

  if (assignmentEffect.scoreBand === 'low') {
    resourceDesc = 'Ekip temposu izlenmeli.';
    resourceTone = 'warning';
  }

  if (input.event.riskLevel === 'critical' || input.event.riskLevel === 'high') {
    riskDesc = 'Risk düşüyor ama kapanmış değil.';
  }

  const profile = getEventGameplayVarietyProfile(input.event, {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    recentProfiles: input.recentVarietyProfiles,
  });
  if (profile.primaryPressure === 'social_sensitivity') {
    trustDesc = 'Sosyal tepki izleniyor, görünür müdahale önemli.';
  }

  return {
    title: 'İlk Etki',
    items: [
      {
        id: 'trust',
        label: 'Güven',
        valueLabel: trustValue,
        description: trustDesc,
        tone: 'positive',
        indicator: 'up',
      },
      {
        id: 'risk',
        label: 'Risk',
        valueLabel: riskValue,
        description: riskDesc,
        tone: 'neutral',
        indicator: 'down',
      },
      {
        id: 'resource',
        label: 'Kaynak',
        valueLabel: resourceValue,
        description: resourceDesc,
        tone: resourceTone,
        indicator: 'neutral',
      },
    ],
  };
}

function buildResourcePulse(
  input: BuildEventFieldPhasePresentationInput,
  assignmentEffect: EventFieldAssignmentEffect,
  selectedPlan: EventFieldSelectedPlanSummary,
): EventFieldResourcePulsePresentation {
  const snapshot = buildOperationReadinessSnapshot({
    phase: 'field',
    hasVehicle: Boolean(input.assignment?.vehicleType),
    assignmentEffectBand: assignmentEffect.scoreBand,
    planStrategyId: selectedPlan.strategyId,
    eventRiskLevel: input.event.riskLevel,
    publicSatisfactionPreview: input.event.previewEffects?.publicSatisfaction,
  });

  const personnel = snapshot.signals.find((s) => s.domain === 'personnel');
  const route = snapshot.signals.find((s) => s.domain === 'route');
  const budget = snapshot.signals.find((s) => s.domain === 'budget');
  const social = snapshot.signals.find((s) => s.domain === 'social');

  const itemFor = (
    id: string,
    domain: 'personnel' | 'route' | 'budget' | 'social',
    iconKey: string,
    signal = snapshot.signals.find((s) => s.domain === domain),
  ): EventFieldResourcePulseItem => ({
    id,
    label: READINESS_FIELD_ITEM_LABELS[domain] ?? signal?.label ?? domain,
    value:
      READINESS_FIELD_VALUE_LABELS[domain]?.[signal?.status ?? 'limited'] ??
      signal?.statusLabel ??
      'İzleniyor',
    tone: mapReadinessToneToUiTone(signal?.tone ?? 'neutral'),
    iconKey,
  });

  const maintenanceHint = input.maintenanceBacklogRuntime
    ? buildMaintenanceRuntimeFieldHint(
        buildMaintenanceBacklogRuntimePresentation(input.maintenanceBacklogRuntime, {
          readinessSnapshot: snapshot,
        }),
        [personnel?.description ?? '', route?.description ?? '', snapshot.summary],
      ) ??
      buildMaintenanceFieldHint(buildMaintenanceBacklogFromReadiness(snapshot), [
        personnel?.description ?? '',
        route?.description ?? '',
        snapshot.summary,
      ])
    : buildMaintenanceFieldHint(buildMaintenanceBacklogFromReadiness(snapshot), [
        personnel?.description ?? '',
        route?.description ?? '',
        snapshot.summary,
      ]);

  return {
    title: 'Ekip Nabzı',
    items: [
      itemFor('team', 'personnel', 'people-outline', personnel),
      itemFor('vehicle', 'route', 'navigate-outline', route),
      itemFor('resource', 'budget', 'wallet-outline', budget),
      itemFor('duration', 'social', 'chatbubbles-outline', social),
    ],
    maintenanceHint: maintenanceHint ?? undefined,
  };
}

function buildFieldActions(): EventFieldAction[] {
  return [
    {
      id: 'field-note',
      label: 'Saha Notu',
      iconKey: 'document-text-outline',
      actionKey: 'open_field_note',
    },
    {
      id: 'watch-map',
      label: 'Haritada İzle',
      iconKey: 'map-outline',
      actionKey: 'watch_on_map',
    },
    {
      id: 'team-status',
      label: 'Ekip Durumu',
      iconKey: 'people-outline',
      actionKey: 'view_team_status',
    },
    {
      id: 'view-risks',
      label: 'Riskleri Gör',
      iconKey: 'alert-circle-outline',
      actionKey: 'view_risks',
    },
  ];
}

function resolveFieldSubtitle(
  input: BuildEventFieldPhasePresentationInput,
  interactionState: EventFieldInteractionState,
): string {
  if (input.isDay1LearningEvent || (input.day ?? input.event.day ?? 1) === 1) {
    return 'Saha ilerlemesini takip et.';
  }
  if (interactionState === 'completed') {
    return 'İlk etkiyi ve riskleri izle.';
  }
  return 'Ekip müdahaleyi yürütüyor.';
}

function buildFieldCta(
  interactionState: EventFieldInteractionState,
  hasMicroDecision: boolean,
): EventFieldCta {
  if (interactionState === 'completed') {
    return {
      label: 'Sonucu Gör',
      disabledLabel: 'Sonucu Gör',
      actionKey: 'view_result',
      enabled: true,
    };
  }

  if (hasMicroDecision || interactionState === 'paused_for_decision') {
    return {
      label: 'Karar bekleniyor',
      disabledLabel: 'Saha Sinyalini Bekle',
      actionKey: 'resolve_micro_decision',
      enabled: false,
    };
  }

  return {
    label: 'Saha Sinyalini Bekle',
    disabledLabel: 'Saha Sinyalini Bekle',
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
  const statusHero = buildFieldStatusHero(input, selectedPlan, interactionState, timeline);
  const resourceRows = buildFieldResourceRows(input, assignmentEffect, selectedPlan);
  const resourcePulse = buildResourcePulse(input, assignmentEffect, selectedPlan);
  const fieldFeedback = buildFieldFeedback(selectedPlan, assignmentEffect, interactionState);
  const firstImpact = buildFirstImpact(input, selectedPlan, assignmentEffect);
  const advisorComment = buildEventFieldAdvisorComment(
    input,
    assignmentEffect,
    selectedPlan,
    hasMicroDecision,
  );
  const actions = buildFieldActions();
  const primaryCta = buildFieldCta(interactionState, hasMicroDecision);

  const autoCompleteEnabled = !hasMicroDecision && interactionState !== 'completed';
  const phaseTransition = buildOperationPhaseTransitionPresentation({
    phase: 'field',
    event: input.event,
    teamStatus: statusHero.statusLabel,
    dispatchStatus:
      interactionState === 'completed'
        ? 'Tamamlandı'
        : interactionState === 'paused_for_decision'
          ? 'Karar bekliyor'
          : 'Yönlendirildi',
    ctaEnabled: primaryCta.enabled,
    ctaDisabledLabel: primaryCta.disabledLabel,
    ctaActionKey: primaryCta.actionKey,
    avoidSummaries: [advisorComment.text, statusHero.summary],
  });

  return {
    title: phaseTransition.shell.title,
    subtitle: resolveFieldSubtitle(input, interactionState),
    phaseHeading: 'Operasyon Sahada',
    phaseDescription:
      'Ekip sahada. Müdahalenin ilk etkilerini ve kalan riskleri takip et.',
    operationStatus: resolveOperationStatus(interactionState),
    statusHero,
    selectedPlan,
    assignmentEffect,
    resourceRows,
    resourcePulse,
    timeline,
    fieldFeedback,
    firstImpact,
    microDecision: input.microDecision ?? undefined,
    advisorComment,
    actions,
    primaryCta,
    autoComplete: {
      enabled: autoCompleteEnabled,
      durationMs: operationMotionFieldAutoCompleteDurationMs(false),
      reducedMotionDurationMs: OPERATION_MOTION_FIELD_REDUCED_MS,
    },
    phaseTransition,
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
  if (!model.advisorComment.toneLabel.trim()) issues.push('advisorComment toneLabel empty');
  if (!model.phaseHeading.trim() || !model.phaseDescription.trim()) {
    issues.push('phase heading/description empty');
  }
  if (!model.statusHero.eventTitle.trim() || !model.statusHero.summary.trim()) {
    issues.push('statusHero incomplete');
  }
  if (model.fieldFeedback.items.length < 2) issues.push('fieldFeedback too short');
  if (model.firstImpact.items.length < 3) issues.push('firstImpact incomplete');
  if (model.resourcePulse.items.length < 4) issues.push('resourcePulse incomplete');
  if (model.actions.length < 4) issues.push('actions incomplete');
  if (!model.primaryCta.disabledLabel.trim()) issues.push('primaryCta disabledLabel empty');

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
