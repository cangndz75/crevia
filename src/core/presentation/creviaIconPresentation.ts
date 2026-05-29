import type { ComponentProps } from 'react';

import type { Ionicons } from '@expo/vector-icons';
import type { BadgeCategory, BadgeRarity } from '@/core/badges/badgeTypes';
import type { AuthorityEvaluationStatus } from '@/core/authority/authorityTypes';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { colors } from '@/ui/theme/colors';

import {
  CREVIA_ICON_DOMAINS,
  CREVIA_ICON_FALLBACK_KEY,
  CREVIA_ICON_REGISTRY,
} from './creviaIconRegistry';
import type {
  CreviaIconDefinition,
  CreviaIconDomain,
  IconTone,
  IconToneStyle,
} from './iconPresentationTypes';

export type { IconTone, IconToneStyle, CreviaIconDefinition, CreviaIconDomain };

export type CreviaIoniconName = ComponentProps<typeof Ionicons>['name'];

export const ICON_PRESENTATION_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
] as const;

const SEMANTIC_TO_IONICON: Record<string, CreviaIoniconName> = {
  ribbon: 'ribbon-outline',
  shield: 'shield-outline',
  badge: 'medal-outline',
  medal: 'medal-outline',
  circleCheck: 'checkmark-circle-outline',
  sparkles: 'sparkles-outline',
  shieldStar: 'shield-checkmark-outline',
  trophy: 'trophy-outline',
  building2: 'business-outline',
  home: 'home-outline',
  factory: 'construct-outline',
  route: 'git-branch-outline',
  leaf: 'leaf-outline',
  mapPin: 'location-outline',
  heartPulse: 'pulse-outline',
  messageCircleWarning: 'chatbubble-ellipses-outline',
  heart: 'heart-outline',
  messagesSquare: 'chatbubbles-outline',
  alertTriangle: 'warning-outline',
  target: 'locate-outline',
  radio: 'radio-outline',
  send: 'send-outline',
  checkCircle: 'checkmark-circle-outline',
  clipboardList: 'clipboard-outline',
  truck: 'car-outline',
  navigation: 'navigate-outline',
  archive: 'archive-outline',
  users: 'people-outline',
  batteryWarning: 'battery-half-outline',
  siren: 'megaphone-outline',
  walletCards: 'wallet-outline',
  scale: 'scale-outline',
  crown: 'trophy-outline',
  userRound: 'person-circle-outline',
  compass: 'compass-outline',
  sunrise: 'sunny-outline',
  signpost: 'trail-sign-outline',
  circle: 'ellipse-outline',
  chatbubble: 'chatbubble-outline',
  flag: 'flag-outline',
};

const TONE_STYLES: Record<IconTone, IconToneStyle> = {
  teal: {
    color: colors.primary,
    backgroundColor: colors.primaryMuted,
    borderColor: 'rgba(26,143,138,0.2)',
  },
  mint: {
    color: '#2BB5A8',
    backgroundColor: '#E6F7F4',
    borderColor: 'rgba(43,181,168,0.2)',
  },
  amber: {
    color: colors.hubGoldDark,
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.24)',
  },
  green: {
    color: colors.success,
    backgroundColor: colors.successMuted,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  blue: {
    color: colors.secondary,
    backgroundColor: colors.secondaryMuted,
    borderColor: 'rgba(59,130,246,0.2)',
  },
  coral: {
    color: '#C75A4A',
    backgroundColor: 'rgba(255, 140, 120, 0.14)',
    borderColor: 'rgba(199, 90, 74, 0.22)',
  },
  gold: {
    color: colors.hubGoldDark,
    backgroundColor: colors.hubGoldMuted,
    borderColor: 'rgba(212,160,23,0.28)',
  },
  neutral: {
    color: colors.textSecondary,
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
  },
};

const DISTRICT_ICON_KEYS: Record<MapDistrictId, string> = {
  merkez: 'district_center',
  cumhuriyet: 'district_cumhuriyet',
  sanayi: 'district_sanayi',
  istasyon: 'district_istasyon',
  yesilvadi: 'district_yesilvadi',
};

const BADGE_RARITY_KEYS: Record<BadgeRarity, string> = {
  common: 'badge_common',
  uncommon: 'badge_uncommon',
  rare: 'badge_rare',
  epic: 'badge_epic',
};

const BADGE_CATEGORY_KEYS: Record<BadgeCategory, string> = {
  operations: 'badge_operations',
  publicTrust: 'badge_publicTrust',
  resources: 'badge_resources',
  personnel: 'badge_personnel',
  crisis: 'badge_crisis',
  authority: 'badge_authority',
  consistency: 'badge_consistency',
  pilot: 'badge_pilot',
};

const AUTHORITY_STATUS_KEYS: Record<AuthorityEvaluationStatus, string> = {
  stable: 'authority_stable',
  watching: 'authority_watching',
  promotion_candidate: 'promotion_candidate',
  promoted: 'authority_promoted',
};

