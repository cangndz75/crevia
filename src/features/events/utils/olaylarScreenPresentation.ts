import type { ImageSourcePropType } from 'react-native';

import { eventImages } from '@/core/assets/eventScreenAssets';
import { formatUrgencyLabel, getRiskLevelLabel } from '@/core/content/mockGameData';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { EventCard, EventRiskLevel } from '@/core/models/EventCard';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import { getEventHeroImage } from '@/features/events/utils/eventAssets';
import {
  buildPremiumPreviewChips,
  deriveAffectedPopulation,
} from '@/features/events/utils/eventUiHelpers';
import { olaylar } from '@/features/events/theme/olaylarScreenTokens';
import type {
  OlaylarActiveEventView,
  OlaylarEventStatItem,
  OlaylarEventStats,
  OlaylarFieldStatusView,
  OlaylarFilterKey,
  OlaylarLiveIncidentMapView,
  OlaylarLiveMapPin,
  OlaylarOperationStatusView,
  OlaylarPriorityEventView,
  OlaylarResolvedEventView,
  OlaylarScreenPresentation,
  OlaylarTimelineItem,
  OlaylarTimelineTone,
} from '@/features/events/types/olaylarScreenTypes';
import {
  computeDaySummary,
  filterPendingEvents,
  pickPriorityEvent,
  shouldShowPriorityEvent,
  type EventScreenFilterKey,
} from '@/features/events/utils/eventsScreenModel';

const MOCK_RESOLVED: OlaylarResolvedEventView[] = [
  {
    id: 'mock-resolved-1',
    title: 'Park Aydınlatması Onarıldı',
    location: 'Atatürk Bulvarı',
    resolvedAgo: '13 saat önce',
    riskLabel: 'Çözüldü',
    rewardLabel: '+5 Memnuniyet',
    image: eventImages.resolvedStreetLight,
  },
  {
    id: 'mock-resolved-2',
    title: 'Su Kaçağı Giderildi',
    location: 'Yeşilvadi Mahallesi',
    resolvedAgo: '1 gün önce',
    riskLabel: 'Çözüldü',
    rewardLabel: '+7 Memnuniyet',
    image: eventImages.resolvedWaterLeak,
  },
  {
    id: 'mock-resolved-3',
    title: 'Mahalle Güveni Toparlandı',
    location: 'Cumhuriyet Mahallesi',
    resolvedAgo: 'Önceki operasyonda',
    riskLabel: 'Düşük Risk',
    rewardLabel: '+4 Memnuniyet',
    image: eventImages.resolvedParkSecurity,
  },
];

const STAT_META: Record<
  keyof OlaylarEventStats,
  Pick<OlaylarEventStatItem, 'label' | 'color' | 'bgColor' | 'icon'>
> = {
  critical: {
    label: 'Kritik',
    color: olaylar.critical,
    bgColor: olaylar.criticalBg,
    icon: 'shield',
  },
  urgent: {
    label: 'Acil',
    color: olaylar.urgent,
    bgColor: olaylar.urgentBg,
    icon: 'notifications',
  },
  active: {
    label: 'Aktif',
    color: olaylar.active,
    bgColor: olaylar.activeBg,
    icon: 'flash',
  },
  resolved: {
    label: 'Çözüldü',
    color: olaylar.success,
    bgColor: olaylar.successBg,
    icon: 'checkmark-circle',
  },
};

function riskToTimelineTone(risk: EventRiskLevel): OlaylarTimelineTone {
  if (risk === 'critical' || risk === 'high') return 'critical';
  if (risk === 'medium') return 'urgent';
  return 'active';
}

function urgencyToProgress(urgencyHours: number): number {
  const clamped = Math.max(1, Math.min(24, urgencyHours));
  return Math.round(((24 - clamped) / 24) * 100);
}

