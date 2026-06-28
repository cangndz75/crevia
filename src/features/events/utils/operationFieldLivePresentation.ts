import type { EventCard } from '@/core/models/EventCard';
import type {
  EventFieldAssignmentEffect,
  EventFieldInteractionState,
  EventFieldSelectedPlanSummary,
} from '@/features/events/utils/eventFieldPhasePresentation';
import type {
  OperationFieldProgressModel,
  OperationFieldProgressStageId,
} from '@/features/events/utils/operationFieldProgressModel';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

export type OperationFieldRiskTendency = 'decreasing' | 'stable' | 'increasing';

export type OperationFieldLivePresentation = {
  title: string;
  statusLabel: string;
  summary: string;
  livePillLabel: string;
  riskTendency: OperationFieldRiskTendency;
  riskTendencyLabel: string;
  riskTendencyTone: 'positive' | 'neutral' | 'warning';
  outcomeDirectionLabel: string;
  outcomeDirectionTone: 'positive' | 'neutral' | 'warning';
  teamStatusLabel: string;
  teamStatusTone: 'positive' | 'neutral' | 'warning';
  progress: OperationFieldProgressModel;
};

export type OperationFieldDecisionImpact = {
  title: string;
  planLabel: string;
  effectLine: string;
  body: string;
  tone: 'positive' | 'neutral' | 'warning';
  iconKey: string;
};

const PLAN_IMPACT_BODY: Record<EventPlanStrategyId, string> = {
  rapid_response:
    'Hızlı kontrol sağlandı; kaynak ve ekip temposu zorlanıyor olabilir.',
  balanced_plan:
    'Dengeli ilerleme sürüyor; kaynak ve süre plan sınırlarında.',
  long_term_fix:
    'Güven etkisi güçleniyor; müdahale süresi ve maliyet baskısı izleniyor.',
};

const PLAN_IMPACT_TONE: Record<EventPlanStrategyId, OperationFieldDecisionImpact['tone']> = {
  rapid_response: 'warning',
  balanced_plan: 'positive',
  long_term_fix: 'neutral',
};

function deriveRiskTendency(input: {
  event: EventCard;
  assignmentEffect: EventFieldAssignmentEffect;
  strategyId: EventPlanStrategyId;
  progressStageId: OperationFieldProgressStageId;
  interactionState: EventFieldInteractionState;
}): {
  tendency: OperationFieldRiskTendency;
  label: string;
  tone: 'positive' | 'neutral' | 'warning';
} {
  const previewRisk = input.event.previewEffects?.risk ?? 0;
  const eventRisk = input.event.riskLevel;
  const isLateStage =
    input.progressStageId === 'stabilizing' ||
    input.progressStageId === 'preparing_result' ||
    input.interactionState === 'completed';

  if (
    input.assignmentEffect.scoreBand === 'low' &&
    (eventRisk === 'critical' || eventRisk === 'high')
  ) {
    return {
      tendency: 'increasing',
      label: 'Risk artıyor',
      tone: 'warning',
    };
  }

  if (previewRisk > 0 && input.assignmentEffect.scoreBand === 'low') {
    return {
      tendency: 'stable',
      label: 'Risk sabit',
      tone: 'warning',
    };
  }

  if (isLateStage && previewRisk <= 0) {
    return {
      tendency: 'decreasing',
      label: 'Risk azalıyor',
      tone: 'positive',
    };
  }

  if (input.strategyId === 'rapid_response' && !isLateStage) {
    return {
      tendency: 'stable',
      label: 'Risk sabit',
      tone: 'neutral',
    };
  }

  if (isLateStage) {
    return {
      tendency: previewRisk > 0 ? 'stable' : 'decreasing',
      label: previewRisk > 0 ? 'Risk sabit' : 'Risk azalıyor',
      tone: previewRisk > 0 ? 'neutral' : 'positive',
    };
  }

  return {
    tendency: 'stable',
    label: 'Risk izleniyor',
    tone: 'neutral',
  };
}

function deriveOutcomeDirection(input: {
  event: EventCard;
  assignmentEffect: EventFieldAssignmentEffect;
  strategyId: EventPlanStrategyId;
  riskTendency: OperationFieldRiskTendency;
  interactionState: EventFieldInteractionState;
}): { label: string; tone: 'positive' | 'neutral' | 'warning' } {
  const previewSatisfaction = input.event.previewEffects?.publicSatisfaction ?? 0;
  const previewRisk = input.event.previewEffects?.risk ?? 0;

  if (input.riskTendency === 'increasing') {
    return {
      label: 'Sonuç risk taşıyabilir',
      tone: 'warning',
    };
  }

  if (input.interactionState === 'completed') {
    if (previewRisk > 0 && input.assignmentEffect.scoreBand === 'low') {
      return {
        label: 'Kısmi toparlanma bekleniyor',
        tone: 'warning',
      };
    }
    if (previewSatisfaction > 0) {
      return {
        label: 'Olumlu sonuç yönünde',
        tone: 'positive',
      };
    }
    return {
      label: 'Sonuç özeti hazır',
      tone: 'neutral',
    };
  }

  if (input.strategyId === 'long_term_fix') {
    return {
      label: 'Kademeli iyileşme yönünde',
      tone: 'positive',
    };
  }

  if (input.strategyId === 'rapid_response' && input.assignmentEffect.scoreBand !== 'low') {
    return {
      label: 'Hızlı toparlanma yönünde',
      tone: 'positive',
    };
  }

  if (previewSatisfaction < -2) {
    return {
      label: 'Sosyal tepki baskısı sürebilir',
      tone: 'warning',
    };
  }

  if (previewRisk > 0) {
    return {
      label: 'Kontrollü ilerleme yönünde',
      tone: 'neutral',
    };
  }

  return {
    label: 'Dengeli sonuç yönünde',
    tone: 'neutral',
  };
}

