import { toDisplayContainerNeighborhoodName } from './containerNeighborhoodBridge';
import { isContainerRelevantEvent } from './containerDecisionEffects';
import { selectContainerSummaryLines } from './containerSelectors';
import type {
  ContainerNeighborhoodId,
  ContainerState,
  ContainerUnit,
  NeighborhoodContainerRecommendedAction,
  NeighborhoodContainerStatus,
  NeighborhoodContainerStatusLabel,
} from './containerTypes';

export type ContainerUiTone = {
  background: string;
  border: string;
  text: string;
  muted: string;
  iconBackground: string;
  iconColor: string;
};

const SEVERITY_TONES: Record<
  'low' | 'medium' | 'high' | 'critical',
  ContainerUiTone
> = {
  low: {
    background: '#E8F7F0',
    border: 'rgba(59, 175, 122, 0.28)',
    text: '#1F5E45',
    muted: '#4A7D66',
    iconBackground: 'rgba(59, 175, 122, 0.18)',
    iconColor: '#2F9B6A',
  },
  medium: {
    background: '#FDF4E6',
    border: 'rgba(232, 155, 46, 0.35)',
    text: '#6B4A12',
    muted: '#8A6A2E',
    iconBackground: 'rgba(232, 155, 46, 0.2)',
    iconColor: '#C8841A',
  },
  high: {
    background: '#FFF3E8',
    border: 'rgba(217, 147, 61, 0.4)',
    text: '#7A4518',
    muted: '#9A5E28',
    iconBackground: 'rgba(217, 147, 61, 0.22)',
    iconColor: '#D9933D',
  },
  critical: {
    background: '#FDEEED',
    border: 'rgba(224, 90, 82, 0.35)',
    text: '#7A2E28',
    muted: '#9A4A44',
    iconBackground: 'rgba(224, 90, 82, 0.18)',
    iconColor: '#D95F50',
  },
};

export function formatContainerRecommendedAction(
  action: NeighborhoodContainerRecommendedAction,
): string {
  const labels: Record<NeighborhoodContainerRecommendedAction, string> = {
    collect_now: 'Toplama Önerilir',
    repair: 'Bakım Önerilir',
    communicate: 'Bilgilendir',
    inspect: 'Kontrol Et',
    monitor: 'İzle',
  };
  return labels[action];
}

export function getContainerSeverityTone(
  severity: 'low' | 'medium' | 'high' | 'critical',
): ContainerUiTone {
  return SEVERITY_TONES[severity];
}

export function mapContainerSeverityFromStatus(
  status: NeighborhoodContainerStatus,
): 'low' | 'medium' | 'high' | 'critical' {
  if (status.statusLabel === 'Kritik') {
    return 'critical';
  }
  if (
    status.statusLabel === 'Taşma Riski' ||
    status.worstOverflowRisk === 'critical'
  ) {
    return 'high';
  }
  if (
    status.statusLabel === 'Koku Baskısı' ||
    status.statusLabel === 'Bakım Gerekli' ||
    status.statusLabel === 'Doluluk Artıyor'
  ) {
    return 'medium';
  }
  return 'low';
}

export function getContainerStatusTone(
  statusLabel: NeighborhoodContainerStatusLabel,
): ContainerUiTone {
  switch (statusLabel) {
    case 'Kritik':
      return SEVERITY_TONES.critical;
    case 'Taşma Riski':
      return SEVERITY_TONES.high;
    case 'Koku Baskısı':
    case 'Bakım Gerekli':
    case 'Doluluk Artıyor':
      return SEVERITY_TONES.medium;
    default:
      return SEVERITY_TONES.low;
  }
}

export function buildHubContainerDetail(
  neighborhoodId: ContainerNeighborhoodId,
  detail: string,
): string {
  const name = toDisplayContainerNeighborhoodName(neighborhoodId);
  if (detail.includes(name)) {
    return detail;
  }
  const normalized = detail.charAt(0).toLowerCase() + detail.slice(1);
  return `${name}'de ${normalized}`;
}

export function buildEventContainerMainLine(
  status: NeighborhoodContainerStatus,
  worstUnit: ContainerUnit | null,
): string {
  const name = toDisplayContainerNeighborhoodName(status.neighborhoodId);
  if (worstUnit) {
    return `${name}'de ortalama doluluk %${Math.round(status.averageFillRate)}, en riskli nokta ${worstUnit.location.locationLabel}.`;
  }
  return `${name}'de ${status.statusLabel.toLowerCase()} — ortalama doluluk %${Math.round(status.averageFillRate)}.`;
}

