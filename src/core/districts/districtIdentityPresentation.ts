import { colors } from '@/ui/theme/colors';

import {
  DISTRICT_IDENTITIES,
  DISTRICT_IDENTITY_FALLBACK,
  MAP_DISTRICT_IDENTITY_IDS,
} from './districtIdentityConstants';
import type {
  DistrictFlavorContext,
  DistrictIdentity,
  DistrictRiskChip,
  DistrictRiskLevel,
  DistrictRiskProfile,
  DistrictVisualAccent,
  MapDistrictId,
} from './districtIdentityTypes';

export const DISTRICT_IDENTITY_BANNED_WORDS = [
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
  'xp',
  'level up',
  'rank up',
] as const;

const RISK_DIMENSION_LABELS: Record<keyof DistrictRiskProfile, string> = {
  social: 'Sosyal',
  traffic: 'Trafik',
  waste: 'Atık',
  personnel: 'Personel',
  budget: 'Bütçe',
};

const RISK_LEVEL_LABELS: Record<DistrictRiskLevel, string> = {
  low: 'düşük',
  medium: 'orta',
  high: 'yüksek',
};

const ACCENT_COLORS: Record<DistrictVisualAccent, string> = {
  teal: colors.primary,
  mint: '#2BB5A8',
  amber: colors.hubGoldDark,
  green: colors.success,
  blue: colors.secondary,
};

const LABEL_ALIASES: Record<string, MapDistrictId> = {
  merkez: 'merkez',
  central: 'merkez',
  cumhuriyet: 'cumhuriyet',
  sanayi: 'sanayi',
  industrial: 'sanayi',
  endüstriyel: 'sanayi',
  istasyon: 'istasyon',
  station: 'istasyon',
  yesilvadi: 'yesilvadi',
  yeşilvadi: 'yesilvadi',
  greenvalley: 'yesilvadi',
};

function isMapDistrictId(value: string): value is MapDistrictId {
  return (MAP_DISTRICT_IDENTITY_IDS as string[]).includes(value);
}

function normalizeLookupKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

export function normalizeMapDistrictId(
  input: string | null | undefined,
): MapDistrictId | null {
  if (input == null || typeof input !== 'string') {
    return null;
  }
  const key = normalizeLookupKey(input);
  if (isMapDistrictId(key)) {
    return key;
  }
  if (LABEL_ALIASES[key]) {
    return LABEL_ALIASES[key];
  }
  for (const [alias, id] of Object.entries(LABEL_ALIASES)) {
    if (key.includes(alias)) {
      return id;
    }
  }
  return null;
}

export function getDistrictIdentity(
  districtId: string | null | undefined,
): DistrictIdentity {
  const normalized = normalizeMapDistrictId(districtId);
  if (normalized && DISTRICT_IDENTITIES[normalized]) {
    return DISTRICT_IDENTITIES[normalized];
  }
  return { ...DISTRICT_IDENTITY_FALLBACK };
}

export function buildDistrictIdentitySummary(
  districtId: string | null | undefined,
): string {
  return getDistrictIdentity(districtId).summary?.trim() || DISTRICT_IDENTITY_FALLBACK.summary;
}

function rankRiskLevel(level: DistrictRiskLevel): number {
  if (level === 'high') return 3;
  if (level === 'medium') return 2;
  return 1;
}

export function buildDistrictRiskChips(
  districtId: string | null | undefined,
  max = 3,
): DistrictRiskChip[] {
  const profile = getDistrictIdentity(districtId).riskProfile;
  if (!profile) {
    return [];
  }

  const entries = Object.entries(profile) as Array<
    [keyof DistrictRiskProfile, DistrictRiskLevel]
  >;

  return entries
    .map(([key, level]) => ({
      id: key,
      level,
      label: `${RISK_DIMENSION_LABELS[key]} · ${RISK_LEVEL_LABELS[level]}`,
      score: rankRiskLevel(level),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, max))
    .map(({ id, level, label }) => ({ id, level, label }));
}

export function buildDistrictFlavorLine(
  districtId: string | null | undefined,
  context: DistrictFlavorContext = 'default',
): string {
  const identity = getDistrictIdentity(districtId);
  const lines = identity.operationFlavorLines ?? [];
  if (lines.length === 0) {
    return identity.summary;
  }

  if (context === 'post_pilot' && identity.id === 'istasyon') {
    const postPilotLine = lines.find((line) =>
      line.toLowerCase().includes('post-pilot'),
    );
    if (postPilotLine) {
      return postPilotLine;
    }
  }

  const index =
    context === 'map'
      ? 0
      : context === 'event'
        ? 1 % lines.length
        : 0;
  return lines[index] ?? lines[0] ?? identity.summary;
}

export function buildDistrictMapPanelLines(
  districtId: string | null | undefined,
): string[] {
  const identity = getDistrictIdentity(districtId);
  const lines: string[] = [];

  const summary = identity.summary?.trim();
  if (summary) {
    lines.push(summary);
  }

  if (lines.length < 2) {
    const personality = identity.personality?.trim();
    if (personality && personality !== summary) {
      const short =
        personality.length > 88 ? `${personality.slice(0, 85).trim()}…` : personality;
      lines.push(short);
    }
  }

  return lines.slice(0, 2);
}

export function buildDistrictEventContextLine(
  districtId: string | null | undefined,
): string {
  const line =
    getDistrictIdentity(districtId).eventContextLine?.trim() ||
    DISTRICT_IDENTITY_FALLBACK.eventContextLine;
  const single = line.replace(/\s+/g, ' ').trim();
  if (single.length <= 120) {
    return single;
  }
  return `${single.slice(0, 117).trim()}…`;
}

export function resolveDistrictAccentColor(
  districtId: string | null | undefined,
): string {
  const accent = getDistrictIdentity(districtId).visualTone?.accent ?? 'teal';
  return ACCENT_COLORS[accent] ?? colors.primary;
}

export function resolveDistrictIconKey(
  districtId: string | null | undefined,
): string {
  return getDistrictIdentity(districtId).visualTone?.iconKey ?? 'district_fallback';
}

export function districtIdentityTextContainsBannedWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of DISTRICT_IDENTITY_BANNED_WORDS) {
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

export function collectDistrictIdentityPresentationStrings(
  districtId?: string | null,
): string[] {
  const id = districtId ?? 'merkez';
  const identity = getDistrictIdentity(id);
  return [
    identity.name,
    identity.shortLabel,
    identity.personality,
    identity.summary,
    ...identity.strengths,
    ...identity.pressurePoints,
    ...identity.operationFlavorLines,
    identity.eventContextLine,
    ...buildDistrictMapPanelLines(id),
    ...buildDistrictRiskChips(id).map((chip) => chip.label),
    buildDistrictEventContextLine(id),
    buildDistrictFlavorLine(id, 'map'),
    buildDistrictFlavorLine(id, 'event'),
    buildDistrictFlavorLine(id, 'post_pilot'),
  ].filter(Boolean);
}
