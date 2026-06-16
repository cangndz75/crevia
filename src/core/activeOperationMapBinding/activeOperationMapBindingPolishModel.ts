import type { AuthorityGameplayEffectSnapshot } from '@/core/authorityGameplayExpansion/authorityGameplayEffectTypes';
import type { MapGameplayRuntimeFeedbackResult } from '@/core/mapGameplayBinding/mapGameplayRuntimeFeedbackTypes';
import type { OperationPortfolioItem } from '@/core/dailyCapacityPortfolio/dailyCapacityPortfolioTypes';

import type {
  ActiveOperationMapBinding,
  ActiveOperationMapCardModel,
} from './activeOperationMapBindingTypes';
import { buildActiveOperationMapCardModel } from './activeOperationMapBindingPresentation';
import {
  resolveActiveOperationIdentity,
  resolveOperationActionPresentation,
} from './operationActionPresentation';

export type BuildPolishedActiveOperationMapCardInput = {
  day: number;
  binding: ActiveOperationMapBinding;
  runtimeFeedback?: MapGameplayRuntimeFeedbackResult | null;
  authorityEffectSnapshot?: AuthorityGameplayEffectSnapshot | null;
  deferredEventIds?: string[];
  explicitEventId?: string;
  portfolioItem?: OperationPortfolioItem;
  mitigationLine?: string;
};

function mergeLines(...lines: Array<string | undefined>): string {
  return lines
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line))
    .join(' ');
}

export function buildPolishedActiveOperationMapCard(
  input: BuildPolishedActiveOperationMapCardInput,
): ActiveOperationMapCardModel | null {
  const base = buildActiveOperationMapCardModel(input.binding, { day: input.day });
  if (!base) return null;

  const identity = resolveActiveOperationIdentity({
    day: input.day,
    explicitEventId: input.explicitEventId ?? input.binding.eventId,
    binding: input.binding,
    runtimeFeedback: input.runtimeFeedback,
    deferredEventIds: input.deferredEventIds,
    portfolioItem: input.portfolioItem,
  });

  if (!identity || input.day < 8) {
    return base;
  }

  const presentation = resolveOperationActionPresentation({
    status: identity.status,
    phase: input.binding.phase,
    day: input.day,
    portfolioItem: input.portfolioItem,
    authorityEffectSnapshot: input.authorityEffectSnapshot,
    mitigationLine: input.mitigationLine,
    explanationSeed: identity.explanationLine,
  });

  const decisionLine = mergeLines(
    input.binding.decisionLine,
    presentation.explanationLine,
    presentation.authorityLine,
  );
  const nextActionLine =
    presentation.deferLine ?? presentation.riskLine ?? base.nextActionLine;

  const ctaLabel =
    identity.source === 'explicit_active' && input.binding.phase === 'completed'
      ? 'Sonucu gor'
      : identity.source === 'explicit_active' &&
          input.binding.phase === 'result_trace_available'
        ? 'Rapora git'
        : presentation.ctaLabel;

  const isActionable =
    (presentation.isStartable || presentation.isInspectable) &&
    input.binding.visibilityLevel !== 'hidden';

  return {
    ...base,
    phaseLabel: presentation.statusLabel,
    mapLine: base.mapLine,
    decisionLine: decisionLine || base.decisionLine,
    nextActionLine,
    ctaLabel,
    ctaRoute:
      isActionable && (presentation.isStartable || presentation.isInspectable)
        ? input.binding.eventDetailRoute
        : undefined,
    isActionable,
    accessibilityLabel: mergeLines(
      base.title,
      presentation.statusLabel,
      decisionLine,
      ctaLabel,
    ),
  };
}
