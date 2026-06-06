import type { ImageSource } from 'expo-image';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import {
  buildDistrictEventContextLine,
  normalizeMapDistrictId,
} from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { EventCard } from '@/core/models/EventCard';
import { isPostPilotGeneratedEvent } from '@/core/postPilot/postPilotOperationUxPresentation';
import type {
  DecisionMetricChange,
  DecisionResultSnapshot,
  DecisionResultSummaryTone,
} from '@/features/events/types/decisionResultTypes';

export const EVENT_RESULT_UI_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'yetkin yetersiz',
  'premium',
  'satın al',
  'başarısız oldun',
  'başarısız',
  'yanlış karar',
  'paywall',
] as const;

export const EVENT_RESULT_LAYOUT_GUARDS = {
  heroTitleNumberOfLines: 4,
  eventTitleNumberOfLines: 2,
  fieldNoteNumberOfLines: 2,
  metaLineNumberOfLines: 1,
  maxImpactMetrics: 3,
  usesFlexShrink: true,
  usesMinWidthZero: true,
} as const;

export const EVENT_RESULT_COPY = {
  panelTitle: 'Operasyon Sonucu',
  impactSectionTitle: 'Kararın Etkisi',
  fieldNoteTitle: 'Saha Notu',
  fieldNoteFallback: 'Saha ekibi sonucu izlemeye aldı.',
  nextStepLabel: 'Sonraki adım',
  ctaHub: 'Sonraki olaya devam et',
  ctaHubSubtitle: 'Operasyona devam ederek mahalledeki durumu iyileştir.',
  ctaEndDay: 'Gün Sonuna Geç',
  ctaEndDaySubtitle: 'Gün sonu raporunu görüntülemek için devam et.',
  ctaReport: 'Raporu gör',
  ctaReportSubtitle: 'Operasyon raporunu incele.',
  publicImpact: 'Halk Etkisi',
  teamImpact: 'Ekip Etkisi',
  resourceImpact: 'Kaynak Etkisi',
  agendaImpact: 'Gündem etkisi',
  infoCardTitle: 'Karar sonucu',
  infoCardBody:
    'Sonuç ekranı kararının etkisini gösterir. Metrik değişimleri ve sistem etkileri gün sonu raporuna yansır.',
  infoCardBodyShort: 'Kararının etkisi gün sonu raporuna yansır.',
  dailyGoalFallback: 'Günlük hedef ilerledi: İlk olay',
  agendaFallback: 'Gündem etkisi: Operasyon ilerledi',
  publicImpactDescUp: 'Mahalle memnuniyeti arttı.',
  publicImpactDescDown: 'Mahalle memnuniyeti düştü.',
  publicImpactDescFlat: 'Mahalle memnuniyeti dengede kaldı.',
  teamImpactDescUp: 'Ekip motivasyonu yükseldi.',
  teamImpactDescDown: 'Ekip motivasyonu düştü.',
  teamImpactDescFlat: 'Ekip motivasyonu dengede kaldı.',
  resourceImpactDescUp: 'Kaynak kullanımı arttı.',
  resourceImpactDescDown: 'Kaynak tasarrufu sağlandı.',
  resourceImpactDescFlat: 'Kaynak kullanımı dengede kaldı.',
} as const;

export type EventResultHeroTone = 'positive' | 'balanced' | 'warning' | 'neutral';
export type EventResultImpactTone = EventResultHeroTone;
export type EventResultDeltaTone = 'positive' | 'negative' | 'neutral';
export type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export type EventResultHeroModel = {
  statusLabel: string;
  title: string;
  tone: EventResultHeroTone;
  eventTitle: string;
  districtName: string;
  decisionLabel: string;
  imageSource?: ImageSource;
};

export type EventResultImpactMetric = {
  id: 'public' | 'team' | 'resource';
  label: string;
  value: string;
  tone: EventResultImpactTone;
};

export type EventResultImpactRowModel = {
  id: 'public' | 'team' | 'resource';
  title: string;
  deltaText: string;
  deltaTone: EventResultDeltaTone;
  description: string;
  iconName: IoniconsName;
  trendTone: EventResultDeltaTone;
};

export type EventResultProgressStripModel = {
  id: 'dailyGoal' | 'agenda';
  iconName: IoniconsName;
  text: string;
  progressText?: string;
  progressRatio?: number;
};

