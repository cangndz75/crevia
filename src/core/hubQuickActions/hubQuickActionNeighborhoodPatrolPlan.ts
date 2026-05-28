import type { ContainerState } from '@/core/containers/containerTypes';
import { selectWorstContainerNeighborhood } from '@/core/containers/containerSelectors';
import type { EventCard } from '@/core/models/EventCard';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { selectNeighborhoodSocialRisks } from '@/core/social/socialSelectors';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { eventSeverity } from '@/core/utils/eventPriority';

import type {
  NeighborhoodPatrolAssignment,
  NeighborhoodPatrolFocus,
  NeighborhoodPatrolSignal,
  NeighborhoodPatrolSignalCategory,
  NeighborhoodPatrolSignalTone,
  NeighborhoodPatrolSource,
} from './hubQuickActionTypes';

export type NeighborhoodPatrolPlanContext = {
  activeEvents: EventCard[];
  neighborhoods: Neighborhood[];
  containerState?: ContainerState;
  socialPulseState?: SocialPulseState;
  vehicleState?: VehicleState;
};

const COMPLAINT_KEYWORDS = [
  'şikayet',
  'sikayet',
  'vatandaş',
  'vatandas',
  'güven',
  'guven',
  'memnuniyet',
  'complaint',
] as const;

const SOCIAL_KEYWORDS = [
  'sosyal',
  'gündem',
  'gundem',
  'medya',
  'viral',
  'söylenti',
  'soylenti',
] as const;

const ROUTE_KEYWORDS = [
  'rota',
  'araç',
  'arac',
  'filo',
  'gecikme',
  'route',
  'vehicle',
] as const;

const CONTAINER_KEYWORDS = [
  'çöp',
  'cop',
  'atık',
  'atik',
  'konteyner',
  'doluluk',
  'waste',
] as const;

function normalizeHaystack(...parts: Array<string | undefined>): string {
  return parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .join(' ')
    .toLowerCase();
}

function includesAny(haystack: string, keywords: readonly string[]): boolean {
  return keywords.some((kw) => haystack.includes(kw));
}

function resolveNeighborhoodId(
  rawId: string | undefined,
  districtName: string | undefined,
  neighborhoods: Neighborhood[],
): string | undefined {
  if (rawId) {
    const byId = neighborhoods.find((n) => n.id === rawId);
    if (byId) return byId.id;
  }
  if (districtName) {
    const byName = neighborhoods.find((n) => n.name === districtName);
    if (byName) return byName.id;
    if (neighborhoods.some((n) => n.id === districtName)) return districtName;
  }
  return rawId;
}

function pickPrimaryEvent(activeEvents: EventCard[]): EventCard | null {
  if (activeEvents.length === 0) return null;
  return [...activeEvents].sort((a, b) => eventSeverity(b) - eventSeverity(a))[0] ?? null;
}

function pickSocialPressureNeighborhood(
  socialPulseState: SocialPulseState | undefined,
): string | null {
  const risks = socialPulseState ? selectNeighborhoodSocialRisks(socialPulseState) : [];
  const worst = risks.at(-1);
  if (
    worst &&
    (worst.riskLevel === 'critical' ||
      worst.riskLevel === 'high' ||
      worst.score >= 55)
  ) {
    return worst.neighborhoodId;
  }
  return null;
}

function pickVehiclePressureNeighborhood(
  vehicleState: VehicleState | undefined,
): string | null {
  if (!vehicleState) return null;
  const ranked = [...vehicleState.units]
    .filter((u) => u.operationalStatus !== 'broken')
    .sort(
      (a, b) =>
        b.breakdownRisk +
        b.workload +
        b.maintenanceNeed -
        (a.breakdownRisk + a.workload + a.maintenanceNeed),
    );
  return ranked[0]?.currentNeighborhoodId ?? ranked[0]?.homeNeighborhoodId ?? null;
}

function fallbackNeighborhoodId(neighborhoods: Neighborhood[]): string | null {
  if (neighborhoods.length === 0) return null;
  const merkez = neighborhoods.find((n) => n.id === 'merkez');
  return merkez?.id ?? neighborhoods[0]!.id;
}

function inferPatrolFocusFromHaystack(haystack: string): NeighborhoodPatrolFocus {
  if (includesAny(haystack, CONTAINER_KEYWORDS)) return 'container_check';
  if (includesAny(haystack, COMPLAINT_KEYWORDS)) return 'complaint_check';
  if (includesAny(haystack, ROUTE_KEYWORDS)) return 'route_check';
  if (includesAny(haystack, SOCIAL_KEYWORDS)) return 'social_check';
  return 'general_check';
}

function resolvePatrolFocus(
  source: NeighborhoodPatrolSource,
  primaryEvent: EventCard | null,
  containerPressure: boolean,
): NeighborhoodPatrolFocus {
  if (source === 'container_pressure' || containerPressure) {
    return 'container_check';
  }
  if (source === 'social_pressure') {
    return 'social_check';
  }
  if (source === 'vehicle_pressure') {
    return 'route_check';
  }
  if (primaryEvent) {
    const haystack = normalizeHaystack(
      primaryEvent.title,
      primaryEvent.description,
      primaryEvent.category,
      primaryEvent.eventType,
      primaryEvent.contextTag,
      primaryEvent.decisions[0]?.title,
      primaryEvent.decisions[0]?.description,
    );
    const inferred = inferPatrolFocusFromHaystack(haystack);
    if (inferred !== 'general_check') return inferred;
    if (includesAny(haystack, COMPLAINT_KEYWORDS)) return 'complaint_check';
  }
  return 'general_check';
}

