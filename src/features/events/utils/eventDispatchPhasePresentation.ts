import {
  buildDispatchReadinessFromContext,
  buildEceReadinessHint,
  buildOperationReadinessSnapshot,
} from '@/core/operationReadiness';
import {
  buildEceMaintenanceHint,
  buildMaintenanceBacklogFromReadiness,
  buildMaintenanceBacklogRuntimePresentation,
  buildMaintenanceDispatchHint,
  buildMaintenanceRuntimeDispatchHint,
} from '@/core/maintenanceBacklog';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import type {
  AssignmentCompatibilityResult,
  CompatibilityLabel,
  EventAssignmentState,
} from '@/core/assignments/assignmentTypes';
import {
  dispatchVarietyHintLine,
  getEventGameplayVarietyProfile,
} from '@/core/eventVariety/eventGameplayVarietyPresentation';
import { applyAuthorityToDispatchReasons } from '@/core/authority/authorityGameplayUnlockPresentation';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import {
  buildDispatchEceLine,
  buildEceMemorySnapshot,
  mapEceToneToDispatchAdvisorTone,
  mapEceToneToToneLabel,
  type EceMemoryContextInput,
} from '@/core/eceTone';
import {
  operationMotionDispatchDurationMs,
  operationMotionDispatchSentDurationMs,
} from '@/core/motion/operationMotionTokens';
import {
  getPlanStrategyLabel,
  mapStrategyIdToPlanOptionId,
  type EventPlanStrategyId,
} from '@/features/events/utils/eventPlanPhasePresentation';
import type { PlanOptionId } from '@/features/events/utils/eventWorkflowPlanPresentation';
import {
  buildOperationPhaseTransitionPresentation,
  type OperationPhaseTransitionPresentation,
} from '@/features/events/utils/operationPhaseTransitionPresentation';
import {
  getPersonnelAssignmentLabel,
  getVehicleAssignmentLabel,
} from '@/core/assignments/assignmentPresentation';

export type EventDispatchInteractionState = 'idle' | 'dispatching' | 'sent';

