import type { ImageSource } from 'expo-image';

import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { EventCard } from '@/core/models/EventCard';
import { deriveVisualType, type EventVisualType } from '@/features/events/utils/eventUiHelpers';

/** Pilot ve operasyon ekranı olay görselleri — `assets/events/` */
export const eventAssets = {
  odor: {
    complaintSignal: require('@/assets/events/odor/ev_odor_complaint_signal_01.png'),
    muhtarPressure: require('@/assets/events/odor/ev_odor_muhtar_pressure_01.png'),
  },
  waste: {
    overflow01: require('@/assets/events/waste/ev_waste_overflow_container_01.png'),
    overflow02: require('@/assets/events/waste/ev_waste_overflow_container_02.png'),
    overflow03: require('@/assets/events/waste/ev_waste_overflow_container_03.png'),
    collectionDelay: require('@/assets/events/waste/ev_waste_collection_delay_01.png'),
  },
  routes: {
    delay: require('@/assets/events/routes/ev_route_delay_01.png'),
    pressure: require('@/assets/events/routes/ev_route_pressure_01.png'),
    vehicleDelay: require('@/assets/events/routes/ev_vehicle_delay_01.png'),
  },
  market: {
    pollution01: require('@/assets/events/market/ev_market_area_pollution_01.png'),
    pollution02: require('@/assets/events/market/ev_market_area_pollution_02.png'),
  },
  social: {
    noise01: require('@/assets/events/social/ev_social_noise_complaint_01.png'),
    noise02: require('@/assets/events/social/ev_social_noise_complaint_02.png'),
    publicCrisis: require('@/assets/events/social/ev_social_public_crisis_01.png'),
    cityRisk: require('@/assets/events/social/ev_city_risk_critical_01.png'),
  },
  maintenance: {
    pothole: require('@/assets/events/maintenance/ev_maintenance_road_pothole_01.png'),
    vehicle: require('@/assets/events/maintenance/ev_maintenance_vehicle_breakdown_01.png'),
  },
  opportunity: {
    parkRenewal: require('@/assets/events/opportunity/ev_park_renewal_01.png'),
    staffRecovery: require('@/assets/events/opportunity/ev_staff_recovery_01.png'),
  },
  complaint: {
    shopkeeper: require('@/assets/events/complaint/ev_shopkeeper_complaint_01.png'),
    marketWaste: require('@/assets/events/complaint/ev_market_waste_stack_01.png'),
    container: require('@/assets/events/complaint/ev_container_overflow_01.png'),
  },
  scenes: {
    odor: require('@/assets/events/scenes/ev_scene_odor_01.png'),
    waste: require('@/assets/events/scenes/ev_scene_waste_01.png'),
    market: require('@/assets/events/scenes/ev_scene_market_01.png'),
    route: require('@/assets/events/scenes/ev_scene_route_01.png'),
    social: require('@/assets/events/scenes/ev_scene_social_01.png'),
    crisis: require('@/assets/events/scenes/ev_scene_crisis_01.png'),
  },
  minimap: {
    central: require('@/assets/events/ui/ev_minimap_central_01.png'),
    cumhuriyet: require('@/assets/events/ui/ev_minimap_cumhuriyet_01.png'),
    industrial_market: require('@/assets/events/ui/ev_minimap_industrial_01.png'),
    market: require('@/assets/events/ui/ev_minimap_market_01.png'),
  },
} as const;

/** Eski hub mock id’leri */
const legacyEventHeroById: Record<string, ImageSource> = {
  'container-overflow': eventAssets.complaint.container,
  'trash-collection-delay': eventAssets.waste.collectionDelay,
  'park-trash-buildup': eventAssets.waste.overflow02,
};

/** Pilot senaryo olay id → görsel */
const pilotEventHeroById: Record<string, ImageSource> = {
  central_day1_learning_main_street: eventAssets.complaint.container,
  cumhuriyet_day1_learning_complaint: eventAssets.odor.complaintSignal,
  industrial_market_day1_learning_market_waste: eventAssets.complaint.marketWaste,
  central_day2_complaint_shopkeepers: eventAssets.complaint.shopkeeper,
  cumhuriyet_day2_complaint_muhtar_pressure: eventAssets.odor.muhtarPressure,
  industrial_market_day2_complaint_sidewalk_load: eventAssets.market.pollution02,
  central_day3_resource_market_staff_conflict: eventAssets.market.pollution01,
  cumhuriyet_day3_resource_complaint_stack: eventAssets.odor.muhtarPressure,
  industrial_market_day3_resource_vehicle_delay: eventAssets.routes.vehicleDelay,
  shared_day3_resource_pressure: eventAssets.social.cityRisk,
  central_day4_social_shopkeeper_group: eventAssets.social.publicCrisis,
  cumhuriyet_day4_social_neighborhood_posts: eventAssets.social.noise02,
  industrial_market_day4_social_low_visibility_risk: eventAssets.social.noise01,
  shared_day4_social_pressure: eventAssets.social.publicCrisis,
  shared_day5_opportunity_staff_recovery: eventAssets.opportunity.staffRecovery,
  shared_day5_opportunity_permanent_solution: eventAssets.opportunity.parkRenewal,
  shared_day7_final_pilot_report_pressure: eventAssets.scenes.crisis,
};

