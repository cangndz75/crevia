import type { ActiveOperationMapBinding } from '@/core/activeOperationMapBinding/activeOperationMapBindingTypes';
import type { ActiveOperationMapCardModel } from '@/core/activeOperationMapBinding';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard, EventRiskLevel } from '@/core/models/EventCard';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { SocialEchoPresentation } from '@/core/socialEcho';

import { buildDistrictMapPersonalityLabel } from '@/core/districtPersonality';

import { composeMapBottomPanelPresentation } from './mapBottomPanelPresentation';

export type MapGameplayMarkerType =
  | 'active_event'
  | 'urgent_signal'
  | 'resolved'
  | 'opportunity'
  | 'resource'
  | 'district'
  | 'operation';

export type MapGameplayMarkerSeverity = 'low' | 'medium' | 'high' | 'critical';

export type MapGameplayMarkerStatus = 'active' | 'pending' | 'resolved' | 'locked';

export type MapGameplayMarker = {
  id: string;
  type: MapGameplayMarkerType;
  title: string;
  subtitle: string;
  districtName?: string;
  severity: MapGameplayMarkerSeverity;
  status: MapGameplayMarkerStatus;
  coordinate: {
    x: number;
    y: number;
  };
  pulse?: boolean;
  ctaLabel?: string;
  eventId?: string;
  eventDetailRoute?: string;
  traitLabel?: string;
};

export type MapGameplayLayer = {
  id: string;
  label: string;
  isActive: boolean;
};

export type MapGameplayPresentation = {
  title: string;
  subtitle: string;
  defaultSelectedMarkerId: string | null;
  markers: MapGameplayMarker[];
  layers: MapGameplayLayer[];
};

export type MapBottomPanelMetric = {
  label: string;
  value: string;
};

export type MapBottomPanelChip = {
  key: string;
  label: string;
  value: string;
  tone: 'risk' | 'status' | 'crew' | 'neutral';
};

export type MapBottomPanelStatusTone =
  | 'active'
  | 'resolved'
  | 'inspect'
  | 'field'
  | 'urgent'
  | 'opportunity'
  | 'neutral';

import type { MapActionBundlePresentation } from '@/core/mapDirectAction';

export type MapBottomPanelPresentation = {
  markerId: string;
  navLabel: string;
  sourcePillLabel: string;
  statusLabel: string;
  statusTone: MapBottomPanelStatusTone;
  title: string;
  contextLine: string;
  summaryLine: string;
  socialEcho?: SocialEchoPresentation;
  subtitle: string;
  districtName?: string;
  chips: MapBottomPanelChip[];
  metrics: MapBottomPanelMetric[];
  expandedLines: string[];
  footerContextLabel: string;
  footerContextValue: string;
  tacticalMicroLine?: string;
  layerHintLine?: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  primaryRoute?: string;
  actionBundle?: MapActionBundlePresentation;
};

export type BuildMapGameplayPresentationInput = {
  activeEvents: EventCard[];
  activeOperationCard: ActiveOperationMapCardModel | null;
  activeOperationBinding: ActiveOperationMapBinding | null;
  gameDay: number;
  operationalResources: OperationalResourcesState;
  decisionHistory: DecisionRecord[];
};

const MARKER_COORDINATES: Record<string, { x: number; y: number }> = {
  merkez: { x: 52, y: 44 },
  cumhuriyet: { x: 36, y: 58 },
  sanayi: { x: 64, y: 63 },
  yesilvadi: { x: 28, y: 52 },
  istasyon: { x: 72, y: 28 },
  gunesTepe: { x: 68, y: 38 },
};

const DEFAULT_LAYERS: MapGameplayLayer[] = [
  { id: 'events', label: 'Olaylar', isActive: true },
  { id: 'risk', label: 'Risk', isActive: true },
  { id: 'opportunity', label: 'Fırsat', isActive: false },
  { id: 'crew', label: 'Ekip', isActive: false },
  { id: 'route', label: 'Rota', isActive: false },
];

function riskToSeverity(risk: EventRiskLevel): MapGameplayMarkerSeverity {
  if (risk === 'critical') return 'critical';
  if (risk === 'high') return 'high';
  if (risk === 'medium') return 'medium';
  return 'low';
}

