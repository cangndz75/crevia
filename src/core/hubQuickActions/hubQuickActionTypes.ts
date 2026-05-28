export type HubQuickActionId =
  | 'field_duty'
  | 'route_preparation'
  | 'neighborhood_patrol'
  | 'social_response';

export type HubQuickActionStatus =
  | 'available'
  | 'used'
  | 'locked'
  | 'disabled';

export type HubQuickActionTone = 'positive' | 'neutral' | 'warning';

export type HubQuickActionResult = {
  actionId: HubQuickActionId;
  title: string;
  tone: HubQuickActionTone;
  resultLine: string;
  detailLine?: string;
  day: number;
};

export type HubQuickActionRecord = {
  id: string;
  actionId: HubQuickActionId;
  day: number;
  title: string;
  targetLabel: string;
  resultLine: string;
  createdAtDay: number;
  createdAtSequence: number;
};

export type FieldDutyAssignment = {
  day: number;
  teamId: string;
  targetNeighborhoodId: string;
  targetCompetency: import('@/core/personnel/personnelTypes').PersonnelCompetencyKey;
  label: string;
  effectLabel: string;
};

export type RoutePreparationFocus =
  | 'waste_route'
  | 'response_route'
  | 'maintenance_route'
  | 'general_route';

export type RoutePreparationSource =
  | 'active_event'
  | 'container_pressure'
  | 'vehicle_pressure'
  | 'fallback';

export type RoutePreparationAssignment = {
  day: number;
  targetNeighborhoodId?: string;
  targetNeighborhoodLabel: string;
  targetVehicleId?: string;
  targetVehicleLabel?: string;
  targetVehicleCategory?: string;
  routeFocus: RoutePreparationFocus;
  source: RoutePreparationSource;
  label: string;
  effectLabel: string;
};

export type NeighborhoodPatrolFocus =
  | 'container_check'
  | 'complaint_check'
  | 'route_check'
  | 'social_check'
  | 'general_check';

export type NeighborhoodPatrolSource =
  | 'active_event'
  | 'container_pressure'
  | 'social_pressure'
  | 'vehicle_pressure'
  | 'fallback';

export type NeighborhoodPatrolSignalTone = 'info' | 'warning' | 'positive';

export type NeighborhoodPatrolSignalCategory =
  | 'container'
  | 'complaint'
  | 'route'
  | 'social'
  | 'general';

export type NeighborhoodPatrolSignal = {
  id: string;
  day: number;
  neighborhoodId: string;
  title: string;
  body: string;
  tone: NeighborhoodPatrolSignalTone;
  category: NeighborhoodPatrolSignalCategory;
};

export type NeighborhoodPatrolAssignment = {
  day: number;
  targetNeighborhoodId: string;
  targetNeighborhoodLabel: string;
  patrolFocus: NeighborhoodPatrolFocus;
  source: NeighborhoodPatrolSource;
  label: string;
  effectLabel: string;
  revealedSignal?: NeighborhoodPatrolSignal;
};

export type SocialResponseType =
  | 'clarify'
  | 'empathize'
  | 'inform'
  | 'deescalate';

export type SocialResponseSource =
  | 'active_topic'
  | 'social_pressure'
  | 'active_event'
  | 'fallback';

export type SocialResponseAssignment = {
  day: number;
  targetTopicId?: string;
  targetTopicTitle?: string;
  targetNeighborhoodId?: string;
  targetNeighborhoodLabel?: string;
  responseType: SocialResponseType;
  source: SocialResponseSource;
  label: string;
  effectLabel: string;
};

export type HubQuickActionState = {
  day: number;
  usedActionIds: HubQuickActionId[];
  records: HubQuickActionRecord[];
  lastResult?: HubQuickActionResult;
  sequence: number;
  fieldDuty?: FieldDutyAssignment;
  routePreparation?: RoutePreparationAssignment;
  neighborhoodPatrol?: NeighborhoodPatrolAssignment;
  socialResponse?: SocialResponseAssignment;
};

export type HubQuickActionCardModel = {
  id: HubQuickActionId;
  title: string;
  subtitle: string;
  iconName: string;
  status: HubQuickActionStatus;
  statusLabel: string;
  helperLine?: string;
  resultPreview?: string;
  disabledReason?: string;
  used: boolean;
};

export type HubQuickActionDefinition = {
  id: HubQuickActionId;
  title: string;
  subtitle: string;
  targetLabel: string;
  iconName: string;
  defaultResultLine: string;
  defaultDetailLine: string;
};

export type ProcessHubQuickActionInput = {
  actionId: HubQuickActionId;
  currentDay: number;
  state: HubQuickActionState;
  fieldDutyContext?: import('./hubQuickActionFieldDutyPlan').FieldDutyPlanContext;
  routePreparationContext?: import('./hubQuickActionRoutePlan').RoutePreparationPlanContext;
  neighborhoodPatrolContext?: import('./hubQuickActionNeighborhoodPatrolPlan').NeighborhoodPatrolPlanContext;
  socialResponseContext?: import('./hubQuickActionSocialResponsePlan').SocialResponsePlanContext;
};

export type ProcessHubQuickActionOutput = {
  state: HubQuickActionState;
  result: HubQuickActionResult;
  stateChanged: boolean;
  socialPulseState?: import('@/core/social/socialTypes').SocialPulseState;
};
