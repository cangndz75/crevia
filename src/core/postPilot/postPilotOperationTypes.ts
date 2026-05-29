export type PostPilotPhase =
  | 'pilot_only'
  | 'pilot_complete_idle'
  | 'preview_seen'
  | 'main_operation_light'
  | 'main_operation_full';

export type ScopeActivationStatus =
  | 'dormant'
  | 'preview'
  | 'agenda'
  | 'active'
  | 'stable';

export type PostPilotScopeId = 'istasyon' | 'yesilvadi' | 'main_operation';

export type PostPilotOperationState = {
  phase: PostPilotPhase;
  scopes: Record<PostPilotScopeId, ScopeActivationStatus>;
  previewSeenAt?: string;
  lightOperationStartedAt?: string;
  lastUpdatedDay?: number;
  /** Post-pilot operasyon takvimi (8+); yoksa city.day ile türetilir. */
  operationDay?: number;
  postPilotDailyEventSet?: import('./postPilotEventTypes').PostPilotDailyEventSet;
};

export type PostPilotNormalizeContext = {
  pilotStatus: 'not_started' | 'active' | 'completed';
  currentPilotDay?: number;
};

export type DerivePostPilotScopeStatusesInput = {
  postPilotOperation: PostPilotOperationState;
  pilotStatus: PostPilotNormalizeContext['pilotStatus'];
  authorityState?: unknown;
};
