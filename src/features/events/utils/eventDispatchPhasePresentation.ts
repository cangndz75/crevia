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
  getPersonnelAssignmentLabel,
  getVehicleAssignmentLabel,
} from '@/core/assignments/assignmentPresentation';

export type EventDispatchInteractionState = 'idle' | 'dispatching' | 'sent';

export type EventDispatchSelectedPlanSummary = {
  strategyId?: EventPlanStrategyId;
  label: string;
  summary: string;
  tone: 'teal' | 'green' | 'gold' | 'warning' | 'neutral';
  sourceLabel: string;
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
  statusLabel: 'Hazır' | 'Sınırlı' | 'Riskli';
  reason: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

export type EventDispatchRouteStepId = 'team' | 'vehicle' | 'route' | 'field';

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
  estimatedLabel?: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type EventDispatchAdvisorComment = {
  title: string;
  text: string;
  tone: 'calm' | 'teaching' | 'warning' | 'positive';
};

export type EventDispatchCtaActionKey = 'send_to_field' | 'complete_assignment' | 'disabled';

export type EventDispatchCta = {
  label: string;
  actionKey: EventDispatchCtaActionKey;
  enabled: boolean;
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
  selectedPlan: EventDispatchSelectedPlanSummary;
  assignmentSummary: EventDispatchAssignmentSummary;
  readinessRows: EventDispatchReadinessRow[];
  compatibility: EventDispatchCompatibility;
  routePreview: EventDispatchRoutePreview;
  advisorComment: EventDispatchAdvisorComment;
  primaryCta: EventDispatchCta;
  dispatchFeedback: EventDispatchFeedback;
  accessibilityLabel: string;
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
};

const PLAN_DISPATCH_SUMMARY: Record<EventPlanStrategyId, string> = {
  rapid_response: 'Süre öncelikli, kaynak maliyeti artabilir.',
  balanced_plan: 'Kaynak dengeli, sosyal tepki kontrol altında.',
  long_term_fix: 'Güven odaklı, sahaya çıkış daha planlı.',
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
  const strategyId = input.selectedPlanStrategyId ?? 'balanced_plan';
  const label =
    input.selectedPlanStrategyLabel?.trim() ||
    getPlanStrategyLabel(strategyId);

  return {
    strategyId,
    label,
    summary: PLAN_DISPATCH_SUMMARY[strategyId],
    tone: PLAN_DISPATCH_TONE[strategyId],
    sourceLabel: 'Planla fazı',
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
  const teamState: EventDispatchRouteStepState =
    dispatchState === 'sent'
      ? 'done'
      : assignment
        ? 'ready'
        : 'locked';

  const vehicleState: EventDispatchRouteStepState =
    dispatchState === 'sent'
      ? 'done'
      : assignment?.vehicleType
        ? 'ready'
        : 'locked';

  const routeState: EventDispatchRouteStepState =
    dispatchState === 'dispatching' || dispatchState === 'sent'
      ? dispatchState === 'sent'
        ? 'done'
        : 'current'
      : assignmentReady
        ? 'current'
        : assignment
          ? 'ready'
          : 'locked';

  const fieldState: EventDispatchRouteStepState =
    dispatchState === 'sent' ? 'current' : dispatchState === 'dispatching' ? 'ready' : 'locked';

  let estimatedLabel =
    planStrategyId === 'rapid_response'
      ? 'Rota süresi kritik'
      : planStrategyId === 'long_term_fix'
        ? 'Planlı çıkış'
        : 'Rota dengeli';

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
    title: 'Yönlendirme hattı',
    pathLabels: [
      'Merkez',
      event?.district?.trim() || event?.neighborhoodId?.trim() || 'Mahalle',
      'Olay noktası',
    ],
    steps: [
      { id: 'team', label: 'Ekip', state: teamState, iconKey: 'people-outline' },
      { id: 'vehicle', label: 'Araç', state: vehicleState, iconKey: 'car-outline' },
      { id: 'route', label: 'Rota', state: routeState, iconKey: 'git-network-outline' },
      { id: 'field', label: 'Saha', state: fieldState, iconKey: 'location-outline' },
    ],
    estimatedLabel,
    tone: routeState === 'current' ? 'positive' : 'neutral',
  };
}

function mapReadinessStatus(
  tone: EventDispatchReadinessRow['tone'],
): EventDispatchReadinessRow['statusLabel'] {
  if (tone === 'positive') return 'Hazır';
  if (tone === 'warning') return 'Riskli';
  return 'Sınırlı';
}

function buildReadinessRows(
  input: BuildEventDispatchPhasePresentationInput,
  assignmentSummary: EventDispatchAssignmentSummary,
  compatibility: EventDispatchCompatibility,
): EventDispatchReadinessRow[] {
  const teamTone: EventDispatchReadinessRow['tone'] =
    assignmentSummary.status === 'ready'
      ? compatibility.tone === 'warning'
        ? 'neutral'
        : 'positive'
      : assignmentSummary.status === 'partial'
        ? 'neutral'
        : 'warning';
  const vehicleTone: EventDispatchReadinessRow['tone'] =
    input.assignment?.vehicleType
      ? compatibility.scoreBand === 'low'
        ? 'neutral'
        : 'positive'
      : 'warning';
  const budgetTone: EventDispatchReadinessRow['tone'] =
    input.selectedPlanStrategyId === 'rapid_response' ||
    input.selectedPlanStrategyId === 'long_term_fix'
      ? 'neutral'
      : 'positive';
  const socialTone: EventDispatchReadinessRow['tone'] =
    (input.event.previewEffects?.publicSatisfaction ?? 0) < -4
      ? 'warning'
      : compatibility.tone === 'warning'
        ? 'neutral'
        : 'positive';

  const rows: Array<Omit<EventDispatchReadinessRow, 'statusLabel'>> = [
    {
      id: 'team',
      label: 'Ekip uygunluğu',
      tone: teamTone,
      reason:
        assignmentSummary.personnelLabel ??
        (teamTone === 'warning' ? 'Ekip seçimi tamamlanmadı.' : 'Ekip sahaya hazır.'),
      iconKey: 'people-outline',
    },
    {
      id: 'vehicle',
      label: 'Araç uygunluğu',
      tone: vehicleTone,
      reason:
        assignmentSummary.vehicleLabel ??
        (vehicleTone === 'warning' ? 'Araç seçimi bekleniyor.' : 'Araç sahaya uygun.'),
      iconKey: 'car-outline',
    },
    {
      id: 'budget',
      label: 'Bütçe durumu',
      tone: budgetTone,
      reason:
        budgetTone === 'positive'
          ? 'Plan kaynak baskısını dengede tutuyor.'
          : 'Plan ek kaynak baskısı yaratabilir.',
      iconKey: 'wallet-outline',
    },
    {
      id: 'social',
      label: 'Sosyal risk',
      tone: socialTone,
      reason:
        socialTone === 'warning'
          ? 'Mahalle tepkisi bu yönlendirmeye hassas.'
          : 'Sosyal nabız yönetilebilir görünüyor.',
      iconKey: 'chatbubbles-outline',
    },
  ];

  return rows.map((row) => ({
    ...row,
    statusLabel: mapReadinessStatus(row.tone),
  }));
}

export function buildEventDispatchAdvisorComment(
  input: BuildEventDispatchPhasePresentationInput,
  compatibility: EventDispatchCompatibility,
  selectedPlan: EventDispatchSelectedPlanSummary,
): EventDispatchAdvisorComment {
  if (input.isDay1LearningEvent || input.day === 1) {
    return {
      title: 'Ece',
      text: 'Yönlendirme adımında ekibi sahaya çıkarıyoruz. Sonraki ekranda operasyonu takip edeceksin.',
      tone: 'teaching',
    };
  }

  if (compatibility.scoreBand === 'low' || compatibility.tone === 'warning') {
    return {
      title: 'Ece',
      text: 'Ekip yorgunluğu var. Bu seçim süre riskini artırabilir.',
      tone: 'warning',
    };
  }

  if (selectedPlan.strategyId === 'rapid_response') {
    return {
      title: 'Ece',
      text: 'Hızlı müdahale seçtin; rota süresi bu planda daha kritik.',
      tone: 'calm',
    };
  }

  if (compatibility.scoreBand === 'high') {
    return {
      title: 'Ece',
      text: 'Bu ekip seçilen plana uygun görünüyor. Sahaya gönderebilirsin.',
      tone: 'positive',
    };
  }

  return {
    title: 'Ece',
    text: 'Atama dengeli görünüyor. Onayladıktan sonra ekibi sahaya yönlendir.',
    tone: 'calm',
  };
}

function buildDispatchCta(
  assignmentReady: boolean,
  hasSelectedDecision: boolean,
  dispatchState: EventDispatchInteractionState,
): EventDispatchCta {
  if (dispatchState === 'dispatching') {
    return {
      label: 'Yönlendiriliyor…',
      actionKey: 'disabled',
      enabled: false,
    };
  }

  if (!assignmentReady || !hasSelectedDecision) {
    return {
      label: 'Sahaya Gönder',
      actionKey: 'disabled',
      enabled: false,
    };
  }

  return {
    label: dispatchState === 'sent' ? 'Ekip sahaya çıktı' : 'Sahaya Gönder',
    actionKey: 'send_to_field',
    enabled: dispatchState !== 'sent',
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
  const readinessRows = buildReadinessRows(input, assignmentSummary, compatibility);
  const routePreview = buildRoutePreview(
    input.assignment,
    input.assignmentReady,
    dispatchState,
    selectedPlan.strategyId ?? 'balanced_plan',
    input.event,
    {
      day: input.day,
      isDay1LearningEvent: input.isDay1LearningEvent,
      recentVarietyProfiles: input.recentVarietyProfiles,
    },
  );
  const advisorComment = buildEventDispatchAdvisorComment(
    input,
    compatibility,
    selectedPlan,
  );
  const primaryCta = buildDispatchCta(
    input.assignmentReady,
    input.hasSelectedDecision,
    dispatchState,
  );

  return {
    title: 'Yönlendir',
    subtitle: 'Ekibi seçilen plana göre sahaya yönlendir.',
    selectedPlan,
    assignmentSummary,
    readinessRows,
    compatibility,
    routePreview,
    advisorComment,
    primaryCta,
    dispatchFeedback: buildDispatchFeedback(dispatchState, reducedMotion),
    accessibilityLabel: `${input.event.title} yönlendirme, ${selectedPlan.label}, ${compatibility.label}`,
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
