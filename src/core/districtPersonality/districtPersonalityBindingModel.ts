import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';

import {
  DISTRICT_ID_PERSONALITY_BASELINE,
} from './districtPersonalityBindingConstants';
import type {
  DistrictPersonalityKey,
  DistrictPersonalityOutcomeBand,
} from './districtPersonalityBindingTypes';
import type { DistrictPersonalityInput, DistrictPersonalityProfile } from './districtPersonalityTypes';
import { buildDistrictPersonalityProfile } from './districtPersonalityModel';

function normalizeDistrictId(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}

function nameIncludes(name: string, ...tokens: string[]): boolean {
  if (!name) return false;
  return tokens.some((token) => name.includes(token.toLocaleLowerCase('tr-TR')));
}

function criterionBand(
  profile: DistrictPersonalityProfile | null | undefined,
  id: DistrictPersonalityProfile['primaryCriterionId'],
): 'low' | 'medium' | 'high' | null {
  const criterion = profile?.criteria.find((entry) => entry.id === id);
  return criterion?.band ?? null;
}

export function deriveDistrictPersonalityKey(input: {
  districtId?: string | null;
  districtName?: string | null;
  profile?: DistrictPersonalityProfile | null;
  publicSatisfaction?: number;
  eventFamily?: string | null;
}): DistrictPersonalityKey {
  const id = normalizeDistrictId(input.districtId);
  const name = normalizeName(input.districtName);
  const knownDistrict = MAP_DISTRICT_IDENTITY_IDS.includes(id as never);
  const profile = knownDistrict ? input.profile : null;
  const family = normalizeName(input.eventFamily);

  if (nameIncludes(name, 'barış', 'baris')) {
    return input.publicSatisfaction != null && input.publicSatisfaction < 52
      ? 'trust_fragile'
      : 'family_residential';
  }

  if (id && DISTRICT_ID_PERSONALITY_BASELINE[id]) {
    return DISTRICT_ID_PERSONALITY_BASELINE[id]!;
  }

  if (profile) {
    if (criterionBand(profile, 'trust_fragility') === 'high') return 'trust_fragile';
    if (
      criterionBand(profile, 'neglect_risk') === 'high' &&
      profile.primaryCriterionId === 'neglect_risk'
    ) {
      return 'routine_dependent';
    }
    if (
      (criterionBand(profile, 'container_density') === 'high' ||
        criterionBand(profile, 'maintenance_exposure') === 'high') &&
      (profile.primaryCriterionId === 'container_density' ||
        profile.primaryCriterionId === 'maintenance_exposure')
    ) {
      return 'service_sensitive';
    }
    if (
      criterionBand(profile, 'route_difficulty') === 'high' &&
      profile.primaryCriterionId === 'route_difficulty'
    ) {
      return 'industrial_route';
    }
    if (
      criterionBand(profile, 'social_sensitivity') === 'high' &&
      (id === 'sanayi' || nameIncludes(name, 'sanayi', 'pazar'))
    ) {
      return 'market_pressure';
    }
  }

  if (family.includes('container') || family.includes('temizlik') || family.includes('bakim')) {
    return 'service_sensitive';
  }
  if (family.includes('rota') || family.includes('ulasim')) {
    return 'industrial_route';
  }

  if (nameIncludes(name, 'cumhuriyet', 'merkez')) return 'civic_core';
  if (nameIncludes(name, 'sanayi', 'pazar')) return 'market_pressure';
  if (nameIncludes(name, 'istasyon')) return 'industrial_route';
  if (nameIncludes(name, 'yeşil', 'yesil', 'vadi')) return 'family_residential';

  if (input.publicSatisfaction != null && input.publicSatisfaction < 48) {
    return 'trust_fragile';
  }

  return 'balanced_unknown';
}

export function resolveDistrictPersonalityProfile(
  input: DistrictPersonalityInput & {
    districtId?: string | null;
    districtName?: string | null;
  },
): DistrictPersonalityProfile {
  const districtId = normalizeDistrictId(input.districtId);
  const knownId = MAP_DISTRICT_IDENTITY_IDS.includes(districtId as never)
    ? districtId
    : undefined;

  return buildDistrictPersonalityProfile({
    ...input,
    districtId: knownId ?? input.districtId ?? undefined,
    districtName: input.districtName ?? undefined,
  });
}

export function mapOutcomeBandToPersonalityOutcome(
  band?: DistrictPersonalityOutcomeBand | string | null,
): 'positive' | 'neutral' | 'warning' {
  if (band === 'positive') return 'positive';
  if (band === 'warning' || band === 'mixed') return 'warning';
  return 'neutral';
}

export function mapResultToneToPersonalityOutcome(
  tone?: string | null,
): 'positive' | 'neutral' | 'warning' {
  if (tone === 'positive' || tone === 'success') return 'positive';
  if (tone === 'warning' || tone === 'critical' || tone === 'mixed') return 'warning';
  return 'neutral';
}
