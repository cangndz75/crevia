import { CONTAINER_OVERFLOW_RISK_PRIORITY } from './containerConstants';
import {
  normalizeContainerNeighborhoodId,
  toDisplayContainerNeighborhoodName,
} from './containerNeighborhoodBridge';
import { createInitialContainerState } from './containerSeed';
import type {
  ContainerNeighborhoodId,
  ContainerState,
  ContainerUnit,
  NeighborhoodContainerRecommendedAction,
  NeighborhoodContainerStatus,
} from './containerTypes';

function compareNeighborhoodRisk(
  a: NeighborhoodContainerStatus,
  b: NeighborhoodContainerStatus,
): number {
  if (b.criticalContainerCount !== a.criticalContainerCount) {
    return b.criticalContainerCount - a.criticalContainerCount;
  }

  const riskDelta =
    CONTAINER_OVERFLOW_RISK_PRIORITY[b.worstOverflowRisk] -
    CONTAINER_OVERFLOW_RISK_PRIORITY[a.worstOverflowRisk];
  if (riskDelta !== 0) {
    return riskDelta;
  }

  if (b.complaintPressure !== a.complaintPressure) {
    return b.complaintPressure - a.complaintPressure;
  }

  return b.averageFillRate - a.averageFillRate;
}

export function selectContainerState(
  containerState: ContainerState | undefined,
): ContainerState {
  return containerState ?? createInitialContainerState(1);
}

export function selectContainerUnitsByNeighborhood(
  state: ContainerState,
  neighborhoodId: string | undefined | null,
): ContainerUnit[] {
  const resolvedId = normalizeContainerNeighborhoodId(neighborhoodId);
  if (!resolvedId) {
    return [];
  }
  return state.units.filter((unit) => unit.neighborhoodId === resolvedId);
}

export function selectNeighborhoodContainerStatus(
  state: ContainerState,
  neighborhoodId: string | undefined | null,
): NeighborhoodContainerStatus | null {
  const resolvedId = normalizeContainerNeighborhoodId(neighborhoodId);
  if (!resolvedId) {
    return null;
  }
  return state.aggregates[resolvedId] ?? null;
}

export function selectWorstContainerNeighborhood(
  state: ContainerState,
): NeighborhoodContainerStatus | null {
  const statuses = Object.values(state.aggregates).filter(
    (status) => status.activeContainerCount > 0,
  );

  if (statuses.length === 0) {
    return null;
  }

  return [...statuses].sort(compareNeighborhoodRisk)[0] ?? null;
}

function buildHubDetail(status: NeighborhoodContainerStatus): string {
  if (status.statusLabel === 'Kritik') {
    return `${status.criticalContainerCount} noktada kritik baskı`;
  }
  if (status.statusLabel === 'Yüksek') {
    return `Yüksek baskı · ortalama doluluk %${Math.round(status.averageFillRate)}`;
  }
  if (status.statusLabel === 'Baskılı') {
    return 'Atık baskısı artıyor';
  }
  if (status.statusLabel === 'Takipte') {
    return `Takipte · ortalama doluluk %${Math.round(status.averageFillRate)}`;
  }
  return `Ortalama doluluk %${Math.round(status.averageFillRate)}`;
}

function severityFromStatus(
  status: NeighborhoodContainerStatus,
): 'low' | 'medium' | 'high' | 'critical' {
  if (status.statusLabel === 'Kritik') {
    return 'critical';
  }
  if (
    status.statusLabel === 'Yüksek' ||
    status.worstOverflowRisk === 'critical'
  ) {
    return 'high';
  }
  if (status.statusLabel === 'Baskılı' || status.statusLabel === 'Takipte') {
    return 'medium';
  }
  return 'low';
}

export function selectHubContainerSignal(
  state: ContainerState,
  neighborhoodId?: string | null,
): {
  neighborhoodId: ContainerNeighborhoodId;
  label: string;
  detail: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: NeighborhoodContainerRecommendedAction;
} | null {
  const status = neighborhoodId
    ? selectNeighborhoodContainerStatus(state, neighborhoodId)
    : selectWorstContainerNeighborhood(state);

  if (!status || status.activeContainerCount === 0) {
    return null;
  }

  return {
    neighborhoodId: status.neighborhoodId,
    label: status.statusLabel,
    detail: buildHubDetail(status),
    severity: severityFromStatus(status),
    recommendedAction: status.recommendedAction,
  };
}

