import type { EventCard } from '@/core/models/EventCard';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import { CITY_DISTRICT_REGIONS } from '@/features/map/data/cityOverviewGeometry';
import type { MapDistrictId } from '@/features/map/data/mapAssets';
import { getMapDistrictLabel } from '@/features/map/utils/mapDistrictLabels';
import type { CenterHomeCoreSections } from '@/features/hub/utils/centerHomePresentation';

export const MISSION_OBSERVE_AREA_ACTION_KEY = 'mission_observe_area';
export const MISSION_OBSERVE_AREA_ROUTE = '/risks?observe=1';

export type MapObservationModeState =
  | 'idle'
  | 'scanning'
  | 'completed'
  | 'blocked'
  | 'cooldown'
  | 'insufficient_energy';

export type MapObservationResultType = 'verified_risk' | 'uncertain' | 'clear';

export type MapObservationHotspot = {
  id: string;
  x: number;
  y: number;
};

export type MapObservationExpectedEffects = {
  risk: string;
  trust: string;
  resource: string;
};

export type MapObservationPresentationModel = {
  targetDistrictId: MapDistrictId;
  targetDistrictName: string;
  activeIssueTitle: string;
  initialConfidence: number;
  finalConfidence: number;
  hotSpotCount: number;
  resultType: MapObservationResultType;
  mainRisk: string;
  recommendedAction: string;
  expectedEffects: MapObservationExpectedEffects;
  scanCenter: { x: number; y: number };
  hotspots: MapObservationHotspot[];
  energyRemaining: number;
  energyMax: number;
  scanCost: number;
  resultChipLabel: string;
  summaryLine: string;
  applyRecommendationRoute?: string;
};

export type MissionObserveHubPresentation = {
  actionKey: string;
  title: string;
  subtitle: string;
  route: string;
  iconKey: string;
  disabled: boolean;
  disabledReason?: string;
  accessibilityLabel: string;
};

const DEFAULT_DISTRICT_ID: MapDistrictId = 'cumhuriyet';
const DEFAULT_DISTRICT_NAME = 'Cumhuriyet Mahallesi';
const DEFAULT_ISSUE_TITLE = 'Cumhuriyet Ekibinde Yorgunluk Baskısı';

function resolveDistrictId(
  event?: EventCard | null,
  focusDistrictId?: MapDistrictId | string | null,
): MapDistrictId {
  const fromEvent = event?.neighborhoodId;
  if (fromEvent && CITY_DISTRICT_REGIONS.some((region) => region.id === fromEvent)) {
    return fromEvent as MapDistrictId;
  }
  if (
    focusDistrictId &&
    CITY_DISTRICT_REGIONS.some((region) => region.id === focusDistrictId)
  ) {
    return focusDistrictId as MapDistrictId;
  }
  return DEFAULT_DISTRICT_ID;
}

function districtLabel(districtId: MapDistrictId): string {
  const region = CITY_DISTRICT_REGIONS.find((entry) => entry.id === districtId);
  const base = region?.displayName ?? getMapDistrictLabel(districtId);
  return base.includes('Mahallesi') ? base : `${base} Mahallesi`;
}

function buildHotspots(center: { x: number; y: number }, count: number): MapObservationHotspot[] {
  const offsets = [
    { dx: -0.06, dy: -0.05 },
    { dx: 0.05, dy: -0.04 },
    { dx: -0.03, dy: 0.06 },
    { dx: 0.07, dy: 0.05 },
  ];
  return offsets.slice(0, count).map((offset, index) => ({
    id: `hotspot_${index + 1}`,
    x: Math.max(0, Math.min(1, center.x + offset.dx)),
    y: Math.max(0, Math.min(1, center.y + offset.dy)),
  }));
}

function inferMainRisk(
  activeOperationCard?: ActiveOperationMapCardModel | null,
  event?: EventCard | null,
): string {
  const pressure = activeOperationCard?.pressureLine?.trim();
  const route = activeOperationCard?.routeLine?.trim();
  if (pressure && route) return `${pressure} + ${route}`;
  if (pressure) return pressure;
  if (route) return route;
  if (event?.title) return event.title;
  return 'Ekip yorgunluğu + rota gecikmesi';
}

function inferRecommendedAction(
  activeOperationCard?: ActiveOperationMapCardModel | null,
): string {
  const next = activeOperationCard?.nextActionLine?.trim();
  const decision = activeOperationCard?.decisionLine?.trim();
  const pressure = activeOperationCard?.pressureLine?.trim();
  if (next) return next;
  if (decision) return decision;
  if (pressure) return pressure;
  return 'Ekip yükünü dengele, rota desteği planla';
}

