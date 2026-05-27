import type { EventSeverity } from '@/core/xp/types';

/** Mahalle karakter tipi — XP XpDistrictType ile uyumlu değer kümesi, ayrı modül. */
export type DistrictType =
  | 'merkez'
  | 'cumhuriyet'
  | 'sanayi'
  | 'pazar'
  | 'yesilpark'
  | 'istasyon';

export type DistrictProfile = {
  id: DistrictType;
  name: string;
  description: string;
  tags: string[];
  baseRisk: number;
  complaintSensitivity: number;
  trafficDensity: number;
  socialMediaSensitivity: number;
  wastePressure: number;
  staffLoadPressure: number;
  vehicleDependency: number;
  publicTrustSensitivity: number;
};

export type DistrictEventType =
  | 'waste_overflow'
  | 'delayed_collection'
  | 'sidewalk_blocked'
  | 'market_crowding'
  | 'vehicle_breakdown_risk'
  | 'noise_complaint'
  | 'social_media_complaint'
  | 'park_cleanliness'
  | 'route_delay'
  | 'staff_fatigue_pressure'
  | 'public_trust_drop';

export type DistrictEventWeights = Partial<Record<DistrictEventType, number>>;

export type DistrictBonusHints = {
  resolvedQuickly?: boolean;
  socialRiskPrevented?: boolean;
  trafficReduced?: boolean;
  vehicleBreakdownPrevented?: boolean;
  publicTrustProtected?: boolean;
  crowdControlled?: boolean;
  parkOrderProtected?: boolean;
};

export type DistrictEvent = {
  id: string;
  day: number;
  districtType: DistrictType;
  districtName: string;
  type: DistrictEventType;
  severity: EventSeverity;
  title: string;
  description: string;
  tags: string[];
  xpDistrictType: DistrictType;
  districtBonusHints: DistrictBonusHints;
};

export type CalculateDistrictEventSeverityParams = {
  districtProfile: DistrictProfile;
  eventType: DistrictEventType;
  currentRisk: number;
  day: number;
  activeEventCount: number;
};

export type CreateDistrictEventParams = {
  districtType: DistrictType;
  day: number;
  currentRisk: number;
  activeEventCount: number;
  randomFn?: () => number;
  /** Test / önizleme için event tipini sabitleme. */
  eventType?: DistrictEventType;
};
