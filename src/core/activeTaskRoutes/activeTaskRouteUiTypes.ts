import type { ActiveTaskRouteContext, ActiveTaskRouteModel } from './activeTaskRouteTypes';

export type CreviaActiveTaskRoutePhase =
  | 'planned'
  | 'dispatch_ready'
  | 'en_route'
  | 'on_site'
  | 'resolving'
  | 'completed'
  | 'delayed'
  | 'risk_watch';

export type CreviaActiveTaskRouteStatus =
  | 'hidden'
  | 'planned'
  | 'ready'
  | 'active'
  | 'watch'
  | 'completed';

export type CreviaActiveTaskRouteHealthStatus = 'healthy' | 'watch' | 'strained' | 'hidden';

export type CreviaActiveTaskRouteStep = {
  id: string;
  label: string;
  shortLabel: string;
  order: number;
  isActive: boolean;
  isComplete: boolean;
};

export type CreviaActiveTaskRouteDistrictNode = {
  districtId: string;
  label: string;
  role: 'source' | 'target';
  tone: 'teal' | 'mint' | 'gold' | 'neutral';
};

export type CreviaActiveTaskRouteResourceNode = {
  kind: 'personnel' | 'vehicle';
  label: string;
  shortLabel: string;
  tone: 'teal' | 'mint' | 'gold' | 'neutral';
};

export type CreviaActiveTaskRoutePresentationLine = {
  surface: 'map' | 'dispatch' | 'field' | 'report';
  text: string;
  tone: 'teal' | 'mint' | 'gold' | 'neutral' | 'warn';
  iconKey: string;
};

export type CreviaActiveTaskRouteVisibility = {
  mode: 'hidden' | 'compact' | 'standard' | 'detailed';
  showSteps: boolean;
  showResourceWarning: boolean;
  maxSteps: number;
  showMapHint: boolean;
};

export type CreviaActiveTaskRouteUiModel = {
  id: string;
  phase: CreviaActiveTaskRoutePhase;
  status: CreviaActiveTaskRouteStatus;
  healthStatus: CreviaActiveTaskRouteHealthStatus;
  visibility: CreviaActiveTaskRouteVisibility;
  routeModel: ActiveTaskRouteModel;
  steps: CreviaActiveTaskRouteStep[];
  districtNodes: CreviaActiveTaskRouteDistrictNode[];
  resourceNodes: CreviaActiveTaskRouteResourceNode[];
  dispatchLine: string;
  fieldLine: string;
  mapLine: string;
  reportLine: string;
  statusLine: string;
  resourceWarningLine?: string;
  teamLabel?: string;
  vehicleLabel?: string;
  targetDistrictLabel?: string;
  activeStepIndex: number;
  visible: boolean;
  isHintOnly: true;
};

export type CreviaActiveTaskRouteUiContext = ActiveTaskRouteContext & {
  eventPhase?: 'inspect' | 'plan' | 'dispatch' | 'field' | 'result';
  rankKey?: string;
  unlockedPermissionIds?: string[];
  isPostPilot?: boolean;
  hasActiveRouteLayer?: boolean;
  resourceFatigueVisible?: boolean;
};

export type CreviaActiveRouteRankVisibility = {
  mode: 'hidden' | 'compact' | 'standard' | 'detailed';
  showSteps: boolean;
  showResourceLink: boolean;
  showTrustMemoryLink: boolean;
};
