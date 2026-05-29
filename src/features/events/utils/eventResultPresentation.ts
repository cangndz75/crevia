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
  'paywall',
] as const;

export const EVENT_RESULT_LAYOUT_GUARDS = {
  heroTitleNumberOfLines: 2,
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
  ctaHub: 'Operasyon Merkezine Dön',
  ctaEndDay: 'Gün Sonuna Geç',
  publicImpact: 'Halk Etkisi',
  teamImpact: 'Ekip Etkisi',
  resourceImpact: 'Kaynak Etkisi',
  agendaImpact: 'Gündem etkisi',
} as const;

export type EventResultHeroTone = 'positive' | 'balanced' | 'warning' | 'neutral';

export type EventResultImpactTone = EventResultHeroTone;

export type EventResultHeroModel = {
  panelTitle: string;
  statusLabel: string;
  summary: string;
  tone: EventResultHeroTone;
  eventTitle: string;
  neighborhoodLabel: string;
  decisionTitle: string;
};

export type EventResultImpactMetric = {
  id: 'public' | 'team' | 'resource';
  label: string;
  value: string;
  tone: EventResultImpactTone;
};

export type EventResultNextStepModel = {
  primaryCtaLabel: string;
  showSecondary: boolean;
};

export type EventResultViewModel = {
  hero: EventResultHeroModel;
  metrics: EventResultImpactMetric[];
  fieldNote: string;
  metaLines: string[];
  districtContextLine?: string;
  showPostPilotContext: boolean;
  nextStep: EventResultNextStepModel;
  isFallback: boolean;
};

const STATUS_LABELS: Record<DecisionResultSummaryTone, string> = {
  positive: 'Başarılı sonuç',
  mixed: 'Dengeli sonuç',
  negative: 'Riskli sonuç',
  neutral: 'Zorlu sonuç',
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

export function buildEventResultHeroModel(
  snapshot: DecisionResultSnapshot,
): EventResultHeroModel {
  const neighborhoodLabel =
    snapshot.neighborhoodName?.trim() ||
    snapshot.eventType?.trim() ||
    'Saha operasyonu';

  return {
    panelTitle: EVENT_RESULT_COPY.panelTitle,
    statusLabel: STATUS_LABELS[snapshot.resultTone],
    summary: snapshot.summaryText?.trim() || snapshot.summaryTitle,
    tone: mapSummaryTone(snapshot.resultTone),
    eventTitle: snapshot.eventTitle || 'Operasyon kaydı',
    neighborhoodLabel,
    decisionTitle: snapshot.decisionTitle || 'Karar uygulandı',
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
  if (
    personnel?.primaryText?.trim() &&
    personnel.status !== 'neutral'
  ) {
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

export function buildEventResultNextStepModel(options?: {
  preferEndDay?: boolean;
}): EventResultNextStepModel {
  return {
    primaryCtaLabel: options?.preferEndDay
      ? EVENT_RESULT_COPY.ctaEndDay
      : EVENT_RESULT_COPY.ctaHub,
    showSecondary: false,
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
  },
): EventResultViewModel {
  return {
    hero: buildEventResultHeroModel(snapshot),
    metrics: buildEventResultImpactMetrics(snapshot).slice(
      0,
      EVENT_RESULT_LAYOUT_GUARDS.maxImpactMetrics,
    ),
    fieldNote: buildEventResultFieldNote(snapshot),
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
    isFallback: options?.isFallback ?? snapshot.id === 'missing',
  };
}

export function collectEventResultPresentationStrings(
  model: EventResultViewModel,
): string[] {
  return [
    model.hero.panelTitle,
    model.hero.statusLabel,
    model.hero.summary,
    model.hero.eventTitle,
    model.hero.neighborhoodLabel,
    model.hero.decisionTitle,
    EVENT_RESULT_COPY.impactSectionTitle,
    EVENT_RESULT_COPY.fieldNoteTitle,
    ...model.metrics.flatMap((m) => [m.label, m.value]),
    model.fieldNote,
    model.districtContextLine ?? '',
    ...model.metaLines,
    model.nextStep.primaryCtaLabel,
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
