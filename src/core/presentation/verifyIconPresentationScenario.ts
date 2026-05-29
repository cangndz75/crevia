import { verifyDistrictIdentityScenario } from '@/core/districts/verifyDistrictIdentityScenario';
import type { BadgeCategory, BadgeRarity } from '@/core/badges/badgeTypes';
import type { AuthorityEvaluationStatus } from '@/core/authority/authorityTypes';
import { verifyLeaderboardUiScenario } from '@/features/leaderboard/verifyLeaderboardUiScenario';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import { buildSocialPulseScreenViewModel } from '@/features/social/utils/socialPulsePresentation';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { verifyMapUiScenario } from '@/features/map/verifyMapUiScenario';
import { verifySocialPulseUiScenario } from '@/features/social/verifySocialPulseUiScenario';
import { verifyProfileBadgeScenario } from '@/features/profile/utils/verifyProfileBadgeScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';

import { CREVIA_ICON_DOMAINS } from './creviaIconRegistry';
import {
  assertAllDomainsHaveIcons,
  assertNoIconPresentationForbiddenWords,
  collectIconRegistryLabels,
  getCreviaIconDefinition,
  getIconForAuthorityStatus,
  getIconForBadgeCategory,
  getIconForBadgeRarity,
  getIconForDistrict,
  getIconForSocialMentionType,
  getIconToneStyle,
  getRegistryIconsForDomain,
  resolveIoniconForDistrict,
  resolveIoniconForRegistryKey,
  type IconTone,
} from './creviaIconPresentation';
import { DISTRICT_REGISTRY_ICON_KEYS } from './creviaIconPresentation';

export type VerifyIconPresentationOutcome = {
  ok: boolean;
  failCount: number;
  checks: string[];
};

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

const BADGE_CATEGORIES: BadgeCategory[] = [
  'operations',
  'publicTrust',
  'resources',
  'personnel',
  'crisis',
  'authority',
  'consistency',
  'pilot',
];

const BADGE_RARITIES: BadgeRarity[] = ['common', 'uncommon', 'rare', 'epic'];

const AUTHORITY_STATUSES: AuthorityEvaluationStatus[] = [
  'stable',
  'watching',
  'promotion_candidate',
  'promoted',
];

const SOCIAL_TYPES = [
  'complaint',
  'praise',
  'gratitude',
  'rumor',
  'crisis',
  'question',
  'neutral',
];

const ICON_TONES: IconTone[] = [
  'teal',
  'mint',
  'amber',
  'green',
  'blue',
  'coral',
  'gold',
  'neutral',
];

