import type { DistrictEventType, DistrictEventWeights, DistrictType } from '@/core/districts/types';

/** Ağırlıklı seçimde stabil sıra — verify ve deterministik testler için. */
export const DISTRICT_EVENT_WEIGHT_ORDER: DistrictEventType[] = [
  'market_crowding',
  'sidewalk_blocked',
  'waste_overflow',
  'route_delay',
  'delayed_collection',
  'vehicle_breakdown_risk',
  'social_media_complaint',
  'public_trust_drop',
  'noise_complaint',
  'park_cleanliness',
  'staff_fatigue_pressure',
];

export const DISTRICT_EVENT_WEIGHTS: Record<DistrictType, DistrictEventWeights> = {
  merkez: {
    social_media_complaint: 20,
    sidewalk_blocked: 15,
    delayed_collection: 15,
    public_trust_drop: 15,
    noise_complaint: 10,
    waste_overflow: 10,
    route_delay: 10,
    staff_fatigue_pressure: 5,
  },
  pazar: {
    market_crowding: 25,
    sidewalk_blocked: 20,
    waste_overflow: 15,
    route_delay: 15,
    delayed_collection: 10,
    social_media_complaint: 10,
    public_trust_drop: 5,
  },
  sanayi: {
    waste_overflow: 25,
    vehicle_breakdown_risk: 20,
    route_delay: 20,
    delayed_collection: 15,
    staff_fatigue_pressure: 10,
    sidewalk_blocked: 5,
    public_trust_drop: 5,
  },
  yesilpark: {
    park_cleanliness: 25,
    public_trust_drop: 15,
    waste_overflow: 15,
    social_media_complaint: 15,
    noise_complaint: 10,
    delayed_collection: 10,
    staff_fatigue_pressure: 10,
  },
  cumhuriyet: {
    delayed_collection: 20,
    public_trust_drop: 20,
    waste_overflow: 15,
    noise_complaint: 15,
    social_media_complaint: 10,
    sidewalk_blocked: 10,
    staff_fatigue_pressure: 10,
  },
  istasyon: {
    route_delay: 25,
    noise_complaint: 20,
    sidewalk_blocked: 15,
    delayed_collection: 15,
    public_trust_drop: 10,
    social_media_complaint: 10,
    waste_overflow: 5,
  },
};

export const FALLBACK_EVENT_TYPE: DistrictEventType = 'delayed_collection';

export function getDistrictEventWeights(
  districtType: DistrictType,
): DistrictEventWeights {
  return (
    DISTRICT_EVENT_WEIGHTS[districtType] ??
    DISTRICT_EVENT_WEIGHTS.merkez
  );
}
