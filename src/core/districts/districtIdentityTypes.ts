/**
 * Harita mahalle kimlikleri — mapDistrictConstants ile aynı id kümesi.
 */
export type MapDistrictId =
  | 'cumhuriyet'
  | 'merkez'
  | 'sanayi'
  | 'istasyon'
  | 'yesilvadi';

export type DistrictRiskLevel = 'low' | 'medium' | 'high';

export type DistrictRiskProfile = {
  social: DistrictRiskLevel;
  traffic: DistrictRiskLevel;
  waste: DistrictRiskLevel;
  personnel: DistrictRiskLevel;
  budget: DistrictRiskLevel;
};

export type DistrictVisualAccent = 'teal' | 'mint' | 'amber' | 'green' | 'blue';

export type DistrictVisualTone = {
  accent: DistrictVisualAccent;
  iconKey: string;
};

export type DistrictIdentity = {
  id: MapDistrictId;
  name: string;
  shortLabel: string;
  personality: string;
  summary: string;
  riskProfile: DistrictRiskProfile;
  strengths: string[];
  pressurePoints: string[];
  visualTone: DistrictVisualTone;
  operationFlavorLines: string[];
  /** Olay/sonuç kartları için tek satırlık bağlam. */
  eventContextLine: string;
};

export type DistrictRiskChip = {
  id: string;
  label: string;
  level: DistrictRiskLevel;
};

export type DistrictFlavorContext = 'map' | 'event' | 'post_pilot' | 'default';
