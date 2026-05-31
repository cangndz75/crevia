import type { ComponentProps } from 'react';
import type { ImageSource } from 'expo-image';
import type Ionicons from '@expo/vector-icons/Ionicons';

import {
  creviaAssets,
  getCreviaRiskBadgeSource,
  type CreviaRiskBadgeLevel,
} from '@/core/assets/creviaAssets';
export type AuthorityTrustTierKey = 'low' | 'mid' | 'high';

export type ReportImpactMetricIcon = 'people' | 'shield-checkmark' | 'diamond';

const REPORT_IMPACT_IMAGES: Record<ReportImpactMetricIcon, ImageSource> = {
  people: creviaAssets.socialPulse.citizenGroup,
  'shield-checkmark': creviaAssets.authority.shieldCheck,
  diamond: creviaAssets.icons.premium.diamondGold,
};

const MAP_METRIC_IMAGES: Partial<
  Record<ComponentProps<typeof Ionicons>['name'], ImageSource>
> = {
  'people-outline': creviaAssets.socialPulse.citizenGroup,
  'person-outline': creviaAssets.socialPulse.teamStatus,
  'flash-outline': creviaAssets.icons.signals.beaconTeal,
};

const AUTHORITY_TIER_IMAGES: Record<AuthorityTrustTierKey, ImageSource> = {
  low: creviaAssets.badges.status.low,
  mid: creviaAssets.badges.status.medium,
  high: creviaAssets.badges.authority.high,
};

const PILOT_STAT_IMAGES = {
  pulse: creviaAssets.districts.icons.cityPulse,
  people: creviaAssets.socialPulse.citizenGroup,
  flag: creviaAssets.badges.pilot.firstFieldDay,
} as const satisfies Record<string, ImageSource>;

/** Gün sonu etki kartı ikonları */
export function getReportImpactMetricImage(icon: ReportImpactMetricIcon): ImageSource {
  return REPORT_IMPACT_IMAGES[icon];
}

/** Harita bölge metrik kutucukları */
export function getMapPilotMetricImage(
  icon: ComponentProps<typeof Ionicons>['name'],
): ImageSource | undefined {
  return MAP_METRIC_IMAGES[icon];
}

/** Yetki güven kartı amblemi */
export function getAuthorityTrustTierImage(tier: AuthorityTrustTierKey): ImageSource {
  return AUTHORITY_TIER_IMAGES[tier];
}

/** Hub bölge nabzı kartı */
export function getHubRegionPulseImage(regionId: string): ImageSource {
  const key = regionId.toLowerCase();
  if (key.includes('sanayi') || key.includes('industrial')) {
    return creviaAssets.districts.industrialBlock;
  }
  if (key.includes('cumhuriyet') || key.includes('pazar')) {
    return creviaAssets.districts.icons.cityPulse;
  }
  if (key.includes('merkez') || key.includes('central')) {
    return creviaAssets.buildings.municipalHall3d;
  }
  return creviaAssets.buildings.statusSquare;
}

/** Pilot özet şeridi */
export function getReportPilotStatImage(
  icon: keyof typeof PILOT_STAT_IMAGES,
): ImageSource {
  return PILOT_STAT_IMAGES[icon];
}

/** Rozet slotları — aktif / kilitli */
export function getReportBadgeSlotImage(active: boolean, slotIndex: number): ImageSource {
  if (!active) {
    return creviaAssets.icons.status.warningShield;
  }
  const activeBadges = [
    creviaAssets.badges.pilot.firstFieldDay,
    creviaAssets.badges.authority.high,
    creviaAssets.badges.status.good,
    creviaAssets.reports.icons.chartSuccess,
  ] as const;
  return activeBadges[slotIndex % activeBadges.length] ?? creviaAssets.badges.status.good;
}

export function resolveRiskBadgeLevelFromText(text: string): CreviaRiskBadgeLevel {
  const normalized = text.toLowerCase();
  if (normalized.includes('çok') || normalized.includes('very') || normalized.includes('kritik')) {
    return 'veryHigh';
  }
  if (normalized.includes('yüksek') || normalized.includes('high')) {
    return 'veryHigh';
  }
  if (normalized.includes('orta') || normalized.includes('medium')) {
    return 'medium';
  }
  if (normalized.includes('düşük') || normalized.includes('low')) {
    return 'low';
  }
  return 'good';
}

export function getRiskBadgeImageForLabel(label: string): ImageSource {
  return getCreviaRiskBadgeSource(resolveRiskBadgeLevelFromText(label));
}

/** Personel ekibi satırı */
export function getPersonnelTeamImage(teamName: string): ImageSource {
  const lower = teamName.toLowerCase();
  if (lower.includes('sürücü') || lower.includes('surucu')) {
    return creviaAssets.vehicles.fieldOperatorTruck;
  }
  if (lower.includes('temizlik') || lower.includes('atık')) {
    return creviaAssets.containers.serviceBins;
  }
  return creviaAssets.socialPulse.teamStatus;
}