export function verifyIconPresentationScenario(): VerifyIconPresentationOutcome {
  const checks: Check[] = [];

  assert(
    checks,
    assertAllDomainsHaveIcons(),
    'Registry içinde her domain için en az 1 icon vardır',
    CREVIA_ICON_DOMAINS.map(
      (d) => `${d}:${getRegistryIconsForDomain(d).length}`,
    ).join(', '),
  );

  const districtIds = Object.keys(DISTRICT_REGISTRY_ICON_KEYS) as Array<
    keyof typeof DISTRICT_REGISTRY_ICON_KEYS
  >;
  assert(
    checks,
    districtIds.length === 5 &&
      districtIds.every((id) => getIconForDistrict(id).key.startsWith('district_')),
    '5 district için icon mapping döner',
    districtIds.map((id) => getIconForDistrict(id).key).join(', '),
  );

  for (const rarity of BADGE_RARITIES) {
    const def = getIconForBadgeRarity(rarity);
    assert(
      checks,
      def.key === `badge_${rarity}`,
      `Badge rarity ${rarity} mapping`,
      def.key,
    );
  }

  for (const category of BADGE_CATEGORIES) {
    const def = getIconForBadgeCategory(category);
    assert(
      checks,
      def.key !== 'fallback',
      `Badge category ${category} fallback olmadan döner`,
      def.key,
    );
  }

  for (const status of AUTHORITY_STATUSES) {
    const def = getIconForAuthorityStatus(status);
    assert(
      checks,
      def.key !== 'fallback',
      `Authority status ${status} fallback olmadan döner`,
      def.key,
    );
  }

  for (const type of SOCIAL_TYPES) {
    const def = getIconForSocialMentionType(type);
    assert(
      checks,
      def.key !== 'fallback',
      `Social mention ${type} fallback olmadan döner`,
      def.key,
    );
  }

  const unknownIcon = getCreviaIconDefinition('not_a_real_icon_key');
  assert(
    checks,
    unknownIcon.key === 'fallback',
    'Unknown icon key fallback döner',
    unknownIcon.label,
  );

  const unknownDistrict = getIconForDistrict('unknown_zone_xyz');
  assert(
    checks,
    unknownDistrict.key === 'district_fallback',
    'Unknown district fallback döner',
    unknownDistrict.label,
  );

  let toneStylesOk = true;
  for (const tone of ICON_TONES) {
    try {
      const style = getIconToneStyle(tone);
      if (!style.color || !style.backgroundColor) {
        toneStylesOk = false;
      }
    } catch {
      toneStylesOk = false;
    }
  }
  assert(checks, toneStylesOk, 'Tone style tüm tone değerleri için güvenli döner');

  const banned = collectIconRegistryLabels().flatMap((line) =>
    assertNoIconPresentationForbiddenWords(line),
  );
  assert(checks, banned.length === 0, 'Yasaklı kelime taraması 0 döner', banned.join('; '));

  let badgeShowcaseOk = true;
  try {
    const summary = buildProfileBadgeShowcaseSummary(createInitialBadgeState(1), 1);
    summary.showcaseItems.forEach((item) => {
      resolveIoniconForRegistryKey(
        getIconForBadgeCategory(item.category).key,
      );
    });
  } catch {
    badgeShowcaseOk = false;
  }
  assert(checks, badgeShowcaseOk, 'Profile badge showcase icon mapping crash olmaz');

  let socialMentionOk = true;
  try {
    const socialModel = buildSocialPulseScreenViewModel({
      socialPulseState: createInitialSocialPulseState(2),
      currentDay: 2,
    });
    socialModel.mentions.items.forEach((item) => {
      resolveIoniconForRegistryKey(item.iconRegistryKey);
    });
  } catch {
    socialMentionOk = false;
  }
  assert(checks, socialMentionOk, 'Social pulse mention icon mapping crash olmaz');

  const merkezDistrict = getIconForDistrict('merkez');
  const merkezIonicon = resolveIoniconForDistrict('merkez');
  assert(
    checks,
    merkezDistrict.key === 'district_center' && merkezIonicon.length > 0,
    'Map district icon mapping district identity ile uyumludur',
    `${merkezDistrict.key} → ${merkezIonicon}`,
  );

  const districtUi = verifyDistrictIdentityScenario();
  assert(
    checks,
    districtUi.ok,
    'verify:district-identity bozulmaz',
    `fail=${districtUi.failCount}`,
  );

  const profileBadges = verifyProfileBadgeScenario();
  assert(
    checks,
    profileBadges.ok,
    'verify:profile-badges bozulmaz',
    profileBadges.ok ? 'ok' : 'fail',
  );

  const socialUi = verifySocialPulseUiScenario();
  assert(
    checks,
    socialUi.ok,
    'verify:social-pulse-ui bozulmaz',
    `fail=${socialUi.failCount}`,
  );

  const leaderboardUi = verifyLeaderboardUiScenario();
  assert(
    checks,
    leaderboardUi.ok,
    'verify:leaderboard-ui bozulmaz',
    `fail=${leaderboardUi.failCount}`,
  );

  const mapUi = verifyMapUiScenario();
  assert(
    checks,
    mapUi.ok,
    'verify:map-ui bozulmaz',
    `fail=${mapUi.failCount}`,
  );

  const uxFlow = verifyFullUxFlowScenario();
  assert(
    checks,
    uxFlow.ok,
    'verify:full-ux-flow bozulmaz',
    `health=${uxFlow.audit.flowHealth}`,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`),
  };
}