function markerFromEvent(
  event: EventCard,
  type: MapGameplayMarkerType,
  coordKey: keyof typeof MARKER_COORDINATES,
  options?: Partial<MapGameplayMarker>,
): MapGameplayMarker {
  const coord = MARKER_COORDINATES[coordKey];
  return {
    id: `marker-event-${event.id}`,
    type,
    title: event.title,
    subtitle: event.description,
    districtName: event.district,
    severity: riskToSeverity(event.riskLevel),
    status: 'active',
    coordinate: coord,
    pulse: type === 'active_event',
    ctaLabel: 'Operasyonu Aç',
    eventId: event.id,
    eventDetailRoute: `/events/${event.id}`,
    ...options,
  };
}

function buildFallbackMarkers(
  activeOperationCard: ActiveOperationMapCardModel | null,
): MapGameplayMarker[] {
  const operationTitle =
    activeOperationCard?.title ?? 'Cumhuriyet Ekibi Hazırlanıyor';
  const operationSubtitle =
    activeOperationCard?.mapLine ?? 'Bu bölgede ilk müdahale başlıyor.';

  return [
    {
      id: 'marker-active-fallback',
      type: 'active_event',
      title: operationTitle,
      subtitle: operationSubtitle,
      districtName: activeOperationCard?.districtLine ?? 'Cumhuriyet Mahallesi',
      severity: 'high',
      status: 'active',
      coordinate: MARKER_COORDINATES.cumhuriyet,
      pulse: true,
      ctaLabel: 'Operasyonu Aç',
    },
    {
      id: 'marker-urgent-fallback',
      type: 'urgent_signal',
      title: 'Trafik Akışı Aksıyor',
      subtitle: 'Atatürk Bulvarı üzerinde yoğunluk artıyor.',
      districtName: 'Atatürk Bulvarı',
      severity: 'medium',
      status: 'pending',
      coordinate: MARKER_COORDINATES.sanayi,
      pulse: false,
    },
    {
      id: 'marker-resolved-fallback',
      type: 'resolved',
      title: 'Park Güvenliği Toparlandı',
      subtitle: 'İnönü Parkı bölgesinde düzen sağlandı.',
      districtName: 'İnönü Parkı',
      severity: 'low',
      status: 'resolved',
      coordinate: MARKER_COORDINATES.yesilvadi,
    },
    {
      id: 'marker-opportunity-fallback',
      type: 'opportunity',
      title: 'Fırsat Sinyali Belirdi',
      subtitle: 'Güneştepe bölgesinde toparlanma fırsatı var.',
      districtName: 'Güneştepe',
      severity: 'low',
      status: 'pending',
      coordinate: MARKER_COORDINATES.gunesTepe,
    },
    {
      id: 'marker-resource-merkez',
      type: 'resource',
      title: 'Merkez',
      subtitle: 'Ekip ve kaynak noktası',
      districtName: 'Merkez',
      severity: 'low',
      status: 'active',
      coordinate: MARKER_COORDINATES.merkez,
      ctaLabel: 'Merkeze Git',
    },
  ];
}