export type EventResultInfoCardModel = {
  title: string;
  body: string;
};

export type EventResultActionModel = {
  primaryTitle: string;
  primarySubtitle: string;
  secondaryTitle: string;
  secondarySubtitle: string;
  showSecondary: boolean;
};

export type EventResultNextStepModel = {
  primaryCtaLabel: string;
  showSecondary: boolean;
};

export type EventResultViewModel = {
  hero: EventResultHeroModel;
  metrics: EventResultImpactMetric[];
  impactRows: EventResultImpactRowModel[];
  fieldNote: string;
  progressStrips: EventResultProgressStripModel[];
  infoCard: EventResultInfoCardModel;
  metaLines: string[];
  districtContextLine?: string;
  showPostPilotContext: boolean;
  nextStep: EventResultNextStepModel;
  actions: EventResultActionModel;
  isFallback: boolean;
};

const STATUS_LABELS: Record<DecisionResultSummaryTone, string> = {
  positive: 'Başarılı sonuç',
  mixed: 'Dengeli sonuç',
  negative: 'Riskli sonuç',
  neutral: 'Zorlu sonuç',
};

const IMPACT_ROW_ICONS: Record<EventResultImpactRowModel['id'], IoniconsName> = {
  public: 'people-outline',
  team: 'construct-outline',
  resource: 'cube-outline',
};

const IMPACT_DESCRIPTIONS: Record<
  EventResultImpactRowModel['id'],
  Record<'up' | 'down' | 'flat', string>
> = {
  public: {
    up: EVENT_RESULT_COPY.publicImpactDescUp,
    down: EVENT_RESULT_COPY.publicImpactDescDown,
    flat: EVENT_RESULT_COPY.publicImpactDescFlat,
  },
  team: {
    up: EVENT_RESULT_COPY.teamImpactDescUp,
    down: EVENT_RESULT_COPY.teamImpactDescDown,
    flat: EVENT_RESULT_COPY.teamImpactDescFlat,
  },
  resource: {
    up: EVENT_RESULT_COPY.resourceImpactDescUp,
    down: EVENT_RESULT_COPY.resourceImpactDescDown,
    flat: EVENT_RESULT_COPY.resourceImpactDescFlat,
  },
};

function mapSummaryTone(tone: DecisionResultSummaryTone): EventResultHeroTone {
  switch (tone) {
    case 'positive':
      return 'positive';
    case 'negative':
      return 'warning';
    case 'mixed':
      return 'balanced';
    default:
      return 'neutral';
  }
}

function formatSignedDelta(delta: number, key: DecisionMetricChange['key']): string {
  if (delta === 0) {
    return 'Dengeli';
  }
  const sign = delta > 0 ? '+' : '';
  if (key === 'budget') {
    const abs = Math.abs(delta);
    if (abs >= 1000) {
      return `${sign}${Math.round(delta / 1000)}K`;
    }
    return `${sign}${delta}`;
  }
  return `${sign}${delta}`;
}

function impactToneForMetric(metric: DecisionMetricChange): EventResultImpactTone {
  if (metric.direction === 'flat') {
    return 'neutral';
  }
  if (metric.isGood) {
    return 'positive';
  }
  if (metric.key === 'operationRisk') {
    return 'warning';
  }
  return metric.delta > 0 ? 'positive' : 'warning';
}

function deltaToneForMetric(metric?: DecisionMetricChange): EventResultDeltaTone {
  if (!metric || metric.direction === 'flat' || metric.delta === 0) {
    return 'neutral';
  }
  if (metric.isGood) {
    return 'positive';
  }
  return 'negative';
}

function descriptionForImpactRow(
  id: EventResultImpactRowModel['id'],
  metric?: DecisionMetricChange,
): string {
  if (!metric || metric.direction === 'flat' || metric.delta === 0) {
    return IMPACT_DESCRIPTIONS[id].flat;
  }
  if (metric.delta > 0) {
    return IMPACT_DESCRIPTIONS[id].up;
  }
  return IMPACT_DESCRIPTIONS[id].down;
}

function findMetric(
  metrics: DecisionMetricChange[],
  key: DecisionMetricChange['key'],
): DecisionMetricChange | undefined {
  return metrics.find((m) => m.key === key);
}

