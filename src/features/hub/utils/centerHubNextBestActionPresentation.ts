import type { OperationPhaseKey } from '@/features/events/utils/operationPhaseTransitionPresentation';
import { OPERATION_PHASE_CTA_LABELS } from '@/features/events/utils/operationPhaseTransitionPresentation';
import type { CenterHomePresentation } from './centerHomePresentation';
import type { CenterHubAction } from './centerHubGameplayPresentation';

export type HubPrimaryCtaIntent =
  | 'continue_operation'
  | 'inspect_operation'
  | 'create_plan'
  | 'dispatch_team'
  | 'enter_field'
  | 'view_result'
  | 'end_day'
  | 'start_new_day'
  | 'plan_operation'
  | 'inspect_signal';

export type HubPrimaryCtaPresentation = {
  intent: HubPrimaryCtaIntent;
  label: string;
  route?: string;
  actionKey: string;
  enabled: boolean;
  phaseKey?: OperationPhaseKey;
  reason: string;
};

export const HUB_PRIMARY_CTA_LABELS: Record<HubPrimaryCtaIntent, string> = {
  continue_operation: 'Operasyona Devam Et',
  inspect_operation: 'Operasyonu İncele',
  create_plan: 'Planı Oluştur',
  dispatch_team: 'Ekibi Yönlendir',
  enter_field: 'Sahaya Geç',
  view_result: 'Sonucu Gör',
  end_day: 'Gün Sonuna Geç',
  start_new_day: 'Yeni Güne Başla',
  plan_operation: 'Planı Güncelle',
  inspect_signal: 'Sinyali İncele',
};

const WEAK_CTA = /^(devam et|detay|işlem yap|detaya git|tümünü gör)$/i;

function isWeakCta(label: string | undefined): boolean {
  return WEAK_CTA.test(label?.trim() ?? '');
}

function resolvePhaseFromSteps(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
): OperationPhaseKey | undefined {
  const currentStep = presentation.recommendedPlan.steps?.find((step) => step.state === 'current');
  if (!currentStep) return undefined;

  switch (currentStep.id) {
    case 'inspect':
      return 'inspect';
    case 'plan':
      return 'plan';
    case 'direct':
    case 'dispatch':
    case 'assign':
      return 'dispatch';
    case 'field':
      return 'field';
    case 'result':
      return 'result';
    default:
      return undefined;
  }
}

function resolvePhaseFromTarget(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
): OperationPhaseKey | undefined {
  const actionKey = presentation.activeTarget.cta.actionKey;
  if (actionKey === 'view_result') return 'result';
  if (actionKey === 'view_plan') return 'plan';
  if (actionKey === 'continue_operation') {
    return resolvePhaseFromSteps(presentation) ?? 'field';
  }
  if (actionKey === 'start_operation') {
    return resolvePhaseFromSteps(presentation) ?? 'inspect';
  }
  return resolvePhaseFromSteps(presentation);
}

function isTargetCompleted(presentation: Omit<CenterHomePresentation, 'gameFirst'>): boolean {
  const target = presentation.activeTarget;
  return (
    target.status === 'completed' ||
    target.visibility === 'completed' ||
    (target.progress?.progressRatio ?? 0) >= 1
  );
}

function isActiveOperationInProgress(presentation: Omit<CenterHomePresentation, 'gameFirst'>): boolean {
  const target = presentation.activeTarget;
  return (
    target.visibility === 'visible' &&
    target.status === 'in_progress' &&
    (target.progress?.progressRatio ?? 0) < 1
  );
}

function resolveEndOfDayIntent(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
): HubPrimaryCtaIntent | null {
  const completed = isTargetCompleted(presentation);
  const dayChip = presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day');
  const day = Number(dayChip?.valueText.match(/\d+/)?.[0] ?? presentation.hubDensity.day ?? 1);

  if (!completed) return null;

  const reportCard = presentation.continuationCards.cards.find(
    (card) => card.kind === 'report_preview' || card.actionKey === 'view_report',
  );
  if (reportCard?.route) {
    return 'end_day';
  }

  if (day >= 2 && presentation.recentImpactSummary.visibility === 'visible') {
    return 'end_day';
  }

  return null;
}

function ctaFromIntent(
  intent: HubPrimaryCtaIntent,
  route: string | undefined,
  actionKey: string,
  enabled: boolean,
  reason: string,
  phaseKey?: OperationPhaseKey,
): HubPrimaryCtaPresentation {
  return {
    intent,
    label: HUB_PRIMARY_CTA_LABELS[intent],
    route,
    actionKey,
    enabled,
    phaseKey,
    reason,
  };
}