export function hasActiveOperationForObservation(
  activeEvents: readonly EventCard[],
  presentation?: Pick<CenterHomeCoreSections, 'activeTarget'> | null,
): boolean {
  if (activeEvents.length > 0) return true;
  const status = presentation?.activeTarget.status;
  return status === 'ready' || status === 'in_progress';
}

export function buildMapObservationPresentationModel(input: {
  activeEvent?: EventCard | null;
  activeOperationCard?: ActiveOperationMapCardModel | null;
  focusDistrictId?: MapDistrictId | string | null;
  energyRemaining?: number;
  energyMax?: number;
}): MapObservationPresentationModel {
  const districtId = resolveDistrictId(input.activeEvent, input.focusDistrictId);
  const region = CITY_DISTRICT_REGIONS.find((entry) => entry.id === districtId);
  const scanCenter = region?.label ?? { x: 0.44, y: 0.3 };
  const districtName = districtLabel(districtId);
  const issueTitle =
    input.activeOperationCard?.title?.trim() ||
    input.activeEvent?.title?.trim() ||
    DEFAULT_ISSUE_TITLE;

  return {
    targetDistrictId: districtId,
    targetDistrictName: districtName,
    activeIssueTitle: issueTitle,
    initialConfidence: 42,
    finalConfidence: 86,
    hotSpotCount: 4,
    resultType: 'verified_risk',
    mainRisk: inferMainRisk(input.activeOperationCard, input.activeEvent),
    recommendedAction: inferRecommendedAction(input.activeOperationCard),
    expectedEffects: {
      risk: '-12 potansiyel',
      trust: '+6',
      resource: '-8% kayıp önleme',
    },
    scanCenter,
    hotspots: buildHotspots(scanCenter, 4),
    energyRemaining: input.energyRemaining ?? 2,
    energyMax: input.energyMax ?? 3,
    scanCost: 1,
    resultChipLabel: 'Risk Doğrulandı',
    summaryLine:
      'Saha Gözü taraması, risk sinyalinin yüksek doğrulukla eşleştiğini gösteriyor.',
    applyRecommendationRoute: input.activeEvent?.id
      ? `/events/${input.activeEvent.id}`
      : '/events',
  };
}

export function buildMissionObserveHubPresentation(input: {
  activeEvents?: readonly EventCard[];
  presentation?: Pick<CenterHomeCoreSections, 'activeTarget'> | null;
  districtName?: string;
}): MissionObserveHubPresentation {
  const hasActive = hasActiveOperationForObservation(
    input.activeEvents ?? [],
    input.presentation,
  );
  const events = input.activeEvents ?? [];
  const districtName =
    input.districtName?.trim() ||
    (events[0] ? districtLabel(resolveDistrictId(events[0])) : DEFAULT_DISTRICT_NAME);

  return {
    actionKey: MISSION_OBSERVE_AREA_ACTION_KEY,
    title: 'Bölgeyi Gözlemle',
    subtitle: hasActive
      ? 'Drone destekli risk doğrulama'
      : 'Gözlem için aktif operasyon gerekli.',
    route: MISSION_OBSERVE_AREA_ROUTE,
    iconKey: 'scan-outline',
    disabled: !hasActive,
    disabledReason: hasActive ? undefined : 'Gözlem için aktif operasyon gerekli.',
    accessibilityLabel: hasActive
      ? `${districtName} risk doğrulaması başlat`
      : 'Gözlem için aktif operasyon gerekli',
  };
}

export function observationScanStatusLine(
  mode: MapObservationModeState,
  scanningPhase: number,
): string {
  if (mode === 'blocked') return 'Gözlem için aktif operasyon gerekli.';
  if (mode === 'cooldown') return 'Saha Gözü yeniden hazırlanıyor.';
  if (mode === 'insufficient_energy') return 'Saha Gözü enerjisi yetersiz.';
  if (mode === 'completed') return 'Risk doğrulandı';
  if (mode === 'scanning') {
    if (scanningPhase === 0) return 'Sinyal doğrulanıyor';
    if (scanningPhase === 1) return 'Risk kaynağı analiz ediliyor';
    return 'Mahalle yoğunluğu taranıyor';
  }
  return 'Saha Gözü hazır';
}