export function buildEventResultImpactMetrics(
  snapshot: DecisionResultSnapshot,
): EventResultImpactMetric[] {
  const specs: Array<{
    id: EventResultImpactMetric['id'];
    label: string;
    key: DecisionMetricChange['key'];
  }> = [
    { id: 'public', label: EVENT_RESULT_COPY.publicImpact, key: 'publicSatisfaction' },
    { id: 'team', label: EVENT_RESULT_COPY.teamImpact, key: 'personnelMorale' },
    { id: 'resource', label: EVENT_RESULT_COPY.resourceImpact, key: 'budget' },
  ];

  return specs.map(({ id, label, key }) => {
    const metric = findMetric(snapshot.metricChanges, key);
    if (!metric) {
      return { id, label, value: 'Dengeli', tone: 'neutral' as const };
    }
    return {
      id,
      label,
      value: formatSignedDelta(metric.delta, key),
      tone: impactToneForMetric(metric),
    };
  });
}

export function buildEventResultImpactRows(
  snapshot: DecisionResultSnapshot,
): EventResultImpactRowModel[] {
  const specs: Array<{
    id: EventResultImpactRowModel['id'];
    title: string;
    key: DecisionMetricChange['key'];
  }> = [
    { id: 'public', title: EVENT_RESULT_COPY.publicImpact, key: 'publicSatisfaction' },
    { id: 'team', title: EVENT_RESULT_COPY.teamImpact, key: 'personnelMorale' },
    { id: 'resource', title: EVENT_RESULT_COPY.resourceImpact, key: 'budget' },
  ];

  return specs.map(({ id, title, key }) => {
    const metric = findMetric(snapshot.metricChanges, key);
    const deltaTone = deltaToneForMetric(metric);
    return {
      id,
      title,
      deltaText: metric ? formatSignedDelta(metric.delta, key) : 'Dengeli',
      deltaTone,
      description: descriptionForImpactRow(id, metric),
      iconName: IMPACT_ROW_ICONS[id],
      trendTone: deltaTone,
    };
  });
}

export function buildEventResultHeroModel(
  snapshot: DecisionResultSnapshot,
): EventResultHeroModel {
  const districtName =
    snapshot.neighborhoodName?.trim() ||
    snapshot.eventType?.trim() ||
    'Saha operasyonu';

  const decisionLabel = snapshot.decisionTitle?.trim() || 'Karar uygulandı';

  return {
    statusLabel: STATUS_LABELS[snapshot.resultTone],
    title: snapshot.summaryText?.trim() || snapshot.summaryTitle,
    tone: mapSummaryTone(snapshot.resultTone),
    eventTitle: snapshot.eventTitle || 'Operasyon kaydı',
    districtName,
    decisionLabel,
  };
}

export function buildEventResultFieldNote(
  snapshot: DecisionResultSnapshot,
): string {
  const social = snapshot.subsystemOutcomes.find((o) => o.key === 'social');
  if (social?.primaryText?.trim()) {
    return social.primaryText.trim();
  }

  const personnel = snapshot.subsystemOutcomes.find((o) => o.key === 'personnel');
  if (personnel?.primaryText?.trim() && personnel.status !== 'neutral') {
    return personnel.primaryText.trim();
  }

  if (snapshot.nextSuggestion?.trim()) {
    return snapshot.nextSuggestion.trim();
  }

  if (snapshot.summaryText?.trim()) {
    return snapshot.summaryText.trim();
  }

  return EVENT_RESULT_COPY.fieldNoteFallback;
}

