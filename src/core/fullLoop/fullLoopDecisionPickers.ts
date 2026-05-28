import { checkDecisionAffordability } from '@/core/economy/economyAffordability';
import type { EconomyState } from '@/core/economy/types';
import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';
import {
  getDecisionPriorityFit,
  type DecisionPriorityFit,
} from '@/features/events/utils/decisionTradeoffPresentation';

function isAffordable(decision: EventDecision, economyState: EconomyState): boolean {
  const check = checkDecisionAffordability({ economyState, decision });
  return check.canAfford;
}

function affordableDecisions(
  event: EventCard,
  economyState: EconomyState,
): EventDecision[] {
  return event.decisions.filter((d) => isAffordable(d, economyState));
}

function strategyOf(decision: EventDecision): string {
  return (decision.contentStrategyLabel ?? '').trim().toLowerCase();
}

function styleOf(decision: EventDecision): string {
  return (decision.decisionStyle ?? decision.style ?? '').toLowerCase();
}

function scoreByPriorityFit(
  fit: DecisionPriorityFit | null,
): number {
  switch (fit) {
    case 'supports':
      return 40;
    case 'indirect':
      return 20;
    case 'neutral':
      return 10;
    case 'resource_pressure':
      return -5;
    case 'risks':
      return -30;
    default:
      return 0;
  }
}

function pickBest(
  event: EventCard,
  economyState: EconomyState,
  scoreFn: (d: EventDecision) => number,
): EventDecision | null {
  const candidates = affordableDecisions(event, economyState);
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => scoreFn(b) - scoreFn(a))[0] ?? null;
}

export function pickBalancedDecision(
  event: EventCard,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) => {
    let score = 0;
    const style = styleOf(d);
    if (style === 'partial' || style === 'balanced') score += 15;
    if (d.recommended) score += 10;
    if (strategyOf(d).includes('dengeli')) score += 8;
    return score;
  });
}

export function pickPriorityAlignedDecision(
  event: EventCard,
  priorityKey: DailyPriorityKey | undefined,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) =>
    scoreByPriorityFit(getDecisionPriorityFit(d, priorityKey)),
  );
}

export function pickFastDecision(
  event: EventCard,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) => {
    let score = 0;
    const style = styleOf(d);
    const strategy = strategyOf(d);
    if (style === 'fast') score += 30;
    if (strategy.includes('hızlı')) score += 25;
    if (style === 'risk') score += 5;
    return score;
  });
}

export function pickPassiveDecision(
  event: EventCard,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) => {
    let score = 0;
    const style = styleOf(d);
    const strategy = strategyOf(d);
    if (style === 'planned') score += 25;
    if (strategy.includes('kaynak korur')) score += 20;
    if (style === 'resource_saving') score += 18;
    if (d.title.toLowerCase().includes('izle')) score += 15;
    return score;
  });
}

export function pickResourceSavingDecision(
  event: EventCard,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) => {
    let score = 0;
    const style = styleOf(d);
    if (style === 'resource_saving' || style === 'planned') score += 25;
    if (strategyOf(d).includes('kaynak')) score += 20;
    const budgetCost = d.costs?.budget ?? 0;
    if (budgetCost === 0) score += 10;
    return score;
  });
}

export function pickPermanentSolutionDecision(
  event: EventCard,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) => {
    let score = 0;
    const style = styleOf(d);
    if (style === 'permanent') score += 35;
    if (strategyOf(d).includes('kalıcı')) score += 30;
    return score;
  });
}

export function pickWrongPriorityDecision(
  event: EventCard,
  priorityKey: DailyPriorityKey | undefined,
  economyState: EconomyState,
): EventDecision | null {
  return pickBest(event, economyState, (d) => {
    const fit = getDecisionPriorityFit(d, priorityKey);
    if (fit === 'risks' || fit === 'resource_pressure') return 40;
    if (fit === 'neutral') return 5;
    if (fit === 'supports') return -20;
    return 0;
  });
}

export function pickFirstAffordableDecision(
  event: EventCard,
  economyState: EconomyState,
): EventDecision | null {
  return affordableDecisions(event, economyState)[0] ?? null;
}