export type EventDispatchPlanChip = {
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventDispatchSelectedPlanSummary = {
  strategyId?: EventPlanStrategyId;
  label: string;
  summary: string;
  tone: 'teal' | 'green' | 'gold' | 'warning' | 'neutral';
  sourceLabel: string;
  isDefaultPlan?: boolean;
  chips: EventDispatchPlanChip[];
};

export type EventDispatchOverallReadinessStatus =
  | 'ready'
  | 'limited'
  | 'strained'
  | 'blocked';

export type EventDispatchReadinessPanel = {
  title: string;
  overallStatus: EventDispatchOverallReadinessStatus;
  overallLabel: string;
  items: EventDispatchReadinessRow[];
  maintenanceHint?: {
    text: string;
    tone: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
    countLabel?: string;
  };
};

export type EventDispatchResourceSummaryItem = {
  id: string;
  label: string;
  value: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventDispatchResourceSummary = {
  title: string;
  items: EventDispatchResourceSummaryItem[];
};

export type EventDispatchBlocker = {
  id: string;
  message: string;
  tone: 'neutral' | 'warning' | 'critical';
  iconKey: string;
};

export type EventDispatchBlockersPresentation = {
  title: string;
  items: EventDispatchBlocker[];
};

export type EventDispatchActionKey =
  | 'view_readiness'
  | 'check_route'
  | 'compare_risks'
  | 'open_note';

export type EventDispatchAction = {
  id: string;
  label: string;
  iconKey: string;
  actionKey: EventDispatchActionKey;
};

export type EventDispatchAssignmentSummary = {
  title: string;
  body: string;
  personnelLabel?: string;
  vehicleLabel?: string;
  teamLabel?: string;
  status: 'ready' | 'partial' | 'missing' | 'locked';
};

export type EventDispatchCompatibilityScoreBand = 'low' | 'medium' | 'high' | 'unknown';

export type EventDispatchCompatibilityReason = {
  id: string;
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventDispatchCompatibility = {
  label: string;
  scoreBand: EventDispatchCompatibilityScoreBand;
  tone: 'positive' | 'neutral' | 'warning';
  reasons: EventDispatchCompatibilityReason[];
};

export type EventDispatchReadinessRow = {
  id: 'team' | 'vehicle' | 'budget' | 'social';
  label: string;
  statusLabel: string;
  reason: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventDispatchRouteStepId = 'center' | 'transit' | 'field';

export type EventDispatchRouteStepState = 'ready' | 'current' | 'locked' | 'done';

export type EventDispatchRouteStep = {
  id: EventDispatchRouteStepId;
  label: string;
  state: EventDispatchRouteStepState;
  iconKey: string;
};

export type EventDispatchRoutePreview = {
  title: string;
  steps: EventDispatchRouteStep[];
  pathLabels: string[];
  districtName: string;
  routeCopy: string;
  estimatedLabel?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventDispatchAdvisorComment = {
  title: string;
  text: string;
  tone: 'calm' | 'teaching' | 'warning' | 'positive';
  toneLabel: string;
};

export type EventDispatchCtaActionKey = 'send_to_field' | 'complete_assignment' | 'disabled';

export type EventDispatchCta = {
  label: string;
  disabledLabel: string;
  actionKey: EventDispatchCtaActionKey;
  enabled: boolean;
  warningSubline?: string;
};

export type EventDispatchFeedback = {
  state: EventDispatchInteractionState;
  label: string;
  helperText?: string;
  durationMs: number;
};

export type EventDispatchPhasePresentation = {
  title: string;
  subtitle?: string;
  phaseHeading: string;
  phaseDescription: string;
  selectedPlan: EventDispatchSelectedPlanSummary;
  assignmentSummary: EventDispatchAssignmentSummary;
  readiness: EventDispatchReadinessPanel;
  /** @deprecated use readiness.items */
  readinessRows: EventDispatchReadinessRow[];
  resourceSummary: EventDispatchResourceSummary;
  compatibility: EventDispatchCompatibility;
  routePreview: EventDispatchRoutePreview;
  blockers: EventDispatchBlockersPresentation;
  advisorComment: EventDispatchAdvisorComment;
  actions: EventDispatchAction[];
  primaryCta: EventDispatchCta;
  dispatchFeedback: EventDispatchFeedback;
  accessibilityLabel: string;
  phaseTransition: OperationPhaseTransitionPresentation;
};

export type BuildEventDispatchPhasePresentationInput = {
  event: EventCard;
  assignment?: EventAssignmentState | null;
  compatibility?: AssignmentCompatibilityResult | null;
  selectedPlanStrategyId?: EventPlanStrategyId | null;
  selectedPlanStrategyLabel?: string | null;
  assignmentReady: boolean;
  hasSelectedDecision: boolean;
  dispatchInteractionState?: EventDispatchInteractionState;
  day?: number;
  isDay1LearningEvent?: boolean;
  reducedMotion?: boolean;
  recentVarietyProfiles?: import('@/core/eventVariety/eventGameplayVarietyTypes').BuildEventGameplayVarietyProfileInput['recentProfiles'];
  authorityGameplayContext?: import('@/core/authority/authorityGameplayUnlockTypes').AuthorityGameplayPresentationContext;
  eceMemoryContext?: EceMemoryContextInput;
  maintenanceBacklogRuntime?: MaintenanceBacklogRuntimeState | null;
};

const PLAN_DISPATCH_SUMMARY: Record<EventPlanStrategyId, string> = {
  rapid_response: 'Görünür ekip etkisiyle güveni hızlı toparlamayı hedefler.',
  balanced_plan: 'Riski büyütmeden ekip temposunu koruyarak ilerler.',
  long_term_fix: 'Bugünkü müdahaleyi yarınki riski azaltacak şekilde genişletir.',
};

const PLAN_DISPATCH_CHIPS: Record<EventPlanStrategyId, EventDispatchPlanChip[]> = {
  rapid_response: [
    { label: 'Etki', value: 'Hızlı', tone: 'positive' },
    { label: 'Bedel', value: 'Ekip baskısı', tone: 'warning' },
  ],
  balanced_plan: [
    { label: 'Etki', value: 'Dengeli', tone: 'neutral' },
    { label: 'Bedel', value: 'Orta', tone: 'neutral' },
  ],
  long_term_fix: [
    { label: 'Etki', value: 'Uzun vadeli', tone: 'positive' },
    { label: 'Bedel', value: 'Yüksek kaynak', tone: 'warning' },
  ],
};

const PLAN_ESTIMATED_MINUTES: Record<EventPlanStrategyId, number> = {
  rapid_response: 12,
  balanced_plan: 18,
  long_term_fix: 25,
};

const PLAN_DISPATCH_TONE: Record<EventPlanStrategyId, EventDispatchSelectedPlanSummary['tone']> = {
  rapid_response: 'teal',
  balanced_plan: 'green',
  long_term_fix: 'gold',
};

function mapCompatibilityLabelToBand(
  label: CompatibilityLabel | undefined,
): EventDispatchCompatibilityScoreBand {
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

function mapCompatibilityLabelToUi(label: CompatibilityLabel | undefined): {
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
} {
  switch (label) {
    case 'Güçlü uyum':
      return { label: 'Uyum iyi', tone: 'positive' };
    case 'Zayıf uyum':
      return { label: 'Riskli atama', tone: 'warning' };
    case 'Dengeli uyum':
      return { label: 'Uyum dengeli', tone: 'neutral' };
    default:
      return { label: 'Uyum izleniyor', tone: 'neutral' };
  }
}

function buildCompatibilityReasons(
  compat: AssignmentCompatibilityResult | null | undefined,
  assignment: EventAssignmentState | null | undefined,
  event?: EventCard,
  varietyInput?: Pick<
    BuildEventDispatchPhasePresentationInput,
    'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles' | 'authorityGameplayContext'
  >,
): EventDispatchCompatibilityReason[] {
  const reasons: EventDispatchCompatibilityReason[] = [];

  if (event) {
    const profile = getEventGameplayVarietyProfile(event, {
      day: varietyInput?.day,
      isDay1LearningEvent: varietyInput?.isDay1LearningEvent,
      recentProfiles: varietyInput?.recentVarietyProfiles,
    });
    const hint = dispatchVarietyHintLine(profile);
    if (hint && profile.primaryPressure === 'team_fatigue_pressure') {
      reasons.push({
        id: 'variety-fatigue',
        label: 'Ekip yorgunluğu etkili',
        tone: 'warning',
        iconKey: 'people-outline',
      });
    } else if (hint) {
      reasons.push({
        id: 'variety-pressure',
        label: hint.length > 40 ? `${hint.slice(0, 38)}…` : hint,
        tone: 'neutral',
        iconKey: 'information-circle-outline',
      });
    }
  }

  for (const strength of compat?.strengths ?? []) {
    if (reasons.length >= 3) break;
    reasons.push({
      id: `strength-${reasons.length}`,
      label: strength.length > 40 ? `${strength.slice(0, 38)}…` : strength,
      tone: 'positive',
      iconKey: 'checkmark-circle-outline',
    });
  }

  for (const warning of compat?.warnings ?? []) {
    if (reasons.length >= 3) break;
    reasons.push({
      id: `warning-${reasons.length}`,
      label: warning.length > 40 ? `${warning.slice(0, 38)}…` : warning,
      tone: 'warning',
      iconKey: 'alert-circle-outline',
    });
  }

  if (reasons.length === 0 && assignment) {
    reasons.push({
      id: 'assignment-ready',
      label: 'Kaynak dengeli',
      tone: 'neutral',
      iconKey: 'briefcase-outline',
    });
  }

  if (reasons.length === 0) {
    reasons.push({
      id: 'fallback',
      label: 'Atama izleniyor',
      tone: 'neutral',
      iconKey: 'ellipse-outline',
    });
  }

  return applyAuthorityToDispatchReasons(
    reasons.slice(0, 3),
    varietyInput?.authorityGameplayContext,
    compat?.warnings,
    compat?.strengths,
  );
}

function buildSelectedPlanSummary(
  input: BuildEventDispatchPhasePresentationInput,
): EventDispatchSelectedPlanSummary {
  const hasExplicitPlan = Boolean(input.selectedPlanStrategyId);
  const strategyId = input.selectedPlanStrategyId ?? 'balanced_plan';
  const label = hasExplicitPlan
    ? input.selectedPlanStrategyLabel?.trim() || getPlanStrategyLabel(strategyId)
    : 'Varsayılan plan';

  return {
    strategyId: hasExplicitPlan ? strategyId : undefined,
    label,
    summary: PLAN_DISPATCH_SUMMARY[strategyId],
    tone: PLAN_DISPATCH_TONE[strategyId],
    sourceLabel: hasExplicitPlan ? 'Plan Aktarımı' : 'Varsayılan plan',
    isDefaultPlan: !hasExplicitPlan,
    chips: PLAN_DISPATCH_CHIPS[strategyId],
  };
}

function resolveAssignmentStatus(
  assignment: EventAssignmentState | null | undefined,
  assignmentReady: boolean,
): EventDispatchAssignmentSummary['status'] {
  if (!assignment) return 'missing';
  if (assignmentReady) return 'ready';
  if (assignment.personnelType && assignment.vehicleType) return 'partial';
  return 'locked';
}

function buildAssignmentSummary(
  assignment: EventAssignmentState | null | undefined,
  assignmentReady: boolean,
): EventDispatchAssignmentSummary {
  const status = resolveAssignmentStatus(assignment, assignmentReady);

  if (!assignment) {
    return {
      title: 'Atama',
      body: 'Ekip ve araç seçimini tamamla.',
      status: 'missing',
    };
  }

  const personnelLabel = getPersonnelAssignmentLabel(assignment.personnelType);
  const vehicleLabel = getVehicleAssignmentLabel(assignment.vehicleType);

  return {
    title: 'Saha ataması',
    body: assignmentReady
      ? 'Ekip sahaya çıkmaya hazır.'
      : 'Atamayı onayla, ardından sahaya gönder.',
    personnelLabel,
    vehicleLabel,
    teamLabel: personnelLabel,
    status,
  };
}

function buildRoutePreview(
  assignment: EventAssignmentState | null | undefined,
  assignmentReady: boolean,
  dispatchState: EventDispatchInteractionState,
  planStrategyId: EventPlanStrategyId,
  event?: EventCard,
  varietyInput?: Pick<BuildEventDispatchPhasePresentationInput, 'day' | 'isDay1LearningEvent' | 'recentVarietyProfiles'>,
): EventDispatchRoutePreview {
  const districtName =
    event?.district?.trim() || event?.neighborhoodId?.trim() || 'Mahalle';

  const centerState: EventDispatchRouteStepState =
    dispatchState === 'sent' ? 'done' : 'ready';

  const transitState: EventDispatchRouteStepState =
    dispatchState === 'sent'
      ? 'done'
      : dispatchState === 'dispatching'
        ? 'current'
        : assignmentReady
          ? 'current'
          : assignment
            ? 'ready'
            : 'locked';

  const fieldState: EventDispatchRouteStepState =
    dispatchState === 'sent' ? 'current' : dispatchState === 'dispatching' ? 'ready' : 'locked';

  let estimatedLabel =
    planStrategyId === 'rapid_response'
      ? `~${PLAN_ESTIMATED_MINUTES.rapid_response} dk`
      : planStrategyId === 'long_term_fix'
        ? `~${PLAN_ESTIMATED_MINUTES.long_term_fix} dk`
        : `~${PLAN_ESTIMATED_MINUTES.balanced_plan} dk`;

  if (event) {
    const profile = getEventGameplayVarietyProfile(event, {
      day: varietyInput?.day,
      isDay1LearningEvent: varietyInput?.isDay1LearningEvent,
      recentProfiles: varietyInput?.recentVarietyProfiles,
    });
    if (profile.primaryPressure === 'route_pressure' && profile.dispatchHintLine) {
      estimatedLabel = profile.dispatchHintLine;
    }
  }

  return {
    title: 'Saha Rotası',
    districtName,
    routeCopy: `Ekip ${districtName} odağına yönlendirilecek.`,
    pathLabels: ['Merkez', 'Ekip çıkışı', districtName],
    steps: [
      { id: 'center', label: 'Merkez', state: centerState, iconKey: 'business-outline' },
      { id: 'transit', label: 'Çıkış', state: transitState, iconKey: 'navigate-outline' },
      { id: 'field', label: districtName, state: fieldState, iconKey: 'location-outline' },
    ],
    estimatedLabel,
    tone: transitState === 'current' ? 'positive' : 'neutral',
  };
}

function buildResourceSummary(
  input: BuildEventDispatchPhasePresentationInput,
  assignmentSummary: EventDispatchAssignmentSummary,
  planStrategyId: EventPlanStrategyId,
): EventDispatchResourceSummary {
  const districtName =
    input.event.district?.trim() || input.event.neighborhoodId?.trim() || 'Bölge';
  const minutes = PLAN_ESTIMATED_MINUTES[planStrategyId];
  const teamCount =
    assignmentSummary.status === 'ready' || assignmentSummary.status === 'partial' ? 2 : 1;
  const vehicleReady = Boolean(input.assignment?.vehicleType);

  return {
    title: 'Saha Ekibi',
    items: [
      {
        id: 'team',
        label: 'Ekip',
        value: `${teamCount} saha ekibi`,
        tone: assignmentSummary.status === 'ready' ? 'positive' : 'neutral',
        iconKey: 'people-outline',
      },
      {
        id: 'vehicle',
        label: 'Araç',
        value: vehicleReady ? '1 araç hazır' : 'Araç bekleniyor',
        tone: vehicleReady ? 'positive' : 'warning',
        iconKey: 'car-outline',
      },
      {
        id: 'duration',
        label: 'Süre',
        value: `~${minutes} dk`,
        tone: 'neutral',
        iconKey: 'time-outline',
      },
      {
        id: 'district',
        label: 'Bölge',
        value: districtName,
        tone: 'neutral',
        iconKey: 'location-outline',
      },
    ],
  };
}

function buildBlockers(
  rows: EventDispatchReadinessRow[],
  compatibility: EventDispatchCompatibility,
  assignmentSummary: EventDispatchAssignmentSummary,
  isDay1LearningEvent?: boolean,
): EventDispatchBlockersPresentation {
  const items: EventDispatchBlocker[] = [];

  if (assignmentSummary.status === 'missing' || assignmentSummary.status === 'locked') {
    items.push({
      id: 'assignment-missing',
      message: 'Ekip ve araç atamasını tamamla.',
      tone: 'critical',
      iconKey: 'alert-circle-outline',
    });
  }

  for (const row of rows) {
    if (items.length >= 3) break;
    if (row.id === 'team' && row.tone === 'neutral') {
      items.push({
        id: 'team-strain',
        message: 'Ekip temposu sınırlı. Uzun müdahale yarına baskı taşıyabilir.',
        tone: 'warning',
        iconKey: 'people-outline',
      });
      continue;
    }
    if (row.id === 'social' && (row.tone === 'warning' || row.tone === 'neutral')) {
      items.push({
        id: 'social-pressure',
        message: row.reason,
        tone: row.tone === 'warning' ? 'warning' : 'neutral',
        iconKey: 'chatbubbles-outline',
      });
      continue;
    }
    if (row.id === 'budget' && (row.tone === 'warning' || row.tone === 'neutral')) {
      items.push({
        id: 'budget-pressure',
        message: 'Bütçe baskısı orta seviyede. Kaynak kullanımını izle.',
        tone: row.tone === 'warning' ? 'warning' : 'neutral',
        iconKey: 'wallet-outline',
      });
    }
  }

  for (const reason of compatibility.reasons) {
    if (items.length >= 3) break;
    if (reason.tone !== 'warning') continue;
    if (items.some((item) => item.message.includes(reason.label.slice(0, 12)))) continue;
    items.push({
      id: `compat-${reason.id}`,
      message: reason.label,
      tone: 'warning',
      iconKey: reason.iconKey,
    });
  }

  if (items.length === 0 && !isDay1LearningEvent) {
    items.push({
      id: 'all-clear',
      message: 'Plan sahaya aktarılmaya hazır.',
      tone: 'neutral',
      iconKey: 'checkmark-circle-outline',
    });
  }

  return {
    title: 'Başlatmadan Önce',
    items: items.slice(0, 3),
  };
}

function buildDispatchActions(): EventDispatchAction[] {
  return [
    {
      id: 'view-readiness',
      label: 'Hazırlığı Gör',
      iconKey: 'speedometer-outline',
      actionKey: 'view_readiness',
    },
    {
      id: 'check-route',
      label: 'Rotayı Kontrol Et',
      iconKey: 'map-outline',
      actionKey: 'check_route',
    },
    {
      id: 'compare-risks',
      label: 'Riskleri Karşılaştır',
      iconKey: 'git-compare-outline',
      actionKey: 'compare_risks',
    },
    {
      id: 'open-note',
      label: 'Not Aç',
      iconKey: 'document-text-outline',
      actionKey: 'open_note',
    },
  ];
}

export function buildEventDispatchAdvisorComment(
  input: BuildEventDispatchPhasePresentationInput,
  compatibility: EventDispatchCompatibility,
  selectedPlan: EventDispatchSelectedPlanSummary,
  overallStatus: EventDispatchOverallReadinessStatus,
): EventDispatchAdvisorComment {
  const day = input.day ?? input.event.day ?? 1;

  if (overallStatus === 'blocked') {
    return {
      title: 'Ece Notu',
      text: 'Atama tamamlanmadan sahaya çıkış riskli. Önce ekip ve araç hazırlığını kontrol et.',
      tone: 'warning',
      toneLabel: 'Dikkat',
    };
  }

  const memoryContext: EceMemoryContextInput = {
    day,
    event: input.event,
    eventId: input.event.id,
    districtName: input.event.district,
    selectedPlanId: selectedPlan.strategyId,
    selectedPlanLabel: selectedPlan.label,
    socialPressure: (input.event.previewEffects?.publicSatisfaction ?? 0) < -3,
    resourcePressure:
      compatibility.scoreBand === 'low' ||
      overallStatus === 'strained' ||
      overallStatus === 'limited',
    ...input.eceMemoryContext,
  };

  const readinessSnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    assignmentStatus: input.assignment
      ? input.assignmentReady
        ? 'ready'
        : 'partial'
      : 'missing',
    hasVehicle: Boolean(input.assignment?.vehicleType),
    compatibilityBand: compatibility.scoreBand,
    compatibilityTone: compatibility.tone,
    planStrategyId: selectedPlan.strategyId,
    publicSatisfactionPreview: input.event.previewEffects?.publicSatisfaction,
  });
  const readinessAvoid = [
    ...(input.eceMemoryContext?.avoidLines ?? []),
    readinessSnapshot.summary,
    buildEceReadinessHint(readinessSnapshot, []) ?? '',
    buildEceMaintenanceHint(
      input.maintenanceBacklogRuntime
        ? buildMaintenanceBacklogRuntimePresentation(input.maintenanceBacklogRuntime, {
            readinessSnapshot,
          })
        : buildMaintenanceBacklogFromReadiness(readinessSnapshot),
      [readinessSnapshot.summary],
    ) ?? '',
  ].filter((line): line is string => Boolean(line));

  const memory = buildEceMemorySnapshot(memoryContext);
  const line = buildDispatchEceLine({
    memory,
    context: memoryContext,
    seed: `${input.event.id}:dispatch:${day}`,
    readinessRisky:
      compatibility.scoreBand === 'low' ||
      compatibility.tone === 'warning' ||
      overallStatus === 'strained' ||
      overallStatus === 'limited',
    planReady: overallStatus === 'ready',
    avoidLines: readinessAvoid,
  });

  if (input.isDay1LearningEvent || day === 1) {
    return {
      title: 'Ece Notu',
      text: line.message,
      tone: 'teaching',
      toneLabel: 'Hazır',
    };
  }

  const tone = mapEceToneToDispatchAdvisorTone(line.tone);
  return {
    title: 'Ece Notu',
    text: line.message,
    tone,
    toneLabel: mapEceToneToToneLabel(line.tone),
  };
}

function buildDispatchCta(
  assignmentReady: boolean,
  hasSelectedDecision: boolean,
  dispatchState: EventDispatchInteractionState,
  overallStatus: EventDispatchOverallReadinessStatus,
): EventDispatchCta {
  if (dispatchState === 'dispatching') {
    return {
      label: 'Yönlendiriliyor…',
      disabledLabel: 'Yönlendiriliyor…',
      actionKey: 'disabled',
      enabled: false,
    };
  }

  if (!assignmentReady || !hasSelectedDecision) {
    return {
      label: 'Hazırlık Eksik',
      disabledLabel: 'Önce Kaynakları Kontrol Et',
      actionKey: 'disabled',
      enabled: false,
    };
  }

  if (dispatchState === 'sent') {
    return {
      label: 'Ekip sahaya çıktı',
      disabledLabel: 'Ekip sahaya çıktı',
      actionKey: 'send_to_field',
      enabled: false,
    };
  }

  return {
    label: 'Ekibi Sahaya Çıkar',
    disabledLabel: 'Hazırlık Eksik',
    actionKey: 'send_to_field',
    enabled: true,
    warningSubline:
      overallStatus === 'strained'
        ? 'Riskleri kabul ederek sahaya çıkar'
        : undefined,
  };
}

function buildDispatchFeedback(
  dispatchState: EventDispatchInteractionState,
  reducedMotion: boolean,
): EventDispatchFeedback {
  const durationMs = operationMotionDispatchDurationMs(reducedMotion);

  switch (dispatchState) {
    case 'dispatching':
      return {
        state: 'dispatching',
        label: 'Ekip sahaya çıkıyor',
        helperText: 'Yönlendirme yapılıyor…',
        durationMs,
      };
    case 'sent':
      return {
        state: 'sent',
        label: 'Ekip sahaya çıktı',
        helperText: 'Sahada takip başlıyor.',
        durationMs: operationMotionDispatchSentDurationMs(reducedMotion),
      };
    default:
      return {
        state: 'idle',
        label: '',
        durationMs,
      };
  }
}

export function buildEventDispatchPhasePresentation(
  input: BuildEventDispatchPhasePresentationInput,
): EventDispatchPhasePresentation {
  const dispatchState = input.dispatchInteractionState ?? 'idle';
  const reducedMotion = input.reducedMotion ?? false;
  const compatLabel =
    input.compatibility?.label ?? input.assignment?.compatibilityLabel;
  const compatUi = mapCompatibilityLabelToUi(compatLabel);
  const scoreBand = mapCompatibilityLabelToBand(compatLabel);

  const selectedPlan = buildSelectedPlanSummary(input);
  const assignmentSummary = buildAssignmentSummary(
    input.assignment,
    input.assignmentReady,
  );
  const compatibility: EventDispatchCompatibility = {
    label: compatUi.label,
    scoreBand,
    tone: compatUi.tone,
    reasons: buildCompatibilityReasons(
      input.compatibility,
      input.assignment,
      input.event,
      {
        day: input.day,
        isDay1LearningEvent: input.isDay1LearningEvent,
        recentVarietyProfiles: input.recentVarietyProfiles,
        authorityGameplayContext: input.authorityGameplayContext,
      },
    ),
  };
  const readinessPanel = buildDispatchReadinessFromContext({
    assignmentStatus: assignmentSummary.status,
    hasVehicle: Boolean(input.assignment?.vehicleType),
    compatibilityBand: compatibility.scoreBand,
    compatibilityTone: compatibility.tone,
    planStrategyId: input.selectedPlanStrategyId,
    publicSatisfactionPreview: input.event.previewEffects?.publicSatisfaction,
  });
  const dispatchReadinessSnapshot = buildOperationReadinessSnapshot({
    phase: 'dispatch',
    assignmentStatus: assignmentSummary.status,
    hasVehicle: Boolean(input.assignment?.vehicleType),
    compatibilityBand: compatibility.scoreBand,
    compatibilityTone: compatibility.tone,
    planStrategyId: input.selectedPlanStrategyId,
    publicSatisfactionPreview: input.event.previewEffects?.publicSatisfaction,
  });
  const maintenanceHint = input.maintenanceBacklogRuntime
    ? buildMaintenanceRuntimeDispatchHint(
        buildMaintenanceBacklogRuntimePresentation(input.maintenanceBacklogRuntime, {
          readinessSnapshot: dispatchReadinessSnapshot,
        }),
        [readinessPanel.overallLabel, dispatchReadinessSnapshot.summary],
      ) ??
      buildMaintenanceDispatchHint(
        buildMaintenanceBacklogFromReadiness(dispatchReadinessSnapshot),
        [readinessPanel.overallLabel, dispatchReadinessSnapshot.summary],
      )
    : buildMaintenanceDispatchHint(
        buildMaintenanceBacklogFromReadiness(dispatchReadinessSnapshot),
        [readinessPanel.overallLabel, dispatchReadinessSnapshot.summary],
      );
  const readinessRows = readinessPanel.items as EventDispatchReadinessRow[];
  const overallReadiness = {
    status: readinessPanel.overallStatus as EventDispatchOverallReadinessStatus,
    label: readinessPanel.overallLabel,
  };
  const readiness: EventDispatchReadinessPanel = {
    title: readinessPanel.title,
    overallStatus: overallReadiness.status,
    overallLabel: overallReadiness.label,
    items: readinessRows,
    maintenanceHint: maintenanceHint ?? undefined,
  };
  const planStrategyId = selectedPlan.strategyId ?? 'balanced_plan';
  const resourceSummary = buildResourceSummary(input, assignmentSummary, planStrategyId);
  const routePreview = buildRoutePreview(
    input.assignment,
    input.assignmentReady,
    dispatchState,
    planStrategyId,
    input.event,
    {
      day: input.day,
      isDay1LearningEvent: input.isDay1LearningEvent,
      recentVarietyProfiles: input.recentVarietyProfiles,
    },
  );
  const blockers = buildBlockers(
    readinessRows,
    compatibility,
    assignmentSummary,
    input.isDay1LearningEvent,
  );
  const advisorComment = buildEventDispatchAdvisorComment(
    input,
    compatibility,
    selectedPlan,
    overallReadiness.status,
  );
  const primaryCta = buildDispatchCta(
    input.assignmentReady,
    input.hasSelectedDecision,
    dispatchState,
    overallReadiness.status,
  );
  const actions = buildDispatchActions();
  const phaseTransition = buildOperationPhaseTransitionPresentation({
    phase: 'dispatch',
    event: input.event,
    planLabel: selectedPlan.label,
    planId: selectedPlan.strategyId,
    planImpactLabel: selectedPlan.chips.find((chip) => chip.label === 'Etki')?.value,
    planCostLabel: selectedPlan.chips.find((chip) => chip.label === 'Bedel')?.value,
    ctaEnabled: primaryCta.enabled,
    ctaDisabledLabel: primaryCta.disabledLabel,
    ctaActionKey: primaryCta.actionKey,
    avoidSummaries: [advisorComment.text, selectedPlan.summary],
  });

  return {
    title: phaseTransition.shell.title,
    subtitle: phaseTransition.shell.subtitle,
    phaseHeading: 'Operasyon Hazırlığı',
    phaseDescription: 'Seçilen planı ekip, araç ve kaynak durumuna göre sahaya çıkar.',
    selectedPlan,
    assignmentSummary,
    readiness,
    readinessRows,
    resourceSummary,
    compatibility,
    routePreview,
    blockers,
    advisorComment,
    actions,
    primaryCta,
    dispatchFeedback: buildDispatchFeedback(dispatchState, reducedMotion),
    phaseTransition,
    accessibilityLabel: `${input.event.title} yönlendirme, ${selectedPlan.label}, ${overallReadiness.label}`,
  };
}

const DECISION_MATCHERS: Record<PlanOptionId, (decision: EventDecision) => boolean> = {
  fast: (decision) =>
    decision.style === 'bold' ||
    decision.decisionStyle === 'fast' ||
    decision.decisionStyle === 'risk',
  balanced: (decision) =>
    decision.style === 'balanced' || decision.recommended === true,
  economy: (decision) =>
    decision.style === 'cautious' ||
    decision.decisionStyle === 'resource_saving' ||
    decision.decisionStyle === 'permanent',
};

export function suggestDecisionIdForPlanStrategy(
  event: EventCard,
  strategyId: EventPlanStrategyId,
): string | null {
  if (!event.decisions.length) return null;

  const planOption = mapStrategyIdToPlanOptionId(strategyId);
  const matcher = DECISION_MATCHERS[planOption];
  const matched = event.decisions.find(matcher);
  if (matched) return matched.id;

  const recommended = event.decisions.find((decision) => decision.recommended);
  if (recommended) return recommended.id;

  return event.decisions[0]?.id ?? null;
}

export function auditEventDispatchPhasePresentation(
  model: EventDispatchPhasePresentation,
): string[] {
  const issues: string[] = [];

  if (!model.title.trim()) issues.push('title empty');
  if (!model.accessibilityLabel.trim()) issues.push('accessibilityLabel empty');
  if (!model.selectedPlan.label.trim()) issues.push('selectedPlan label empty');
  if (!model.selectedPlan.summary.trim()) issues.push('selectedPlan summary empty');
  if (model.compatibility.reasons.length > 3) issues.push('compatibility reasons above max');

  const stepIds = new Set<string>();
  for (const step of model.routePreview.steps) {
    if (stepIds.has(step.id)) issues.push(`duplicate route step ${step.id}`);
    stepIds.add(step.id);
  }

  if (model.routePreview.steps.length < 3 || model.routePreview.steps.length > 4) {
    issues.push('route steps count out of range');
  }

  if (!['low', 'medium', 'high', 'unknown'].includes(model.compatibility.scoreBand)) {
    issues.push('invalid compatibility scoreBand');
  }

  if (!model.advisorComment.text.trim()) issues.push('advisorComment empty');
  if (!model.advisorComment.toneLabel.trim()) issues.push('advisorComment toneLabel empty');
  if (model.readiness.items.length !== 4) issues.push('readiness items count invalid');
  if (model.blockers.items.length > 3) issues.push('blockers above max');
  if (model.actions.length < 1) issues.push('actions empty');
  if (!model.primaryCta.disabledLabel.trim()) issues.push('primaryCta disabledLabel empty');

  if (model.dispatchFeedback.durationMs < 0 || model.dispatchFeedback.durationMs > 900) {
    issues.push('dispatch feedback duration out of range');
  }

  return issues;
}

export function dispatchAdvisorDiffersFromPlanAdvisor(
  dispatchComment: string,
  planComment: string,
): boolean {
  return dispatchComment.trim() !== planComment.trim();
}