const ADVISOR_LINES: Record<
  NeighborhoodContainerRecommendedAction,
  string
> = {
  collect_now: 'Toplama öne alınırsa taşma baskısı düşer.',
  repair: 'Bakım ekibi gönderilmezse aynı nokta tekrar sorun çıkarabilir.',
  communicate:
    'Saha çözümü gecikecekse mahalleye bilgilendirme yapmak sosyal baskıyı azaltır.',
  inspect: 'Saha incelemesi yapılmazsa gizli risk büyüyebilir.',
  monitor: 'Durum dengeli, ancak doluluk eğilimi takip edilmeli.',
};

function selectWorstUnit(units: ContainerUnit[]): ContainerUnit | null {
  if (units.length === 0) {
    return null;
  }

  return [...units].sort((a, b) => {
    const riskDelta =
      CONTAINER_OVERFLOW_RISK_PRIORITY[b.overflowRisk] -
      CONTAINER_OVERFLOW_RISK_PRIORITY[a.overflowRisk];
    if (riskDelta !== 0) {
      return riskDelta;
    }
    return b.fillRate - a.fillRate;
  })[0] ?? null;
}

export function selectEventContainerContext(
  state: ContainerState,
  event: { neighborhoodId?: string; eventType?: string; title?: string },
): {
  status: NeighborhoodContainerStatus | null;
  worstUnit: ContainerUnit | null;
  advisorLine: string | null;
  detailLine: string | null;
} {
  const neighborhoodId =
    normalizeContainerNeighborhoodId(event.neighborhoodId) ??
    selectWorstContainerNeighborhood(state)?.neighborhoodId ??
    null;

  const status = neighborhoodId
    ? selectNeighborhoodContainerStatus(state, neighborhoodId)
    : null;

  const units = neighborhoodId
    ? selectContainerUnitsByNeighborhood(state, neighborhoodId)
    : [];

  const worstUnit = selectWorstUnit(units);

  const advisorLine = status
    ? (ADVISOR_LINES[status.recommendedAction] ?? null)
    : null;

  const detailLine = worstUnit
    ? `${worstUnit.location.locationLabel}: doluluk %${Math.round(worstUnit.fillRate)}, ${worstUnit.status === 'overflowing' ? 'taşma eğilimi' : 'izleniyor'}`
  : status
    ? `${toDisplayContainerNeighborhoodName(status.neighborhoodId)} — ${status.statusLabel}`
    : null;

  return {
    status,
    worstUnit,
    advisorLine,
    detailLine,
  };
}

export function selectContainerSummaryLines(state: ContainerState): string[] {
  const ranked = Object.values(state.aggregates)
    .filter((status) => status.activeContainerCount > 0)
    .sort(compareNeighborhoodRisk);

  const lines: string[] = [];

  for (const status of ranked) {
    if (lines.length >= 3) {
      break;
    }

    const name = toDisplayContainerNeighborhoodName(status.neighborhoodId);

    if (status.statusLabel === 'Kritik') {
      lines.push(
        `${name}'de ${status.criticalContainerCount} noktada kritik atık baskısı var.`,
      );
      continue;
    }

    if (status.statusLabel === 'Yüksek') {
      lines.push(`${name}'de atık baskısı yüksek; toplama önceliği önerilir.`);
      continue;
    }

    if (status.statusLabel === 'Baskılı') {
      lines.push(`${name}'de atık baskısı artıyor; saha takibi önerilir.`);
      continue;
    }

    if (status.statusLabel === 'Dengeli') {
      lines.push(`${name} konteyner durumu dengeli.`);
      continue;
    }

    lines.push(
      `${name}'de ${status.statusLabel.toLowerCase()} — ortalama doluluk %${Math.round(status.averageFillRate)}.`,
    );
  }

  return lines.slice(0, 3);
}