export function buildEventResultProgressStrips(
  snapshot: DecisionResultSnapshot,
  options?: {
    dailyGoalProgress?: { current: number; total: number } | null;
  },
): EventResultProgressStripModel[] {
  const strips: EventResultProgressStripModel[] = [];

  const goalText = snapshot.dailyGoalImpact?.trim() || EVENT_RESULT_COPY.dailyGoalFallback;
  const progress = options?.dailyGoalProgress;
  const progressText =
    progress && progress.total > 0
      ? `${Math.min(progress.current, progress.total)}/${progress.total}`
      : '1/1';
  const progressRatio =
    progress && progress.total > 0
      ? Math.min(progress.current / progress.total, 1)
      : goalText.includes('ilerledi')
        ? 1
        : 0.5;

  strips.push({
    id: 'dailyGoal',
    iconName: 'flag-outline',
    text: goalText,
    progressText,
    progressRatio,
  });

  if (snapshot.dailyPriorityImpact) {
    const { title, text } = snapshot.dailyPriorityImpact;
    const agendaLine = [title, text].filter(Boolean).join(' · ');
    strips.push({
      id: 'agenda',
      iconName: 'calendar-outline',
      text: agendaLine
        ? `${EVENT_RESULT_COPY.agendaImpact}: ${agendaLine}`
        : EVENT_RESULT_COPY.agendaFallback,
    });
  } else {
    strips.push({
      id: 'agenda',
      iconName: 'calendar-outline',
      text: EVENT_RESULT_COPY.agendaFallback,
    });
  }

  return strips.slice(0, 2);
}

export function buildEventResultInfoCard(): EventResultInfoCardModel {
  const body = EVENT_RESULT_COPY.infoCardBody;
  return {
    title: EVENT_RESULT_COPY.infoCardTitle,
    body: body.length > 120 ? EVENT_RESULT_COPY.infoCardBodyShort : body,
  };
}

export function buildEventResultMetaLines(
  snapshot: DecisionResultSnapshot,
): string[] {
  const lines: string[] = [];

  if (snapshot.dailyGoalImpact?.trim()) {
    lines.push(snapshot.dailyGoalImpact.trim());
  }

  if (snapshot.dailyPriorityImpact) {
    const { title, text } = snapshot.dailyPriorityImpact;
    const line = [title, text].filter(Boolean).join(' · ');
    if (line) {
      lines.push(`${EVENT_RESULT_COPY.agendaImpact}: ${line}`);
    }
  }

  const badgeLike = snapshot.highlightLines.find(
    (line) =>
      line.toLowerCase().includes('rozet') ||
      line.toLowerCase().includes('yetki') ||
      line.toLowerCase().includes('güven'),
  );
  if (badgeLike) {
    lines.push(badgeLike);
  }

  return lines.slice(0, 2);
}

export function buildEventResultActionModel(options?: {
  preferEndDay?: boolean;
}): EventResultActionModel {
  const preferEndDay = options?.preferEndDay ?? false;
  return {
    primaryTitle: preferEndDay
      ? EVENT_RESULT_COPY.ctaEndDay
      : EVENT_RESULT_COPY.ctaHub,
    primarySubtitle: preferEndDay
      ? EVENT_RESULT_COPY.ctaEndDaySubtitle
      : EVENT_RESULT_COPY.ctaHubSubtitle,
    secondaryTitle: EVENT_RESULT_COPY.ctaReport,
    secondarySubtitle: EVENT_RESULT_COPY.ctaReportSubtitle,
    showSecondary: true,
  };
}

export function buildEventResultNextStepModel(options?: {
  preferEndDay?: boolean;
}): EventResultNextStepModel {
  return {
    primaryCtaLabel: options?.preferEndDay
      ? EVENT_RESULT_COPY.ctaEndDay
      : EVENT_RESULT_COPY.ctaHub,
    showSecondary: true,
  };
}

export function resolveEventDistrictIdForIdentity(
  event?: Pick<EventCard, 'neighborhoodId' | 'district' | 'districtIds'> | null,
  snapshot?: Pick<DecisionResultSnapshot, 'neighborhoodId' | 'neighborhoodName'> | null,
): MapDistrictId | null {
  if (event?.neighborhoodId) {
    const fromNeighborhood = normalizeMapDistrictId(event.neighborhoodId);
    if (fromNeighborhood) {
      return fromNeighborhood;
    }
  }
  if (event?.districtIds?.[0]) {
    const fromIds = normalizeMapDistrictId(event.districtIds[0]);
    if (fromIds) {
      return fromIds;
    }
  }
  if (event?.district) {
    const fromDistrict = normalizeMapDistrictId(event.district);
    if (fromDistrict) {
      return fromDistrict;
    }
  }
  if (snapshot?.neighborhoodId) {
    const fromSnapshotId = normalizeMapDistrictId(snapshot.neighborhoodId);
    if (fromSnapshotId) {
      return fromSnapshotId;
    }
  }
  if (snapshot?.neighborhoodName) {
    return normalizeMapDistrictId(snapshot.neighborhoodName);
  }
  return null;
}