const minimapByDistrict: Record<string, ImageSource> = {
  central: eventAssets.minimap.central,
  cumhuriyet: eventAssets.minimap.cumhuriyet,
  industrial_market: eventAssets.minimap.industrial_market,
  industrial: eventAssets.minimap.industrial_market,
  market: eventAssets.minimap.market,
};

const sceneByVisualType: Record<EventVisualType, ImageSource> = {
  odor_complaint: eventAssets.scenes.odor,
  waste: eventAssets.scenes.waste,
  traffic: eventAssets.scenes.route,
  maintenance: eventAssets.scenes.route,
  opportunity: eventAssets.scenes.market,
  default: eventAssets.scenes.social,
};

function matchEventIdPrefix(eventId: string): ImageSource | null {
  if (
    eventId.includes('odor') ||
    (eventId.includes('complaint') && eventId.includes('cumhuriyet'))
  ) {
    return eventAssets.odor.complaintSignal;
  }
  if (eventId.includes('vehicle_delay') || eventId.includes('route')) {
    return eventAssets.routes.vehicleDelay;
  }
  if (eventId.includes('market') || eventId.includes('waste')) {
    return eventAssets.complaint.marketWaste;
  }
  if (eventId.includes('opportunity')) {
    return eventAssets.opportunity.parkRenewal;
  }
  if (eventId.includes('social')) {
    return eventAssets.social.publicCrisis;
  }
  return null;
}

export function getEventHeroImage(
  eventId: string,
  category: string,
  event?: Pick<EventCard, 'title' | 'contextTag' | 'filterTags' | 'eventType'>,
): ImageSource {
  if (legacyEventHeroById[eventId]) {
    return legacyEventHeroById[eventId];
  }
  if (pilotEventHeroById[eventId]) {
    return pilotEventHeroById[eventId];
  }

  const prefixMatch = matchEventIdPrefix(eventId);
  if (prefixMatch) {
    return prefixMatch;
  }

  if (event) {
    const visual = deriveVisualType(event as EventCard);
    return sceneByVisualType[visual];
  }

  const key = category.toLowerCase();
  if (key.includes('temizlik') || key.includes('atık')) {
    return eventAssets.waste.overflow03;
  }
  if (key.includes('altyapı') || key.includes('altyapi')) {
    return eventAssets.maintenance.pothole;
  }
  if (key.includes('iletişim') || key.includes('iletisim') || key.includes('sosyal')) {
    return eventAssets.social.noise01;
  }
  if (key.includes('pazar') || key.includes('market')) {
    return eventAssets.market.pollution01;
  }
  if (key.includes('rota')) {
    return eventAssets.routes.delay;
  }
  return eventAssets.social.cityRisk;
}

export function getEventSceneImage(event: EventCard): ImageSource {
  if (pilotEventHeroById[event.id]) {
    return pilotEventHeroById[event.id];
  }
  return sceneByVisualType[deriveVisualType(event)];
}

export function getDistrictMinimapImage(
  districtId?: string | null,
  districtName?: string,
): ImageSource {
  if (districtId && districtId in minimapByDistrict) {
    return minimapByDistrict[districtId];
  }
  const name = (districtName ?? '').toLowerCase();
  if (name.includes('cumhuriyet')) return eventAssets.minimap.cumhuriyet;
  if (name.includes('pazar') || name.includes('market')) {
    return eventAssets.minimap.market;
  }
  if (name.includes('sanayi') || name.includes('endüstriyel')) {
    return eventAssets.minimap.industrial_market;
  }
  return eventAssets.minimap.central;
}

export function getMinimapForPilotDistrict(
  districtId: PilotDistrictId | null | undefined,
): ImageSource {
  if (districtId && districtId in minimapByDistrict) {
    return minimapByDistrict[districtId];
  }
  return eventAssets.minimap.central;
}