const SOCIAL_MENTION_KEYS: Record<string, string> = {
  complaint: 'social_complaint',
  praise: 'social_praise',
  gratitude: 'social_praise',
  rumor: 'social_rumor',
  crisis: 'social_warning',
  question: 'social_info',
  opportunity: 'social_praise',
  neutral: 'social_pulse',
  info: 'social_info',
};

const OPERATION_CONTEXT_KEYS: Record<string, string> = {
  focus: 'operation_focus',
  field: 'field_operation',
  dispatch: 'dispatch',
  result: 'result',
  report: 'report',
  map: 'map_focus',
};

export function resolveCreviaIoniconName(
  definition: CreviaIconDefinition,
): CreviaIoniconName {
  const mapped = SEMANTIC_TO_IONICON[definition.iconName];
  if (mapped) {
    return mapped;
  }
  return SEMANTIC_TO_IONICON.circle ?? 'ellipse-outline';
}

export function getCreviaIconDefinition(
  key: string | null | undefined,
): CreviaIconDefinition {
  if (key && CREVIA_ICON_REGISTRY[key]) {
    return CREVIA_ICON_REGISTRY[key]!;
  }
  return CREVIA_ICON_REGISTRY[CREVIA_ICON_FALLBACK_KEY]!;
}

export function getIconForDistrict(
  districtId: string | null | undefined,
): CreviaIconDefinition {
  const normalized = districtId?.trim().toLowerCase();
  if (normalized && normalized in DISTRICT_ICON_KEYS) {
    return getCreviaIconDefinition(
      DISTRICT_ICON_KEYS[normalized as MapDistrictId],
    );
  }
  if (normalized?.includes('yesil') || normalized?.includes('yeşil')) {
    return getCreviaIconDefinition('district_yesilvadi');
  }
  if (normalized?.includes('istasyon') || normalized?.includes('station')) {
    return getCreviaIconDefinition('district_istasyon');
  }
  if (normalized?.includes('sanayi') || normalized?.includes('industrial')) {
    return getCreviaIconDefinition('district_sanayi');
  }
  if (normalized?.includes('cumhuriyet')) {
    return getCreviaIconDefinition('district_cumhuriyet');
  }
  if (normalized?.includes('merkez') || normalized?.includes('central')) {
    return getCreviaIconDefinition('district_center');
  }
  return getCreviaIconDefinition('district_fallback');
}

export function getIconForBadgeRarity(rarity: BadgeRarity): CreviaIconDefinition {
  return getCreviaIconDefinition(BADGE_RARITY_KEYS[rarity]);
}

export function getIconForBadgeCategory(
  category: BadgeCategory,
): CreviaIconDefinition {
  return getCreviaIconDefinition(BADGE_CATEGORY_KEYS[category]);
}

export function getIconForAuthorityStatus(
  status: AuthorityEvaluationStatus | string | null | undefined,
): CreviaIconDefinition {
  if (status && status in AUTHORITY_STATUS_KEYS) {
    return getCreviaIconDefinition(
      AUTHORITY_STATUS_KEYS[status as AuthorityEvaluationStatus],
    );
  }
  return getCreviaIconDefinition('authority_rank');
}

export function getIconForSocialMentionType(
  type: string | null | undefined,
): CreviaIconDefinition {
  const key = type ? SOCIAL_MENTION_KEYS[type] : undefined;
  if (key) {
    return getCreviaIconDefinition(key);
  }
  return getCreviaIconDefinition('social_pulse');
}

export function getIconForOperationContext(
  context: string | null | undefined,
): CreviaIconDefinition {
  const normalized = context?.trim().toLowerCase();
  if (normalized && OPERATION_CONTEXT_KEYS[normalized]) {
    return getCreviaIconDefinition(OPERATION_CONTEXT_KEYS[normalized]!);
  }
  return getCreviaIconDefinition('operation_focus');
}

export function getIconToneStyle(tone: IconTone): IconToneStyle {
  return TONE_STYLES[tone] ?? TONE_STYLES.neutral;
}

export function resolveIoniconForRegistryKey(
  key: string | null | undefined,
): CreviaIoniconName {
  return resolveCreviaIoniconName(getCreviaIconDefinition(key));
}

export function resolveIoniconForDistrict(
  districtId: string | null | undefined,
): CreviaIoniconName {
  return resolveCreviaIoniconName(getIconForDistrict(districtId));
}

export function assertNoIconPresentationForbiddenWords(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits: string[] = [];
  for (const word of ICON_PRESENTATION_FORBIDDEN_WORDS) {
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

export function collectIconRegistryLabels(): string[] {
  return Object.values(CREVIA_ICON_REGISTRY).flatMap((def) => [
    def.label,
    def.description ?? '',
  ]);
}

export function getRegistryIconsForDomain(
  domain: CreviaIconDomain,
): CreviaIconDefinition[] {
  return Object.values(CREVIA_ICON_REGISTRY).filter((def) => def.domain === domain);
}

export function assertAllDomainsHaveIcons(): boolean {
  return CREVIA_ICON_DOMAINS.every(
    (domain) => getRegistryIconsForDomain(domain).length >= 1,
  );
}

export const DISTRICT_REGISTRY_ICON_KEYS = DISTRICT_ICON_KEYS;