function buildMarkersFromGameState(input: BuildMapGameplayPresentationInput): MapGameplayMarker[] {
  const markers: MapGameplayMarker[] = [];
  const seenIds = new Set<string>();

  const pushMarker = (marker: MapGameplayMarker) => {
    if (seenIds.has(marker.id)) return;
    seenIds.add(marker.id);
    markers.push(marker);
  };

  const sortedEvents = [...input.activeEvents].sort((a, b) => {
    const score = (event: EventCard) => {
      let value = 0;
      if (event.riskLevel === 'critical') value += 100;
      else if (event.riskLevel === 'high') value += 80;
      else if (event.riskLevel === 'medium') value += 40;
      value += Math.max(0, 24 - event.urgencyHours);
      return value;
    };
    return score(b) - score(a);
  });

  const primary = sortedEvents[0];
  if (primary) {
    pushMarker(
      markerFromEvent(primary, 'active_event', 'cumhuriyet', {
        pulse: true,
        eventDetailRoute:
          input.activeOperationBinding?.eventDetailRoute ?? `/events/${primary.id}`,
      }),
    );
  }

  const urgent = sortedEvents.find(
    (event) => event.id !== primary?.id && event.urgencyHours <= 6,
  );
  if (urgent) {
    pushMarker(markerFromEvent(urgent, 'urgent_signal', 'sanayi'));
  }

  const opportunity = sortedEvents.find((event) =>
    event.filterTags?.includes('opportunity'),
  );
  if (opportunity && opportunity.id !== primary?.id) {
    pushMarker(markerFromEvent(opportunity, 'opportunity', 'gunesTepe'));
  }

  const resolvedRecord = input.decisionHistory.at(-1);
  if (resolvedRecord) {
    pushMarker({
      id: `marker-resolved-${resolvedRecord.id}`,
      type: 'resolved',
      title: resolvedRecord.eventTitle,
      subtitle: 'Operasyon tamamlandı',
      districtName: resolvedRecord.neighborhoodName ?? resolvedRecord.neighborhoodId,
      severity: 'low',
      status: 'resolved',
      coordinate: MARKER_COORDINATES.yesilvadi,
    });
  }

  pushMarker({
    id: 'marker-district-merkez',
    type: 'district',
    title: 'Merkez',
    subtitle: 'Ekip ve kaynak noktası',
    districtName: 'Merkez',
    traitLabel:
      buildDistrictMapPersonalityLabel({
        districtId: 'merkez',
        districtName: 'Merkez',
      }) ?? undefined,
    severity: 'low',
    status: 'active',
    coordinate: MARKER_COORDINATES.merkez,
    ctaLabel: 'Merkeze Git',
  });

  if (markers.filter((m) => m.type !== 'district').length < 4) {
    for (const fallback of buildFallbackMarkers(input.activeOperationCard)) {
      if (markers.length >= 6) break;
      if (!seenIds.has(fallback.id)) {
        pushMarker(fallback);
      }
    }
  }

  return markers.slice(0, 8);
}

export function buildMapGameplayPresentation(
  input: BuildMapGameplayPresentationInput,
): MapGameplayPresentation {
  const markers = buildMarkersFromGameState(input);
  const defaultSelectedMarkerId =
    markers.find((marker) => marker.type === 'active_event')?.id ??
    markers.find((marker) => marker.status === 'active')?.id ??
    markers[0]?.id ??
    null;

  return {
    title: 'Şehir Haritası',
    subtitle: 'Canlı taktik görünüm',
    defaultSelectedMarkerId,
    markers,
    layers: DEFAULT_LAYERS,
  };
}


export function buildMapBottomPanelPresentation(
  marker: MapGameplayMarker,
  input: {
    activeOperationCard: ActiveOperationMapCardModel | null;
    activeOperationBinding: ActiveOperationMapBinding | null;
    activeEventCount: number;
    operationalResources: OperationalResourcesState;
    activeEvents?: EventCard[];
    recentDecisionRecord?: DecisionRecord | null;
    gameDay?: number;
    navIndex?: number;
    navTotal?: number;
  },
): MapBottomPanelPresentation {
  return composeMapBottomPanelPresentation({
    marker,
    navIndex: input.navIndex ?? 0,
    navTotal: input.navTotal ?? 1,
    activeOperationCard: input.activeOperationCard,
    activeOperationBinding: input.activeOperationBinding,
    activeEventCount: input.activeEventCount,
    operationalResources: input.operationalResources,
    activeEvents: input.activeEvents,
    recentDecisionRecord: input.recentDecisionRecord,
    gameDay: input.gameDay,
  });
}

export function findMapGameplayMarker(
  markers: MapGameplayMarker[],
  markerId: string | null,
  fallbackId: string | null,
): MapGameplayMarker | null {
  if (markerId) {
    const selected = markers.find((marker) => marker.id === markerId);
    if (selected) return selected;
  }
  if (fallbackId) {
    return markers.find((marker) => marker.id === fallbackId) ?? null;
  }
  return markers[0] ?? null;
}

export function mapMarkerCoordinateToPoint(coordinate: {
  x: number;
  y: number;
}): { x: number; y: number } {
  return {
    x: (coordinate.x / 100) * 1000,
    y: (coordinate.y / 100) * 1000,
  };
}
