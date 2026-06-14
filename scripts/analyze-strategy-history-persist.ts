/**
 * Strategy history persist binding analysis.
 * Calistir: npm run analyze:strategy-history-persist
 */

import {
  STRATEGY_DECISION_HISTORY_MAX,
  STRATEGY_DOMINANT_SURFACE_COOLDOWN_DAYS,
  STRATEGY_FOLLOW_UP_EXECUTION_HISTORY_MAX,
  STRATEGY_HISTORY_MAX_AGE_DAYS,
  STRATEGY_OPERATION_CHOICE_HISTORY_MAX,
  STRATEGY_PORTFOLIO_CHOICE_HISTORY_MAX,
} from '../src/core/strategyHistory/strategyHistoryModel';

// eslint-disable-next-line no-console
console.log('Strategy history persist binding');
// eslint-disable-next-line no-console
console.log(`maxAgeDays=${STRATEGY_HISTORY_MAX_AGE_DAYS}`);
// eslint-disable-next-line no-console
console.log(`decisionHistoryMax=${STRATEGY_DECISION_HISTORY_MAX}`);
// eslint-disable-next-line no-console
console.log(`operationChoiceHistoryMax=${STRATEGY_OPERATION_CHOICE_HISTORY_MAX}`);
// eslint-disable-next-line no-console
console.log(`portfolioChoiceHistoryMax=${STRATEGY_PORTFOLIO_CHOICE_HISTORY_MAX}`);
// eslint-disable-next-line no-console
console.log(`followUpExecutionHistoryMax=${STRATEGY_FOLLOW_UP_EXECUTION_HISTORY_MAX}`);
// eslint-disable-next-line no-console
console.log(`dominantSurfaceCooldownDays=${STRATEGY_DOMINANT_SURFACE_COOLDOWN_DAYS}`);