function shouldShowDistrictEventContextLine(
  event?: EventCard | null,
  snapshot?: DecisionResultSnapshot | null,
): boolean {
  const districtId = resolveEventDistrictIdForIdentity(event, snapshot);
  if (!districtId) {
    return false;
  }
  const seed = event?.id ?? snapshot?.eventId ?? districtId;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % 997;
  }
  return hash % 3 === 0;
}

export function buildEventResultDistrictContextLine(
  event?: EventCard | null,
  snapshot?: DecisionResultSnapshot | null,
): string | undefined {
  if (!shouldShowDistrictEventContextLine(event, snapshot)) {
    return undefined;
  }
  const districtId = resolveEventDistrictIdForIdentity(event, snapshot);
  if (!districtId) {
    return undefined;
  }
  return buildDistrictEventContextLine(districtId);
}

export function shouldShowPostPilotResultContext(
  snapshot: DecisionResultSnapshot,
  event?: EventCard | null,
): boolean {
  if (event) {
    return isPostPilotGeneratedEvent(event);
  }
  return snapshot.eventId.startsWith('pp_d');
}

export function buildEventResultViewModel(
  snapshot: DecisionResultSnapshot,
  options?: {
    event?: EventCard | null;
    preferEndDayCta?: boolean;
    isFallback?: boolean;
    dailyGoalProgress?: { current: number; total: number } | null;
  },
): EventResultViewModel {
  const progressStrips = buildEventResultProgressStrips(snapshot, {
    dailyGoalProgress: options?.dailyGoalProgress,
  });

  return {
    hero: buildEventResultHeroModel(snapshot),
    metrics: buildEventResultImpactMetrics(snapshot).slice(
      0,
      EVENT_RESULT_LAYOUT_GUARDS.maxImpactMetrics,
    ),
    impactRows: buildEventResultImpactRows(snapshot).slice(
      0,
      EVENT_RESULT_LAYOUT_GUARDS.maxImpactMetrics,
    ),
    fieldNote: buildEventResultFieldNote(snapshot),
    progressStrips,
    infoCard: buildEventResultInfoCard(),
    metaLines: buildEventResultMetaLines(snapshot),
    districtContextLine: buildEventResultDistrictContextLine(
      options?.event,
      snapshot,
    ),
    showPostPilotContext: shouldShowPostPilotResultContext(
      snapshot,
      options?.event,
    ),
    nextStep: buildEventResultNextStepModel({
      preferEndDay: options?.preferEndDayCta,
    }),
    actions: buildEventResultActionModel({
      preferEndDay: options?.preferEndDayCta,
    }),
    isFallback: options?.isFallback ?? snapshot.id === 'missing',
  };
}

export function collectEventResultPresentationStrings(
  model: EventResultViewModel,
): string[] {
  return [
    EVENT_RESULT_COPY.panelTitle,
    model.hero.statusLabel,
    model.hero.title,
    model.hero.eventTitle,
    model.hero.districtName,
    model.hero.decisionLabel,
    EVENT_RESULT_COPY.impactSectionTitle,
    EVENT_RESULT_COPY.fieldNoteTitle,
    ...model.metrics.flatMap((m) => [m.label, m.value]),
    ...model.impactRows.flatMap((row) => [row.title, row.deltaText, row.description]),
    model.fieldNote,
    model.districtContextLine ?? '',
    ...model.metaLines,
    ...model.progressStrips.map((strip) => strip.text),
    model.infoCard.title,
    model.infoCard.body,
    model.nextStep.primaryCtaLabel,
    model.actions.primaryTitle,
    model.actions.secondaryTitle,
  ].filter(Boolean);
}

export function eventResultTextContainsForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of EVENT_RESULT_UI_FORBIDDEN_WORDS) {
    if (word === 'xp') {
      if (/\bxp\b/.test(haystack)) {
        hits.push(word);
      }
      continue;
    }
    if (haystack.includes(word)) {
      hits.push(word);
    }
  }
  return hits;
}

export function assertNoEventResultForbiddenWords(
  strings: string[],
): string[] {
  return strings.flatMap((line) => eventResultTextContainsForbiddenWords(line));
}