function signalToneForFocus(
  focus: NeighborhoodPatrolFocus,
): NeighborhoodPatrolSignalTone {
  switch (focus) {
    case 'container_check':
    case 'route_check':
      return 'warning';
    case 'social_check':
      return 'info';
    case 'complaint_check':
      return 'warning';
    case 'general_check':
    default:
      return 'positive';
  }
}

function signalCategoryForFocus(
  focus: NeighborhoodPatrolFocus,
): NeighborhoodPatrolSignalCategory {
  switch (focus) {
    case 'container_check':
      return 'container';
    case 'complaint_check':
      return 'complaint';
    case 'route_check':
      return 'route';
    case 'social_check':
      return 'social';
    case 'general_check':
    default:
      return 'general';
  }
}

function buildSignalBody(
  focus: NeighborhoodPatrolFocus,
  neighborhoodLabel: string,
): string {
  switch (focus) {
    case 'container_check':
      return `${neighborhoodLabel} çevresinde konteyner yoğunluğu erken fark edildi.`;
    case 'complaint_check':
      return `${neighborhoodLabel} içinde vatandaş şikayetleri aynı noktada kümeleniyor.`;
    case 'route_check':
      return `${neighborhoodLabel} rotasında kısa süreli saha gecikmesi riski görüldü.`;
    case 'social_check':
      return `${neighborhoodLabel} gündeminde hassasiyet artışı gözlendi.`;
    case 'general_check':
    default:
      return `${neighborhoodLabel} için kısa saha kontrolü tamamlandı.`;
  }
}

export function buildNeighborhoodPatrolSignal(
  day: number,
  neighborhoodId: string,
  neighborhoodLabel: string,
  focus: NeighborhoodPatrolFocus,
): NeighborhoodPatrolSignal {
  return {
    id: `patrol-signal-${day}-${neighborhoodId}`,
    day,
    neighborhoodId,
    title: 'Saha turu sinyali',
    body: buildSignalBody(focus, neighborhoodLabel),
    tone: signalToneForFocus(focus),
    category: signalCategoryForFocus(focus),
  };
}

export function buildNeighborhoodPatrolAssignment(
  context: NeighborhoodPatrolPlanContext,
  currentDay: number,
): NeighborhoodPatrolAssignment | null {
  const { activeEvents, neighborhoods, containerState, socialPulseState, vehicleState } =
    context;

  if (neighborhoods.length === 0) {
    return null;
  }

  let targetNeighborhoodId: string | undefined;
  let source: NeighborhoodPatrolSource = 'fallback';
  let containerPressure = false;

  const primaryEvent = pickPrimaryEvent(activeEvents);
  if (primaryEvent) {
    const resolved = resolveNeighborhoodId(
      primaryEvent.neighborhoodId,
      primaryEvent.district,
      neighborhoods,
    );
    if (resolved) {
      targetNeighborhoodId = resolved;
      source = 'active_event';
    }
  }

  if (!targetNeighborhoodId) {
    const containerWorst = containerState
      ? selectWorstContainerNeighborhood(containerState)
      : null;
    if (containerWorst) {
      targetNeighborhoodId = containerWorst.neighborhoodId;
      source = 'container_pressure';
      containerPressure = true;
    }
  }

  if (!targetNeighborhoodId) {
    const socialWorst = pickSocialPressureNeighborhood(socialPulseState);
    if (socialWorst) {
      targetNeighborhoodId = socialWorst;
      source = 'social_pressure';
    }
  }

  if (!targetNeighborhoodId) {
    const vehicleWorst = pickVehiclePressureNeighborhood(vehicleState);
    if (vehicleWorst) {
      targetNeighborhoodId = vehicleWorst;
      source = 'vehicle_pressure';
    }
  }

  if (!targetNeighborhoodId) {
    targetNeighborhoodId = fallbackNeighborhoodId(neighborhoods) ?? undefined;
    source = 'fallback';
  }

  if (!targetNeighborhoodId) {
    return null;
  }

  const neighborhood =
    neighborhoods.find((n) => n.id === targetNeighborhoodId) ??
    neighborhoods.find((n) => n.name === targetNeighborhoodId);
  const targetNeighborhoodLabel =
    neighborhood?.name ?? targetNeighborhoodId ?? 'Merkez';

  const patrolFocus = resolvePatrolFocus(source, primaryEvent, containerPressure);
  const revealedSignal = buildNeighborhoodPatrolSignal(
    currentDay,
    targetNeighborhoodId,
    targetNeighborhoodLabel,
    patrolFocus,
  );

  const label = `${targetNeighborhoodLabel} — saha turu`;
  const effectLabel = `${targetNeighborhoodLabel} keşif`;

  return {
    day: currentDay,
    targetNeighborhoodId,
    targetNeighborhoodLabel,
    patrolFocus,
    source,
    label,
    effectLabel,
    revealedSignal,
  };
}

export function buildNeighborhoodPatrolResultLines(
  assignment: NeighborhoodPatrolAssignment,
): { resultLine: string; detailLine: string } {
  const neighborhood = assignment.targetNeighborhoodLabel;
  const signalHint = assignment.revealedSignal?.body;
  return {
    resultLine: `Mahalle Turu tamamlandı: ${neighborhood}’de saha sinyali netleşti.`,
    detailLine:
      signalHint ??
      'Eşleşen mahalle kararlarında ek saha bilgisi gösterilir.',
  };
}
