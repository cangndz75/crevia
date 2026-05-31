import type { InteractionExpectedAction } from './interactionContractTypes';

export const INTERACTION_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
] as const;

export const KNOWN_INTERACTION_ROUTES = [
  '/',
  '/post-pilot-offer',
  '/events/main-operation-preview',
  '/events',
  '/events/decision-result',
  '/events/pilot-final-report',
  '/events/[id]',
  '/reports',
  '/profile',
  '/social',
  '/social/mentions',
  '/social/outcome-history',
  '/leaderboard',
  '/risks',
  '/progression',
] as const;

export const KNOWN_INTERACTION_ACTIONS = [
  'askAdvisorForDailySummary',
  'askAdvisorForEventHint',
  'acknowledgeAdvisorMissedSignal',
  'confirmDailyOperationsPlan',
  'updateDailyOperationsPlan',
  'refreshDailyOperationsPlan',
  'confirmEventAssignment',
  'markAssignmentDispatched',
  'updateEventAssignment',
  'resolveMicroDecision',
  'skipMicroDecision',
  'mockPurchaseMainOperationPack',
  'continueWithLimitedAgenda',
  'restoreMainOperationAccessPlaceholder',
  'useQuickAction',
  'devJumpToPostPilotOfferForTesting',
  'devJumpToFullMainOperationForTesting',
  'devRaiseCrisisRiskForTesting',
  'devGenerateMicroDecisionForTesting',
  'devJumpToDay8LimitedForTesting',
  'clearSaveAndReset',
  'endCurrentDay',
  'mapFocusDistrict',
  'mapSelectDistrict',
  'mapSelectPin',
  'mapSetFilter',
] as const;

export const CTA_AFFORDANCES = new Set([
  'primary_cta',
  'secondary_cta',
  'inline_action',
  'option_button',
  'disabled_cta',
  'debug_button',
  'pressable_card',
]);

export const ACTION_REQUIRES_TARGET: Record<
  InteractionExpectedAction,
  'route' | 'modalId' | 'actionName' | 'debugGuard' | null
> = {
  none: null,
  navigation: 'route',
  modal: 'modalId',
  state_update: 'actionName',
  expand_collapse: null,
  external_placeholder: 'actionName',
  debug_only: 'debugGuard',
};
