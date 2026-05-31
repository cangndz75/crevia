export type InteractionSurface =
  | 'hub'
  | 'event_plan'
  | 'event_dispatch'
  | 'event_field'
  | 'event_result'
  | 'report'
  | 'map'
  | 'post_pilot'
  | 'profile'
  | 'social'
  | 'leaderboard'
  | 'devtools';

export type InteractionVisualAffordance =
  | 'static_card'
  | 'pressable_card'
  | 'primary_cta'
  | 'secondary_cta'
  | 'inline_action'
  | 'option_button'
  | 'disabled_cta'
  | 'debug_button';

export type InteractionExpectedAction =
  | 'none'
  | 'navigation'
  | 'modal'
  | 'state_update'
  | 'expand_collapse'
  | 'external_placeholder'
  | 'debug_only';

export type InteractionTarget = {
  type: InteractionExpectedAction;
  route?: string;
  modalId?: string;
  actionName?: string;
  stateSlice?: string;
  debugGuard?: '**DEV**' | 'custom_guard';
};

export type InteractionContract = {
  id: string;
  componentName: string;
  surface: InteractionSurface;
  label: string;
  visualAffordance: InteractionVisualAffordance;
  expectedAction: InteractionExpectedAction;
  target?: InteractionTarget;
  isOptional?: boolean;
  disabledBehavior?: {
    hasDisabledState: boolean;
    explanationRequired: boolean;
    explanation?: string;
  };
  guard?: {
    dayRange?: 'pilot' | 'post_pilot' | 'full_main' | 'limited' | 'dev_only';
    accessMode?: 'none' | 'limited' | 'full';
  };
  notes?: string;
};

export type InteractionAuditSeverity = 'pass' | 'warn' | 'fail';

export type InteractionAuditFinding = {
  id: string;
  severity: InteractionAuditSeverity;
  contractId: string;
  componentName: string;
  message: string;
  recommendation: string;
};

export type InteractionAuditResult = {
  health: 'PASS' | 'WARN' | 'FAIL';
  checkedCount: number;
  passCount: number;
  warnCount: number;
  failCount: number;
  findings: InteractionAuditFinding[];
};
