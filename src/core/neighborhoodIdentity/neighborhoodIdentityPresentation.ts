import { colors } from '@/ui/theme/colors';

import { getNeighborhoodIdentity } from './neighborhoodIdentityModel';
import type {
  NeighborhoodArchetype,
  NeighborhoodIdentityId,
  NeighborhoodVisualTone,
} from './neighborhoodIdentityTypes';

const ARCHETYPE_LABELS: Record<NeighborhoodArchetype, string> = {
  civic_center: 'Merkez karakteri',
  starter_residential: 'Başlangıç mahallesi',
  industrial_pressure: 'Operasyon baskısı',
  transit_crossroads: 'Geçiş bölgesi',
  green_residential: 'Yeşil mahalle',
};

const TONE_COLORS: Record<
  NeighborhoodVisualTone,
  { bg: string; text: string; border: string }
> = {
  blue: {
    bg: colors.secondaryMuted,
    text: colors.secondary,
    border: colors.secondary,
  },
  green: {
    bg: colors.successMuted,
    text: colors.success,
    border: colors.success,
  },
  amber: {
    bg: colors.warningMuted,
    text: colors.warning,
    border: colors.warning,
  },
  slate: {
    bg: colors.backgroundAlt,
    text: colors.textSecondary,
    border: colors.border,
  },
  violet: {
    bg: colors.purpleMuted,
    text: colors.purple,
    border: colors.purple,
  },
  orange: {
    bg: colors.hubGoldMuted,
    text: colors.hubGoldDark,
    border: colors.hubGold,
  },
};

export function getNeighborhoodArchetypeLabel(
  id: string | undefined | null,
): string {
  const archetype = getNeighborhoodIdentity(id).archetype;
  return ARCHETYPE_LABELS[archetype];
}

export function getNeighborhoodToneColors(id: string | undefined | null) {
  const tone = getNeighborhoodIdentity(id).visualTone;
  return TONE_COLORS[tone];
}

export function getTopNeighborhoodSensitivityChips(
  id: NeighborhoodIdentityId | string | null | undefined,
  limit = 2,
): string[] {
  const identity = getNeighborhoodIdentity(id);
  const ranked = Object.entries(identity.sensitivities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit);

  const LABELS: Record<string, string> = {
    social_visibility: 'Sosyal görünürlük',
    waste_pressure: 'Atık yükü',
    traffic_flow: 'Trafik / akış',
    maintenance_need: 'Bakım ihtiyacı',
    public_expectation: 'Kamu beklentisi',
    budget_sensitivity: 'Bütçe hassasiyeti',
    personnel_load: 'Personel yükü',
    crisis_spread: 'Kriz yayılımı',
  };

  return ranked.map(([key, value]) => {
    const label = LABELS[key] ?? key;
    return value >= 75 ? `${label} yüksek` : `${label} orta`;
  });
}
