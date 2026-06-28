import type { DistrictPersonalityProfile } from './districtPersonalityTypes';

export type DistrictPersonalityKey =
  | 'civic_core'
  | 'market_pressure'
  | 'industrial_route'
  | 'family_residential'
  | 'trust_fragile'
  | 'service_sensitive'
  | 'routine_dependent'
  | 'balanced_unknown';

export type DistrictPersonalityTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral';

export type DistrictPersonalityOutcomeBand = 'positive' | 'neutral' | 'warning' | 'mixed';

export type DistrictPersonalityPresentation = {
  districtId?: string;
  districtName: string;
  personalityKey: DistrictPersonalityKey;
  label: string;
  shortTrait: string;
  expectationLabel: string;
  toleranceLabel: string;
  reactsTo: string[];
  positiveResponse: string;
  negativeResponse: string;
  riskWhenIgnored: string;
  tone: DistrictPersonalityTone;
};

export type DistrictReactionFlavor = {
  title: string;
  description: string;
  tone: DistrictPersonalityTone;
  chips: Array<{
    label: string;
    value?: string;
    tone: DistrictPersonalityTone;
  }>;
};

export type DistrictMemoryReportInsight = {
  sectionTitle: string;
  line: string;
  tone: DistrictPersonalityTone;
};

export type DistrictPersonalityBindingInput = {
  districtId?: string | null;
  districtName?: string | null;
  day?: number;
  outcomeBand?: DistrictPersonalityOutcomeBand;
  publicSatisfaction?: number;
  profile?: import('./districtPersonalityTypes').DistrictPersonalityProfile | null;
  eventFamily?: string | null;
  avoidLines?: string[];
};

export type DistrictPersonalitySurface =
  | 'result'
  | 'report'
  | 'replay'
  | 'feed'
  | 'ece'
  | 'map'
  | 'periodGoal';
