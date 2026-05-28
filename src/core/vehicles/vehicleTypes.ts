export type VehicleCategory =
  | 'garbage_truck'
  | 'small_response'
  | 'maintenance_vehicle'
  | 'inspection_vehicle'
  | 'utility_pickup';

export type VehicleOperationalStatus =
  | 'available'
  | 'assigned'
  | 'maintenance'
  | 'broken'
  | 'resting';

export type VehicleConditionLevel =
  | 'good'
  | 'worn'
  | 'risky'
  | 'critical';

export type VehicleNeighborhoodId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type VehicleUnit = {
  id: string;
  name: string;
  category: VehicleCategory;
  homeNeighborhoodId: VehicleNeighborhoodId;
  currentNeighborhoodId: VehicleNeighborhoodId;
  operationalStatus: VehicleOperationalStatus;
  condition: number;
  fuelOrCharge: number;
  workload: number;
  routeEfficiency: number;
  maintenanceNeed: number;
  breakdownRisk: number;
  assignedEventId?: string | null;
  lastAssignedDay?: number | null;
  lastMaintenanceDay?: number | null;
  traits?: string[];
};

export type VehicleAggregates = {
  total: number;
  available: number;
  assigned: number;
  inMaintenance: number;
  broken: number;
  averageCondition: number;
  averageWorkload: number;
  averageRouteEfficiency: number;
  averageBreakdownRisk: number;
  criticalCount: number;
};

export type VehicleDayModifiers = {
  routePressure: number;
  maintenancePressure: number;
  fuelPressure: number;
};

export type VehicleState = {
  units: VehicleUnit[];
  aggregates: VehicleAggregates;
  lastProcessedDay: number;
  dayModifiers: VehicleDayModifiers;
};

export type VehicleRootState = {
  vehicleState?: VehicleState;
};

export type VehicleDecisionAction =
  | 'dispatch_collection'
  | 'dispatch_response'
  | 'prioritize_route'
  | 'maintenance'
  | 'permanent_solution'
  | 'add_capacity'
  | 'monitor'
  | 'none';

export type VehicleDecisionEventInput = {
  id: string;
  type?: string;
  eventType?: string;
  title?: string;
  description?: string;
  category?: string;
  neighborhoodId?: string;
  districtId?: string;
  districtIds?: string[];
  tags?: string[];
};

export type VehicleDecisionChoiceInput = {
  id: string;
  title?: string;
  label?: string;
  description?: string;
  body?: string;
  intent?: string;
  type?: string;
  action?: string;
  decisionStyle?: string;
  style?: string;
  category?: string;
  tags?: string[];
  costs?: {
    budget?: number;
    staffHours?: number;
    vehicleUsage?: number;
  };
  riskLevel?: string;
  intensity?: string | number;
  neighborhoodId?: string;
};

export type VehicleDecisionInput = {
  vehicleState: VehicleState;
  event?: VehicleDecisionEventInput;
  decision: VehicleDecisionChoiceInput;
  day: number;
};

export type VehicleDecisionResult = {
  state: VehicleState;
  action: VehicleDecisionAction;
  affectedVehicleId: string | null;
};

export type VehicleFleetActionType =
  | 'send_to_maintenance'
  | 'rest_vehicle'
  | 'route_support';

export type VehicleFleetActionInput = {
  type: VehicleFleetActionType;
  vehicleId: string;
  day: number;
};

export type VehicleFleetActionGateResult = {
  allowed: boolean;
  reason?: string;
};

export type VehicleFleetActionApplyResult = {
  state: VehicleState;
  applied: boolean;
  message: string;
  affectedVehicleId?: string;
};

export type VehicleFleetActionRecommendationTone =
  | 'neutral'
  | 'warning'
  | 'danger'
  | 'good';

export type VehicleFleetActionRecommendation = {
  type: VehicleFleetActionType;
  vehicleId: string;
  vehicleName: string;
  label: string;
  description: string;
  tone: VehicleFleetActionRecommendationTone;
};