function resolveTeamStatus(
  assignmentEffect: EventFieldAssignmentEffect,
): { label: string; tone: 'positive' | 'neutral' | 'warning' } {
  switch (assignmentEffect.scoreBand) {
    case 'high':
      return { label: 'Ekip tempolu', tone: 'positive' };
    case 'low':
      return { label: 'Ekip zorlanıyor', tone: 'warning' };
    case 'medium':
      return { label: 'Ekip dengede', tone: 'neutral' };
    default:
      return { label: 'Ekip izleniyor', tone: 'neutral' };
  }
}

function resolveLiveSummary(input: {
  progress: OperationFieldProgressModel;
  riskLabel: string;
  outcomeLabel: string;
  strategyId: EventPlanStrategyId;
  assignmentEffect: EventFieldAssignmentEffect;
}): string {
  const parts = [input.progress.helperText];

  if (input.assignmentEffect.scoreBand === 'high') {
    parts.push('Doğru ekip seçimi müdahaleyi hızlandırıyor.');
  } else if (input.assignmentEffect.scoreBand === 'low') {
    parts.push('Atama uyumu zayıf; süre ve kaynak baskısı artabilir.');
  }

  if (input.strategyId === 'rapid_response') {
    parts.push(`${input.riskLabel}; kaynak temposu izleniyor.`);
  } else {
    parts.push(`${input.outcomeLabel}.`);
  }

  return parts.filter(Boolean).join(' ');
}

function resolveLivePillLabel(
  interactionState: EventFieldInteractionState,
  progressStageId: OperationFieldProgressStageId,
): string {
  if (interactionState === 'completed') return 'Tamamlandı';
  if (interactionState === 'paused_for_decision') return 'Bekliyor';
  if (progressStageId === 'preparing_result') return 'Hazırlanıyor';
  if (progressStageId === 'stabilizing') return 'Sahada';
  return 'Canlı';
}

export function buildOperationFieldDecisionImpact(input: {
  selectedPlan: EventFieldSelectedPlanSummary;
  assignmentEffect: EventFieldAssignmentEffect;
  day?: number;
  isDay1LearningEvent?: boolean;
}): OperationFieldDecisionImpact {
  const strategyId = input.selectedPlan.strategyId ?? 'balanced_plan';
  const isDay1 = input.isDay1LearningEvent || (input.day ?? 1) === 1;

  let body = PLAN_IMPACT_BODY[strategyId];
  let tone = PLAN_IMPACT_TONE[strategyId];

  if (input.assignmentEffect.scoreBand === 'low') {
    body = `${body} Atama uyumu zayıf; müdahale süresi uzayabilir.`;
    tone = 'warning';
  } else if (input.assignmentEffect.scoreBand === 'high' && strategyId === 'rapid_response') {
    body = 'Hızlı müdahale planı iyi uyumla sahada hız kazandı.';
    tone = 'positive';
  }

  if (isDay1) {
    body = body.split('.')[0] ?? body;
    if (!body.endsWith('.')) body = `${body}.`;
  }

  return {
    title: isDay1 ? 'Seçimin Etkisi' : 'Kararının Etkisi',
    planLabel: input.selectedPlan.label,
    effectLine: input.selectedPlan.effectLine,
    body,
    tone,
    iconKey: 'git-branch-outline',
  };
}

export function buildOperationFieldLivePresentation(input: {
  event: EventCard;
  selectedPlan: EventFieldSelectedPlanSummary;
  assignmentEffect: EventFieldAssignmentEffect;
  interactionState: EventFieldInteractionState;
  progress: OperationFieldProgressModel;
  helperTextOverride?: string;
}): OperationFieldLivePresentation {
  const strategyId = input.selectedPlan.strategyId ?? 'balanced_plan';
  const progress = input.helperTextOverride
    ? { ...input.progress, helperText: input.helperTextOverride }
    : input.progress;

  const risk = deriveRiskTendency({
    event: input.event,
    assignmentEffect: input.assignmentEffect,
    strategyId,
    progressStageId: progress.currentStageId,
    interactionState: input.interactionState,
  });

  const outcome = deriveOutcomeDirection({
    event: input.event,
    assignmentEffect: input.assignmentEffect,
    strategyId,
    riskTendency: risk.tendency,
    interactionState: input.interactionState,
  });

  const team = resolveTeamStatus(input.assignmentEffect);

  let summary = resolveLiveSummary({
    progress,
    riskLabel: risk.label,
    outcomeLabel: outcome.label,
    strategyId,
    assignmentEffect: input.assignmentEffect,
  });

  const isDay1 = (input.event.day ?? 1) === 1;
  if (isDay1) {
    summary = progress.helperText;
  }

  return {
    title: 'Canlı Operasyon',
    statusLabel: progress.statusLabel,
    summary,
    livePillLabel: resolveLivePillLabel(input.interactionState, progress.currentStageId),
    riskTendency: risk.tendency,
    riskTendencyLabel: risk.label,
    riskTendencyTone: risk.tone,
    outcomeDirectionLabel: outcome.label,
    outcomeDirectionTone: outcome.tone,
    teamStatusLabel: team.label,
    teamStatusTone: team.tone,
    progress,
  };
}

export function fieldRiskAlignsWithPreviewEffects(input: {
  riskTendency: OperationFieldRiskTendency;
  previewRisk: number;
  assignmentBand: EventFieldAssignmentEffect['scoreBand'];
}): boolean {
  if (input.riskTendency === 'increasing') {
    return input.previewRisk >= 0 || input.assignmentBand === 'low';
  }
  if (input.riskTendency === 'decreasing') {
    return input.previewRisk <= 0;
  }
  return true;
}
