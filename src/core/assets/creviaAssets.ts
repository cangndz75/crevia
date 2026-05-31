import type { ImageSource } from 'expo-image';

/**
 * Crevia oyun görselleri — `assets/crevia/**` altında tek kaynak.
 * Yeni PNG eklerken yalnızca bu dosyayı güncelleyin.
 */
export const creviaAssets = {
  buildings: {
    municipalHall3d: require('@/assets/crevia/buildings/municipal_hall_3d.png'),
    statusSquare: require('@/assets/crevia/buildings/icons/building_status_square.png'),
  },
  vehicles: {
    fieldOperatorTruck: require('@/assets/crevia/vehicles/field_operator_truck.png'),
  },
  containers: {
    serviceBins: require('@/assets/crevia/containers/container_service_bins.png'),
  },
  districts: {
    industrialBlock: require('@/assets/crevia/districts/district_industrial_block.png'),
    icons: {
      cityPulse: require('@/assets/crevia/districts/icons/district_status_city_pulse.png'),
    },
  },
  map: {
    icons: {
      cityRoutePin: require('@/assets/crevia/map/icons/city_route_map_pin.png'),
      routePath: require('@/assets/crevia/map/icons/route_path_marker.png'),
      layersStack: require('@/assets/crevia/map/icons/district_layers_stack.png'),
    },
    markers: {
      truck: require('@/assets/crevia/map/markers/map_marker_truck.png'),
      publicBuilding: require('@/assets/crevia/map/markers/district_public_building_marker.png'),
      factory: require('@/assets/crevia/map/markers/district_factory_marker.png'),
    },
  },
  icons: {
    resources: {
      efficiencyGauge: require('@/assets/crevia/icons/resources/resource_efficiency_gauge.png'),
    },
    time: {
      nightShiftMoon: require('@/assets/crevia/icons/time/night_shift_moon.png'),
    },
    premium: {
      diamondGold: require('@/assets/crevia/icons/premium/premium_diamond_gold.png'),
    },
    knowledge: {
      operationGuide: require('@/assets/crevia/icons/knowledge/operation_guide_book.png'),
    },
    goals: {
      targetTeal: require('@/assets/crevia/icons/goals/goal_target_teal.png'),
    },
    system: {
      infoEmblem: require('@/assets/crevia/icons/system/info_emblem_teal.png'),
    },
    status: {
      warningShield: require('@/assets/crevia/icons/status/warning_shield_gold.png'),
    },
    signals: {
      beaconTeal: require('@/assets/crevia/icons/signals/signal_beacon_teal.png'),
    },
  },
  reports: {
    icons: {
      chartSuccess: require('@/assets/crevia/reports/icons/report_chart_success.png'),
      dailyTaskCoin: require('@/assets/crevia/reports/icons/daily_task_clipboard_coin.png'),
      checklistSuccess: require('@/assets/crevia/reports/icons/checklist_card_success.png'),
    },
    endOfDay: {
      sheetSmall: require('@/assets/crevia/reports/end-of-day/end_day_report_sheet_small.png'),
      deskDocuments: require('@/assets/crevia/reports/end-of-day/end_day_report_desk_documents.png'),
      clipboardDesk: require('@/assets/crevia/reports/end-of-day/end_day_report_clipboard_desk.png'),
      bundle: require('@/assets/crevia/reports/end-of-day/end_day_report_bundle.png'),
      clipboardStamp: require('@/assets/crevia/reports/end-of-day/end_day_report_clipboard_stamp.png'),
      badgeDocument: require('@/assets/crevia/reports/end-of-day/end_day_report_badge_document.png'),
      analyticsSheet: require('@/assets/crevia/reports/end-of-day/end_day_report_analytics_sheet.png'),
      scrollPen: require('@/assets/crevia/reports/end-of-day/end_day_report_scroll_pen.png'),
    },
  },
  badges: {
    status: {
      veryHigh: require('@/assets/crevia/badges/status/badge_risk_very_high.png'),
      medium: require('@/assets/crevia/badges/status/badge_risk_medium.png'),
      good: require('@/assets/crevia/badges/status/badge_risk_good.png'),
      low: require('@/assets/crevia/badges/status/badge_risk_low.png'),
    },
    authority: {
      high: require('@/assets/crevia/badges/authority/badge_authority_high.png'),
    },
    pilot: {
      firstFieldDay: require('@/assets/crevia/badges/pilot/badge_first_field_day.png'),
    },
  },
  socialPulse: {
    citizenGroup: require('@/assets/crevia/social-pulse/icons/citizen_group_mint.png'),
    teamStatus: require('@/assets/crevia/social-pulse/icons/citizen_team_status.png'),
  },
  authority: {
    shieldCheck: require('@/assets/crevia/authority/icons/authority_shield_check.png'),
  },
  operations: {
    dispatchCompass: require('@/assets/crevia/operations/dispatch/dispatch_compass_target.png'),
  },
  leaderboard: {
    trophyGold: require('@/assets/crevia/leaderboard/icons/achievement_trophy_gold.png'),
  },
} as const satisfies Record<string, unknown>;

export type CreviaRiskBadgeLevel = 'veryHigh' | 'medium' | 'good' | 'low';

const RISK_BADGE_BY_LEVEL: Record<CreviaRiskBadgeLevel, ImageSource> = {
  veryHigh: creviaAssets.badges.status.veryHigh,
  medium: creviaAssets.badges.status.medium,
  good: creviaAssets.badges.status.good,
  low: creviaAssets.badges.status.low,
};

/** Metrik / bölge risk etiketinden rozet görseli. */
export function getCreviaRiskBadgeSource(level: CreviaRiskBadgeLevel): ImageSource {
  return RISK_BADGE_BY_LEVEL[level];
}

/** Harita pilot alanı küçük önizleme görselleri. */
export const CREVIA_MAP_PILOT_MINI_ASSETS = {
  merkez: creviaAssets.map.markers.publicBuilding,
  cumhuriyet: creviaAssets.districts.icons.cityPulse,
  sanayiPazar: creviaAssets.map.markers.factory,
} as const satisfies Record<string, ImageSource>;
