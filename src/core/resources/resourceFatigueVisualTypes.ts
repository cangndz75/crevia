export type ResourceVisualDomain = 'vehicle' | 'personnel' | 'container' | 'route' | 'mixed';

export type ResourceVisualState =
  | 'ready'
  | 'stable'
  | 'watch'
  | 'busy'
  | 'strained'
  | 'tired'
  | 'maintenance_risk'
  | 'critical'
  | 'recovering'
  | 'resolved'
  | 'unknown';

export type ResourceVisualTone = 'teal' | 'mint' | 'amber' | 'coral' | 'neutral';

export type ResourceVisualSurface =
  | 'hub'
  | 'map'
  | 'dispatch'
  | 'field'
  | 'result'
  | 'report';

export type ResourceFatigueVisualModel = {
  id: string;
  domain: ResourceVisualDomain;
  state: ResourceVisualState;
  tone: ResourceVisualTone;
  title: string;
  shortLabel: string;
  summary: string;
  iconKey: string;
  priority: number;
  visible: boolean;
  maxLines: number;
  debugReason?: string;
};

export type ResourceFatigueVisualInput = {
  day: number;
  domain?: ResourceVisualDomain;
  operationSignals?: {
    dailyFocus?: string;
    overall?: { status?: string };
    vehicles?: { status?: string; summary?: string };
    personnel?: { status?: string; summary?: string };
    containers?: { status?: string; summary?: string };
  } | null;
  operationalResources?: {
    vehicleGroups?: Record<
      string,
      {
        status?: string;
        maintenanceRisk?: number;
        routePressure?: number;
        capacityPressure?: number;
      }
    >;
    personnelGroups?: Record<
      string,
      { status?: string; fatigueScore?: number; moraleScore?: number }
    >;
    districtNetworks?: Record<
      string,
      {
        status?: string;
        fillPressure?: number;
        cleanlinessPressure?: number;
      }
    >;
  } | null;
  mapPresence?: { domain?: string } | null;
  eventDomainFocus?: { focus?: string; domain?: string } | null;
  carryOverMemory?: { domain?: string; resolved?: boolean } | null;
  reportTomorrowPreview?: { domain?: string; visible?: boolean } | null;
  activeEvent?: {
    contentCategory?: string;
    title?: string;
    resolved?: boolean;
    inProgress?: boolean;
  } | null;
  assignmentState?: { dominantDomain?: string } | null;
  surface?: ResourceVisualSurface;
  hasRealPostPilotData?: boolean;
  postPilotOperation?: { active?: boolean } | null;
};

export type ResourceFatigueVisualSummary = {
  visibleStates: ResourceFatigueVisualModel[];
  primaryState?: ResourceFatigueVisualModel;
  warnings: string[];
};

export const RESOURCE_VISUAL_DOMAINS: ResourceVisualDomain[] = [
  'vehicle',
  'personnel',
  'container',
  'route',
  'mixed',
];

export const RESOURCE_VISUAL_STATES: ResourceVisualState[] = [
  'ready',
  'stable',
  'watch',
  'busy',
  'strained',
  'tired',
  'maintenance_risk',
  'critical',
  'recovering',
  'resolved',
  'unknown',
];
