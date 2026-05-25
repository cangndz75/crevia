export type DecisionAppliedEffects = {
  publicSatisfaction?: number;
  budget?: number;
  staffMorale?: number;
  cleanliness?: number;
  trust?: number;
  risk?: number;
};

export type DecisionAppliedCosts = {
  budget?: number;
  staffHours?: number;
  vehicleUsage?: number;
  morale?: number;
};

export type DecisionRecord = {
  id: string;
  day: number;
  eventId: string;
  eventTitle: string;
  decisionId: string;
  decisionLabel: string;
  neighborhoodId?: string;
  neighborhoodName?: string;
  appliedEffects: DecisionAppliedEffects;
  appliedCosts?: DecisionAppliedCosts;
  createdAt: string;
};