export function buildHubPrimaryCtaPresentation(
  presentation: Omit<CenterHomePresentation, 'gameFirst'>,
): HubPrimaryCtaPresentation {
  const target = presentation.activeTarget;
  const commandMove = presentation.operationFocus.commandPanel?.recommendedMove;
  const topSignal = presentation.operationSignals.signals[0];
  const endOfDay = resolveEndOfDayIntent(presentation);

  if (endOfDay === 'end_day') {
    const route =
      presentation.continuationCards.cards.find((card) => card.route)?.route ??
      '/reports/end-of-day';
    return ctaFromIntent(
      'end_day',
      route,
      'end_day',
      true,
      'active-operation-completed-end-day-ready',
    );
  }

  if (isActiveOperationInProgress(presentation) && !isTargetCompleted(presentation)) {
    const phase = resolvePhaseFromTarget(presentation);
    const phaseLabel = phase ? OPERATION_PHASE_CTA_LABELS[phase] : undefined;
    const fallbackLabel = HUB_PRIMARY_CTA_LABELS.continue_operation;
    const rawLabel = commandMove?.ctaLabel ?? target.cta.label;
    const label =
      !rawLabel || isWeakCta(rawLabel)
        ? phaseLabel && phase !== 'inspect'
          ? phaseLabel
          : fallbackLabel
        : rawLabel === 'Devam Et'
          ? fallbackLabel
          : rawLabel;

    return {
      intent: 'continue_operation',
      label,
      route: commandMove?.route ?? target.cta.route,
      actionKey: target.cta.actionKey,
      enabled: target.cta.enabled,
      phaseKey: phase,
      reason: 'active-operation-in-progress',
    };
  }

  if (isTargetCompleted(presentation)) {
    const nextMove = presentation.nextActions.actions.find((action) => action.routeKey && !action.disabled);
    return ctaFromIntent(
      'inspect_operation',
      nextMove?.routeKey ?? presentation.recommendedPlan.cta?.route ?? '/events',
      nextMove?.actionKey ?? 'start_operation',
      true,
      'previous-operation-completed-next-inspect',
    );
  }

  const phase = resolvePhaseFromTarget(presentation);
  if (phase) {
    const phaseIntentMap: Record<OperationPhaseKey, HubPrimaryCtaIntent> = {
      inspect: 'inspect_operation',
      plan: 'create_plan',
      dispatch: 'dispatch_team',
      field: 'enter_field',
      result: 'view_result',
    };
    const intent = phaseIntentMap[phase];
    const route = commandMove?.route ?? target.cta.route ?? '/events';
    const rawLabel = commandMove?.ctaLabel ?? target.cta.label;
    const label =
      !rawLabel || isWeakCta(rawLabel) ? HUB_PRIMARY_CTA_LABELS[intent] : rawLabel;

    return ctaFromIntent(intent, route, target.cta.actionKey, target.cta.enabled, `workflow-phase-${phase}`, phase);
  }

  if (topSignal && presentation.operationSignals.signals.length > 0 && target.visibility === 'hidden') {
    return ctaFromIntent(
      'inspect_signal',
      topSignal.route ?? presentation.operationSignals.cta?.route ?? '/events',
      topSignal.actionKey ?? 'view_signal',
      true,
      'no-active-target-signal-led',
    );
  }

  if (target.id === 'day1-entry' || presentation.hubDensity.band === 'day1') {
    return ctaFromIntent(
      'inspect_operation',
      target.cta.route ?? '/events',
      target.cta.actionKey,
      target.cta.enabled,
      'day1-first-operation',
    );
  }

  const fallbackLabel = commandMove?.ctaLabel ?? target.cta.label;
  const label =
    !fallbackLabel || isWeakCta(fallbackLabel)
      ? HUB_PRIMARY_CTA_LABELS.inspect_operation
      : fallbackLabel;

  return ctaFromIntent(
    'inspect_operation',
    commandMove?.route ?? target.cta.route ?? '/events',
    target.cta.actionKey,
    target.cta.enabled,
    'default-inspect-operation',
  );
}

export function hubPrimaryCtaToHubAction(cta: HubPrimaryCtaPresentation): CenterHubAction {
  return {
    label: cta.label,
    route: cta.route,
    actionKey: cta.actionKey,
    enabled: cta.enabled,
  };
}