function formatTimelineClock(baseHour: number, baseMinute: number, offsetMinutes: number): string {
  const total = baseHour * 60 + baseMinute + offsetMinutes;
  const hour = Math.floor((total % (24 * 60)) / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function timelineLabelForEvent(event: EventCard): string {
  if (event.riskLevel === 'critical' || event.riskLevel === 'high') return 'Kritik';
  if (event.urgencyHours <= 6) return 'Acil';
  return 'Aktif';
}

function satisfactionReward(record: DecisionRecord): string | undefined {
  const delta = record.appliedEffects.publicSatisfaction;
  if (delta == null || delta === 0) return undefined;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} Memnuniyet`;
}

export function toOlaylarFilterKey(key: OlaylarFilterKey): EventScreenFilterKey {
  if (key === 'active') return 'all';
  return key;
}

export function buildOlaylarStats(
  activeEvents: EventCard[],
  decisionHistory: DecisionRecord[],
): OlaylarEventStats {
  const summary = computeDaySummary(activeEvents, decisionHistory);
  return {
    critical: summary.find((s) => s.key === 'critical')?.count ?? 0,
    urgent: summary.find((s) => s.key === 'urgent')?.count ?? 0,
    active: summary.find((s) => s.key === 'active')?.count ?? 0,
    resolved: summary.find((s) => s.key === 'resolved')?.count ?? 0,
  };
}

export function buildOlaylarEventStatItems(
  activeEvents: EventCard[],
  decisionHistory: DecisionRecord[],
): OlaylarEventStatItem[] {
  const stats = buildOlaylarStats(activeEvents, decisionHistory);
  const total =
    stats.critical + stats.urgent + stats.active + stats.resolved || 1;

  return (Object.keys(stats) as Array<keyof OlaylarEventStats>).map((key) => ({
    key,
    count: stats[key],
    percent: Math.round((stats[key] / total) * 100),
    ...STAT_META[key],
  }));
}

export function buildOperationStatusSummary(
  operationalResources: OperationalResourcesState,
  activeEventCount: number,
): OlaylarOperationStatusView {
  const personnel = Object.values(operationalResources.personnelGroups);
  const vehicles = Object.values(operationalResources.vehicleGroups);

  const teamCapacity = personnel.length * 4;
  const teamsReady = personnel.reduce((acc, group) => {
    if (group.status === 'stable') return acc + 4;
    if (group.status === 'busy') return acc + 3;
    if (group.status === 'strained') return acc + 2;
    return acc + 1;
  }, 0);

  const vehicleCapacity = vehicles.length * 8;
  const vehiclesReady = vehicles.reduce((acc, group) => {
    if (group.status === 'stable') return acc + 8;
    if (group.status === 'busy') return acc + 6;
    if (group.status === 'strained') return acc + 4;
    return acc + 2;
  }, 0);

  const avgMorale =
    personnel.reduce((sum, group) => sum + group.moraleScore, 0) /
    Math.max(1, personnel.length);
  const speedPercent = Math.round(
    100 + (avgMorale - 50) * 0.5 + (activeEventCount === 0 ? 15 : 0),
  );

  const hasCriticalResource =
    personnel.some((group) => group.status === 'critical') ||
    vehicles.some((group) => group.status === 'critical');

  return {
    statusLabel: hasCriticalResource ? 'KRİTİK' : activeEventCount > 0 ? 'AKTİF' : 'HAZIR',
    teamsLabel: `${teamsReady}/${teamCapacity}`,
    vehiclesLabel: `${vehiclesReady}/${vehicleCapacity}`,
    speedLabel: `${Math.min(150, Math.max(80, speedPercent))}%`,
    tone: hasCriticalResource ? 'critical' : activeEventCount > 0 ? 'active' : 'ready',
  };
}

function buildLiveMapPins(activeEvents: EventCard[]): OlaylarLiveMapPin[] {
  const positions: Array<{ left: `${number}%`; top: `${number}%` }> = [
    { left: '18%', top: '42%' },
    { left: '48%', top: '36%' },
    { left: '72%', top: '48%' },
    { left: '34%', top: '58%' },
  ];

  const pins: OlaylarLiveMapPin[] = activeEvents.slice(0, 3).map((event, index) => ({
    id: event.id,
    tone: riskToTimelineTone(event.riskLevel),
    left: positions[index]?.left ?? '50%',
    top: positions[index]?.top ?? '45%',
    pulse: index === 0,
  }));

  if (pins.length === 0) {
    return [
      {
        id: 'resolved-pin',
        tone: 'resolved',
        left: '62%',
        top: '52%',
      },
    ];
  }

  if (pins.length < 4) {
    pins.push({
      id: 'resolved-pin',
      tone: 'resolved',
      left: positions[pins.length]?.left ?? '62%',
      top: positions[pins.length]?.top ?? '52%',
    });
  }

  return pins;
}

export function buildLiveIncidentMapView(activeEvents: EventCard[]): OlaylarLiveIncidentMapView {
  return {
    title: 'CANLI OLAY HARİTASI',
    layerButtonLabel: 'Harita Katmanları',
    liveLabel: 'CANLI',
    pins: buildLiveMapPins(activeEvents),
  };
}

export function buildIncidentTimeline(
  activeEvents: EventCard[],
  decisionHistory: DecisionRecord[],
): OlaylarTimelineItem[] {
  const now = new Date();
  const baseHour = now.getHours();
  const baseMinute = now.getMinutes();
  const items: OlaylarTimelineItem[] = [];

  const sortedEvents = [...activeEvents].sort(
    (a, b) => a.urgencyHours - b.urgencyHours,
  );

  sortedEvents.slice(0, 3).forEach((event, index) => {
    items.push({
      id: `timeline-active-${event.id}`,
      time: formatTimelineClock(baseHour, baseMinute, index * 8 + 3),
      label: timelineLabelForEvent(event),
      tone: riskToTimelineTone(event.riskLevel),
    });
  });

  if (decisionHistory.length > 0) {
    items.push({
      id: `timeline-resolved-${decisionHistory.at(-1)?.id ?? 'resolved'}`,
      time: formatTimelineClock(baseHour, baseMinute, items.length * 8 + 5),
      label: 'Çözüldü',
      tone: 'resolved',
    });
  }

  if (items.length === 0) {
    return [
      {
        id: 'timeline-idle',
        time: formatTimelineClock(baseHour, baseMinute, 0),
        label: 'Hazır',
        tone: 'resolved',
      },
    ];
  }

  return items.slice(0, 4);
}

export function buildFieldStatusSummary(
  operationalResources: OperationalResourcesState,
  activeEvents: EventCard[],
): OlaylarFieldStatusView {
  const personnel = Object.values(operationalResources.personnelGroups);
  const teamCapacity = personnel.length * 4;
  const teamsReady = personnel.reduce((acc, group) => {
    if (group.status === 'stable') return acc + 4;
    if (group.status === 'busy') return acc + 3;
    if (group.status === 'strained') return acc + 2;
    return acc + 1;
  }, 0);

  const avgOrder =
    personnel.reduce((sum, group) => sum + (100 - group.workloadScore), 0) /
    Math.max(1, personnel.length);

  const districts = new Set(
    activeEvents.map((event) => event.district).filter(Boolean),
  );

  return {
    orderPercent: Math.round(Math.max(35, Math.min(92, avgOrder))),
    affectedDistricts: districts.size,
    activeTasks: activeEvents.length,
    teamsOnDutyLabel: `${teamsReady}/${teamCapacity}`,
    ctaLabel: 'Ekip Gönder',
  };
}

export function buildOlaylarScreenPresentation(input: {
  activeEvents: EventCard[];
  decisionHistory: DecisionRecord[];
  operationalResources: OperationalResourcesState;
}): OlaylarScreenPresentation {
  return {
    operationStatus: buildOperationStatusSummary(
      input.operationalResources,
      input.activeEvents.length,
    ),
    eventStats: buildOlaylarEventStatItems(
      input.activeEvents,
      input.decisionHistory,
    ),
    liveIncidentMap: buildLiveIncidentMapView(input.activeEvents),
    incidentTimeline: buildIncidentTimeline(
      input.activeEvents,
      input.decisionHistory,
    ),
    fieldStatus: buildFieldStatusSummary(
      input.operationalResources,
      input.activeEvents,
    ),
  };
}

function findRiskDelta(event: EventCard): string {
  const chips = buildPremiumPreviewChips(event.previewEffects, 3, event);
  const risk = chips.find((c) => c.tone === 'risk' || c.label.toLowerCase().includes('risk'));
  if (risk) return risk.friendlyLabel;
  if (event.riskLevel === 'high' || event.riskLevel === 'critical') return '+10 Risk';
  return '+6 Risk';
}

function findXpDelta(event: EventCard): string {
  const chips = buildPremiumPreviewChips(event.previewEffects, 3, event);
  const xp = chips.find((c) => c.tone === 'xp' || c.label.toLowerCase().includes('deneyim'));
  if (xp) return xp.friendlyLabel;
  return '+14 Deneyim';
}

export function buildPriorityEventView(
  event: EventCard | null,
): OlaylarPriorityEventView | null {
  if (!event) return null;
  return {
    id: event.id,
    title: event.title,
    district: event.district,
    description: event.description,
    timeLeft: formatUrgencyLabel(event.urgencyHours),
    affected: deriveAffectedPopulation(event),
    riskLabel: getRiskLevelLabel(event.riskLevel),
    riskDelta: findRiskDelta(event),
    xpDelta: findXpDelta(event),
    image: getEventHeroImage(event.id, event.category, event) as ImageSourcePropType,
  };
}

export function buildActiveEventViews(events: EventCard[]): OlaylarActiveEventView[] {
  return events.slice(0, 3).map((event) => ({
    id: event.id,
    title: event.title,
    location: event.district,
    timeLeft: formatUrgencyLabel(event.urgencyHours),
    progress: urgencyToProgress(event.urgencyHours),
    statusLabel:
      event.riskLevel === 'critical' || event.riskLevel === 'high'
        ? 'Acil'
        : event.riskLevel === 'medium'
          ? 'Orta Risk'
          : 'Aktif',
    tone: riskToTimelineTone(event.riskLevel),
  }));
}

function resolvedImageForRecord(record: DecisionRecord, index: number): ImageSourcePropType {
  const haystack = `${record.eventTitle} ${record.eventId ?? ''}`.toLowerCase();
  if (haystack.includes('park') || haystack.includes('güvenlik') || haystack.includes('guvenlik')) {
    return eventImages.resolvedParkSecurity;
  }
  if (haystack.includes('su') || haystack.includes('sız') || haystack.includes('siz')) {
    return eventImages.resolvedWaterLeak;
  }
  if (haystack.includes('sokak') || haystack.includes('aydın') || haystack.includes('aydin')) {
    return eventImages.resolvedStreetLight;
  }
  return index === 0 ? eventImages.resolvedParkSecurity : eventImages.resolvedWaterLeak;
}

function formatResolvedAgo(record: DecisionRecord, index: number): string {
  if (record.createdAt) {
    const created = new Date(record.createdAt).getTime();
    const hours = Math.max(1, Math.round((Date.now() - created) / 3_600_000));
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.max(1, Math.round(hours / 24));
    return `${days} gün önce`;
  }
  if (index === 0) return '13 saat önce';
  if (index === 1) return '1 gün önce';
  return 'Önceki operasyonda';
}

export function buildResolvedEventViews(
  records: DecisionRecord[],
  useMockWhenEmpty = true,
): OlaylarResolvedEventView[] {
  if (records.length === 0 && useMockWhenEmpty) {
    return MOCK_RESOLVED;
  }

  const seenTitles = new Set<string>();
  return [...records]
    .reverse()
    .slice(0, 3)
    .reduce<OlaylarResolvedEventView[]>((acc, record, index) => {
      if (seenTitles.has(record.eventTitle)) return acc;
      seenTitles.add(record.eventTitle);
      acc.push({
        id: record.id,
        title: record.eventTitle,
        location: record.neighborhoodName ?? record.neighborhoodId ?? 'Pilot Bölge',
        resolvedAgo: formatResolvedAgo(record, index),
        riskLabel: 'Çözüldü',
        rewardLabel: satisfactionReward(record),
        image: resolvedImageForRecord(record, index),
      });
      return acc;
    }, []);
}

export function getMapHeroSource(): number {
  return eventImages.cityMapHero;
}

export function resolveOlaylarPriority(
  activeEvents: EventCard[],
  featuredEventId: string | null,
  filter: OlaylarFilterKey,
) {
  const priorityEvent = pickPriorityEvent(activeEvents, featuredEventId);
  const mappedFilter = toOlaylarFilterKey(filter);
  const showPriority =
    shouldShowPriorityEvent(priorityEvent, mappedFilter) && priorityEvent != null;
  const pendingEvents = filterPendingEvents(
    activeEvents,
    priorityEvent?.id ?? null,
    mappedFilter,
  );
  return { priorityEvent, showPriority, pendingEvents };
}

export function resolvePrimaryOperationEventId(
  activeEvents: EventCard[],
  featuredEventId: string | null,
): string | null {
  const priority = pickPriorityEvent(activeEvents, featuredEventId);
  if (priority) return priority.id;
  return activeEvents[0]?.id ?? null;
}
