import { checkDecisionAffordability } from '@/core/economy/economyAffordability';
import type { EconomyState } from '@/core/economy/types';
import type { EventCard, EventDecision } from '@/core/models/EventCard';

import { PILOT_FINAL_EVENT_ID } from './calculatePilotFinalResult';

export const FINAL_LOW_COST_CLOSEOUT_DECISION_ID = 'd7-low-cost-closeout';

/** Gün 7 final rapor olayı — en az bir uygulanabilir soft fallback karar. */
export function createFinalLowCostCloseoutDecision(): EventDecision {
  return {
    id: FINAL_LOW_COST_CLOSEOUT_DECISION_ID,
    title: 'Öncelikleri netleştirip düşük maliyetli kapanış planı yap',
    description:
      'Sadece en kritik baskıları kapatır; yan sorunlar raporda takip maddesi olarak kalır.',
    style: 'balanced',
    decisionStyle: 'fast',
    contentStrategyLabel: 'Hızlı müdahale',
    contentShortTradeoff:
      'Bütçeyi korur, ancak yalnızca en kritik baskıları kapatır.',
    contentRiskHint: 'Bazı yan sorunlar raporda takip maddesi olarak kalabilir.',
    contentPriorityHint: 'Dolaylı katkı',
    effects: {
      publicSatisfaction: 2,
      budget: 0,
      morale: 1,
      risk: -2,
      xp: 8,
    },
    costs: { budget: 0, staffHours: 1 },
  };
}

function economyFromBudget(budget: number): EconomyState {
  return {
    currentSource: budget,
    startingSource: budget,
    totalEarned: 0,
    totalSpent: 0,
    transactions: [],
  };
}

function hasAffordableOption(
  event: EventCard,
  economyState: EconomyState,
): boolean {
  return event.decisions.some(
    (d) => checkDecisionAffordability({ economyState, decision: d }).canAfford,
  );
}

function isFinalStressEvent(event: EventCard): boolean {
  return (
    event.id === PILOT_FINAL_EVENT_ID ||
    event.eventType === 'final' ||
    event.day === 7
  );
}

/**
 * Final stres olaylarında en az bir uygulanabilir karar garanti eder.
 * Mevcut karar listesini silmez; yalnızca soft fallback ekler veya günceller.
 */
export function ensureAtLeastOneAffordableDecision(
  event: EventCard,
  currentBudget: number,
): EventCard {
  if (!isFinalStressEvent(event)) {
    return event;
  }

  const economyState = economyFromBudget(currentBudget);
  if (hasAffordableOption(event, economyState)) {
    return event;
  }

  const fallback = createFinalLowCostCloseoutDecision();
  const existingIdx = event.decisions.findIndex(
    (d) => d.id === FINAL_LOW_COST_CLOSEOUT_DECISION_ID,
  );

  if (existingIdx >= 0) {
    const decisions = [...event.decisions];
    decisions[existingIdx] = { ...decisions[existingIdx]!, ...fallback };
    return { ...event, decisions };
  }

  return {
    ...event,
    decisions: [...event.decisions, fallback],
  };
}
