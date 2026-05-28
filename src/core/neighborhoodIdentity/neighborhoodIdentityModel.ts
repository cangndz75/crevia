import type { EventCard } from '@/core/models/EventCard';
import type { DailyGoalMetricKey } from '@/core/dailyGoals/dailyGoalTypes';

import {
  DEFAULT_NEIGHBORHOOD_ID,
  NEIGHBORHOOD_IDENTITIES,
} from './neighborhoodIdentityConstants';
import type {
  NeighborhoodEventBiasKey,
  NeighborhoodGoalBiasKey,
  NeighborhoodIdentity,
  NeighborhoodIdentityId,
  NeighborhoodReportStatus,
  NeighborhoodSensitivityKey,
} from './neighborhoodIdentityTypes';

const MAX_EVENT_BIAS_BOOST = 0.08;
const MAX_EVENT_WEIGHT_POINTS = 8;

const ALIAS_TO_ID: Record<string, NeighborhoodIdentityId> = {
  merkez: 'merkez',
  central: 'merkez',
  cumhuriyet: 'cumhuriyet',
  sanayi: 'sanayi',
  industrialmarket: 'sanayi',
  industrial_market: 'sanayi',
  sanayipazar: 'sanayi',
  pazar: 'sanayi',
  istasyon: 'istasyon',
  yesilvadi: 'yesilvadi',
  yesilpark: 'yesilvadi',
  yenikonut: 'cumhuriyet',
  'yeni-konut': 'cumhuriyet',
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function normalizeNeighborhoodId(
  value: string | undefined | null,
): NeighborhoodIdentityId | null {
  if (value == null || value === '') {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed in NEIGHBORHOOD_IDENTITIES) {
    return trimmed as NeighborhoodIdentityId;
  }
  const key = normalizeKey(trimmed);
  if (key in NEIGHBORHOOD_IDENTITIES) {
    return key as NeighborhoodIdentityId;
  }
  return ALIAS_TO_ID[key] ?? null;
}

export function resolveNeighborhoodId(
  value: string | undefined | null,
  fallback: NeighborhoodIdentityId = DEFAULT_NEIGHBORHOOD_ID,
): NeighborhoodIdentityId {
  return normalizeNeighborhoodId(value) ?? fallback;
}

export function getNeighborhoodIdentity(
  id: string | undefined | null,
): NeighborhoodIdentity {
  const resolved = resolveNeighborhoodId(id);
  return NEIGHBORHOOD_IDENTITIES[resolved];
}

export function getNeighborhoodDisplayName(
  id: string | undefined | null,
): string {
  return getNeighborhoodIdentity(id).shortName;
}

export function getNeighborhoodRepresentative(id: string | undefined | null) {
  return getNeighborhoodIdentity(id).representative;
}

export function getNeighborhoodSensitivity(
  id: string | undefined | null,
  key: NeighborhoodSensitivityKey,
): number {
  return getNeighborhoodIdentity(id).sensitivities[key] ?? 50;
}

export function getNeighborhoodEventBias(
  id: string | undefined | null,
  category: NeighborhoodEventBiasKey,
): number {
  return getNeighborhoodIdentity(id).eventBias[category] ?? 0;
}

export function getNeighborhoodGoalBias(
  id: string | undefined | null,
  metric: DailyGoalMetricKey | NeighborhoodGoalBiasKey,
): number {
  const identity = getNeighborhoodIdentity(id);
  if (metric in identity.goalBias) {
    return identity.goalBias[metric as NeighborhoodGoalBiasKey];
  }
  return 0;
}

export function getNeighborhoodReportTone(
  id: string | undefined | null,
  status: NeighborhoodReportStatus,
): string {
  return getNeighborhoodIdentity(id).reportTone[status];
}

export function getNeighborhoodUiTone(id: string | undefined | null) {
  return getNeighborhoodIdentity(id).visualTone;
}

export function getNeighborhoodPlayerHint(id: string | undefined | null): string {
  return getNeighborhoodIdentity(id).playerHint;
}

export function getNeighborhoodSocialChipLabel(
  id: string | undefined | null,
): string {
  return getNeighborhoodIdentity(id).socialChipLabel;
}

export function getNeighborhoodMapCharacterLine(
  id: string | undefined | null,
): string {
  return getNeighborhoodIdentity(id).mapCharacterLine;
}

export function getNeighborhoodIdentityChipLabel(
  id: string | undefined | null,
): string {
  const identity = getNeighborhoodIdentity(id);
  return `${identity.shortName} · ${identity.tagline}`;
}

export function resolveNeighborhoodIdFromEvent(
  event: Pick<EventCard, 'neighborhoodId' | 'district'>,
): NeighborhoodIdentityId | null {
  return (
    normalizeNeighborhoodId(event.neighborhoodId) ??
    normalizeNeighborhoodId(event.district)
  );
}

function eventHaystack(event: EventCard): string {
  const tags = (event.filterTags ?? []).join(' ');
  return `${event.eventType ?? ''} ${event.category} ${tags} ${event.title}`.toLowerCase();
}

function matchesCategory(
  haystack: string,
  category: NeighborhoodEventBiasKey,
): boolean {
  switch (category) {
    case 'waste':
      return /waste|atık|konteyner|container|çöp|koku|market/.test(haystack);
    case 'social':
      return /social|sosyal|şikayet|complaint|medya|gürültü|noise|citizen/.test(
        haystack,
      );
    case 'vehicle':
      return /vehicle|araç|filo|rota|route|staff|personel/.test(haystack);
    case 'personnel':
      return /staff|personel|ekip|vardiya|fatigue|yorgun/.test(haystack);
    case 'maintenance':
      return /maintenance|bakım|park|peyzaj|temizlik|odor|koku/.test(haystack);
    case 'traffic':
      return /traffic|trafik|akış|flow|istasyon|geçiş|transit/.test(haystack);
    case 'budget':
      return /budget|bütçe|kaynak|maliyet/.test(haystack);
    default:
      return false;
  }
}

/** 0–0.08 arası küçük bias — tutorial/gün 1’de 0. */
export function getNeighborhoodEventBiasBoost(
  event: EventCard,
  options?: { currentDay?: number; tutorialActive?: boolean },
): number {
  if (options?.tutorialActive || (options?.currentDay ?? 2) <= 1) {
    return 0;
  }
  const neighborhoodId = resolveNeighborhoodIdFromEvent(event);
  if (!neighborhoodId) {
    return 0;
  }
  const identity = getNeighborhoodIdentity(neighborhoodId);
  const haystack = eventHaystack(event);
  let top = 0;
  for (const key of Object.keys(identity.eventBias) as NeighborhoodEventBiasKey[]) {
    if (matchesCategory(haystack, key)) {
      top = Math.max(top, identity.eventBias[key]);
    }
  }
  if (top <= 0) {
    return 0;
  }
  return Math.min(MAX_EVENT_BIAS_BOOST, top * MAX_EVENT_BIAS_BOOST);
}

/** Event weight’e eklenecek küçük puan (max 8). */
export function getNeighborhoodIdentityEventWeightBonus(
  event: EventCard,
  options?: { currentDay?: number; tutorialActive?: boolean },
): number {
  const boost = getNeighborhoodEventBiasBoost(event, options);
  if (boost <= 0) {
    return 0;
  }
  return Math.min(MAX_EVENT_WEIGHT_POINTS, Math.round(boost * 100));
}

export function buildNeighborhoodIdentityReportLine(params: {
  neighborhoodId: string | null | undefined;
  status: NeighborhoodReportStatus;
}): string | null {
  if (!params.neighborhoodId) {
    return null;
  }
  const normalized = normalizeNeighborhoodId(params.neighborhoodId);
  if (!normalized) {
    return null;
  }
  return getNeighborhoodReportTone(normalized, params.status);
}

export function enrichGoalDescriptionWithIdentity(
  neighborhoodId: string | undefined | null,
  description: string,
): string {
  const normalized = normalizeNeighborhoodId(neighborhoodId);
  if (!normalized) {
    return description;
  }
  const hint = getNeighborhoodPlayerHint(normalized);
  if (!hint || description.includes(hint.slice(0, 24))) {
    return description;
  }
  const combined = `${description} ${hint}`;
  return combined.length > 120 ? description : combined;
}