export function buildEventContainerRiskLine(worstUnit: ContainerUnit): string {
  return `En yakın risk: ${worstUnit.location.locationLabel} · Doluluk %${Math.round(worstUnit.fillRate)}`;
}

export function buildNeighborhoodContainerHint(
  status: NeighborhoodContainerStatus,
): string {
  return `Bu mahallede atık durumu: ${status.statusLabel}`;
}

export function mergeAdvisorWithContainerLine(
  baseAdvisor: string,
  containerLine: string | null,
  includeContainer: boolean,
): string {
  if (!includeContainer || !containerLine?.trim()) {
    return baseAdvisor;
  }

  const base = baseAdvisor.trim();
  const extra = containerLine.trim();
  const combined = `${base} ${extra}`;
  const maxLen = 160;

  if (combined.length <= maxLen) {
    return combined;
  }

  const reserved = extra.length + 4;
  const maxBase = maxLen - reserved;
  if (maxBase > 48) {
    return `${base.slice(0, maxBase).trim()}… ${extra}`;
  }

  return extra;
}

const CALM_CONTAINER_REPORT_LINE = 'Atık operasyonu dengeli seyrini korudu.';

function polishContainerReportLine(status: NeighborhoodContainerStatus): string {
  const name = toDisplayContainerNeighborhoodName(status.neighborhoodId);

  if (status.criticalContainerCount > 0) {
    return `${name}'de taşma riski yüksek; toplama rotası öneriliyor.`;
  }

  switch (status.statusLabel) {
    case 'Koku Baskısı':
      return `${name}'de koku baskısı takip edilmeli.`;
    case 'Bakım Gerekli':
      return `${name}'de bakım ihtiyacı artıyor.`;
    case 'Taşma Riski':
    case 'Kritik':
      return `${name}'de taşma riski yüksek; toplama rotası öneriliyor.`;
    case 'Doluluk Artıyor':
      return `${name}'de doluluk artıyor; rota takibi önerilir.`;
    case 'Dengeli':
      return `${name} dengeli seyrini korudu.`;
  }
}

/** Gün sonu raporu için 1–3 operasyonel satır (gün kapanışı container state). */
export function buildDailyContainerSummaryLines(
  containerState: ContainerState | undefined,
  day?: number,
): string[] | undefined {
  if (!containerState) {
    return undefined;
  }

  const activeStatuses = Object.values(containerState.aggregates).filter(
    (status) => status.activeContainerCount > 0,
  );

  if (activeStatuses.length === 0) {
    return undefined;
  }

  const elevated = activeStatuses.filter(
    (status) => status.statusLabel !== 'Dengeli',
  );

  if (elevated.length === 0) {
    return [CALM_CONTAINER_REPORT_LINE];
  }

  const maxLines = day === 1 ? 1 : 3;
  const lines: string[] = [];

  if (day !== 1 && elevated.length >= 2) {
    lines.push(`${elevated.length} mahallede atık baskısı yükseldi.`);
  }

  const ranked = [...elevated].sort((a, b) => {
    if (b.criticalContainerCount !== a.criticalContainerCount) {
      return b.criticalContainerCount - a.criticalContainerCount;
    }
    return b.averageFillRate - a.averageFillRate;
  });

  for (const status of ranked) {
    if (lines.length >= maxLines) {
      break;
    }
    const line = polishContainerReportLine(status);
    if (!lines.includes(line)) {
      lines.push(line);
    }
  }

  if (lines.length === 0) {
    const fallback = selectContainerSummaryLines(containerState).slice(0, maxLines);
    return fallback.length > 0 ? fallback : [CALM_CONTAINER_REPORT_LINE];
  }

  return lines.slice(0, maxLines);
}

export function resolveEventContainerVisibility(
  event: {
    id: string;
    title?: string;
    category?: string;
    eventType?: string;
    neighborhoodId?: string;
    tags?: string[];
    filterTags?: string[];
  },
  status: NeighborhoodContainerStatus | null,
): { visible: boolean; compact: boolean } {
  const relevant = isContainerRelevantEvent({
    id: event.id,
    title: event.title ?? '',
    category: event.category,
    eventType: event.eventType,
    neighborhoodId: event.neighborhoodId,
    tags: event.tags ?? event.filterTags,
  });

  if (!status || status.activeContainerCount === 0) {
    return { visible: relevant, compact: false };
  }

  if (relevant) {
    return { visible: true, compact: false };
  }

  if (status.statusLabel === 'Dengeli') {
    return { visible: false, compact: false };
  }

  return { visible: true, compact: true };
}
