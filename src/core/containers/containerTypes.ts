export type ContainerType =
  | 'standard_waste'
  | 'recycling'
  | 'organic'
  | 'market_waste'
  | 'industrial_waste'
  | 'park_bin';

export type ContainerOverflowRisk =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ContainerUnitStatus =
  | 'normal'
  | 'needs_collection'
  | 'overflowing'
  | 'needs_maintenance'
  | 'disabled';

export type ContainerNeighborhoodId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type ContainerLocation = {
  locationKey: string;
  locationLabel: string;
  mapZone: ContainerNeighborhoodId;
  x?: number;
  y?: number;
};

export type ContainerUnit = {
  id: string;
  neighborhoodId: ContainerNeighborhoodId;
  name: string;
  type: ContainerType;
  location: ContainerLocation;
  capacity: number;
  fillRate: number;
  condition: number;
  odorLevel: number;
  overflowRisk: ContainerOverflowRisk;
  lastCollectedDay: number;
  maintenanceNeed: number;
  status: ContainerUnitStatus;
  complaintPressure: number;
  linkedEventIds?: string[];
  tags?: string[];
};

export type NeighborhoodContainerRecommendedAction =
  | 'collect_now'
  | 'inspect'
  | 'repair'
  | 'monitor'
  | 'communicate';

export type NeighborhoodContainerStatusLabel =
  | 'Dengeli'
  | 'Doluluk Artıyor'
  | 'Taşma Riski'
  | 'Koku Baskısı'
  | 'Bakım Gerekli'
  | 'Kritik';

export type NeighborhoodContainerStatus = {
  neighborhoodId: ContainerNeighborhoodId;
  averageFillRate: number;
  worstOverflowRisk: ContainerOverflowRisk;
  averageCondition: number;
  odorPressure: number;
  maintenancePressure: number;
  collectionDelayDays: number;
  complaintPressure: number;
  activeContainerCount: number;
  criticalContainerCount: number;
  recommendedAction: NeighborhoodContainerRecommendedAction;
  statusLabel: NeighborhoodContainerStatusLabel;
};

export type ContainerState = {
  units: ContainerUnit[];
  aggregates: Record<ContainerNeighborhoodId, NeighborhoodContainerStatus>;
  lastProcessedDay: number;
  dayModifiers?: {
    isMarketDay?: boolean;
    weatherId?: string;
  };
};

export type ContainerDailyUpdateContext = {
  day: number;
  isMarketDay?: boolean;
  weatherId?: string;
};

export type ContainerDailyUpdateResult = {
  state: ContainerState;
  changedUnitIds: string[];
  newlyCriticalNeighborhoodIds: ContainerNeighborhoodId[];
  summaryLines: string[];
};

export type ContainerDecisionAction =
  | 'monitor'
  | 'dispatch_collection'
  | 'communicate'
  | 'permanent_solution'
  | 'maintenance'
  | 'prioritize_route'
  | 'add_capacity'
  | 'none';

export type ContainerDecisionEffectSummary = {
  action: ContainerDecisionAction;
  neighborhoodId: ContainerNeighborhoodId | null;
  affectedUnitIds: string[];
  summaryLine: string | null;
  severity: 'none' | 'low' | 'medium' | 'high';
};

export type ContainerDecisionInput = {
  containerState: ContainerState;
  event: {
    id: string;
    neighborhoodId?: string;
    eventType?: string;
    title: string;
    category?: string;
    tags?: string[];
  };
  decision: {
    id: string;
    title: string;
    body?: string;
    description?: string;
    decisionStyle?: string;
    type?: string;
    category?: string;
    tags?: string[];
    costs?: {
      budget?: number;
      staffHours?: number;
      vehicleUsage?: number;
    };
    neighborhoodId?: string;
  };
  day: number;
  personnelAssigned?: boolean;
  targetNeighborhoodId?: ContainerNeighborhoodId;
  targetContainerIds?: string[];
};

export type ContainerDecisionResult = {
  state: ContainerState;
  affectedUnitIds: string[];
  metricHints?: {
    cleanlinessDelta?: number;
    trustDelta?: number;
  };
  flagsForPilot?: Record<string, string | number | boolean>;
  summary?: ContainerDecisionEffectSummary;
};
