/**
 * Olaylar ekranı kritik PNG'leri — tek merkezden static require.
 * Repo'daki gerçek dosya adları (alt klasörler) kullanılır; Android case-sensitivity güvenli.
 */
export const eventImages = {
  cityMapHero: require('@/assets/events/ui/ev_minimap_central_01.png'),
  fatiguePressure: require('@/assets/events/social/ev_city_risk_critical_01.png'),
  resolvedParkSecurity: require('@/assets/events/opportunity/ev_park_renewal_01.png'),
  resolvedWaterLeak: require('@/assets/events/maintenance/ev_maintenance_road_pothole_01.png'),
  resolvedStreetLight: require('@/assets/events/maintenance/ev_maintenance_road_pothole_02.png'),
  trafficPressure: require('@/assets/events/routes/ev_route_pressure_01.png'),
  parkSecurity: require('@/assets/events/social/ev_social_public_crisis_01.png'),
} as const;

export const criticalEventImageModules = Object.values(eventImages);
