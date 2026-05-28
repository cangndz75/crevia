export type NeighborhoodIdentityId =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type NeighborhoodArchetype =
  | 'civic_center'
  | 'starter_residential'
  | 'industrial_pressure'
  | 'transit_crossroads'
  | 'green_residential';

export type NeighborhoodSensitivityKey =
  | 'social_visibility'
  | 'waste_pressure'
  | 'traffic_flow'
  | 'maintenance_need'
  | 'public_expectation'
  | 'budget_sensitivity'
  | 'personnel_load'
  | 'crisis_spread';

export type NeighborhoodEventBiasKey =
  | 'waste'
  | 'social'
  | 'vehicle'
  | 'personnel'
  | 'maintenance'
  | 'traffic'
  | 'budget';

export type NeighborhoodGoalBiasKey =
  | 'publicSatisfaction'
  | 'operationRisk'
  | 'budget'
  | 'personnelMorale'
  | 'containerPressure'
  | 'socialPulse'
  | 'vehicleRisk';

export type NeighborhoodVisualTone =
  | 'blue'
  | 'green'
  | 'amber'
  | 'slate'
  | 'violet'
  | 'orange';

export type NeighborhoodReportStatus = 'good' | 'warning' | 'critical';

export type NeighborhoodIdentity = {
  id: NeighborhoodIdentityId;
  name: string;
  shortName: string;
  archetype: NeighborhoodArchetype;
  tagline: string;
  description: string;
  playerHint: string;
  socialChipLabel: string;
  mapCharacterLine: string;
  visualTone: NeighborhoodVisualTone;
  iconName: string;
  representative: {
    name: string;
    role: string;
    quote: string;
    avatarKey: string;
  };
  strengths: string[];
  vulnerabilities: string[];
  sensitivities: Record<NeighborhoodSensitivityKey, number>;
  eventBias: Record<NeighborhoodEventBiasKey, number>;
  goalBias: Record<NeighborhoodGoalBiasKey, number>;
  reportTone: Record<NeighborhoodReportStatus, string>;
};
